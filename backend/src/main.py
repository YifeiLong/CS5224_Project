"""
SolarYield AI — FastAPI application entry point.

Routes
------
GET  /health    → liveness check
POST /forecast  → 12-month PV yield + ROI forecast for 3 scenarios
"""

from dotenv import load_dotenv
load_dotenv()  # load .env file before config reads os.getenv()

from fastapi import FastAPI, HTTPException

from .config import DEFAULT_CAPEX_PER_KWP_SGD, DEFAULT_PERFORMANCE_RATIO
from .schemas import ForecastRequest
from .services.geocode import geocode_postal
from .services.pv import pv_kwh_monthly
from .services.roi import compute_roi
from .services.scenarios import make_scenarios
from .services.tariff import get_tariff_series
from .services.weather_model import WeatherForecaster

from .services.advisory_api import router as advisory_router

app = FastAPI(
    title="SolarYield AI",
    version="0.1.0",
    description="Rooftop PV yield forecasting and ROI analysis for Singapore.",
)

app.include_router(advisory_router)

# Single shared forecaster instance (stateless in the dummy implementation)
_forecaster = WeatherForecaster()


@app.get("/health", summary="Liveness check")
def health() -> dict:
    """Return a simple OK status."""
    return {"status": "ok"}


@app.post("/forecast", summary="Generate 12-month PV forecast and ROI")
def forecast(req: ForecastRequest) -> dict:
    """
    Steps:
      A. Resolve location (lat/lon or geocode postal code)
      B. Get dummy weather forecast (12 sun-hours)
      C. Build pessimistic / neutral / optimistic weather scenarios
      D. Convert sun-hours → kWh via simple PV formula
      E. Build tariff series
      F. Compute ROI metrics per scenario
      G. Return chart-ready JSON
    """

    # --- A. Resolve location ---
    if req.lat is not None and req.lon is not None:
        lat, lon = req.lat, req.lon
    else:
        # postal_code presence guaranteed by schema validator
        try:
            lat, lon = geocode_postal(req.postal_code)  # type: ignore[arg-type]
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    # --- Resolve defaults for optional inputs ---
    system_size_kwp = req.system_size_kwp or min(req.roof_area_m2 * 0.2, 10.0)
    capex_sgd = (
        req.capex_sgd
        if req.capex_sgd is not None
        else DEFAULT_CAPEX_PER_KWP_SGD * system_size_kwp
    )

    # --- B. Weather forecast (dummy stub) ---
    base_weather = _forecaster.forecast_monthly(lat, lon)

    # --- C. Scenarios (±15 %) ---
    weather_scenarios = make_scenarios(base_weather)

    # --- D. PV conversion ---
    pv_scenarios: dict[str, list[float]] = {
        scenario: pv_kwh_monthly(series, system_size_kwp, DEFAULT_PERFORMANCE_RATIO)
        for scenario, series in weather_scenarios.items()
    }

    # --- E. Tariff series ---
    tariff = get_tariff_series(req.tariff_sgd_per_kwh)

    # --- F. ROI per scenario ---
    cashflow: dict[str, list[float]] = {}
    payback_years: dict[str, float | None] = {}
    roi_10y: dict[str, float | None] = {}

    for scenario, pv in pv_scenarios.items():
        result = compute_roi(pv, tariff, capex_sgd, req.monthly_load_kwh)
        cashflow[scenario] = result["cumulative_sgd"]
        payback_years[scenario] = result["payback_years"]
        roi_10y[scenario] = result["roi_10y"]

    # --- G. Build response ---
    return {
        "location": {
            "lat": lat,
            "lon": lon,
            "postal_code": req.postal_code,
        },
        "inputs_used": {
            "roof_area_m2": req.roof_area_m2,
            "system_size_kwp": round(system_size_kwp, 3),
            "panel_efficiency": req.panel_efficiency,
            "capex_sgd": round(capex_sgd, 2),
            "monthly_load_kwh": req.monthly_load_kwh,
            "tariff_sgd_per_kwh": tariff[0],
        },
        "weather": weather_scenarios,
        "pv_kwh": pv_scenarios,
        "tariff": tariff,
        "roi": {
            "capex_sgd": round(capex_sgd, 2),
            "payback_years": payback_years,
            "roi_10y": roi_10y,
        },
        "cashflow_cumulative_sgd": cashflow,
    }
