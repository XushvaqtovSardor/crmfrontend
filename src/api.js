import axios from 'axios';

// API base URL resolution strategy:
// 1) explicit env URL
// 2) localhost in dev
// 3) relative /api/v1 for proxy-based deployments
const envApiUrl = import.meta.env.VITE_API_URL?.trim();
const fallbackHost = import.meta.env.DEV ? 'http://localhost:3000' : '';
const rawApiUrl = envApiUrl || fallbackHost;

const API_URL = rawApiUrl
  ? (rawApiUrl.includes('/api/v1')
    ? rawApiUrl.replace(/\/$/, '')
    : `${rawApiUrl.replace(/\/$/, '')}/api/v1`)
  : '/api/v1';

if (!envApiUrl && !import.meta.env.DEV) {
  console.error('VITE_API_URL is not set for production. API calls may fail unless /api/v1 is proxied.');
}

// Transport-level tuning for busy networks and overloaded backends.
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000);
const API_MAX_RETRIES = Number(import.meta.env.VITE_API_MAX_RETRIES ?? 2);
const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);

// Tracks in-flight GET requests to cancel duplicates.
const pendingGetControllers = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makeRequestKey(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${method}:${url}:${params}`;
}

function clearPendingRequest(config) {
  const key = config?.__requestKey;
  if (key && pendingGetControllers.has(key)) {
    pendingGetControllers.delete(key);
  }
}

// Retry only transient failures.
function isRetryableError(error) {
  const status = error?.response?.status;
  if (!status) return true;
  return status === 408 || status === 429 || status >= 500;
}

// Shared axios client for all frontend data access.
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT_MS,
});

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();

  // Deduplicate repeated GET calls (same route + params) during rapid UI updates.
  if (method === 'get' && !config.__skipDedupe) {
    const key = makeRequestKey(config);
    const previous = pendingGetControllers.get(key);
    if (previous) previous.abort('Duplicate request canceled');
    const controller = new AbortController();
    config.signal = controller.signal;
    config.__requestKey = key;
    pendingGetControllers.set(key, controller);
  }

  const token = localStorage.getItem('erp_access_token');
  const user = JSON.parse(localStorage.getItem('erp_user') || 'null');

  // JWT auth for protected endpoints.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Legacy role/id headers kept for backward compatibility with guard logic.
  if (user) {
    config.headers['x-user-id'] = String(user.id);
    config.headers['x-user-role'] = user.role;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    clearPendingRequest(res.config);
    return res;
  },
  async (err) => {
    clearPendingRequest(err.config);

    const config = err.config || {};
    const method = (config.method || 'get').toLowerCase();
    const retries = config.__retries || 0;

    // Auto-retry idempotent calls with exponential backoff.
    if (
      RETRYABLE_METHODS.has(method)
      && retries < API_MAX_RETRIES
      && !axios.isCancel(err)
      && isRetryableError(err)
    ) {
      config.__retries = retries + 1;
      config.__skipDedupe = true;
      const backoffMs = Math.min(1000 * 2 ** retries, 4000);
      await sleep(backoffMs);
      return api.request(config);
    }

    // Global auth-failure handling (except login request itself).
    const isAuthRequest = typeof config.url === 'string' && config.url.includes('/auth/login');
    if ((err.response?.status === 403 || err.response?.status === 401) && !isAuthRequest) {
      localStorage.removeItem('erp_user');
      localStorage.removeItem('erp_access_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
