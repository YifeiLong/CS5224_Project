# SolarYield AI — Frontend

A React-based SaaS web application for rooftop solar PV yield forecasting and ROI analysis in Singapore. Users input their property details to receive AI-driven solar generation forecasts, financial projections, and advisory responses from an LLM.

---

## Requirements

| Package | Version |
|---|---|
| Node.js | ≥ 18 |
| React | ^19.2.4 |
| Vite | ^8.0.1 |
| MUI (Material UI) | ^7.3.9 |
| Recharts | ^3.8.1 |
| Axios | ^1.14.0 |

---

## Local Development

```bash
cd solar-frontend
npm install
# to install node modules
npm run dev
# App runs at http://localhost:5173
```

Set the backend URL in a `.env` file at `solar-frontend/`:
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If `VITE_API_BASE_URL` is not set, it defaults to `http://localhost:8000`.

---

## Project Structure

```
solar-frontend/
├── index.html                        # HTML entry point
├── package.json                      # Dependencies and scripts
├── vite.config.js                    # Vite build configuration
├── users.json                        # Pre-seeded grader account reference
└── src/
    ├── main.jsx                      # React DOM entry — mounts <App />
    ├── App.jsx                       # Root — wraps everything in <UserProvider>
    │
    ├── assets/
    │   ├── solar-panel-on-a-red-roof-reflecting-the-sun-web.jpg  # Hero background
    │   └── SEI_270344931.webp        # About Us section image
    │
    ├── context/
    │   └── UserContext.jsx           # Global state management (see below)
    │
    ├── pages/
    │   └── Home.jsx                  # Main page — tab routing + modal management
    │
    ├── components/
    │   ├── Navbar.jsx                # Top navigation bar with auth dropdown
    │   ├── HeroInput.jsx             # Property input form (postal code, roof size, type)
    │   ├── Dashboard.jsx             # Free tier + Pro tier charts and stat cards
    │   ├── ChatWidget.jsx            # Floating AI advisory chatbot (Pro only)
    │   ├── LoginModal.jsx            # Login / register modal
    │   ├── PaymentModal.jsx          # Mock payment modal — upgrades session to Pro
    │   ├── PricingPage.jsx           # Pricing tab content
    │   └── AboutUsPage.jsx           # About Us tab content
    │
    └── services/
        └── api.js                    # All backend API calls
```

---

## Component Overview

### `App.jsx`
Entry point. Wraps the entire app in `<UserProvider>` so all components can access global state via `useUser()`.

### `Home.jsx`
Controls tab navigation (`Features`, `Pricing`, `About Us`), modal open/close state, and scroll position preservation when modals open. Renders `HeroInput`, `Dashboard`, and `ChatWidget` only when the `Features` tab is active.

### `UserContext.jsx`
Provides global state to all components:

| Value | Type | Description |
|---|---|---|
| `currentUser` | object \| null | Logged-in user `{ id, name, email, isPro }` |
| `isPro` | boolean | Derived from `currentUser.isPro` |
| `solarData` | object \| null | Transformed forecast result stored after `/forecast` call |
| `setSolarData` | function | Called by `HeroInput` after a successful forecast |
| `logout` | function | Clears user state and localStorage token |
| `upgradeToPro` | function | Sets `isPro: true` in current session |

Session is not persisted across visits — `fetchCurrentUser()` returns `null` (mock auth).

### `Navbar.jsx`
Dark navy bar (`#0f172a`) with tab navigation, login button, and user dropdown. Uses `position="relative"` with `zIndex: 1400` to ensure the dropdown renders above the hero image overlay.

### `HeroInput.jsx`
Collects three inputs:
- **Property Type** — `residential` or `commercial` (ToggleButtonGroup)
- **Postal Code** — 6-digit Singapore postal code (validated before submission)
- **Roof Size** — in square feet via slider + text field (converted to m² in `api.js`)

On "Analyze Now", calls `fetchPrediction()` and stores `response.data` in `UserContext.solarData`.

### `Dashboard.jsx`
Renders two tiers based on `isPro`:

