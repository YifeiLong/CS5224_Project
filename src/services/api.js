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
export const fetchPrediction = async (postalCode, roofSize) => {
  // ── MOCK (delete when backend is ready) ───────────────────────────
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'success',
        location: { postalCode, district: postalCode.substring(0, 2) },
        inputs_used: { roofSize, effectiveArea: roofSize * 0.7 },
        pv_kwh: { monthly: [], annual: roofSize * 150 },
        roi: {
          estCost: Math.round(roofSize * 220),
          paybackYears: 3.5,
          annualSavings: roofSize * 120,
          carbonOffset: roofSize * 0.8,
        },
        data: {
          freeTier: {
            historicalAvgSunHours: 4.8,
            estCost: Math.round(roofSize * 220),
            past12Months: [
              { month: 'Jan', rainfall: 250, sunlight: 140 },
              { month: 'Feb', rainfall: 160, sunlight: 160 },
              { month: 'Mar', rainfall: 170, sunlight: 175 },
              { month: 'Apr', rainfall: 165, sunlight: 180 },
              { month: 'May', rainfall: 170, sunlight: 170 },
              { month: 'Jun', rainfall: 150, sunlight: 190 },
              { month: 'Jul', rainfall: 140, sunlight: 200 },
              { month: 'Aug', rainfall: 145, sunlight: 195 },
              { month: 'Sep', rainfall: 160, sunlight: 180 },
              { month: 'Oct', rainfall: 190, sunlight: 160 },
              { month: 'Nov', rainfall: 240, sunlight: 145 },
              { month: 'Dec', rainfall: 280, sunlight: 130 },
            ],
          },
          proTier: {
            future12MonthsYield: [
              { month: 'Next Jan', yield: roofSize * 11 },
              { month: 'Next Feb', yield: roofSize * 12 },
              { month: 'Next Mar', yield: roofSize * 14 },
              { month: 'Next Apr', yield: roofSize * 15 },
              { month: 'Next May', yield: roofSize * 14 },
              { month: 'Next Jun', yield: roofSize * 13 },
              { month: 'Next Jul', yield: roofSize * 13.5 },
              { month: 'Next Aug', yield: roofSize * 14 },
              { month: 'Next Sep', yield: roofSize * 12.5 },
              { month: 'Next Oct', yield: roofSize * 11 },
              { month: 'Next Nov', yield: roofSize * 9.5 },
              { month: 'Next Dec', yield: roofSize * 9 },
            ],
            roiYears: 3.5,
            carbonOffset: roofSize * 0.8,
          },
        },
      });
    }, 1500);
  });
  // ── REAL (uncomment when backend is ready) ────────────────────────
  // const res = await fetch(`${BASE_URL}/forecast`, {
  //   method: 'POST',
  //   headers: authHeaders(),
  //   body: JSON.stringify({ postalCode, roofSize }),
  // });
  // return handleResponse(res);
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
export const sendChatMessage = async (messages, forecastResult = null) => {
  const latestUserMessage = [...messages].reverse().find(m => m.role === 'user');
  const userQuestion = latestUserMessage?.content || '';

  // ── MOCK (delete when backend is ready) ───────────────────────────
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        answer: 'Thank you for your question. The advisory backend is running in mock mode. Switch run_mode to "local" once the model is deployed to receive real AI-generated answers.',
        disclaimer: 'This response is for result interpretation and decision support only. It is not professional financial, legal, or engineering advice.',
      });
    }, 1500);
  });
  // ── REAL (uncomment when backend is ready) ────────────────────────
  // const res = await fetch(`${BASE_URL}/advisory`, {
  //   method: 'POST',
  //   headers: authHeaders(),
  //   body: JSON.stringify({
  //     user_question: userQuestion,
  //     forecast_result: forecastResult, // must have: location, inputs_used, pv_kwh, roi
  //     language: 'en',
  //     run_mode: 'mock',   // ← change to 'local' when model is deployed on cloud
  //     max_new_tokens: 220,
  //     temperature: 0.3,
  //     top_p: 0.9,
  //   }),
  // });
  // return handleResponse(res);
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


// =============================================================================
// 5. PDF REPORT EXPORT
// =============================================================================

/**
 * GENERATE and download a PDF report (Pro only).
 *
 * BACKEND:  POST /reports/generate
 * AUTH:     Required — Pro users only
 * BODY:     { postalCode, roofSize, analysisData }
 * RETURNS:  PDF binary blob → browser downloads automatically
 */
export const generatePdfReport = async (postalCode, roofSize, analysisData) => {
  // ── REAL (uncomment when backend is ready) ────────────────────────
  // const res = await fetch(`${BASE_URL}/reports/generate`, {
  //   method: 'POST',
  //   headers: authHeaders(),
  //   body: JSON.stringify({ postalCode, roofSize, analysisData }),
  // });
  // if (!res.ok) throw new Error('Failed to generate report');
  // const blob = await res.blob();
  // const url = URL.createObjectURL(blob);
  // const a = document.createElement('a');
  // a.href = url;
  // a.download = `SolarYield_Report_${postalCode}.pdf`;
  // a.click();
  // URL.revokeObjectURL(url);
  console.warn('PDF export: backend not yet connected.');
};


// =============================================================================
// 6. ANALYSIS HISTORY
// =============================================================================

/**
 * FETCH the authenticated user's saved analysis history.
 *
 * BACKEND:  GET /analysis/history
 * AUTH:     Required
 * RETURNS:  [{ id, postalCode, roofSize, createdAt, summary }]
 */
export const fetchAnalysisHistory = async () => {
  // ── REAL (uncomment when backend is ready) ────────────────────────
  // const res = await fetch(`${BASE_URL}/analysis/history`, {
  //   headers: authHeaders(),
  // });
  // return handleResponse(res);
};