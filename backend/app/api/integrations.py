import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.store import StoreConnection
from app.schemas.store import StoreConnect, StoreConnectionResponse, StoreListResponse

logger = logging.getLogger("tsc365")
router = APIRouter()
from app.core.limiter import limiter

SHOPIFY_SCOPES = ["read_products", "write_products", "read_orders", "write_orders"]


@router.get("", response_model=StoreListResponse)
async def list_connections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StoreConnection).where(StoreConnection.user_id == current_user.id)
    )
    connections = result.scalars().all()
    return StoreListResponse(
        connections=[StoreConnectionResponse.model_validate(c) for c in connections]
    )


@router.post("/shopify", response_model=StoreConnectionResponse, status_code=201)
@limiter.limit("10/hour")
async def connect_shopify(request: Request, data: StoreConnect, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if data.platform != "shopify":
        raise HTTPException(status_code=400, detail="Use /integrations/connect for other platforms")

    existing = await db.execute(
        select(StoreConnection).where(
            StoreConnection.user_id == current_user.id,
            StoreConnection.platform == "shopify",
            StoreConnection.store_name == data.store_name,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Store already connected")

    conn = StoreConnection(
        user_id=current_user.id,
        platform="shopify",
        store_name=data.store_name,
        store_url=data.store_url,
        access_token=data.access_token,
        refresh_token=data.refresh_token,
        settings=data.settings,
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return StoreConnectionResponse.model_validate(conn)


@router.post("/etsy", response_model=StoreConnectionResponse, status_code=201)
@limiter.limit("10/hour")
async def connect_etsy(request: Request, data: StoreConnect, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    conn = StoreConnection(
        user_id=current_user.id,
        platform="etsy",
        store_name=data.store_name,
        store_url=data.store_url,
        access_token=data.access_token,
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return StoreConnectionResponse.model_validate(conn)


@router.post("/woocommerce", response_model=StoreConnectionResponse, status_code=201)
@limiter.limit("10/hour")
async def connect_woocommerce(request: Request, data: StoreConnect, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    conn = StoreConnection(
        user_id=current_user.id,
        platform="woocommerce",
        store_name=data.store_name,
        store_url=data.store_url,
        access_token=data.access_token,
        settings=data.settings,
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return StoreConnectionResponse.model_validate(conn)


@router.post("/wix", response_model=StoreConnectionResponse, status_code=201)
@limiter.limit("10/hour")
async def connect_wix(request: Request, data: StoreConnect, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(StoreConnection).where(
            StoreConnection.user_id == current_user.id,
            StoreConnection.platform == "wix",
            StoreConnection.store_name == data.store_name,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Wix store already connected")

    conn = StoreConnection(
        user_id=current_user.id,
        platform="wix",
        store_name=data.store_name,
        store_url=data.store_url,
        access_token=data.access_token,
        settings=data.settings or {},
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return StoreConnectionResponse.model_validate(conn)


@router.delete("/{connection_id}", status_code=204)
async def disconnect_store(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StoreConnection).where(
            StoreConnection.id == connection_id,
            StoreConnection.user_id == current_user.id,
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    await db.delete(conn)
    await db.commit()


@router.post("/{connection_id}/sync")
async def sync_store(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StoreConnection).where(
            StoreConnection.id == connection_id,
            StoreConnection.user_id == current_user.id,
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    if conn.platform == "shopify":
        return await _sync_shopify(conn)
    elif conn.platform == "etsy":
        return {"message": "Etsy sync coming soon"}
    elif conn.platform == "woocommerce":
        return await _sync_woocommerce(conn)
    elif conn.platform == "wix":
        return await _sync_wix(conn)

    return {"message": "Sync not supported for this platform"}


async def _sync_shopify(conn: StoreConnection):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://{conn.store_name}.myshopify.com/admin/api/2024-01/orders.json",
            headers={"X-Shopify-Access-Token": conn.access_token},
            params={"status": "any", "limit": 50},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to sync with Shopify")
        return {"orders_synced": len(resp.json().get("orders", []))}


async def _sync_woocommerce(conn: StoreConnection):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{conn.store_url}/wp-json/wc/v3/orders",
            auth=(conn.settings.get("consumer_key", ""), conn.settings.get("consumer_secret", "")),
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to sync with WooCommerce")
        return {"orders_synced": len(resp.json())}


async def _sync_wix(conn: StoreConnection):
    instance_id = conn.settings.get("instance_id", "")
    if not instance_id:
        raise HTTPException(
            status_code=400,
            detail="Wix instance_id not found in connection settings. Reconnect your Wix store.",
        )

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://www.wixapis.com/stores/v1/orders",
            headers={
                "Authorization": f"Bearer {conn.access_token}",
                "wix-account-id": instance_id,
            },
            params={"limit": 50},
        )
        if resp.status_code != 200:
            logger.error(f"Wix API error: {resp.status_code}")
            raise HTTPException(status_code=400, detail="Wix API request failed")
        data = resp.json()
        orders = data.get("orders", [])
        return {"orders_synced": len(orders)}
