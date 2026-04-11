# SolarYield AI — Backend

FastAPI backend providing rooftop PV yield forecasting and ROI analysis for Singapore installations using Facebook Prophet ML models.

---

## Project structure

```
backend/
├── src/
│   ├── main.py           # FastAPI app + route handlers
│   ├── schemas.py        # Pydantic request model & validation
│   ├── config.py         # Shared constants (default parameters, etc.)
│   ├── data/
│   │   └── station_meta.csv  # Weather stations mapping for Haversine distances
│   ├── models/           # Pre-trained Prophet JSON models (Rain, Sun, Tariff)
│   └── services/
        ├── advisory_api.py   # LLM advisory endpoint
        ├── llm_service.py    # Local LLM loading & inference
│       ├── geocode.py    # OneMap postal-code → lat/lon
│       ├── weather_model.py  # Prophet ML logic, station matching & inference
│       ├── scenarios.py  # Pessimistic / neutral / optimistic scaling
│       ├── pv.py         # Sun-hours → kWh conversion
│       └── roi.py        # Savings, payback period, 10-year ROI
├── download_model.py   # Script to download local LLM model
├── pyproject.toml
└── .python-version       
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
    "user_type": "residential",
    "capex_sgd": null,
    "monthly_load_kwh": 450,
    "tariff_sgd_per_kwh": null
  }' | python3 -m json.tool
```

**Example response (truncated):**

```json
{
  "location": {
    "lat": 1.2799963,
    "lon": 103.8473476,
    "postal_code": "098585",
    "nearest_station": "Sentosa Island",
    "station_distance_km": 1.24
  },
  "inputs_used": {
    "roof_area_m2": 50, 
    "user_type": "residential",
    "system_size_kwp": 6.0,
    "panel_efficiency": 0.2, 
    "capex_sgd": 12000.0,
    "monthly_load_kwh": 450, 
    "tariff_sgd_per_kwh": 0.3
  },
  "historical_averages": {
    "past_12m_avg_daily_sunshine_hrs": 6.5,
    "past_12m_avg_rainy_days": 14.5,
    "past_12m_avg_tariff_cents": 29.8
  },
  "weather_scenarios": {
    "pessimistic": [102.0, 109.34, ...],
    "neutral":     [120.0, 128.63, ...],
    "optimistic":  [138.0, 147.92, ...]
  },
  "rainy_days": [14.0, 12.0, 16.0, ...],
  "pv_kwh": {
    "pessimistic": [489.6, 524.82, ...],
    "neutral":     [576.0, 617.44, ...],
    "optimistic":  [662.4, 710.0, ...]
  },
  "tariff_series": [0.301, 0.302, ...],
  "roi": {
    "capex_sgd": 12000.0,
    "payback_years": { "pessimistic": null, "neutral": 8.5, "optimistic": 7.2 },
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

## Prophet ML Integration

The file `src/services/weather_model.py` contains a `ProphetForecaster` class which directly integrates the actual solar AI models (Facebook Prophet).

| Step | Action Performed by Backend |
|--------|------------------|
| **1. Station Matching** | Computes the Haversine distance between the user’s coordinates and all available weather stations in `station_meta.csv` to pick the nearest one. |
| **2. Rainy Days Model** | Deserializes `model_rain_{station_id}.json` and predicts the number of rainy days for the next 12 months. |
| **3. Sun-hours Model**  | Deserializes the global `model_sun.json` to predict the base daily sun hours for the next 12 months, scaling it up to monthly totals using Pandas. |
| **4. Tariff Model**     | Depending on `"user_type": "residential"` or `"commercial"`, deserializes the corresponding `.json` market model to forecast electricity rates for the next 12 months. |
| **5. Historical Extraction** | Extracts the last 12 months of actual history directly from the Prophet forecast objects to compute `historical_averages`. |

**How it was integrated:**
- Models were trained via Prophet, exported using `prophet.serialize.model_to_json`, and stored in `src/models/`.
- Predictions leverage `pandas` for date generation (`datetime.now()`) to provide dynamic, live predictions starting from the current month.

---

## LLM Advisory System

This project includes an additional advisory module that generates natural-language explanations for the forecast results returned by the backend.

Unlike the forecasting pipeline, this module does not recompute PV generation or ROI.  
It focuses on interpreting the existing output and presenting it in a concise and user-friendly way.

---

## Overview

The advisory workflow is designed to work together with the `/forecast` endpoint:

```
Frontend → POST /forecast → numerical results  
Frontend → POST /advisory → natural-language explanation
```

Typical usage:

1. Call `/forecast` to obtain PV generation and ROI results  
2. Pass the returned JSON together with a user question to `/advisory`  
3. Receive a short explanation generated by the advisory module  

---

## Components

### Model preparation (`download_model.py`)

This script downloads a small local language model and stores it under the project directory.

Default model:
- `deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B`

Usage:

```bash
pip install torch transformers accelerate huggingface_hub
python download_model.py
```

The model will be saved under:

```
./models/deepseek-r1-distill-qwen-1.5b
```

This step only needs to be run once before using the advisory endpoint.

---

### Local LLM service (`llm_service.py`)

This module implements the core advisory logic.

It is responsible for:

- loading the local model from disk  
- extracting key fields from the `/forecast` output  
- constructing a compact prompt  
- generating a short advisory response  

#### Forecast summarization

Instead of passing the full forecast JSON directly to the model, a smaller summary is constructed, including:

- annual PV generation (neutral scenario)  
- payback period and ROI  
- tariff level and variation  
- weather scenarios and uncertainty  
- historical averages  

This improves stability and reduces prompt size for smaller models.

---

#### Prompt design

The model input is structured as:

- a system prompt defining behavior and constraints  
- the user question  
- a summarized forecast result  

The design enforces:

- use of the neutral scenario as the main reference  
- comparison across pessimistic and optimistic scenarios  
- no generation of unsupported or missing values  

---

#### Run modes

The advisory service supports two modes:

- `local`: uses the downloaded model for inference  
- `mock`: uses a rule-based fallback without loading a model  

The mock mode is useful for testing and as a fallback when model files are not available.

---

#### Uncertainty handling

A simple rule-based check is used to identify high uncertainty:

- large differences between pessimistic and optimistic scenarios  
  (e.g. payback gap or ROI gap)

This is reflected in the generated explanation to provide a more realistic interpretation.

---

### Advisory API (`advisory_api.py`)

This module provides the `/advisory` endpoint.

Responsibilities:

1. validate incoming request  
2. accept `/forecast` output directly as input  
3. call the LLM service  
4. return a structured response  

---

## Example flow

```
User:
"Is this investment worth it?"

Step 1:
POST /forecast → returns PV + ROI data

Step 2:
POST /advisory
{
  "user_question": "...",
  "forecast_result": { ... }
}

Step 3:
LLM generates explanation
```

---

## Response format

```json
{
  "answer": "...",
  "disclaimer": "...",
  "used_model": "...",
  "run_mode": "local",
  "status": "success"
}
```

---

## Notes

- The advisory module is intended for interpretation and decision support  
- All outputs are based on forecast assumptions and should not be treated as guarantees  
- For deployment, the model should be downloaded once and reused locally  


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
