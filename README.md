# SolarYield AI — Frontend

STILL UNDER REVISION!!!
NEED API for connecting with backend
fetch results of user data and model outputs and post
Consistency with backend models
You can test login first with loginModal.jsx
---


## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run (must)
```bash
npm install 
npm run dev
```

## Project Structure

```
src/
├── App.jsx                  # Root component — wraps app in UserProvider
├── main.jsx                 # Vite entry point
├── context/
│   └── UserContext.jsx      # Global auth + solar data state
├── pages/
│   └── Home.jsx             # Page router — manages tab state and modals
├── components/
│   ├── Navbar.jsx           # Top navigation with tab routing and auth buttons
│   ├── HeroInput.jsx        # Landing page (feature tab) — postal code input + Analyze Now
│   ├── Dashboard.jsx        # Analysis results — free charts + Pro paywall
│   ├── ChatWidget.jsx       # Fixed chat bubble — AI consultant (Pro only)
│   ├── LoginModal.jsx       # Login / Register modal
│   ├── PaymentModal.jsx     # Pro upgrade / payment modal
│   ├── PricingPage.jsx      # Pricing tab page
│   └── AboutUsPage.jsx      # About Us tab page
└── services/
    └── api.js               # ALL backend communication — stubs + real endpoints
```

---


### Environment Variables
Create a `.env` file in the project root:
```env
VITE_API_BASE_URL=http://localhost:8000/v1
```
For production:
```env
VITE_API_BASE_URL=https://api.solaryield.ai/v1
```

---

## Frontend–Backend Contract

All API calls are centralised in `src/services/api.js`. Every function contains:
- A **mock implementation** (active by default) so the frontend runs without a backend
- A **commented-out real implementation** to uncomment once the backend endpoint is ready

### Authentication Flow
```
User registers / logs in
  → POST /auth/register or /auth/login
  → Backend returns { user: { id, name, email, isPro }, token }
  → Frontend stores token in localStorage as "solar_token"
  → authHeaders() injects "Authorization: Bearer <token>" on every subsequent call
  → On app load, GET /auth/me rehydrates the session from the stored token
```

### isPro Persistence
`isPro` must be stored **in the database against the user record**, not only in frontend state. The login endpoint must return `isPro: true/false` reflecting the user's current Stripe subscription status. This is what persists the Pro plan across logout/login cycles.

---

## Backend Endpoints Required

### 1. Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Create new user. Returns user object + JWT. |
| POST | `/auth/login` | None | Authenticate user. Returns user object + JWT with current `isPro`. |
| POST | `/auth/logout` | JWT | Invalidate token server-side (optional). |
| GET | `/auth/me` | JWT | Return current user's profile and plan status. Used to rehydrate session on app load. |

**Request/Response shapes** are documented in `api.js` → Section 1.

---

### 2. Solar Analysis — `/analysis`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/analysis/predict` | Optional | Core prediction endpoint. Free tier data returned for all users. Pro tier data only returned when JWT belongs to a Pro user (isPro = true). |
| GET | `/analysis/history` | JWT | Return user's saved past analyses (paginated). |

**`POST /analysis/predict` — Full specification:**

Request body:
```json
{ "postalCode": "560123", "roofSize": 150 }
```

Response:
```json
{
  "status": "success",
  "data": {
    "freeTier": {
      "historicalAvgSunHours": 4.8,
      "estCost": 33000,
      "past12Months": [
        { "month": "Jan", "rainfall": 250, "sunlight": 140 }
      ]
    },
    "proTier": {
      "future12MonthsYield": [
        { "month": "Next Jan", "yield": 1650 }
      ],
      "roiYears": 3.5,
      "carbonOffset": 120
    }
  }
}
```

**Data sources to integrate:**
- `historicalAvgSunHours` + `past12Months` → NEA Meteorological Service API or an irradiance database keyed by Singapore postal district
- `estCost` → Configurable cost-per-sqft constant (currently SGD 220/sqft)
- `future12MonthsYield` → ML prediction microservice (see ML section below)
- `roiYears` → Derived from estCost, yield, and current EMA electricity tariff
- `carbonOffset` → Derived from yield × Singapore grid emission factor

---

### 3. AI Chat — `/chat`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat/message` | JWT (Pro only) | Send conversation history to LLM. Returns assistant reply. |

Request body:
```json
{
  "messages": [
    { "role": "user", "content": "What is my estimated ROI?" },
    { "role": "assistant", "content": "Based on your roof size..." }
  ],
  "context": {
    "postalCode": "560123",
    "roofSize": 150,
    "historicalAvgSunHours": 4.8,
    "estCost": 33000
  }
}
```

Response:
```json
{ "content": "Based on your 150 sqft roof in postal district 56..." }
```

**LLM integration notes:**
- Connect to OpenAI GPT-4o, Anthropic Claude, or your own fine-tuned model
- Prepend a system prompt constraining responses to Singapore solar topics (NEA grants, ECIS export scheme, EMA tariffs, SolarNova programme)
- Inject the `context` object so the LLM gives property-specific answers
- Enforce Pro-only access via JWT middleware — return 403 for free users
- Recommended rate limit: 50 messages/user/day
- Consider SSE streaming for better UX — `ChatWidget.jsx` is ready to be updated to consume a `ReadableStream`

