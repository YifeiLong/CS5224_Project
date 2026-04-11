from __future__ import annotations

from typing import Optional

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
    capex_sgd: Optional[float] = Field(
        default=None, ge=0, description="Total install cost (SGD). Defaults to 2000 × kWp."
    )
    monthly_load_kwh: Optional[float] = Field(
        default=None, ge=0, description="Monthly electricity consumption (kWh). If omitted, 80 % self-consumption is assumed."
    )
    tariff_sgd_per_kwh: Optional[float] = Field(
        default=None, gt=0, description="Electricity tariff override (SGD/kWh). Defaults to 0.30."
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
