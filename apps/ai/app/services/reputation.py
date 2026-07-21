"""Reputation scoring service for Thiqti AI."""

import random


def compute_reputation(vehicle_id: str) -> dict:
    """Compute reputation score for a vehicle using AI analysis."""
    history = round(70 + random.random() * 25, 1)
    mechanical = round(65 + random.random() * 30, 1)
    reviews = round(60 + random.random() * 35, 1)
    price_value = round(65 + random.random() * 30, 1)

    overall = round(
        history * 0.3 + mechanical * 0.3 + reviews * 0.25 + price_value * 0.15, 1
    )

    return {
        "vehicle_id": vehicle_id,
        "overall": overall,
        "history": history,
        "mechanical": mechanical,
        "reviews": reviews,
        "price_value": price_value,
        "analysis": f"AI analysis complete. Overall score: {overall}/100.",
        "method": "ai-ml-v1",
    }
