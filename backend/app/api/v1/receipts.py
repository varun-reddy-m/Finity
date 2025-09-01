# receipts.py — PARSE-ONLY (no DB writes)
import os, json, requests
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.core.security import get_current_user

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing")
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GBASE = "https://generativelanguage.googleapis.com"

ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/tiff",
}

def gemini_upload_bytes(data: bytes, mime: str, display_name: str) -> str:
    """Start resumable upload, send bytes, return file_uri."""
    start = requests.post(
        f"{GBASE}/upload/v1beta/files?key={GEMINI_API_KEY}",
        headers={
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": str(len(data)),
            "X-Goog-Upload-Header-Content-Type": mime,
            "Content-Type": "application/json",
        },
        json={"file": {"display_name": display_name}},
        timeout=60,
    )
    upload_url = start.headers.get("X-Goog-Upload-URL")
    if not upload_url:
        raise HTTPException(500, f"Gemini upload start failed: {start.text}")

    up = requests.post(
        upload_url,
        headers={
            "Content-Length": str(len(data)),
            "X-Goog-Upload-Offset": "0",
            "X-Goog-Upload-Command": "upload, finalize",
        },
        data=data,
        timeout=300,
    )
    if not up.ok:
        raise HTTPException(500, f"Gemini upload finalize failed: {up.text}")
    file_info = up.json()
    file_uri = (file_info.get("file") or {}).get("uri")
    if not file_uri:
        raise HTTPException(500, f"Gemini upload returned no file URI: {file_info}")
    return file_uri

def gemini_parse_file(file_uri: str, mime: str) -> dict:
    """Call generateContent with response schema; return parsed JSON dict."""
    schema = {
        "type": "object",
        "properties": {
            "doc_type": {"type": "string", "enum": ["bank_statement","invoice","expense_sheet","unknown"]},
            "currency": {"type": "string"},
            "summary": {
                "type": "object",
                "properties": {
                    "total_debits": {"type": "number"},
                    "total_credits": {"type": "number"},
                    "period_start": {"type": "string"},
                    "period_end": {"type": "string"},
                },
            },
            "transactions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "date": {"type": "string"},          # YYYY-MM-DD
                        "description": {"type": "string"},
                        "amount": {"type": "number"},
                        "direction": {"type": "string", "enum": ["debit","credit"]},
                        "category": {"type": "string"},
                        "currency": {"type": "string"},
                    },
                    "required": ["date","description","amount","direction"],
                },
            },
        },
        "required": ["transactions"],
    }

    body = {
        "contents": [{
            "parts": [
                {"text": (
                    "You are a financial document parser. "
                    "Extract transactions. Dates must be YYYY-MM-DD. "
                    "Amount positive. Direction 'debit' or 'credit'. "
                    "Default currency INR if unknown. Return ONLY JSON."
                )},
                # IMPORTANT: camelCase keys
                {"fileData": {"mimeType": mime, "fileUri": file_uri}},
            ]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": schema,
        },
    }

    r = requests.post(
        f"{GBASE}/v1beta/models/{MODEL}:generateContent?key={GEMINI_API_KEY}",
        headers={"Content-Type": "application/json"},
        json=body,
        timeout=120,
    )
    if not r.ok:
        raise HTTPException(500, f"Gemini parse failed: {r.text}")
    data = r.json()

    # JSON is returned as text in the first candidate
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)
    except Exception as e:
        raise HTTPException(500, f"Gemini returned unexpected shape: {e} :: {data}")

@router.post("/receipts/parse-file")
async def parse_receipt_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
):
    mime = file.content_type or "application/octet-stream"
    if mime not in ALLOWED_MIME:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Unsupported file type {mime}. Allowed: PDF/JPEG/PNG/WEBP/TIFF.",
        )

    data = await file.read()
    file_uri = gemini_upload_bytes(data, mime, file.filename or "document")
    parsed = gemini_parse_file(file_uri, mime)

    # Ensure defaults if model omits them
    parsed.setdefault("currency", "INR")
    parsed.setdefault("doc_type", "unknown")
    parsed.setdefault("transactions", [])

    return parsed
