from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.catalog import CatalogBlueprint, CatalogSyncLog
from app.services.printify import PrintifyClient

router = APIRouter()
from app.core.limiter import limiter


def _escape_ilike(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/catalog/categories/list")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CatalogBlueprint.category, func.count(CatalogBlueprint.id))
        .where(CatalogBlueprint.category.isnot(None))
        .group_by(CatalogBlueprint.category)
        .order_by(func.count(CatalogBlueprint.id).desc())
    )
    return [{"name": r[0], "count": r[1]} for r in result.all()]


@router.get("/catalog/brands/list")
async def list_brands(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CatalogBlueprint.brand, func.count(CatalogBlueprint.id))
        .where(CatalogBlueprint.brand.isnot(None))
        .group_by(CatalogBlueprint.brand)
        .order_by(func.count(CatalogBlueprint.id).desc())
        .limit(50)
    )
    return [{"name": r[0], "count": r[1]} for r in result.all()]


@router.get("/catalog")
async def list_catalog(
    page: int = Query(1, ge=1),
    per_page: int = Query(24, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    featured_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    query = select(CatalogBlueprint)
    count_query = select(func.count(CatalogBlueprint.id))

    if search:
        escaped = _escape_ilike(search)
        like = f"%{escaped}%"
        clause = or_(
            CatalogBlueprint.title.ilike(like, escape="\\"),
            CatalogBlueprint.brand.ilike(like, escape="\\"),
            CatalogBlueprint.description.ilike(like, escape="\\"),
        )
        query = query.where(clause)
        count_query = count_query.where(clause)
    if category:
        query = query.where(CatalogBlueprint.category == category)
        count_query = count_query.where(CatalogBlueprint.category == category)
    if brand:
        query = query.where(CatalogBlueprint.brand == brand)
        count_query = count_query.where(CatalogBlueprint.brand == brand)
    if featured_only:
        query = query.where(CatalogBlueprint.is_featured == True)
        count_query = count_query.where(CatalogBlueprint.is_featured == True)

    total = (await db.execute(count_query)).scalar()
    offset = (page - 1) * per_page
    result = await db.execute(query.order_by(CatalogBlueprint.title).offset(offset).limit(per_page))
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": i.printify_id,
                "title": i.title,
                "description": i.description,
                "brand": i.brand,
                "model": i.model,
                "images": i.images or [],
                "category": i.category,
                "is_featured": i.is_featured,
            }
            for i in items
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/catalog/{printify_id}")
async def get_catalog_item(printify_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CatalogBlueprint).where(CatalogBlueprint.printify_id == printify_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": item.printify_id,
        "title": item.title,
        "description": item.description,
        "brand": item.brand,
        "model": item.model,
        "images": item.images or [],
        "category": item.category,
        "is_featured": item.is_featured,
    }


@router.post("/catalog/sync")
@limiter.limit("5/hour")
async def sync_catalog(request: Request, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    log = CatalogSyncLog(status="running")
    db.add(log)
    await db.flush()

    client = PrintifyClient()
    page = 1
    total_synced = 0

    try:
        while True:
            response = await client.list_blueprints(page=page, limit=100)
            if not response:
                break

            if isinstance(response, dict):
                blueprints = response.get("data", [])
                last_page = response.get("last_page", page)
            else:
                blueprints = response
                last_page = page

            if not blueprints:
                break

            for bp in blueprints:
                existing = await db.execute(
                    select(CatalogBlueprint).where(CatalogBlueprint.printify_id == bp["id"])
                )
                row = existing.scalar_one_or_none()

                images = bp.get("images", []) or []
                desc = bp.get("description", "") or ""
                title = bp.get("title", "") or ""
                brand = bp.get("brand", "") or ""
                title_lower = title.lower()

                category = "Apparel"
                if any(w in title_lower for w in ["mug", "cup"]):
                    category = "Drinkware"
                elif any(w in title_lower for w in ["phone case", "iphone", "samsung"]):
                    category = "Electronics"
                elif any(w in title_lower for w in ["poster", "canvas", "wall art", "framed"]):
                    category = "Wall Art"
                elif any(w in title_lower for w in ["bag", "tote", "backpack"]):
                    category = "Bags"
                elif any(w in title_lower for w in ["hat", "cap", "beanie", "visor"]):
                    category = "Headwear"
                elif any(w in title_lower for w in ["sock", "legging", "jogger"]):
                    category = "Accessories"
                elif any(w in title_lower for w in ["pillow", "blanket", "throw"]):
                    category = "Home"
                elif any(w in title_lower for w in ["sticker", "label", "decal"]):
                    category = "Stickers"
                elif any(w in title_lower for w in ["book", "journal", "notebook", "planner"]):
                    category = "Stationery"
                elif any(w in title_lower for w in ["shoe", "slide", "slipper"]):
                    category = "Footwear"

                featured = any(w in title_lower for w in [
                    "t-shirt", "tee", "hoodie", "sweatshirt", "pullover",
                    "mug", "poster", "phone case", "tote", "cap",
                ])

                if row:
                    row.title = title
                    row.description = desc
                    row.brand = brand
                    row.model = bp.get("model", "")
                    row.images = images
                    row.category = category
                    row.is_featured = featured
                else:
                    db.add(CatalogBlueprint(
                        printify_id=bp["id"],
                        title=title,
                        description=desc,
                        brand=brand,
                        model=bp.get("model", ""),
                        images=images,
                        category=category,
                        is_featured=featured,
                    ))
                total_synced += 1

            await db.commit()

            if page >= last_page or len(blueprints) < 100:
                break
            page += 1

        log.total_blueprints = total_synced
        log.status = "completed"
        log.finished_at = datetime.now(timezone.utc)
        await db.commit()

    except Exception as e:
        log.status = "failed"
        log.finished_at = datetime.now(timezone.utc)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

    return {"status": "completed", "total_synced": total_synced}
