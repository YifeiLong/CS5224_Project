# SolarYield AI — Backend

FastAPI backend providing rooftop PV yield forecasting and ROI analysis for Singapore installations.

---

## Project structure

```
backend/
├── src/
│   ├── main.py           # FastAPI app + route handlers
│   ├── schemas.py        # Pydantic request model & validation
│   ├── config.py         # Shared constants (tariff, degradation, etc.)
│   └── services/
│       ├── geocode.py    # OneMap postal-code → lat/lon
│       ├── weather_model.py  # WeatherForecaster (DUMMY STUB — see below)
│       ├── scenarios.py  # Pessimistic / neutral / optimistic scaling
│       ├── pv.py         # Sun-hours → kWh conversion
│       ├── tariff.py     # Electricity tariff series
│       └── roi.py        # Savings, payback period, 10-year ROI
├── pyproject.toml
└── .python-version       # 3.11
```

---

## Prerequisites

- [uv](https://docs.astral.sh/uv/) ≥ 0.4
- A OneMap API token — register free at https://www.onemap.gov.sg/apidocs/register

---

## Running locally

```bash
# 1. Install dependencies (creates / updates .venv automatically)
cd backend
uv sync

# 2. Set up environment variables
cp .env.example .env
# Edit .env and paste your OneMap token: ONEMAP_API_TOKEN=<your_token>

# 3. Start the development server
uv run uvicorn src.main:app --reload --port 8000
```

> **Note:** The `ONEMAP_API_TOKEN` is only needed when a caller supplies a `postal_code`.
> If you always pass `lat`/`lon` directly (e.g. from the frontend map picker), the token is not used.


The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

## Endpoints

### `GET /health`

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### `POST /forecast`

**Minimum request (lat/lon + roof area):**

```bash
curl -s -X POST http://localhost:8000/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 1.28,
    "lon": 103.85,
    "roof_area_m2": 50
  }' | python3 -m json.tool
```

**Full request with all optional fields:**

```bash
curl -s -X POST http://localhost:8000/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "postal_code": "098585",
    "roof_area_m2": 50,
    "system_size_kwp": 6,
    "panel_efficiency": 0.20,
    "capex_sgd": 12000,
    "monthly_load_kwh": 450,
    "tariff_sgd_per_kwh": 0.30
  }' | python3 -m json.tool
```

**Example response (truncated):**

```json
{
  "location": { "lat": 1.2799963, "lon": 103.8473476, "postal_code": "098585" },
  "inputs_used": {
    "roof_area_m2": 50, "system_size_kwp": 6.0,
    "panel_efficiency": 0.2, "capex_sgd": 12000.0,
    "monthly_load_kwh": 450, "tariff_sgd_per_kwh": 0.3
  },
  "weather": {
    "pessimistic": [102.0, 109.34, ...],
    "neutral":     [120.0, 128.63, ...],
    "optimistic":  [138.0, 147.92, ...]
  },
  "pv_kwh": {
    "pessimistic": [489.6, 524.82, ...],
    "neutral":     [576.0, 617.44, ...],
    "optimistic":  [662.4, 710.0, ...]
  },
  "tariff": [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  "roi": {
    "capex_sgd": 12000.0,
    "payback_years": { "pessimistic": null, "neutral": null, "optimistic": null },
    "roi_10y": { "pessimistic": 0.4321, "neutral": 0.7109, "optimistic": 0.9897 }
  },
  "cashflow_cumulative_sgd": {
    "pessimistic": [-11853.0, ...],
    "neutral":     [-11826.6, ...],
    "optimistic":  [-11800.2, ...]
  }
}
```

---

## Dummy weather model — how to plug in the real model

The file `src/services/weather_model.py` contains a `WeatherForecaster` class with:

| Method | Current behaviour | Replace with |
|--------|------------------|--------------|
| `load_model(path)` | no-op | deserialise your Prophet / LSTM artifact |
| `forecast_monthly(lat, lon)` | deterministic sinusoidal pattern (120 ± 10 sun-hours) | real inference returning `list[float]` of length 12 |

**Steps to integrate a real model:**

1. Train your model to output 12 monthly effective sun-hours given (lat, lon).
2. Serialise it (e.g. `joblib.dump(model, "weather_model.pkl")`).
3. Set `MODEL_PATH` in `config.py` or as an env var.
4. In `weather_model.py`:
   - In `load_model`: `self._model = joblib.load(path)` (or equivalent).
   - In `forecast_monthly`: call `self._model.predict(lat, lon)` and return the result.
5. Call `_forecaster.load_model(MODEL_PATH)` in `main.py` at startup.

No other changes are required — the rest of the pipeline is model-agnostic.

---

## PV formula assumptions

The formula used in `src/services/pv.py` is intentionally simplified:

```
pv_kwh[month] = sun_hours[month] × system_size_kwp × performance_ratio
```

| Assumption | Value | Notes |
|-----------|-------|-------|
| Performance ratio (PR) | 0.80 | Bundles inverter, wiring, temperature losses |
| Shading / soiling | not modelled | Assume negligible |
| Panel orientation | not modelled | Assume optimal tilt toward equator |
| Degradation | not applied here | Applied in ROI module (0.5 %/year) |

For production, replace this with a full PVWatts / PVLib calculation.

---

## Running tests

```bash
cd backend
uv run pytest
```
