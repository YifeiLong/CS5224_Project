// =============================================================================
// api.js — SolarYield AI | Frontend API Service Layer
// =============================================================================
//
// HOW TO SWITCH FROM MOCK TO REAL BACKEND:
//   1. Start your FastAPI backend: uvicorn main:app --reload --port 8000
//   2. Create a .env file in your React project root:
//        VITE_API_BASE_URL=http://127.0.0.1:8000
//   3. In each function below, delete the MOCK block and uncomment REAL block
//   4. Make sure CORS is enabled in your FastAPI main.py
//
// TEST ACCOUNT FOR GRADERS (pre-seeded in users.json):
//   Email:    cs5224group11@gmail.com
//   Password: 12345678
//   Plan:     Pro (isPro: false)
//
// =============================================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Helper: inject JWT from localStorage into every authenticated request
// ---------------------------------------------------------------------------
const authHeaders = () => {
  const token = localStorage.getItem('solar_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ---------------------------------------------------------------------------
// Helper: throw readable error from non-2xx response
// ---------------------------------------------------------------------------
const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.detail || 'Request failed');
  }
  return res.json();
};


// =============================================================================
// 1. AUTH
// =============================================================================

/**
 * REGISTER a new user.
 *
 * BACKEND:  POST /auth/register
 * BODY:     { name: string, email: string, password: string }
 * RETURNS:  { user: { id, name, email, isPro }, token: string }
 *
 * Backend must:
 *   - Check if email already exists in users.json / DB — return 400 if so
 *   - Hash password with bcrypt before saving
 *   - Append new user entry to users.json
 *   - Return a signed JWT
 *
 * users.json entry shape:
 *   { id, name, email, password (bcrypt hash), isPro, createdAt }
 */
export const registerUser = async (name, email, password) => {
  // ── MOCK (delete when backend is ready) ───────────────────────────
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === 'cs5224group11@gmail.com') {
        reject(new Error('An account with this email already exists. Please log in.'));
      } else {
        resolve({
          user: { id: `u_${Date.now()}`, name, email, isPro: false },
          token: 'mock_jwt_token_register',
        });
        
      }
    }, 800);
  });
  // ── REAL (uncomment when backend is ready) ────────────────────────
  // const res = await fetch(`${BASE_URL}/auth/register`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ name, email, password }),
  // });
  // const data = await handleResponse(res);
  // localStorage.setItem('solar_token', data.token);
  // return data;
};

/**
 * LOGIN an existing user.
 *
 * BACKEND:  POST /auth/login
 * BODY:     { email: string, password: string }
 * RETURNS:  { user: { id, name, email, isPro }, token: string }
 *
 * Backend must:
 *   - Look up email in users.json / DB
 *   - If not found → 404, message must contain "sign up"
 *   - Verify password with bcrypt.checkpw()
 *   - If wrong → 401, message: "Incorrect password"
 *   - Return isPro from stored user record (persists Pro status across sessions)
 *   - Return a signed JWT
 *
 * Pre-seeded test account in users.json:
 *   email: cs5224group11@gmail.com | password: 12345678 | isPro: false
 */
export const loginUser = async (email, password) => {
  // ── MOCK (delete when backend is ready) ───────────────────────────
  // Simulates the pre-seeded grader account from users.json
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === 'cs5224group11@gmail.com' && password === '12345678') {
        resolve({
          user: { id: 'u_001', name: 'test', email, isPro: false },
          token: 'mock_jwt_token_grader',
        });
      } else if (email !== 'cs5224group11@gmail.com') {
        reject(new Error('No account found with this email. Please sign up first.'));
      } else {
        reject(new Error('Incorrect password. Please try again.'));
      }
    }, 800);
  });
  // ── REAL (uncomment when backend is ready) ────────────────────────
  // const res = await fetch(`${BASE_URL}/auth/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // });
  // const data = await handleResponse(res);
  // localStorage.setItem('solar_token', data.token);
  // return data;
};

/**
 * LOGOUT the current user.
 * Always removes JWT from localStorage client-side.
 *
 * BACKEND:  POST /auth/logout  (optional — invalidates token server-side)
 */