**Recommended system prompt (store server-side):**
```
You are SolarExpert AI, a consultant specialising in rooftop solar energy in Singapore.
Answer questions about solar yield, ROI, installation costs, NEA SolarNova grants,
EMA net metering, and the ECIS export scheme. Be concise and always cite
Singapore-specific figures when available. If the user's property context is provided,
tailor your answer to their specific situation.
```

---

### 4. Payments — `/payments` (Stripe)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/create-checkout-session` | JWT | Create Stripe Checkout session for Pro plan. Returns `{ sessionId, url }`. |
| GET | `/payments/subscription-status` | JWT | Return current subscription status. Called after Stripe redirect. |
| POST | `/payments/cancel-subscription` | JWT | Cancel Pro plan at period end. |
| POST | `/payments/webhook` | Stripe signature | Stripe webhook handler — updates `isPro` in DB on `checkout.session.completed`. |

**Stripe integration notes:**
- Use Stripe's server-side SDK (Node.js: `stripe` package)
- The webhook endpoint must verify the `Stripe-Signature` header
- On `checkout.session.completed`, set `isPro = true` on the user record in your database
- On `customer.subscription.deleted`, set `isPro = false`

---


## ML Model Integration

The `future12MonthsYield` field in `/analysis/predict` should be powered by a machine learning model.

**Recommended inputs (features):**
- Roof size (sqft)
- Postal district (maps to irradiance zone)
- Month of year
- Historical 12-month irradiance and rainfall averages
- Panel efficiency constant (store in config, e.g. 0.18 for standard monocrystalline)
- Shading factor (optional — derived from geospatial data)

**Suggested architecture:**
- Train a regression model (XGBoost, LightGBM, or a small neural net) on historical Singapore NEA irradiance data
- Serve as a FastAPI or Flask microservice
- The main backend calls this microservice internally — the frontend only talks to `/analysis/predict`

---

## Database Schema (recommended)

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,  -- bcrypt hashed
  is_pro      BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis history
CREATE TABLE analyses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  postal_code TEXT NOT NULL,
  roof_size   NUMERIC NOT NULL,
  result_json JSONB,          -- store full API response
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history (optional — for context injection)
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  role        TEXT CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Frontend Components — Backend Integration Points

### `UserContext.jsx`
Currently manages auth state in memory (resets on refresh). Once the backend is ready:
1. On mount, call `fetchCurrentUser()` to rehydrate session from `localStorage` token
2. Replace `register()` / `login()` with calls to `registerUser()` / `loginUser()` from `api.js`
3. `upgradeToPro()` should call `fetchSubscriptionStatus()` after Stripe redirect to confirm DB update

### `ChatWidget.jsx`
The `handleSend` function contains a clearly marked `BACKEND INTEGRATION POINT` comment. Replace the `setTimeout` mock with:
```js
const data = await sendChatMessage(messages, solarDataContext);
const reply = data.content;
```

### `PaymentModal.jsx`
Replace the `handlePay` mock with:
```js
const { url } = await createCheckoutSession();
window.location.href = url; // Redirect to Stripe Checkout
```

### `Dashboard.jsx`
Add a "Download Report" button (Pro only) that calls:
```js
await generatePdfReport(postalCode, roofSize, solarData);
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, MUI v5, Recharts |
| State | React Context API |
| Routing (tab-based) | Custom tab state in Home.jsx |
| Recommended Backend | Node.js + Express or Python + FastAPI |
| Recommended Database | PostgreSQL (via Supabase or Railway) |
| Payments | Stripe |
| LLM | OpenAI GPT-4o / Anthropic Claude API |
| ML Serving | FastAPI + scikit-learn / XGBoost |
| Hosting | Vercel (frontend) + Railway / Render (backend) |

---

## Current Mock Behaviour

The app runs fully without a backend. All mocks are in `api.js`:

| Feature | Mock behaviour |
|---------|---------------|
| Register / Login | In-memory user store in `UserContext.jsx` |
| Solar analysis | Returns hardcoded data after 1.5s delay |
| AI chat | Returns a placeholder string after 1.5s delay |
| Payment | Simulates success after 2s delay |
| PDF export | Logs a warning to the console |

---

## Deployment Checklist

- [ ] Set `VITE_API_BASE_URL` in production `.env`
- [ ] Uncomment real implementations in `api.js` and remove mocks
- [ ] Move auth to `UserContext.jsx` — call `fetchCurrentUser()` on mount
- [ ] Configure Stripe webhook endpoint on backend
- [ ] Set up CORS on backend to allow your frontend domain
- [ ] Add HTTPS to backend (required for Stripe and secure cookies)
- [ ] Set JWT expiry and implement token refresh
- [ ] Add rate limiting to `/chat/message` and `/analysis/predict`
