from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from app.core.config import get_settings
from app.core.security import get_current_user
from app.models.user import User
from app.services.printify import PrintifyClient
import hashlib
import hmac
import logging

router = APIRouter()
settings = get_settings()
logger = logging.getLogger("tsc365")


def get_printify_client(user_token: str = None, shop_id: str = None) -> PrintifyClient:
    token = user_token or settings.PRINTIFY_API_TOKEN
    sid = shop_id or settings.PRINTIFY_SHOP_ID
    if not token:
        raise HTTPException(status_code=400, detail="Printify API token not configured")
    return PrintifyClient(token=token, shop_id=sid)


class PrintifyConnect(BaseModel):
    api_token: str
    shop_id: str


class WebhookCreate(BaseModel):
    topic: str
    url: str


class ProductCreateRequest(BaseModel):
    blueprint_id: int
    print_provider_id: int
    title: str
    description: str = ""
    variants: list[dict]
    image_url: str
    tags: list[str] = []


class OrderCreateRequest(BaseModel):
    line_items: list[dict]
    address_to: dict
    shipping_method: int = 1


class ImageUploadRequest(BaseModel):
    url: str | None = None
    contents: str | None = None


@router.get("/connection")
async def get_connection(current_user: User = Depends(get_current_user)):
    return {
        "connected": bool(settings.PRINTIFY_API_TOKEN),
        "shop_id": settings.PRINTIFY_SHOP_ID,
        "has_token": bool(settings.PRINTIFY_API_TOKEN),
    }


