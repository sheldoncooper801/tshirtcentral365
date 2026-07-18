from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.core.config import get_settings, BASE_DIR
from app.core.database import engine, Base
from app.middleware import SecurityHeadersMiddleware, RequestIDMiddleware
from app.logging_config import setup_logging
from app.api import auth, products, orders, providers, uploads, integrations, payments, printify, catalog, contact, designs
import app.models  # noqa: ensure all models registered
import os

settings = get_settings()
logger = setup_logging(settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    if not settings.SECRET_KEY:
        raise RuntimeError("SECRET_KEY environment variable is required. Set a random 64-char hex string.")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")

    if settings.PRINTIFY_API_TOKEN:
        try:
            from sqlalchemy import select, func
            from app.core.database import async_session
            from app.models.catalog import CatalogBlueprint

            async with async_session() as session:
                result = await session.execute(select(func.count()).select_from(CatalogBlueprint))
                count = result.scalar()
            if count == 0:
                logger.info("Catalog empty — auto-syncing from Printify...")
                from app.services.printify import PrintifyClient
                from app.models.catalog import CatalogSyncLog

                client = PrintifyClient()
                page = 1
                total = 0
                async with async_session() as session:
                    while True:
                        response = await client.list_blueprints(page=page, limit=100)
                        if not response:
                            break
                        blueprints = response.get("data", []) if isinstance(response, dict) else response
                        last_page = response.get("last_page", page) if isinstance(response, dict) else page
                        if not blueprints:
                            break
                        for bp in blueprints:
                            existing = await session.execute(
                                select(CatalogBlueprint).where(CatalogBlueprint.printify_id == bp["id"])
                            )
                            row = existing.scalar_one_or_none()
                            title = bp.get("title", "") or ""
                            title_lower = title.lower()
                            category = "Apparel"
                            if any(w in title_lower for w in ["mug", "cup"]): category = "Drinkware"
                            elif any(w in title_lower for w in ["phone case", "iphone", "samsung"]): category = "Electronics"
                            elif any(w in title_lower for w in ["poster", "canvas", "wall art", "framed"]): category = "Wall Art"
                            elif any(w in title_lower for w in ["bag", "tote", "backpack"]): category = "Bags"
                            elif any(w in title_lower for w in ["hat", "cap", "beanie", "visor"]): category = "Headwear"
                            elif any(w in title_lower for w in ["sock", "legging", "jogger"]): category = "Accessories"
                            elif any(w in title_lower for w in ["pillow", "blanket", "throw"]): category = "Home"
                            elif any(w in title_lower for w in ["sticker", "label", "decal"]): category = "Stickers"
                            elif any(w in title_lower for w in ["book", "journal", "notebook", "planner"]): category = "Stationery"
                            elif any(w in title_lower for w in ["shoe", "slide", "slipper"]): category = "Footwear"
                            featured = any(w in title_lower for w in ["t-shirt", "tee", "hoodie", "sweatshirt", "pullover", "mug", "poster", "phone case", "tote", "cap"])
                            if not row:
                                session.add(CatalogBlueprint(
                                    printify_id=bp["id"], title=title,
                                    description=bp.get("description", "") or "",
                                    brand=bp.get("brand", "") or "",
                                    model=bp.get("model", ""),
                                    images=bp.get("images", []) or [],
                                    category=category, is_featured=featured,
                                ))
                            total += 1
                        await session.commit()
                        if page >= last_page or len(blueprints) < 100:
                            break
                        page += 1
                logger.info(f"Auto-sync complete: {total} products")
        except Exception as e:
            logger.error(f"Auto-sync failed: {e}")

    yield
    logger.info("Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIDMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/api/health")
@limiter.limit("30/minute")
async def health(request: Request):
    from sqlalchemy import text
    from app.core.database import async_session

    health_status = {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION, "checks": {}}

    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        health_status["checks"]["database"] = "ok"
    except Exception:
        health_status["status"] = "degraded"
        health_status["checks"]["database"] = "error"

    health_status["checks"]["square"] = "configured" if settings.SQUARE_ACCESS_TOKEN else "not_configured"
    health_status["checks"]["printify"] = "configured" if settings.PRINTIFY_API_TOKEN else "not_configured"
    health_status["checks"]["s3"] = "configured" if settings.AWS_ACCESS_KEY_ID else "not_configured"

    status_code = 200 if health_status["status"] == "ok" else 503
    return JSONResponse(content=health_status, status_code=status_code)


app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(providers.router, prefix="/api/providers", tags=["Providers"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(printify.router, prefix="/api/printify", tags=["Printify"])
app.include_router(catalog.router, prefix="/api", tags=["Catalog"])
app.include_router(contact.router, prefix="/api", tags=["Contact"])
app.include_router(designs.router, prefix="/api", tags=["Designs"])

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")


@app.get("/uploads/{file_path:path}")
async def serve_upload(file_path: str):
    from fastapi.responses import FileResponse
    full_path = os.path.normpath(os.path.join(UPLOAD_DIR, file_path))
    if not full_path.startswith(os.path.normpath(UPLOAD_DIR)):
        return JSONResponse(status_code=400, content={"detail": "Invalid path"})
    if os.path.isfile(full_path):
        return FileResponse(full_path)
    return JSONResponse(status_code=404, content={"detail": "File not found"})
