from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class SavedDesign(Base):
    __tablename__ = "saved_designs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False, default="Untitled Design")
    title = Column(String(300), nullable=True)
    design_url = Column(String(500), nullable=False)
    blueprint_id = Column(Integer, nullable=True)
    provider_id = Column(Integer, nullable=True)
    variant_id = Column(Integer, nullable=True)
    product_title = Column(String(300), nullable=True)
    product_image = Column(String(500), nullable=True)
    front_design_url = Column(String(500), nullable=True)
    back_design_url = Column(String(500), nullable=True)
    color = Column(String(100), nullable=True)
    size = Column(String(50), nullable=True)
    design_options = Column(JSON, nullable=True)
    design_config = Column(JSON, nullable=True)
    retail_price = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