@router.post("/connection")
async def connect_printify(data: PrintifyConnect, current_user: User = Depends(get_current_user)):
    client = PrintifyClient(token=data.api_token, shop_id=data.shop_id)
    try:
        shops = await client.list_shops()
        return {"status": "ok", "shops": shops, "shop_id": data.shop_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")


@router.get("/shops")
async def list_shops(current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.list_shops()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalog/blueprints")
async def list_blueprints(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    client = get_printify_client()
    try:
        return await client.list_blueprints(page=page, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalog/blueprints/{blueprint_id}")
async def get_blueprint(blueprint_id: int, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.get_blueprint(blueprint_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalog/blueprints/{blueprint_id}/providers")
async def list_blueprint_providers(blueprint_id: int, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.list_blueprint_providers(blueprint_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalog/blueprints/{blueprint_id}/providers/{provider_id}/variants")
async def get_blueprint_variants(
    blueprint_id: int, provider_id: int, current_user: User = Depends(get_current_user)
):
    client = get_printify_client()
    try:
        return await client.get_blueprint_variants(blueprint_id, provider_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalog/blueprints/{blueprint_id}/providers/{provider_id}/shipping")
async def get_blueprint_shipping(
    blueprint_id: int, provider_id: int, current_user: User = Depends(get_current_user)
):
    client = get_printify_client()
    try:
        return await client.get_blueprint_shipping(blueprint_id, provider_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalog/providers")
async def list_print_providers(current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.list_print_providers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalog/providers/{provider_id}")
async def get_print_provider(provider_id: int, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.get_print_provider(provider_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products")
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    client = get_printify_client()
    try:
        return await client.list_products(page=page, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products/{product_id}")
async def get_product(product_id: str, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.get_product(product_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/products")
async def create_product(data: ProductCreateRequest, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    product_data = {
        "title": data.title,
        "description": data.description,
        "blueprint_id": data.blueprint_id,
        "print_provider_id": data.print_provider_id,
        "variants": data.variants,
        "print_areas": [{
            "variant_ids": [v.get("id") for v in data.variants],
            "placeholders": [{
                "images": [{"url": data.image_url}]
            }]
        }],
        "tags": data.tags,
    }
    try:
        return await client.create_product(product_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/products/{product_id}")
async def update_product(
    product_id: str, data: ProductCreateRequest, current_user: User = Depends(get_current_user)
):
    client = get_printify_client()
    product_data = {
        "title": data.title,
        "description": data.description,
        "blueprint_id": data.blueprint_id,
        "print_provider_id": data.print_provider_id,
        "variants": data.variants,
        "tags": data.tags,
    }
    try:
        return await client.update_product(product_id, product_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        await client.delete_product(product_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/products/{product_id}/publish")
async def publish_product(product_id: str, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.publish_product(product_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PublishFromDesignerRequest(BaseModel):
    title: str
    description: str = ""
    blueprint_id: int
    print_provider_id: int
    image_url: str
    variant_ids: list[int]
    tags: list[str] = []
    publish_immediately: bool = False


@router.post("/publish-from-designer")
async def publish_from_designer(data: PublishFromDesignerRequest, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        upload_result = await client.upload_image(image_url=data.image_url)
        uploaded_url = upload_result.get("url", data.image_url)

        product_data = {
            "title": data.title,
            "description": data.description,
            "blueprint_id": data.blueprint_id,
            "print_provider_id": data.print_provider_id,
            "variants": [{"id": vid, "price": 0, "is_enabled": True, "is_default": i == 0} for i, vid in enumerate(data.variant_ids)],
            "print_areas": [{
                "variant_ids": data.variant_ids,
                "placeholders": [{"images": [{"url": uploaded_url}]}]
            }],
            "tags": data.tags,
        }
        product = await client.create_product(product_data)

        if data.publish_immediately:
            product_id = product.get("id")
            if product_id:
                await client.publish_product(product_id)

        return product
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/uploads/image")
async def upload_image(data: ImageUploadRequest, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.upload_image(image_url=data.url, contents=data.contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders")
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: str | None = None,
    current_user: User = Depends(get_current_user),
):
    client = get_printify_client()
    try:
        return await client.list_orders(page=page, limit=limit, status=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.get_order(order_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders")
async def create_order(data: OrderCreateRequest, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    order_data = {
        "line_items": data.line_items,
        "address_to": data.address_to,
        "shipping_method": data.shipping_method,
    }
    try:
        return await client.create_order(order_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/shipping")
async def calculate_shipping(data: OrderCreateRequest, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    order_data = {
        "line_items": data.line_items,
        "address_to": data.address_to,
        "shipping_method": data.shipping_method,
    }
    try:
        return await client.calculate_shipping(order_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/{order_id}/production")
async def send_to_production(order_id: str, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.send_to_production(order_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.cancel_order(order_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/webhooks")
async def list_webhooks(current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.list_webhooks()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhooks")
async def create_webhook(data: WebhookCreate, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        return await client.create_webhook(data.topic, data.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str, current_user: User = Depends(get_current_user)):
    client = get_printify_client()
    try:
        await client.delete_webhook(webhook_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook-receive")
async def receive_webhook(request: Request):
    from app.core.database import async_session
    from app.models.order import Order
    from sqlalchemy import select
    from datetime import datetime, timezone

    raw_body = await request.body()
    body = await request.json()
    topic = request.headers.get("X-Printify-Topic", "unknown")

    webhook_secret = getattr(settings, "PRINTIFY_WEBHOOK_SECRET", "")
    if not webhook_secret:
        logger.error("PRINTIFY_WEBHOOK_SECRET not configured — rejecting webhook")
        return {"status": "error", "detail": "Webhook not configured"}

    signature = request.headers.get("X-Printify-Signature", "")
    expected = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        logger.warning("Printify webhook signature verification failed")
        return {"status": "invalid_signature"}

    logger.info(f"Printify webhook: topic={topic}")

    try:
        resource_type = body.get("resource_type", "")
        resource = body.get("resource", {})
        resource_id = resource.get("id", "")
        extra = body.get("extra", {})

        if resource_type == "order" and resource_id:
            async with async_session() as db:
                result = await db.execute(
                    select(Order).where(Order.printify_order_id == resource_id)
                )
                order = result.scalar_one_or_none()
                if not order:
                    logger.warning(f"Printify webhook: no order found for printify_id={resource_id}")
                    return {"status": "ok"}

                order.printify_status = extra.get("status") or resource.get("status", "")

                if extra.get("tracking_number"):
                    order.tracking_number = extra["tracking_number"]
                if extra.get("tracking_url"):
                    order.tracking_url = extra["tracking_url"]

                if topic == "order:shipment_created" or order.printify_status == "shipped":
                    order.status = "shipped"
                    order.shipped_at = datetime.now(timezone.utc)
                elif topic == "order:cancelled":
                    order.status = "cancelled"
                elif topic == "order:fulfillment_processing":
                    order.status = "processing"

                await db.commit()
                logger.info(f"Order {order.order_number} updated via Printify webhook: status={order.status}")

    except Exception as e:
        logger.error(f"Printify webhook error: {e}")

    return {"status": "ok"}


@router.post("/fulfillment/{printify_order_id}/send-to-production")
async def fulfillment_send_to_production(
    printify_order_id: str,
    current_user: User = Depends(get_current_user),
):
    from app.services.fulfillment import send_to_production
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await send_to_production(printify_order_id)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to send to production")
    return result


@router.post("/fulfillment/{printify_order_id}/cancel")
async def fulfillment_cancel(
    printify_order_id: str,
    current_user: User = Depends(get_current_user),
):
    from app.services.fulfillment import cancel_printify_order
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await cancel_printify_order(printify_order_id)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to cancel order")
    return result


@router.get("/fulfillment/{printify_order_id}/status")
async def fulfillment_status(
    printify_order_id: str,
    current_user: User = Depends(get_current_user),
):
    from app.services.fulfillment import get_printify_order_status
    result = await get_printify_order_status(printify_order_id)
    if not result:
        raise HTTPException(status_code=404, detail="Printify order not found")
    return result
