import logging
from datetime import datetime, timezone
import re
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.catalog import CatalogBlueprint, CatalogSyncLog
from app.services.printify import PrintifyClient

logger = logging.getLogger("tsc365")
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
                "starting_price": i.starting_price,
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
        "starting_price": item.starting_price,
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
                desc = re.sub(r"<[^>]+>", " ", bp.get("description", "") or "")
                desc = re.sub(r"\s+", " ", desc).strip()
                title = bp.get("title", "") or ""
                brand = bp.get("brand", "") or ""
                title_lower = title.lower()

                category = "Apparel"
                if any(w in title_lower for w in ["mug", "cup", "tumbler", "bottle", "stein", "flask", "wine tumbler"]):
                    category = "Drinkware"
                elif any(w in title_lower for w in ["phone case", "iphone", "samsung", "airpod", "case", "phone skin", "grip", "mouse pad"]):
                    category = "Electronics"
                elif any(w in title_lower for w in ["poster", "canvas", "wall art", "framed", "acrylic print", "metal print", "wood print", "banner", "yard sign", "tapestry"]):
                    category = "Wall Art"
                elif any(w in title_lower for w in ["bag", "tote", "backpack", "fanny", "pouch", "duffle", "drawstring", "luggage"]):
                    category = "Bags"
                elif any(w in title_lower for w in ["hat", "cap", "beanie", "visor", "beret", "headband", "balaclava", "trucker"]):
                    category = "Headwear"
                elif any(w in title_lower for w in ["sock", "legging", "bracelet", "bangle", "keychain", "bandana", "scarf", "face mask", "lanyard", "wristband"]):
                    category = "Accessories"
                elif any(w in title_lower for w in ["pillow", "blanket", "throw", "towel", "magnet", "coaster", "rug", "doormat", "apron", "flag", "ornament", "candle", "tray", "serving", "bamboo", "pet", "yoga mat", "duvet", "bed"]):
                    category = "Home"
                elif any(w in title_lower for w in ["sticker", "label", "decal"]):
                    category = "Stickers"
                elif any(w in title_lower for w in ["notebook", "journal", "planner", "pen", "bookmark", "greeting card", "calendar", "notepad"]):
                    category = "Stationery"
                elif any(w in title_lower for w in ["shoe", "slide", "slipper", "sneaker", "boot", "sandal", "eva foam", "clog"]):
                    category = "Footwear"

                featured = any(w in title_lower for w in [
                    "t-shirt", "tee", "hoodie", "sweatshirt", "pullover",
                    "mug", "poster", "phone case", "tote", "cap",
                ])

                price_map = {
                    "Apparel": 24.99, "Drinkware": 16.99, "Wall Art": 22.99,
                    "Bags": 27.99, "Electronics": 22.99, "Headwear": 19.99,
                    "Accessories": 16.99, "Home": 21.99, "Stickers": 5.99,
                    "Stationery": 14.99, "Footwear": 34.99,
                }
                starting = price_map.get(category, 19.99)

                if row:
                    row.title = title
                    row.description = desc
                    row.brand = brand
                    row.model = bp.get("model", "")
                    row.images = images
                    row.category = category
                    row.is_featured = featured
                    if not row.starting_price:
                        row.starting_price = starting
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
                        starting_price=starting,
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
        logger.error(f"Catalog sync failed: {e}")
        raise HTTPException(status_code=500, detail="Sync failed. Please try again later.")

    return {"status": "completed", "total_synced": total_synced}
