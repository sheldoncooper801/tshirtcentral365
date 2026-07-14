import time
import uuid
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("tsc365")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if not request.url.path.startswith("/api/docs") and not request.url.path.startswith("/api/openapi"):
            response.headers["Content-Security-Policy"] = (
                "default-src 'self' https://www.tshirtcentral365.com https://tshirtcentral365.com https://api.tshirtcentral365.com; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sandbox.web.squarecdn.com https://web.squarecdn.com https://analytics.sitesgpt.com https://accounts.google.com https://apis.google.com; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' https: data: blob:; "
                "font-src 'self' https://fonts.gstatic.com; "
                "connect-src 'self' https://sandbox.web.squarecdn.com https://web.squarecdn.com https://*.squarecdn.com https://connect.squareupsquare.com https://accounts.google.com https://oauth2.googleapis.com https://api.tshirtcentral365.com; "
                "frame-src 'self' https://accounts.google.com; "
                "frame-ancestors 'none';"
            )
        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        if not request.url.path.startswith("/api/health"):
            logger.info(
                f"{request.method} {request.url.path} "
                f"status={response.status_code} "
                f"duration={duration_ms}ms "
                f"request_id={request_id}"
            )
        return response