**Free Tier** (always visible after forecast):
- 4 stat cards: Avg Daily Sun Hours, Avg Rainy Days, Avg Electricity Tariff, Est. Installation Cost
- 3 line charts (past 12 months): Monthly Sun Hours, Rainy Days, Electricity Tariff ¢/kWh

**Pro Tier** (visible only when `isPro === true`, blurred with upgrade prompt otherwise):
- 4 stat cards: Payback Period, 10-Year ROI, Annual Savings, Carbon Offset
- Grouped bar chart: Predicted Monthly PV Yield (pessimistic / neutral / optimistic)
- Line chart: Monthly Electricity Cost Avoided (neutral scenario)
- Breakeven line chart (quarterly) + 3 payback period stat cards side by side

### `ChatWidget.jsx`
Floating chat bubble (bottom-right). Accessible to Pro users only. On send:
1. Passes the typed message directly as `userQuestion` to `sendChatMessage()`
2. `sendChatMessage()` forwards `_rawForecastResult` (cached raw `/forecast` response) to `POST /advisory`
3. Displays the returned `answer` and `disclaimer` in chat bubbles
4. Shows the actual backend error message if the request fails (not a generic string)

### `LoginModal.jsx`
Handles login and registration — fully client-side mock. Only the pre-seeded grader account is accepted for login. New registrations succeed client-side with `isPro: false`.

### `PaymentModal.jsx`
Mock payment flow. Auto-fill button populates test card details. On confirm, calls `upgradeToPro()` in `UserContext` — sets `isPro: true` for the current session only. No real payment is processed.

---

## Backend Connection (`api.js`)

### Base URL
```js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```
Set `VITE_API_BASE_URL` as an environment variable to point to the deployed backend.

### Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/forecast` | POST | Prophet ML forecast — weather, PV yield, ROI, cashflow |
| `/advisory` | POST | LLM advisory — contextual answer based on forecast result |

### `/forecast` Request
```js
{
  postal_code:        "560123",     // 6-digit Singapore postal code
  roof_area_m2:       4.645,        // converted from sqft input (× 0.092903)
  user_type:          "residential", // or "commercial" — selects tariff model
  system_size_kwp:    null,         // backend derives: min(roof_area × 0.2, 10)
  panel_efficiency:   0.20,
  capex_sgd:          null,         // backend derives: 2000 × system_size_kwp
  monthly_load_kwh:   null,         // backend assumes 80% self-consumption ratio
  tariff_sgd_per_kwh: null,         // backend uses Prophet ML tariff forecast
}
```

The raw response is cached in `_rawForecastResult` (module-level variable) immediately for use by `/advisory`.

### `/advisory` Request
```js
{
  user_question:   "your payback period?",
  forecast_result: _rawForecastResult,  // raw /forecast response — NOT the UI-transformed shape
  language:        "en",
  run_mode:        "local",             // uses DeepSeek-R1-Distill-Qwen-1.5B on cloud server
  max_new_tokens:  220,
  temperature:     0.3,
  top_p:           0.9,
}
```

`run_mode: "local"` means the backend runs the downloaded DeepSeek LLM for inference. The raw `/forecast` response is forwarded verbatim because `llm_service.py`'s `summarize_forecast_result()` needs the original backend keys (`pv_kwh.neutral`, `roi.payback_years`, `tariff_series`, etc.) — not the UI-transformed data stored in React context.

### Auth
Auth is fully client-side mock — no backend auth endpoints are called.

**Pre-seeded grader account:**
| Field | Value |
|---|---|
| Email | `cs5224group11@gmail.com` |
| Password | `12345678` |
| Plan | Pro (isPro: false) |

---

## User Access Tiers

| Feature | Free (not logged in) | Free (logged in) | Pro |
|---|---|---|---|
| Forecast analysis | ✅ | ✅ | ✅ |
| Historical stat cards | ✅ | ✅ | ✅ |
| Historical line charts | ✅ | ✅ | ✅ |
| Pro stat cards & charts | ❌ blurred | ❌ blurred | ✅ |
| AI chat advisory | ❌ | ❌ | ✅ |