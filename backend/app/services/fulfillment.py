import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.order import Order, OrderItem
from app.services.printify import PrintifyClient

logger = logging.getLogger("tsc365")


async def _resolve_best_provider(blueprint_id: int, variant_id: int) -> tuple[int, int] | None:
    """Auto-select the best Printify provider for a blueprint.

    Returns (provider_id, variant_id) or None if no provider found.
    """
    client = PrintifyClient()
    try:
        providers = await client.list_blueprint_providers(blueprint_id)
        if not providers:
            return None
        best = providers[0]
        provider_id = best.get("id")
        if not provider_id:
            return None
        return (provider_id, variant_id)
    except Exception as e:
        logger.error(f"Failed to resolve provider for blueprint {blueprint_id}: {e}")
        return None


async def create_printify_fulfillment(order: Order, db: AsyncSession) -> dict | None:
    """Create a Printify order to fulfill a customer order.

    This is called after Square payment succeeds.
    It reads the order items, builds the Printify payload, and submits it.
    Returns the Printify order dict on success, None on failure.
    """
    if not order.items:
        logger.warning(f"Order {order.order_number} has no items, skipping Printify fulfillment")
        return None

    client = PrintifyClient()

    line_items = []
    for item in order.items:
        provider_id = item.printify_provider_id
        variant_id = item.printify_variant_id

        # Auto-resolve provider if not set
        if not provider_id and item.printify_blueprint_id:
            resolved = await _resolve_best_provider(item.printify_blueprint_id, variant_id)
            if resolved:
                provider_id, variant_id = resolved

        if variant_id and provider_id:
            line_items.append({
                "product_id": str(variant_id),
                "variant_id": variant_id,
                "quantity": item.quantity,
                "print_provider_id": provider_id,
                "blueprint_id": item.printify_blueprint_id,
            })

    if not line_items:
        logger.warning(f"Order {order.order_number} has no Printify-eligible items")
        return None

    addr = order.shipping_address or {}
    shipping_address = {
        "first_name": (addr.get("name") or addr.get("full_name") or "").split(" ")[0],
        "last_name": " ".join((addr.get("name") or addr.get("full_name") or "").split(" ")[1:]) or " ",
        "email": addr.get("email", ""),
        "phone": addr.get("phone", ""),
        "country": addr.get("country", "US"),
        "region": addr.get("state", ""),
        "address1": addr.get("line1", ""),
        "address2": addr.get("line2", ""),
        "city": addr.get("city", ""),
        "zip": addr.get("postal_code", ""),
    }

    printify_payload = {
        "line_items": line_items,
        "shipping_method": 1,
        "address_to": shipping_address,
        "external_id": order.order_number,
        "label": order.order_number,
    }

    try:
        result = await client.create_order(printify_payload)
        printify_order_id = result.get("id", "")
        printify_status = result.get("status", "pending")

        order.printify_order_id = printify_order_id
        order.printify_status = printify_status
        await db.commit()

        logger.info(
            f"Printify order created for {order.order_number}: "
            f"id={printify_order_id} status={printify_status}"
        )
        return result

    except Exception as e:
        logger.error(f"Failed to create Printify order for {order.order_number}: {e}")
        order.printify_status = f"error: {str(e)[:100]}"
        await db.commit()
        return None


async def send_to_production(printify_order_id: str) -> dict | None:
    """Send a Printify order to production (confirm for printing)."""
    client = PrintifyClient()
    try:
        result = await client.send_to_production(printify_order_id)
        logger.info(f"Printify order {printify_order_id} sent to production")
        return result
    except Exception as e:
        logger.error(f"Failed to send Printify order {printify_order_id} to production: {e}")
        return None


async def cancel_printify_order(printify_order_id: str) -> dict | None:
    """Cancel a Printify order before it goes to production."""
    client = PrintifyClient()
    try:
        result = await client.cancel_order(printify_order_id)
        logger.info(f"Printify order {printify_order_id} cancelled")
        return result
    except Exception as e:
        logger.error(f"Failed to cancel Printify order {printify_order_id}: {e}")
        return None


async def get_printify_order_status(printify_order_id: str) -> dict | None:
    """Fetch current status of a Printify order."""
    client = PrintifyClient()
    try:
        return await client.get_order(printify_order_id)
    except Exception as e:
        logger.error(f"Failed to get Printify order {printify_order_id} status: {e}")
        return None


async def sync_printify_order_status(order: Order, db: AsyncSession) -> None:
    """Pull latest Printify status and update our Order record."""
    if not order.printify_order_id:
        return

    pf_order = await get_printify_order_status(order.printify_order_id)
    if not pf_order:
        return

    order.printify_status = pf_order.get("status", order.printify_status)

    shipments = pf_order.get("shipments", [])
    if shipments:
        latest = shipments[-1]
        tracking = latest.get("tracking_number", "")
        tracking_url = latest.get("tracking_url", "")
        if tracking:
            order.tracking_number = tracking
        if tracking_url:
            order.tracking_url = tracking_url
        if latest.get("status") == "shipped":
            order.status = "shipped"

    await db.commit()
