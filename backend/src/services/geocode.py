"""
Resolve a Singapore postal code to (lat, lon) via the OneMap Search API.

Auth note (important)
---------------------
As of 2024, the OneMap Search API requires token-based authentication.
Pass your registered token via the ONEMAP_API_TOKEN environment variable.
Register here: https://www.onemap.gov.sg/apidocs/register

API contract (from https://www.onemap.gov.sg/apidocs/search):
  GET /api/common/elastic/search
  Headers: Authorization: <token>
  Params:
    searchVal      - the postal code or address string
    returnGeom     - Y/N, must be Y to get LATITUDE/LONGITUDE
    getAddrDetails - Y/N
  Response shape (first result):
    { "LATITUDE": "1.307...", "LONGITUDE": "103.854...", ... }
"""

import requests

from ..config import GEOCODE_TIMEOUT_S, ONEMAP_API_TOKEN, ONEMAP_SEARCH_URL


def geocode_postal(postal_code: str) -> tuple[float, float]:
    """
    Call OneMap Search and return (lat, lon) for the given Singapore postal code.

    Raises:
        ValueError: postal code returns no results, or token is missing.
        RuntimeError: network or HTTP error.
    """
    if not ONEMAP_API_TOKEN:
        raise ValueError(
            "ONEMAP_API_TOKEN environment variable is not set. "
            "Register at https://www.onemap.gov.sg/apidocs/register "
            "and add ONEMAP_API_TOKEN=<your_token> to your .env file."
        )

    headers = {"Authorization": ONEMAP_API_TOKEN}
    params = {
        "searchVal": postal_code,
        "returnGeom": "Y",
        "getAddrDetails": "N",
    }

    try:
        resp = requests.get(
            ONEMAP_SEARCH_URL,
            headers=headers,
            params=params,
            timeout=GEOCODE_TIMEOUT_S,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(
            f"Geocode request failed for postal code '{postal_code}': {exc}"
        ) from exc

    results = resp.json().get("results", [])
    if not results:
        raise ValueError(
            f"No location found for postal code '{postal_code}'. "
            "Verify the code is a valid 6-digit Singapore postal code."
        )

    first = results[0]
    return float(first["LATITUDE"]), float(first["LONGITUDE"])
