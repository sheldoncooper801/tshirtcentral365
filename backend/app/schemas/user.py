from pydantic import BaseModel, EmailStr, Field
from typing import Literal
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    full_name: str = Field(min_length=1, max_length=100)
    role: Literal["seller", "provider"] = "seller"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
    bio: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
