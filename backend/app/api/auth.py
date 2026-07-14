from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.config import get_settings
from app.core.security import hash_password, verify_password, create_token, decode_token, get_current_user
from datetime import timedelta
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, UserUpdate, Token
import logging

router = APIRouter()
from app.core.limiter import limiter
settings = get_settings()
logger = logging.getLogger("tsc365")


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/hour")
async def register(request: Request, data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role="seller",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = create_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


class GoogleLoginRequest(BaseModel):
    credential: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8)


class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/google", response_model=Token)
@limiter.limit("10/minute")
async def google_login(request: Request, data: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google login not configured")

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )

        google_id = idinfo["sub"]
        email = idinfo.get("email", "")
        name = idinfo.get("name", "")
        avatar = idinfo.get("picture", "")

        if not email:
            raise HTTPException(status_code=400, detail="Email not available from Google")

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if user:
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account disabled")
        user.auth_provider = "google"
        user.auth_provider_id = google_id
        if avatar and not user.avatar_url:
            user.avatar_url = avatar
        await db.commit()
    else:
        user = User(
            email=email,
            hashed_password=hash_password(google_id),
            full_name=name or email.split("@")[0],
            role="seller",
            auth_provider="google",
            auth_provider_id=google_id,
            avatar_url=avatar or None,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/forgot-password")
@limiter.limit("5/hour")
async def forgot_password(request: Request, data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if user:
        reset_token = create_token(
            {"sub": str(user.id), "type": "reset"},
            expires_delta=timedelta(hours=1),
        )
        logger.info(f"Password reset requested for {data.email} (token generated)")
    return {"detail": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
@limiter.limit("5/hour")
async def reset_password(request: Request, data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.hashed_password = hash_password(data.password)
    await db.commit()
    return {"detail": "Password reset successful"}


@router.post("/verify-email")
@limiter.limit("10/hour")
async def verify_email(request: Request, data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.token)
    if not payload or payload.get("type") != "email_verify":
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    user.email_verified = True
    user.verification_token = None
    await db.commit()
    return {"detail": "Email verified successfully"}


@router.post("/resend-verification")
@limiter.limit("3/hour")
async def resend_verification(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    verification_token = create_token(
        {"sub": str(current_user.id), "type": "email_verify"},
        expires_delta=timedelta(hours=24),
    )
    current_user.verification_token = verification_token
    await db.commit()
    logger.info(f"Verification email sent to {current_user.email}")
    return {"detail": "Verification email sent"}


@router.get("/admin/users")
@limiter.limit("30/minute")
async def list_users(
    request: Request,
    page: int = 1,
    per_page: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar()
    offset = (page - 1) * per_page
    result = await db.execute(select(User).offset(offset).limit(per_page))
    users = result.scalars().all()
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }
