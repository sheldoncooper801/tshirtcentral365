from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, Integer, JSON, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class CatalogBlueprint(Base):
    __tablename__ = "catalog_blueprints"

    id: Mapped[int] = mapped_column(primary_key=True)
    printify_id: Mapped[int] = mapped_column(unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    images: Mapped[list | None] = mapped_column(JSON, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class CatalogSyncLog(Base):
    __tablename__ = "catalog_sync_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    total_blueprints: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="running")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
