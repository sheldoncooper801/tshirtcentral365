from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime


class OrderItemCreate(BaseModel):
    variant_id: int | None = None
    blueprint_id: int | None = None
    printify_variant_id: int | None = None
    provider_id: int | None = None
    product_title: str | None = None
    variant_title: str | None = None
    product_image: str | None = None
    price: float | None = None
    quantity: int = Field(gt=0, le=100)
    design_file_url: str | None = None


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    shipping_address: dict
    billing_address: dict | None = None
    notes: str | None = None
    store_connection_id: int | None = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: int | None = None
    variant_id: int | None = None
    quantity: int
    unit_price: float
    total_price: float
    design_file_url: str | None
    printify_blueprint_id: int | None = None
    printify_variant_id: int | None = None
    printify_provider_id: int | None = None
    product_title: str | None = None
    variant_title: str | None = None
    product_image: str | None = None

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: str
    provider_status: str | None
    tracking_number: str | None
    tracking_url: str | None
    printify_order_id: str | None = None
    printify_status: str | None = None
    subtotal: float
    shipping_cost: float
    tax: float
    total: float
    shipping_address: dict
    notes: str | None
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime
    shipped_at: datetime | None
    delivered_at: datetime | None

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]
    total: int
    page: int
    per_page: int


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "processing", "shipped", "delivered", "cancelled"]
    tracking_number: str | None = None
    tracking_url: str | None = None
