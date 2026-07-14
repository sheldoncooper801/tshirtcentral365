from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Numeric, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    provider_id: Mapped[int | None] = mapped_column(ForeignKey("print_providers.id"), nullable=True)
    store_connection_id: Mapped[int | None] = mapped_column(ForeignKey("store_connections.id"), nullable=True)

    status: Mapped[str] = mapped_column(String(30), default="pending")
    provider_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    tracking_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tracking_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))
    shipping_cost: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    tax: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(10, 2))

    shipping_address: Mapped[dict] = mapped_column(JSON)
    billing_address: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    external_order_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    printify_order_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    printify_status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    buyer: Mapped["User"] = relationship(back_populates="orders")
    provider: Mapped["PrintProvider | None"] = relationship(back_populates="orders")
    store_connection: Mapped["StoreConnection | None"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    variant_id: Mapped[int | None] = mapped_column(ForeignKey("product_variants.id"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2))
    total_price: Mapped[float] = mapped_column(Numeric(10, 2))
    design_file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    printify_blueprint_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    printify_variant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    printify_provider_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    product_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    variant_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_image: Mapped[str | None] = mapped_column(String(500), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product | None"] = relationship(back_populates="order_items")
