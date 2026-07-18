import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import Order
from app.schemas.payment import CheckoutCreate, CheckoutResponse

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)
from app.core.limiter import limiter


@router.post("/checkout", response_model=CheckoutResponse)
@limiter.limit("10/minute")
async def create_checkout(request: Request, data: CheckoutCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == data.order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not settings.SQUARE_ACCESS_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="Payment processing not configured. Add SQUARE_ACCESS_TOKEN to .env",
        )

    if not data.payment_token:
        raise HTTPException(status_code=400, detail="Payment token is required")

    try:
        from square import Square
        from square.environment import SquareEnvironment

        env = SquareEnvironment.SANDBOX if settings.SQUARE_ENVIRONMENT == "sandbox" else SquareEnvironment.PRODUCTION
        client = Square(
            token=settings.SQUARE_ACCESS_TOKEN,
            environment=env,
        )

        idempotency_key = f"order-{order.order_number}"

        amount_cents = int(round(float(order.total) * 100))

        payment_response = client.payments.create(
            source_id=data.payment_token,
            idempotency_key=idempotency_key,
            amount_money={
                "amount": amount_cents,
                "currency": "USD",
            },
            reference_id=order.order_number,
            note=f"Order {order.order_number} - T-Shirt Central 365",
        )

        if payment_response.errors:
            error_detail = "; ".join(
                e.get("detail", e.get("code", "Unknown error"))
                for e in payment_response.errors
            )
            logger.error(f"Square payment failed for order {order.order_number}: {error_detail}")
            raise HTTPException(status_code=402, detail=f"Payment failed: {error_detail}")

        payment = payment_response.payment
        payment_id = payment.id if payment else ""

        order.stripe_payment_intent_id = payment_id
        order.status = "processing"
        await db.commit()
        await db.refresh(order)

        logger.info(f"Payment successful for order {order.order_number}: {payment_id}")

        # Automatically create Printify fulfillment order
        try:
            from app.services.fulfillment import create_printify_fulfillment
            pf_result = await create_printify_fulfillment(order, db)
            if pf_result:
                logger.info(f"Printify fulfillment initiated for {order.order_number}")
            else:
                logger.warning(f"Printify fulfillment not created for {order.order_number} (no eligible items or API error)")
        except Exception as pf_err:
            logger.error(f"Printify fulfillment error (non-blocking): {pf_err}")

        return CheckoutResponse(
            payment_id=payment_id,
            status="completed",
            order_id=order.id,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment error for order {order.order_number}: {e}")
        raise HTTPException(status_code=500, detail="Payment processing failed")


def _verify_square_signature(payload: bytes, signature_header: str, signature_key: str) -> bool:
    import hmac
    import hashlib
    import base64
    if not signature_key:
        return False
    expected = hmac.new(
        signature_key.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).digest()
    expected_b64 = base64.b64encode(expected).decode("utf-8")
    return hmac.compare_digest(expected_b64, signature_header)


@router.post("/webhook")
async def square_webhook(request: Request):
    from app.core.database import async_session

    payload = await request.body()

    if not settings.SQUARE_ACCESS_TOKEN:
        return {"status": "skipped"}

    signature_header = request.headers.get("x-square-hmacsha256", "")
    webhook_secret = getattr(settings, "SQUARE_WEBHOOK_SIGNATURE_KEY", "")
    if not webhook_secret:
        logger.error("SQUARE_WEBHOOK_SIGNATURE_KEY not configured — rejecting webhook")
        return JSONResponse(status_code=503, content={"status": "error", "detail": "Webhook not configured"})
    if not _verify_square_signature(payload, signature_header, webhook_secret):
        logger.warning("Square webhook signature verification failed")
        return {"status": "invalid_signature"}

    try:
        import json
        event = json.loads(payload)
        event_type = event.get("type", "")

        if event_type == "payment.completed":
            data = event.get("data", {}).get("object", {}).get("payment", {})
            reference_id = data.get("reference_id", "")
            if reference_id:
                async with async_session() as db:
                    result = await db.execute(
                        select(Order).where(Order.order_number == reference_id)
                    )
                    order = result.scalar_one_or_none()
                    if order:
                        order.status = "processing"
                        await db.commit()
                        logger.info(f"Order {reference_id} marked as processing via webhook")

        elif event_type == "payment.failed":
            data = event.get("data", {}).get("object", {}).get("payment", {})
            logger.warning(f"Payment failed via webhook: {data.get('id', 'unknown')}")

    except Exception as e:
        logger.error(f"Webhook error: {e}")

    return {"status": "ok"}


@router.get("/config")
async def get_payment_config():
    from app.core.costs import TAX_RATE, SHIPPING_COST, CURRENCY
    return {
        "square_application_id": getattr(settings, "SQUARE_APPLICATION_ID", ""),
        "square_location_id": settings.SQUARE_LOCATION_ID,
        "square_environment": settings.SQUARE_ENVIRONMENT,
        "enabled": bool(settings.SQUARE_ACCESS_TOKEN),
        "tax_rate": TAX_RATE,
        "shipping_cost": SHIPPING_COST,
        "currency": CURRENCY,
    }
