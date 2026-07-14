from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.product import Product, ProductVariant
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductVariantCreate,
    ProductResponse, ProductListResponse, ProductVariantResponse,
)

router = APIRouter()
from app.core.limiter import limiter


def _escape_ilike(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/my", response_model=ProductListResponse)
async def my_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.seller_id == current_user.id).options(selectinload(Product.variants))
    count_query = select(func.count(Product.id)).where(Product.seller_id == current_user.id)

    total = (await db.execute(count_query)).scalar()
    offset = (page - 1) * per_page
    result = await db.execute(query.offset(offset).limit(per_page))
    products = result.scalars().unique().all()

    return ProductListResponse(
        products=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category_id: int | None = None,
    published_only: bool = True,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).options(selectinload(Product.variants))
    count_query = select(func.count(Product.id))

    if published_only:
        query = query.where(Product.is_published == True)
        count_query = count_query.where(Product.is_published == True)
    if category_id:
        query = query.where(Product.category_id == category_id)
        count_query = count_query.where(Product.category_id == category_id)
    if search:
        escaped = _escape_ilike(search)
        like = f"%{escaped}%"
        query = query.where(Product.title.ilike(like, escape="\\"))
        count_query = count_query.where(Product.title.ilike(like, escape="\\"))

    total = (await db.execute(count_query)).scalar()
    offset = (page - 1) * per_page
    result = await db.execute(query.offset(offset).limit(per_page))
    products = result.scalars().unique().all()

    return ProductListResponse(
        products=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_product(request: Request, data: ProductCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    product = Product(
        seller_id=current_user.id,
        **data.model_dump(),
    )
    db.add(product)
    await db.commit()

    result = await db.execute(
        select(Product).where(Product.id == product.id).options(selectinload(Product.variants))
    )
    product = result.scalar_one()
    return ProductResponse.model_validate(product)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id).options(selectinload(Product.variants)))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.views += 1
    await db.commit()
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    product.profit_margin = float(product.retail_price - product.base_cost)
    await db.commit()

    result = await db.execute(
        select(Product).where(Product.id == product.id).options(selectinload(Product.variants))
    )
    product = result.scalar_one()
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(product)
    await db.commit()


@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
async def add_variant(
    product_id: int,
    data: ProductVariantCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    variant = ProductVariant(product_id=product_id, **data.model_dump())
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    return ProductVariantResponse.model_validate(variant)


@router.get("/{product_id}/variants", response_model=list[ProductVariantResponse])
async def list_variants(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProductVariant).where(ProductVariant.product_id == product_id)
    )
    return [ProductVariantResponse.model_validate(v) for v in result.scalars().all()]
