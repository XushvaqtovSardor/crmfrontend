import axios from 'axios';
import { normalizeRole } from './utils/roles.js';
const envApiUrl = import.meta.env.VITE_API_URL?.trim();
const rawApiUrl = envApiUrl;
const API_URL = rawApiUrl
    ? (rawApiUrl.includes('/api/v1')
        ? rawApiUrl.replace(/\/$/, '')
        : `${rawApiUrl.replace(/\/$/, '')}/api/v1`)
    : '/api/v1';
if (!envApiUrl && !import.meta.env.DEV) {
    console.error('VITE_API_URL is not set for production. API calls may fail unless /api/v1 is proxied.');
}
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000);
const API_MAX_RETRIES = Number(import.meta.env.VITE_API_MAX_RETRIES ?? 2);
const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const pendingGetControllers = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function readStoredUser() {
    try {
        const raw = localStorage.getItem('erp_user');
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        return {
            ...parsed,
            role: normalizeRole(parsed.role),
        };
    }
    catch {
        localStorage.removeItem('erp_user');
        return null;
    }
}
function clearStoredSession() {
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_access_token');
}
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
function isRetryableError(error) {
    const status = error?.response?.status;
    if (!status)
        return true;
    return status === 408 || status === 429 || status >= 500;
}
const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: API_TIMEOUT_MS,
});
api.interceptors.request.use((config) => {
    const method = (config.method || 'get').toLowerCase();
    if (method === 'get' && !config.__skipDedupe) {
        const key = makeRequestKey(config);
        const previous = pendingGetControllers.get(key);
        if (previous)
            previous.abort('Duplicate request canceled');
        const controller = new AbortController();
        config.signal = controller.signal;
        config.__requestKey = key;
        pendingGetControllers.set(key, controller);
    }
    const token = localStorage.getItem('erp_access_token');
    const user = readStoredUser();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (user) {
        config.headers['x-user-id'] = String(user.id);
        config.headers['x-user-role'] = normalizeRole(user.role);
    }
    return config;
});
api.interceptors.response.use((res) => {
    clearPendingRequest(res.config);
    return res;
}, async (err) => {
    clearPendingRequest(err.config);
    const config = err.config || {};
    const method = (config.method || 'get').toLowerCase();
    const retries = config.__retries || 0;
    if (RETRYABLE_METHODS.has(method)
        && retries < API_MAX_RETRIES
        && !axios.isCancel(err)
        && isRetryableError(err)) {
        config.__retries = retries + 1;
        config.__skipDedupe = true;
        const backoffMs = Math.min(1000 * 2 ** retries, 4000);
        await sleep(backoffMs);
        return api.request(config);
    }
    const isAuthRequest = typeof config.url === 'string' && config.url.includes('/auth/login');
    if ((err.response?.status === 403 || err.response?.status === 401) && !isAuthRequest) {
        clearStoredSession();
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    return Promise.reject(err);
});
export default api;
