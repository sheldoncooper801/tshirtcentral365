from pydantic import BaseModel, Field
from datetime import datetime


class ProductCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    category_id: int | None = None
    base_cost: float = Field(ge=0)
    retail_price: float = Field(gt=0)
    tags: list[str] | None = None


class ProductUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category_id: int | None = None
    retail_price: float | None = None
    tags: list[str] | None = None
    is_published: bool | None = None


class ProductVariantCreate(BaseModel):
    provider_id: int
    size: str
    color: str
    color_hex: str | None = None
    base_cost: float
    retail_price: float
    sku: str | None = None
    image_url: str | None = None


class ProductVariantResponse(BaseModel):
    id: int
    provider_id: int
    size: str
    color: str
    color_hex: str | None
    base_cost: float
    retail_price: float
    in_stock: bool
    image_url: str | None

    model_config = {"from_attributes": True}


class ProductResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    base_cost: float
    retail_price: float
    mockup_urls: dict | None
    design_file_url: str | None
    tags: list | None
    is_published: bool
    views: int
    created_at: datetime
    updated_at: datetime
    variants: list[ProductVariantResponse] = []

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    products: list[ProductResponse]
    total: int
    page: int
    per_page: int
