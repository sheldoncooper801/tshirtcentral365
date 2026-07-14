from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, Numeric, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PrintProvider(Base):
    __tablename__ = "print_providers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    countries: Mapped[list | None] = mapped_column(JSON, nullable=True)
    product_types: Mapped[list | None] = mapped_column(JSON, nullable=True)
    fulfillment_time_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    shipping_methods: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    rating: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    api_endpoint: Mapped[str | None] = mapped_column(String(500), nullable=True)
    api_key: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    variants: Mapped[list["ProductVariant"]] = relationship(back_populates="provider")
    orders: Mapped[list["Order"]] = relationship(back_populates="provider")
