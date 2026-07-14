from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.provider import PrintProvider
from app.schemas.provider import (
    ProviderCreate, ProviderUpdate, ProviderResponse, ProviderListResponse,
)

router = APIRouter()


@router.get("", response_model=ProviderListResponse)
async def list_providers(
    country: str | None = None,
    product_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(PrintProvider).where(PrintProvider.is_active == True)
    count_query = select(func.count(PrintProvider.id)).where(PrintProvider.is_active == True)

    result = await db.execute(query)
    providers = result.scalars().all()
    total = (await db.execute(count_query)).scalar()

    return ProviderListResponse(
        providers=[ProviderResponse.model_validate(p) for p in providers],
        total=total,
    )


@router.post("", response_model=ProviderResponse, status_code=201)
async def create_provider(
    data: ProviderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    existing = await db.execute(select(PrintProvider).where(PrintProvider.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Provider slug already exists")

    provider = PrintProvider(**data.model_dump())
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return ProviderResponse.model_validate(provider)


@router.get("/{provider_id}", response_model=ProviderResponse)
async def get_provider(provider_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PrintProvider).where(PrintProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return ProviderResponse.model_validate(provider)


@router.put("/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: int,
    data: ProviderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    result = await db.execute(select(PrintProvider).where(PrintProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(provider, field, value)

    await db.commit()
    await db.refresh(provider)
    return ProviderResponse.model_validate(provider)


@router.get("/{provider_id}/products")
async def provider_product_types(provider_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PrintProvider).where(PrintProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return {"product_types": provider.product_types or [], "countries": provider.countries or []}
