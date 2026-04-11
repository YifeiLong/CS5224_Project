# SolarYield AI — Frontend

STILL UNDER REVISION!!!
- NEED API for connecting with backend
- fetch results of user data and model outputs and post
- Consistency with backend models
- You can test login first with loginModal.jsx and api.js, with our mock user -- email:cs5224group11@gmail.com, password: 12345678
- user login data is stored inside users.json
---


## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run (must)
```bash
Download all files and put them into a single folder then:
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

## Frontend–Backend Contract

All API calls are centralised in `src/services/api.js`. Every function contains:
- A **mock implementation** (active by default) so the frontend runs without a backend
- A **commented-out real implementation** to uncomment once the backend endpoint is ready

## Backend Endpoints Required
ONLY FOR REFERENCE

### 1. Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Create new user. Returns user object + JWT. |
| POST | `/auth/login` | None | Authenticate user. Returns user object + JWT with current `isPro`. |
| POST | `/auth/logout` | JWT | Invalidate token server-side (optional). |
| GET | `/auth/me` | JWT | Return current user's profile and plan status. Used to rehydrate session on app load. |

**Request/Response shapes** are documented in `api.js` → Section 1.

### 2. Solar Yield Analysis
ML Model Integration: The future prediction for pro and past summary for non-pro users should be powered by a machine learning model.

### 3. AI Chat

### 4. Payments 


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
Based on model outputs

---

## Current Mock Behaviour

The app runs fully without a backend. All mocks are in `api.js`:

| Feature | Mock behaviour |
|---------|---------------|
| Register / Login | In-memory user store in `UserContext.jsx` |
| Solar analysis | Returns hardcoded data after 1.5s delay |
| AI chat | Returns a placeholder string after 1.5s delay |
| Payment | Simulates success after 2s delay |

