from pydantic import BaseModel
from datetime import datetime


class ProviderCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    website: str | None = None
    email: str | None = None
    countries: list[str] | None = None
    product_types: list[str] | None = None
    fulfillment_time_days: int | None = None
    api_endpoint: str | None = None


class ProviderUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    website: str | None = None
    countries: list[str] | None = None
    product_types: list[str] | None = None
    fulfillment_time_days: int | None = None
    is_active: bool | None = None


class ProviderResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    website: str | None
    countries: list | None
    product_types: list | None
    fulfillment_time_days: int | None
    is_active: bool
    rating: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProviderListResponse(BaseModel):
    providers: list[ProviderResponse]
    total: int
