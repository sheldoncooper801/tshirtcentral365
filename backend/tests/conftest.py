import pytest_asyncio
import os
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User
from app.core import limiter as _limiter_module

os.environ["TESTING"] = "1"

_original_limit = _limiter_module.limiter.limit

def _noop_limit(*args, **kwargs):
    def decorator(func):
        return func
    return decorator

_limiter_module.limiter.limit = _noop_limit

TEST_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_tshirtcentral365.db")
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with test_session() as session:
        try:
            yield session
        finally:
            await session.close()

app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    try:
        os.remove(TEST_DB_PATH)
    except OSError:
        pass


@pytest_asyncio.fixture(scope="session")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture(scope="session")
async def test_user(client):
    resp = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User",
    })
    return resp.json()["user"]


@pytest_asyncio.fixture(scope="session")
async def admin_user(client):
    resp = await client.post("/api/auth/register", json={
        "email": "admin@example.com",
        "password": "adminpass123",
        "full_name": "Admin User",
    })
    return resp.json()["user"]


@pytest_asyncio.fixture(scope="session")
async def auth_token(client, test_user):
    resp = await client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123",
    })
    return resp.json()["access_token"]


@pytest_asyncio.fixture(scope="session")
async def admin_token(client, admin_user):
    resp = await client.post("/api/auth/login", json={
        "email": "admin@example.com",
        "password": "adminpass123",
    })
    return resp.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
