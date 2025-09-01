import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Ensure the backend directory is in the Python path
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_path not in sys.path:
    sys.path.append(backend_path)

print("Python Path:", sys.path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import init_db
from app.api.v1 import auth, categories, transactions, reports, receipts

async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(categories.router, prefix="/api/v1", tags=["categories"])
app.include_router(transactions.router, prefix="/api/v1", tags=["transactions"])
app.include_router(reports.router, prefix="/api/v1", tags=["reports"])
app.include_router(receipts.router, prefix="/api/v1", tags=["receipts"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
