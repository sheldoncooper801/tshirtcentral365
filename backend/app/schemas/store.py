from pydantic import BaseModel
from datetime import datetime


class StoreConnect(BaseModel):
    platform: str
    store_name: str
    access_token: str
    refresh_token: str | None = None
    store_url: str | None = None
    settings: dict | None = None


class StoreConnectionResponse(BaseModel):
    id: int
    platform: str
    store_name: str
    store_url: str | None
    is_active: bool
    last_synced_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StoreListResponse(BaseModel):
    connections: list[StoreConnectionResponse]
