from __future__ import annotations

from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field, model_validator


class ForecastRequest(BaseModel):
    """
    Input payload for POST /forecast.

    Either (lat + lon) or postal_code must be provided.
    All other fields have sensible defaults derived from the inputs.
    """

    # Location — at least one of these groups must be supplied
    postal_code: Optional[str] = Field(
        default=None, description="Singapore 6-digit postal code"
    )
    lat: Optional[float] = Field(default=None, ge=-90, le=90, description="Latitude")
    lon: Optional[float] = Field(
        default=None, ge=-180, le=180, description="Longitude"
    )

    # Physical system parameters
    roof_area_m2: float = Field(..., gt=0, le=2000, description="Usable roof area (m²)")
    system_size_kwp: Optional[float] = Field(
        default=None, gt=0, description="Installed capacity (kWp). Defaults to min(roof_area*0.2, 10)."
    )
    panel_efficiency: float = Field(
        default=0.20, gt=0, lt=1, description="Panel efficiency (0–1)"
    )

    # Financial inputs
    user_type: str = Field(
        default="residential", description="Customer profile for tariff forecasting: 'residential' or 'commercial'."
    )
    capex_sgd: Optional[float] = Field(
        default=None, ge=0, description="Total install cost (SGD). Defaults to 2000 × kWp."
    )
    monthly_load_kwh: Optional[float] = Field(
        default=None, ge=0, description="Monthly electricity consumption (kWh). If omitted, 80 % self-consumption is assumed."
    )
    tariff_sgd_per_kwh: Optional[float] = Field(
        default=None, gt=0, description="Electricity tariff override (SGD/kWh). Defaults to Prophet ML predictions."
    )

    @model_validator(mode="after")
    def require_location(self) -> "ForecastRequest":
        has_latlon = self.lat is not None and self.lon is not None
        has_postal = self.postal_code is not None
        if not has_latlon and not has_postal:
            raise ValueError(
                "Provide either 'lat' + 'lon' or 'postal_code' to identify the installation location."
            )
        return self


# --- Response Models ---

class LocationInfo(BaseModel):
    lat: float
    lon: float
    postal_code: Optional[str] = None
    nearest_station: str
    station_distance_km: float

class InputsUsed(BaseModel):
    roof_area_m2: float
    user_type: str
    system_size_kwp: float
    panel_efficiency: float
    capex_sgd: float
    monthly_load_kwh: Optional[float] = None
    tariff_sgd_per_kwh: float

class HistoricalAverages(BaseModel):
    past_12m_avg_daily_sunshine_hrs: float
    past_12m_avg_rainy_days: float
    past_12m_avg_tariff_cents: float

class ROIMetrics(BaseModel):
    capex_sgd: float
    payback_years: dict[str, Optional[float]]
    roi_10y: dict[str, Optional[float]]

class ForecastResponse(BaseModel):
    """Output payload for POST /forecast."""
    location: LocationInfo
    inputs_used: InputsUsed
    historical_averages: HistoricalAverages
    weather_scenarios: dict[str, List[float]]
    rainy_days: List[float]
    pv_kwh: dict[str, List[float]]
    tariff_series: List[float]
    roi: ROIMetrics
    cashflow_cumulative_sgd: dict[str, List[float]]

