import httpx
from typing import Any
from app.core.config import get_settings

settings = get_settings()
BASE_URL = "https://api.printify.com/v1"
V2_BASE_URL = "https://api.printify.com/v2"


class PrintifyClient:
    def __init__(self, token: str | None = None, shop_id: str | None = None):
        self.token = token or settings.PRINTIFY_API_TOKEN
        self.shop_id = shop_id or settings.PRINTIFY_SHOP_ID
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "User-Agent": "T-Shirt-Central-365-Integration/1.0",
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, url: str, **kwargs) -> Any:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(method, url, headers=self.headers, **kwargs)
            if resp.status_code == 429:
                retry_after = resp.headers.get("Retry-After", "5")
                raise Exception(f"Rate limited. Retry after {retry_after}s")
            if resp.status_code >= 400:
                detail = resp.text
                raise Exception(f"Printify API error {resp.status_code}: {detail}")
            if resp.status_code == 204:
                return None
            return resp.json()

    async def _get(self, path: str, params: dict = None) -> Any:
        return await self._request("GET", f"{BASE_URL}{path}", params=params)

    async def _post(self, path: str, data: dict = None) -> Any:
        return await self._request("POST", f"{BASE_URL}{path}", json=data)

    async def _put(self, path: str, data: dict = None) -> Any:
        return await self._request("PUT", f"{BASE_URL}{path}", json=data)

    async def _delete(self, path: str) -> Any:
        return await self._request("DELETE", f"{BASE_URL}{path}")

    async def _v2_get(self, path: str, params: dict = None) -> Any:
        return await self._request("GET", f"{V2_BASE_URL}{path}", params=params)

    async def list_shops(self) -> list[dict]:
        return await self._get("/shops.json")

    async def list_blueprints(self, page: int = 1, limit: int = 100) -> dict:
        return await self._get("/catalog/blueprints.json", params={"page": page, "limit": limit})

    async def get_blueprint(self, blueprint_id: int) -> dict:
        return await self._get(f"/catalog/blueprints/{blueprint_id}.json")

    async def list_blueprint_providers(self, blueprint_id: int) -> list[dict]:
        return await self._get(f"/catalog/blueprints/{blueprint_id}/print_providers.json")

    async def get_blueprint_variants(self, blueprint_id: int, provider_id: int) -> dict:
        return await self._get(f"/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json")

    async def get_blueprint_shipping(self, blueprint_id: int, provider_id: int) -> dict:
        return await self._get(f"/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/shipping.json")

    async def list_print_providers(self) -> list[dict]:
        return await self._get("/catalog/print_providers.json")

    async def get_print_provider(self, provider_id: int) -> dict:
        return await self._get(f"/catalog/print_providers/{provider_id}.json")

    async def list_products(self, page: int = 1, limit: int = 10) -> dict:
        return await self._get(f"/shops/{self.shop_id}/products.json", params={"page": page, "limit": limit})

    async def get_product(self, product_id: str) -> dict:
        return await self._get(f"/shops/{self.shop_id}/products/{product_id}.json")

    async def create_product(self, data: dict) -> dict:
        return await self._post(f"/shops/{self.shop_id}/products.json", data=data)

    async def update_product(self, product_id: str, data: dict) -> dict:
        return await self._put(f"/shops/{self.shop_id}/products/{product_id}.json", data=data)

    async def delete_product(self, product_id: str) -> None:
        return await self._delete(f"/shops/{self.shop_id}/products/{product_id}.json")

    async def publish_product(self, product_id: str, data: dict = None) -> dict:
        publish_data = data or {
            "title": True, "description": True, "images": True,
            "variants": True, "tags": True, "keyFeatures": True,
        }
        return await self._post(f"/shops/{self.shop_id}/products/{product_id}/publish.json", data=publish_data)

    async def upload_image(self, image_url: str = None, contents: str = None) -> dict:
        payload = {}
        if image_url:
            payload["url"] = image_url
        if contents:
            payload["contents"] = contents
        return await self._post("/uploads/images.json", data=payload)

    async def list_orders(self, page: int = 1, limit: int = 10, status: str = None) -> dict:
        params = {"page": page, "limit": limit}
        if status:
            params["status"] = status
        return await self._get(f"/shops/{self.shop_id}/orders.json", params=params)

    async def get_order(self, order_id: str) -> dict:
        return await self._get(f"/shops/{self.shop_id}/orders/{order_id}.json")

    async def create_order(self, data: dict) -> dict:
        return await self._post(f"/shops/{self.shop_id}/orders.json", data=data)

    async def create_express_order(self, data: dict) -> dict:
        return await self._post(f"/shops/{self.shop_id}/express.json", data=data)

    async def calculate_shipping(self, data: dict) -> dict:
        return await self._post(f"/shops/{self.shop_id}/orders/shipping.json", data=data)

    async def send_to_production(self, order_id: str) -> dict:
        return await self._post(f"/shops/{self.shop_id}/orders/{order_id}/send_to_production.json")

    async def cancel_order(self, order_id: str) -> dict:
        return await self._post(f"/shops/{self.shop_id}/orders/{order_id}/cancel.json")

    async def list_webhooks(self) -> list[dict]:
        return await self._get(f"/shops/{self.shop_id}/webhooks.json")

    async def create_webhook(self, topic: str, url: str) -> dict:
        return await self._post(f"/shops/{self.shop_id}/webhooks.json", data={"topic": topic, "url": url})

    async def delete_webhook(self, webhook_id: str) -> None:
        return await self._delete(f"/shops/{self.shop_id}/webhooks/{webhook_id}.json")

    async def get_shipping_v2(self, blueprint_id: int, provider_id: int) -> dict:
        return await self._v2_get(f"/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/shipping.json")