export const logoutUser = async () => {
  localStorage.removeItem('solar_token');
  // ── REAL (optional) ───────────────────────────────────────────────
  // await fetch(`${BASE_URL}/auth/logout`, {
  //   method: 'POST',
  //   headers: authHeaders(),
  // }).catch(() => {});
};

/**
 * GET current authenticated user from stored JWT.
 * Called on app load to rehydrate session — user stays logged in after refresh.
 *
 * BACKEND:  GET /auth/me
 * RETURNS:  { id, name, email, isPro }
 *
 * Backend must decode the JWT from Authorization header and return
 * the user's current record including up-to-date isPro status.
 */
export const fetchCurrentUser = async () => {
  // ── MOCK ──────────────────────────────────────────────────────────
  return null; // No session persistence in mock mode — user must log in each visit
  // ── REAL (uncomment when backend is ready) ────────────────────────
  // const res = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() });
  // return handleResponse(res);
};


// =============================================================================
// 2. SOLAR ANALYSIS — /forecast
// =============================================================================

/**
 * FETCH solar prediction for a property.
 *
 * BACKEND:  POST /forecast
 * BODY:     { postalCode: string, roofSize: number }
 *
 * RETURNS shape (must match exactly — /advisory validator checks top-level keys):
 * {
 *   status: 'success',
 *   location:    { postalCode, district },          ← required by /advisory
 *   inputs_used: { roofSize, effectiveArea },       ← required by /advisory
 *   pv_kwh:      { monthly: [...], annual: number },← required by /advisory
 *   roi:         { estCost, paybackYears,           ← required by /advisory
 *                  annualSavings, carbonOffset },
 *   data: {
 *     freeTier: {
 *       historicalAvgSunHours: number,
 *       estCost: number,
 *       past12Months: [{ month, rainfall, sunlight }]
 *     },
 *     proTier: {                          ← only return if JWT user isPro = true
 *       future12MonthsYield: [{ month, yield }],
 *       roiYears: number,
 *       carbonOffset: number
 *     }
 *   }
 * }
 *
 * NOTE: The full response object is passed to /advisory as forecast_result.
 * The advisory validator WILL reject payloads missing location, inputs_used,
 * pv_kwh, or roi — so these four top-level keys are mandatory.
 */
