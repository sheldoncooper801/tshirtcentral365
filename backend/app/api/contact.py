from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.contact import ContactMessage
import logging

logger = logging.getLogger("tsc365")
router = APIRouter()
from app.core.limiter import limiter


class ContactForm(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    subject: str = Field(..., max_length=100)
    message: str = Field(..., min_length=10, max_length=5000)


@router.post("/contact")
@limiter.limit("5/hour")
async def submit_contact(request: Request, form: ContactForm, db: AsyncSession = Depends(get_db)):
    msg = ContactMessage(
        name=form.name,
        email=form.email,
        subject=form.subject,
        message=form.message,
    )
    db.add(msg)
    await db.commit()

    logger.info(
        f"Contact form: name={form.name} email={form.email} "
        f"subject={form.subject} ip={request.client.host if request.client else 'unknown'}"
    )
    return {
        "detail": "Message received. We'll get back to you within 24 hours.",
        "success": True,
    }


@router.get("/contact/messages")
async def list_messages(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin only")

    result = await db.execute(
        select(ContactMessage).order_by(desc(ContactMessage.created_at)).limit(100)
    )
    messages = result.scalars().all()
    total_result = await db.execute(select(func.count()).select_from(ContactMessage))
    total = total_result.scalar()

    unread_result = await db.execute(
        select(func.count()).select_from(ContactMessage).where(ContactMessage.read == 0)
    )
    unread = unread_result.scalar()

    return {"messages": messages, "total": total, "unread": unread}
