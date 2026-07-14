from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional, Any
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.design import SavedDesign

router = APIRouter()
from app.core.limiter import limiter


class SaveDesignRequest(BaseModel):
    title: Optional[str] = "Untitled Design"
    design_url: str
    blueprint_id: Optional[int] = None
    provider_id: Optional[int] = None
    variant_id: Optional[int] = None
    product_title: Optional[str] = None
    product_image: Optional[str] = None
    front_design_url: Optional[str] = None
    back_design_url: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    design_config: Optional[dict[str, Any]] = None
    retail_price: Optional[float] = None


class UpdateDesignRequest(BaseModel):
    title: Optional[str] = None
    design_url: Optional[str] = None
    design_config: Optional[dict[str, Any]] = None
    retail_price: Optional[float] = None


@router.get("/designs")
@limiter.limit("30/minute")
async def list_designs(request: Request, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SavedDesign).where(SavedDesign.user_id == current_user.id).order_by(desc(SavedDesign.created_at))
    )
    designs = result.scalars().all()
    return [
        {
            "id": d.id,
            "title": d.title or d.name or "Untitled Design",
            "blueprint_id": d.blueprint_id,
            "provider_id": d.provider_id,
            "variant_id": d.variant_id,
            "design_url": d.design_url,
            "front_design_url": d.front_design_url,
            "back_design_url": d.back_design_url,
            "color": d.color,
            "size": d.size,
            "design_config": d.design_config,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in designs
    ]


@router.post("/designs")
@limiter.limit("20/minute")
async def save_design(request: Request, req: SaveDesignRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    design = SavedDesign(
        user_id=current_user.id,
        name=req.title or "Untitled Design",
        title=req.title,
        design_url=req.design_url,
        blueprint_id=req.blueprint_id,
        provider_id=req.provider_id,
        variant_id=req.variant_id,
        product_title=req.product_title,
        product_image=req.product_image,
        front_design_url=req.front_design_url,
        back_design_url=req.back_design_url,
        color=req.color,
        size=req.size,
        design_config=req.design_config,
        retail_price=int(req.retail_price) if req.retail_price else None,
    )
    db.add(design)
    await db.commit()
    await db.refresh(design)
    return {"id": design.id, "message": "Design saved"}


@router.put("/designs/{design_id}")
async def update_design(
    design_id: int,
    req: UpdateDesignRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedDesign).where(SavedDesign.id == design_id, SavedDesign.user_id == current_user.id)
    )
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    if req.title is not None:
        design.title = req.title
        design.name = req.title
    if req.design_url is not None:
        design.design_url = req.design_url
    if req.design_config is not None:
        design.design_config = req.design_config
    if req.retail_price is not None:
        design.retail_price = int(req.retail_price)

    await db.commit()
    await db.refresh(design)
    return {"id": design.id, "message": "Design updated"}


@router.delete("/designs/{design_id}")
async def delete_design(
    design_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedDesign).where(SavedDesign.id == design_id, SavedDesign.user_id == current_user.id)
    )
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    await db.delete(design)
    await db.commit()
    return {"detail": "Design deleted"}