export const fetchPrediction = async (postalCode, roofSize, userType = "residential") => {
  const res = await fetch(`${BASE_URL}/forecast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      postal_code: postalCode, 
      roof_area_m2: Number(roofSize) * 0.092903, // converting sqft to sqm
      // Map frontend labels to backend model filenames:
      // residential → tariff_domestic.json, commercial → tariff_industrial.json
      user_type: userType,
      system_size_kwp: null,
      panel_efficiency: 0.20,
      capex_sgd: null,
      monthly_load_kwh: null,
      tariff_sgd_per_kwh: null
    }),
  });
  
  const backendData = await handleResponse(res);

  // Cache raw response so sendChatMessage() can pass it to /advisory unchanged
  _rawForecastResult = backendData;

  // Generate short month labels starting from current month (e.g. "Apr 26")
  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const monthLabels = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${MONTH_ABBR[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
  });

  // Past 12 month labels: from 12 months ago up to last month
  const pastMonthLabels = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 12 + i, 1);
    return `${MONTH_ABBR[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
  });

  // Derived aggregates
  const neutralAnnualKwh = backendData.pv_kwh.neutral.reduce((a, b) => a + b, 0);
  const avgTariffSgd = backendData.historical_averages.past_12m_avg_tariff_cents / 100;
  const annualSavings = Math.round(neutralAnnualKwh * avgTariffSgd);
  const carbonOffset = Math.round(neutralAnnualKwh * 0.408);

  return {
    status: 'success',
    location: backendData.location,
    inputs_used: backendData.inputs_used,
    pv_kwh: {
      monthly: backendData.pv_kwh.neutral,
      annual: neutralAnnualKwh,
    },
    roi: {
      estCost: backendData.roi.capex_sgd,
      paybackYears: backendData.roi.payback_years.neutral,
      annualSavings,
      carbonOffset,
    },
    data: {
      freeTier: {
        historicalAvgSunHours: backendData.historical_averages.past_12m_avg_daily_sunshine_hrs,
        historicalAvgRainyDays: backendData.historical_averages.past_12m_avg_rainy_days,
        historicalAvgTariffCents: backendData.historical_averages.past_12m_avg_tariff_cents,
        estCost: backendData.roi.capex_sgd,
        // Three separate chart data arrays, each using PAST 12 month labels.
        // The backend returns forecast data derived from historical training —
        // we label the x-axis as the past 12 months since these reflect historical patterns.
        // weather_scenarios.neutral = monthly sun hours (daily_hrs × days_in_month, from weather_model.py)
        // rainy_days = rainy_days_monthly
        // tariff_series = tariff_sgd_monthly in SGD/kWh → ×100 for cents
        sunHoursChart: pastMonthLabels.map((month, i) => ({
          month,
          value: parseFloat(backendData.weather_scenarios.neutral[i].toFixed(1)),
        })),
        rainyDaysChart: pastMonthLabels.map((month, i) => ({
          month,
          value: parseFloat(backendData.rainy_days[i].toFixed(1)),
        })),
        tariffChart: pastMonthLabels.map((month, i) => ({
          month,
          value: parseFloat((backendData.tariff_series[i] * 100).toFixed(2)),
        })),
      },
      proTier: {
        // All 3 scenario yields per month for grouped bar chart
        future12MonthsYield: monthLabels.map((month, i) => ({
          month,
          Pessimistic: parseFloat(backendData.pv_kwh.pessimistic[i].toFixed(1)),
          Neutral: parseFloat(backendData.pv_kwh.neutral[i].toFixed(1)),
          Optimistic: parseFloat(backendData.pv_kwh.optimistic[i].toFixed(1)),
        })),
        // Quarterly cashflow (end-of-quarter values: months 3,6,9,12)
        // cashflow_cumulative_sgd is a 12-element array (monthly)
        // 5 points: start of each quarter (0,3,6,9) + end of Q4 (11), labeled by actual month
        quarterlyCashflow: [0, 3, 6, 9, 11].map(i => ({
          month: monthLabels[i],
          Pessimistic: parseFloat(backendData.cashflow_cumulative_sgd.pessimistic[i].toFixed(0)),
          Neutral:     parseFloat(backendData.cashflow_cumulative_sgd.neutral[i].toFixed(0)),
          Optimistic:  parseFloat(backendData.cashflow_cumulative_sgd.optimistic[i].toFixed(0)),
        })),
        // Monthly savings matching roi.py exactly:
        //   savings_kwh = pv_kwh.neutral * SELF_CONSUMPTION_RATIO (0.80, no load provided)
        //   savings_sgd = savings_kwh * tariff_series[i]  (future 12-month forecast tariff, SGD/kWh)
        // tariff_series comes from tariff_sgd_monthly (weather_model.py) already in SGD/kWh
        // Assume 100% self-consumption (user consumes all PV generated)
        // gridCostAvoidedSgd = full neutral PV kWh × forecast monthly tariff (SGD/kWh)
        monthlySavingsChart: monthLabels.map((month, i) => ({
          month,
          gridCostAvoidedSgd: parseFloat((backendData.pv_kwh.neutral[i] * backendData.tariff_series[i]).toFixed(2)),
        })),
        roiYears: backendData.roi.payback_years.neutral,
        roiYearsPessimistic: backendData.roi.payback_years.pessimistic,
        roiYearsOptimistic: backendData.roi.payback_years.optimistic,
        roi10y: backendData.roi.roi_10y.neutral,
        carbonOffset,
        annualSavings,
      },
    },
  };
};


// =============================================================================
// 3. AI CHAT — /advisory
// =============================================================================

/**
 * SEND a chat message to the LLM advisory backend.
 *
 * BACKEND:  POST /advisory
 * AUTH:     Required — Pro users only (enforced server-side via JWT)
 *
 * FLOW:
 *   1. User runs /forecast → solarData stored in UserContext
 *   2. User opens chat and asks a question
 *   3. Frontend calls POST /advisory with question + full forecast result
 *   4. Backend passes both to LLM and returns natural-language answer
 *
 * REQUEST:
 *   {
 *     user_question: string,       // latest user message, max 1000 chars
 *     forecast_result: object,     // full solarData object from fetchPrediction()
 *                                  // must contain: location, inputs_used, pv_kwh, roi
 *     language: "en" | "zh",
 *     run_mode: "mock" | "local",  // "mock" = rule-based, "local" = real LLM
 *     max_new_tokens: number,      // 50–600
 *     temperature: number,         // 0.0–1.5
 *     top_p: number,               // 0.0–1.0
 *   }
 *
 * RESPONSE:
 *   {
 *     answer: string,       // main text shown in chat bubble
 *     disclaimer: string,   // shown as italic footnote below the answer
 *     used_model: string,
 *     run_mode: string,
 *     status: string,
 *   }
 *
 * IMPORTANT: Change run_mode to "local" when model is deployed on cloud.
 */
// Cache the raw backend /forecast response for /advisory
// fetchPrediction() stores the raw response here so sendChatMessage() can
// forward it verbatim — the advisory llm_service needs original backend keys.
let _rawForecastResult = null;

export const sendChatMessage = async (userQuestion, forecastResult = null) => {
  // userQuestion passed directly from ChatWidget — avoids any extraction risk from messages array
  // Use cached raw backend response — llm_service.py needs original backend keys
  const advisoryPayload = _rawForecastResult || forecastResult;

  if (!advisoryPayload) {
    return {
      answer:
        'Please run a solar forecast first by entering your postal code and roof size. ' +
        'Once the analysis is complete, I can answer questions about your specific results.',
      disclaimer:
        'This response is for result interpretation and decision support only. ' +
        'It is not professional financial, legal, or engineering advice.',
    };
  }

  // Connect to real /advisory backend using run_mode: 'mock'
  // This invokes generate_mock_answer() in llm_service.py — no LLM download needed.
  // Change run_mode to 'local' once download_model.py has been run.
  const res = await fetch(`${BASE_URL}/advisory`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      user_question:   userQuestion,
      forecast_result: advisoryPayload,  // raw /forecast shape → llm_service works correctly
      language:        'en',
      run_mode:        'local',           // ← uses generate_mock_answer() in llm_service.py
      max_new_tokens:  220,
      temperature:     0.3,
      top_p:           0.9,
    }),
  });

  return handleResponse(res);
};


