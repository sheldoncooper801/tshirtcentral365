import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.product import Product, ProductVariant
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderListResponse,
    OrderStatusUpdate,
)
from app.core.costs import TAX_RATE, SHIPPING_COST, MIN_PAYABLE_AMOUNT, MAX_PAYABLE_AMOUNT

router = APIRouter()


def generate_order_number() -> str:
    return f"TSC365-{uuid.uuid4().hex[:8].upper()}"


@router.get("", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Order)
        .options(selectinload(Order.items))
    )
    count_query = select(func.count(Order.id))

    if current_user.role != "admin":
        query = query.where(Order.buyer_id == current_user.id)
        count_query = count_query.where(Order.buyer_id == current_user.id)

    if status_filter:
        query = query.where(Order.status == status_filter)
        count_query = count_query.where(Order.status == status_filter)

    total = (await db.execute(count_query)).scalar()
    offset = (page - 1) * per_page
    result = await db.execute(query.order_by(Order.created_at.desc()).offset(offset).limit(per_page))
    orders = result.scalars().unique().all()

    return OrderListResponse(
        orders=[OrderResponse.model_validate(o) for o in orders],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    subtotal = 0.0
    order_items = []

    for item_data in data.items:
        quantity = item_data.quantity

        if item_data.printify_variant_id:
            price = item_data.price or 0.0
            if price < MIN_PAYABLE_AMOUNT or price > MAX_PAYABLE_AMOUNT:
                raise HTTPException(status_code=400, detail=f"Invalid price ${price:.2f} for Printify item. Must be between ${MIN_PAYABLE_AMOUNT:.2f} and ${MAX_PAYABLE_AMOUNT:.2f}")
            total_price = price * quantity
            subtotal += total_price

            order_items.append(OrderItem(
                quantity=quantity,
                unit_price=price,
                total_price=total_price,
                design_file_url=item_data.design_file_url,
                printify_blueprint_id=item_data.blueprint_id,
                printify_variant_id=item_data.printify_variant_id,
                printify_provider_id=item_data.provider_id,
                product_title=item_data.product_title or "Printify Product",
                variant_title=item_data.variant_title or "",
                product_image=item_data.product_image,
            ))
        else:
            variant = await db.get(ProductVariant, item_data.variant_id)
            if not variant:
                raise HTTPException(status_code=400, detail=f"Variant {item_data.variant_id} not found")

            total_price = float(variant.retail_price) * quantity
            subtotal += total_price

            order_items.append(OrderItem(
                product_id=variant.product_id,
                variant_id=variant.id,
                quantity=quantity,
                unit_price=float(variant.retail_price),
                total_price=total_price,
                design_file_url=item_data.design_file_url,
            ))

    shipping_cost = SHIPPING_COST
    tax = round(subtotal * TAX_RATE, 2)
    total = round(subtotal + shipping_cost + tax, 2)

    order = Order(
        order_number=generate_order_number(),
        buyer_id=current_user.id,
        status="pending",
        subtotal=round(subtotal, 2),
        shipping_cost=shipping_cost,
        tax=tax,
        total=total,
        shipping_address=data.shipping_address,
        billing_address=data.billing_address,
        notes=data.notes,
        store_connection_id=data.store_connection_id,
    )
    db.add(order)
    await db.flush()

    for item in order_items:
        item.order_id = order.id
        db.add(item)

    await db.commit()

    result = await db.execute(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    )
    order = result.scalar_one()
    return OrderResponse.model_validate(order)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.buyer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return OrderResponse.model_validate(order)


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    order.status = data.status
    if data.tracking_number:
        order.tracking_number = data.tracking_number
    if data.tracking_url:
        order.tracking_url = data.tracking_url
    if data.status == "shipped":
        order.shipped_at = datetime.now(timezone.utc)
    elif data.status == "delivered":
        order.delivered_at = datetime.now(timezone.utc)

    await db.commit()

    result = await db.execute(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    )
    order = result.scalar_one()
    return OrderResponse.model_validate(order)
