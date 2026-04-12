# SolarYield AI — Frontend README
run backend with models and show results in frontend
## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| React | ^19.2.4 | UI framework |
| MUI (Material UI) | ^7.3.9 | Component library |
| Recharts | ^3.8.1 | Chart visualisations |
| Vite | ^8.0.1 | Build tool & dev server |

---

## Directory Structure

```
solar-frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                      # React entry point
    ├── App.jsx                       # Root component — renders Navbar + pages
    │
    ├── assets/
    │   ├── solar-panel-on-a-red-roof-reflecting-the-sun-web.jpg   # Hero background
    │   └── SEI_270344931.webp        # About Us image
    │
    ├── context/
    │   └── UserContext.jsx           # Global state: currentUser, isPro, solarData
    │
    ├── pages/
    │   └── Home.jsx                  # Main page — composes HeroInput + Dashboard
    │
    ├── components/
    │   ├── Navbar.jsx                # Top navigation bar
    │   ├── HeroInput.jsx             # Postal code / roof size / user type form
    │   ├── Dashboard.jsx             # Free tier + Pro tier charts and stat cards
    │   ├── ChatWidget.jsx            # Floating AI advisory chat (Pro only)
    │   ├── LoginModal.jsx            # Login / register modal
    │   ├── PaymentModal.jsx          # Mock payment modal (upgrades to Pro)
    │   ├── PricingPage.jsx           # Pricing page tab
    │   └── AboutUsPage.jsx           # About Us page tab
    │
    └── services/
        └── api.js                    # All backend API calls (see below)
```

---

## api.js — Service Layer

### Base URL Configuration

```js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

| Environment | How to set | Value |
|---|---|---|
| **Local dev** | Default fallback | `http://localhost:8000` |
| **Local dev (explicit)** | `.env` file in `solar-frontend/` root | `VITE_API_BASE_URL=http://127.0.0.1:8000` |
| **Cloud deployment** | Environment variable on cloud platform | `VITE_API_BASE_URL=https://your-backend-domain.com` |

Create a `.env` file in `solar-frontend/` to override:
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

### Section 1 — Auth (client-side mock only)

Auth is fully mocked — no backend calls. One pre-seeded grader account:

| Field | Value |
|---|---|
| Email | `cs5224group11@gmail.com` |
| Password | `12345678` |
| Plan | `isPro: true` (unlocked for demo/grading) |

No user data is persisted anywhere. This is a one-time SaaS demo.

---

### Section 2 — Forecast Model (`POST /forecast`)

**Endpoint:** `BASE_URL + /forecast`

**What it sends:**
```js
{
  postal_code:      postalCode,           // 6-digit Singapore postal code
  roof_area_m2:     roofSize * 0.092903,  // converted from sqft input in HeroInput
  user_type:        userType,             // 'residential' or 'commercial'
  system_size_kwp:  null,                 // backend derives from roof area
  panel_efficiency: 0.20,
  capex_sgd:        null,                 // backend derives from system size
  monthly_load_kwh: null,                 // assumes 80% self-consumption ratio
  tariff_sgd_per_kwh: null,               // uses Prophet ML tariff forecast
}
```

**What the backend runs:**
1. OneMap API → resolves postal code to (lat, lon)
2. Prophet model → finds nearest weather station, forecasts rain/sun/tariff
3. `make_scenarios()` → generates pessimistic / neutral / optimistic weather (±15%)
4. `pv_kwh_monthly()` → converts sun hours → kWh per scenario
5. `compute_roi()` → savings, cashflow, payback, 10-year ROI per scenario

**Raw response cached** in `_rawForecastResult` (module-level variable) immediately after the call, for use by the advisory endpoint.

**Frontend transforms** the raw response into two tiers:
- `freeTier` — historical stat cards + 3 line charts (sun hours, rainy days, tariff)
- `proTier` — PV yield bar chart, grid cost line chart, cashflow breakeven chart, payback stat cards

---

### Section 3 — LLM Advisory Model (`POST /advisory`)

**Endpoint:** `BASE_URL + /advisory`

**What it sends:**
```js
{
  user_question:   userQuestion,        // string typed by user in ChatWidget
  forecast_result: _rawForecastResult,  // raw /forecast response (not UI-transformed)
  language:        'en',
  run_mode:        'mock',              // ← see Run Mode table below
  max_new_tokens:  220,
  temperature:     0.3,
  top_p:           0.9,
}
```

**Important:** `_rawForecastResult` (the original backend `/forecast` response) is forwarded verbatim — NOT the `solarData` stored in React context. This is because `llm_service.py`'s `summarize_forecast_result()` needs the original backend keys (`pv_kwh.neutral`, `roi.payback_years`, `tariff_series`, etc.).

#### Run Mode

| `run_mode` | Where set | Behaviour |
|---|---|---|
| `'mock'` | `api.js` line ~399 | Calls `generate_mock_answer()` in `llm_service.py` — rule-based answers, no model download needed. Answers vary by keyword: `"payback"`, `"roi"`, `"solar"`, `"install"`, `"worth"` |
| `'local'` | Change in `api.js` | Loads DeepSeek-R1-Distill-Qwen-1.5B from local disk, runs full LLM inference |

#### To switch to local LLM

**Step 1** — Download the model (run once from `backend/` folder):
```bash
source venv/bin/activate
python download_model.py
# Downloads ~3GB to: backend/models/deepseek-r1-distill-qwen-1.5b/
```

**Step 2** — Change `run_mode` in `api.js`:
```js
// Before
run_mode: 'mock',

// After
run_mode: 'local',
```

No other files need to change.

#### To switch to cloud deployment

**Step 1** — Set the backend URL as an environment variable on your cloud platform:
```
VITE_API_BASE_URL=https://your-backend-domain.com
```

**Step 2** — If the LLM is deployed on cloud, also change `run_mode`:
```js
run_mode: 'local',  // cloud VM has the model downloaded
```

**Step 3** — In `backend/main.py`, restrict CORS to your frontend domain:
```python
allow_origins=["https://your-frontend-domain.com"]  # instead of ["*"]
```

---

### Section 4 — Payments (mock only)

Payment is fully mocked — no Stripe integration. Clicking "Upgrade to Pro" in the UI calls `upgradeToPro()` from `UserContext`, which sets `isPro: true` in React state for the current session only. No payment is processed.

---

## Running Locally

```bash
# Terminal 1 — Backend
cd backend
source venv/bin/activate
uvicorn src.main:app --reload --port 8000

# Terminal 2 — Frontend
cd solar-frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

Make sure `backend/.env` contains a valid OneMap token:
```
ONEMAP_API_TOKEN=eyJhbGci...
```
The token expires every 3 days — renew at https://www.onemap.gov.sg/apidocs/