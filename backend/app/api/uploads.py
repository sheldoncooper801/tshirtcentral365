import os
import re
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.config import get_settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()
settings = get_settings()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOCAL_UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

ALLOWED_TYPES = {
    "image/png", "image/jpeg", "image/webp", "image/svg+xml",
    "application/pdf",
}
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "svg", "pdf"}
MAX_SIZE = 50 * 1024 * 1024

SVG_DANGEROUS_PATTERNS = [
    re.compile(r"<script\b[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL),
    re.compile(r"javascript:", re.IGNORECASE),
    re.compile(r"on\w+\s*=", re.IGNORECASE),
    re.compile(r"<iframe\b[^>]*>.*?</iframe>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<object\b[^>]*>.*?</object>", re.IGNORECASE | re.DOTALL),
    re.compile(r"<embed\b[^>]*>", re.IGNORECASE),
    re.compile(r"<foreignObject\b[^>]*>.*?</foreignObject>", re.IGNORECASE | re.DOTALL),
    re.compile(r"data:text/html", re.IGNORECASE),
]


def _sanitize_svg(content: bytes) -> bytes:
    text = content.decode("utf-8", errors="ignore")
    for pattern in SVG_DANGEROUS_PATTERNS:
        text = pattern.sub("", text)
    return text.encode("utf-8")


def _sanitize_filename(filename: str) -> str:
    name = filename.split("/")[-1].split("\\")[-1]
    name = "".join(c for c in name if c.isalnum() or c in "._-")
    if not name or len(name) > 200:
        name = "upload"
    return name


def _validate_and_get_ext(filename: str, content_type: str) -> str:
    name = _sanitize_filename(filename)
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in ALLOWED_EXTENSIONS:
        type_map = {
            "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp",
            "image/svg+xml": "svg", "application/pdf": "pdf",
        }
        ext = type_map.get(content_type, "png")
    return ext


async def _save_local(key: str, contents: bytes, content_type: str) -> str:
    file_path = os.path.join(LOCAL_UPLOAD_DIR, key)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(contents)
    return f"/uploads/{key}"


def _get_s3_client():
    import boto3
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.S3_REGION,
    )


@router.post("/design")
async def upload_design(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")

    contents = bytearray()
    total_size = 0
    while chunk := await file.read(8192):
        total_size += len(chunk)
        if total_size > MAX_SIZE:
            raise HTTPException(status_code=400, detail="File too large (max 50MB)")
        contents.extend(chunk)
    contents = bytes(contents)

    ext = _validate_and_get_ext(file.filename or "upload.png", file.content_type or "image/png")

    if ext == "svg":
        contents = _sanitize_svg(contents)

    key = f"designs/{current_user.id}/{uuid.uuid4().hex}.{ext}"

    if settings.AWS_ACCESS_KEY_ID:
        s3 = _get_s3_client()
        s3.put_object(Bucket=settings.S3_BUCKET, Key=key, Body=contents, ContentType=file.content_type)
        url = f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/{key}"
    else:
        url = await _save_local(key, contents, file.content_type)

    return {"url": url, "key": key, "filename": file.filename}


@router.post("/mockup")
async def upload_mockup(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")

    contents = bytearray()
    total_size = 0
    while chunk := await file.read(8192):
        total_size += len(chunk)
        if total_size > MAX_SIZE:
            raise HTTPException(status_code=400, detail="File too large (max 50MB)")
        contents.extend(chunk)
    contents = bytes(contents)

    ext = _validate_and_get_ext(file.filename or "upload.png", file.content_type or "image/png")

    if ext == "svg":
        contents = _sanitize_svg(contents)

    key = f"mockups/{current_user.id}/{uuid.uuid4().hex}.{ext}"

    if settings.AWS_ACCESS_KEY_ID:
        s3 = _get_s3_client()
        s3.put_object(Bucket=settings.S3_BUCKET, Key=key, Body=contents, ContentType=file.content_type)
        url = f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/{key}"
    else:
        url = await _save_local(key, contents, file.content_type)

    return {"url": url, "key": key}
