from fastapi import APIRouter
from app.services.reputation import compute_reputation
from app.services.analysis import analyze_listing

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/reputation/{vehicle_id}")
def reputation(vehicle_id: str):
    return compute_reputation(vehicle_id)

@router.post("/analyze-listing")
def analyze(data: dict):
    return analyze_listing(data)
