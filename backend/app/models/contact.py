from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(300), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
