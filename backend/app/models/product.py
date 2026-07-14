from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, Numeric, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category_id: Mapped[int | None] = mapped_column(ForeignKey("product_categories.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")

    base_cost: Mapped[float] = mapped_column(Numeric(10, 2))
    retail_price: Mapped[float] = mapped_column(Numeric(10, 2))
    profit_margin: Mapped[float] = mapped_column(Numeric(5, 2), default=0)

    mockup_urls: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    design_file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    placement: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    views: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    seller: Mapped["User"] = relationship(back_populates="products")
    category: Mapped["ProductCategory | None"] = relationship(back_populates="products")
    variants: Mapped[list["ProductVariant"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    provider_id: Mapped[int] = mapped_column(ForeignKey("print_providers.id"))
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True)
    size: Mapped[str] = mapped_column(String(20))
    color: Mapped[str] = mapped_column(String(50))
    color_hex: Mapped[str | None] = mapped_column(String(7), nullable=True)
    base_cost: Mapped[float] = mapped_column(Numeric(10, 2))
    retail_price: Mapped[float] = mapped_column(Numeric(10, 2))
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    product: Mapped["Product"] = relationship(back_populates="variants")
    provider: Mapped["PrintProvider"] = relationship(back_populates="variants")