// =============================================================================
// 4. PAYMENTS — Stripe
// =============================================================================

/**
 * CREATE a Stripe Checkout Session.
 *
 * BACKEND:  POST /payments/create-checkout-session
 * AUTH:     Required
 * RETURNS:  { sessionId, url }
 *
 * Redirect user to data.url (Stripe hosted checkout).
 * Stripe webhook (checkout.session.completed) sets isPro = true in users.json / DB.
 */
export const createCheckoutSession = async () => {
  // ── MOCK ──────────────────────────────────────────────────────────
  return new Promise((resolve) => {
    setTimeout(() => resolve({ sessionId: 'mock_session', url: null }), 500);
  });
  // ── REAL (uncomment when backend is ready) ────────────────────────
  // const res = await fetch(`${BASE_URL}/payments/create-checkout-session`, {
  //   method: 'POST',
  //   headers: authHeaders(),
  //   body: JSON.stringify({ planId: 'pro_monthly' }),
  // });
  // return handleResponse(res);
};

/**
 * VERIFY subscription after Stripe redirect.
 *
 * BACKEND:  GET /payments/subscription-status
 * AUTH:     Required
 * RETURNS:  { isPro: boolean, planId: string, renewsAt: string }
 */
export const fetchSubscriptionStatus = async () => {
  // ── MOCK ──────────────────────────────────────────────────────────
  return { isPro: false, planId: 'free', renewsAt: null };
  // ── REAL (uncomment when backend is ready) ────────────────────────
  // const res = await fetch(`${BASE_URL}/payments/subscription-status`, {
  //   headers: authHeaders(),
  // });
  // return handleResponse(res);
};
