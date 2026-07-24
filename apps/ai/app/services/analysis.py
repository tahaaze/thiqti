"""Listing analysis service for Thiqti AI."""


def analyze_listing(data: dict) -> dict:
    """Analyze a car listing for anomalies and quality signals."""
    price = data.get("price", 0)
    km = data.get("km", 0)
    year = data.get("year", 2020)

    flags = []
    if km > 200000:
        flags.append("high_mileage")
    if price < 50000 and km < 10000:
        flags.append("suspiciously_low_price")
    if year > 2025 and km < 1000:
        flags.append("very_new_low_km")

    quality = "high" if not flags else "medium" if len(flags) < 2 else "low"

    return {
        "quality": quality,
        "flags": flags,
        "verified": len(flags) == 0,
        "analysis": f"Listing analyzed. Quality: {quality}.",
    }
