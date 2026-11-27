const RAW_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = RAW_BASE ? `${RAW_BASE}/api` : '/api';

const TOKEN_KEY = 'mushroom_token';
const REFRESH_TOKEN_KEY = 'mushroom_refresh_token';
const USER_KEY = 'mushroom_user';

let onUnauthorizedCallback = null;

export function setOnUnauthorized(cb) {
  onUnauthorizedCallback = cb;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession({ token, refreshToken, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(method, path, { body, params, auth = true } = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra dịch vụ API.');
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (res.status === 401 && auth) {
    clearAuthSession();
    if (typeof onUnauthorizedCallback === 'function') {
      onUnauthorizedCallback(data?.message || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(data?.message || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
  }

  if (!res.ok) {
    const detailMsg =
      data?.errors && typeof data.errors === 'object'
        ? Object.values(data.errors).join('; ')
        : null;
    throw new Error(detailMsg || data?.message || `Lỗi máy chủ (HTTP ${res.status})`);
  }

  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      request('POST', '/auth/login', { body: { email, password }, auth: false }),
    register: (full_name, email, password) =>
      request('POST', '/auth/register', { body: { full_name, email, password }, auth: false }),
    me: () => request('GET', '/auth/me'),
    updateMe: (body) => request('PUT', '/auth/me', { body }),
    changePassword: (body) => request('PUT', '/auth/change-password', { body }),
  },
  dashboard: {
    summary: () => request('GET', '/dashboard/summary'),
  },
  rooms: {
    list: (params) => request('GET', '/rooms', { params }),
    create: (body) => request('POST', '/rooms', { body }),
    get: (id) => request('GET', `/rooms/${id}`),
    update: (id, body) => request('PUT', `/rooms/${id}`, { body }),
    remove: (id) => request('DELETE', `/rooms/${id}`),
  },
  trays: {
    list: (params) => request('GET', '/trays', { params }),
    create: (body) => request('POST', '/trays', { body }),
    get: (id) => request('GET', `/trays/${id}`),
    update: (id, body) => request('PUT', `/trays/${id}`, { body }),
    remove: (id) => request('DELETE', `/trays/${id}`),
    updateStage: (id, body) => request('PUT', `/trays/${id}/stage`, { body }),
    growthLogs: (id) => request('GET', `/trays/${id}/growth-logs`),
  },
  devices: {
    list: (params) => request('GET', '/devices', { params }),
    create: (body) => request('POST', '/devices', { body }),
    get: (id) => request('GET', `/devices/${id}`),
    update: (id, body) => request('PUT', `/devices/${id}`, { body }),
    remove: (id) => request('DELETE', `/devices/${id}`),
    sendCommand: (id, action, payload) =>
      request('POST', `/devices/${id}/command`, { body: { action, payload } }),
    commands: (id) => request('GET', `/devices/${id}/commands`),
  },
  sensors: {
    latest: (room_id) => request('GET', '/sensors/latest', { params: { room_id } }),
    history: (params) => request('GET', '/sensors/history', { params }),
    ingest: (body) => request('POST', '/sensors', { body }),
  },
  alerts: {
    list: (params) => request('GET', '/alerts', { params }),
    markRead: (id) => request('PUT', `/alerts/${id}/read`),
    resolve: (id) => request('PUT', `/alerts/${id}/resolve`),
    listThresholds: () => request('GET', '/alerts/thresholds'),
    updateThreshold: (metric, body) =>
      request('PUT', `/alerts/thresholds/${metric}`, { body }),
  },
  harvests: {
    list: (params) => request('GET', '/harvests', { params }),
    create: (body) => request('POST', '/harvests', { body }),
    get: (id) => request('GET', `/harvests/${id}`),
    record: (id, body) => request('PUT', `/harvests/${id}/record`, { body }),
  },
  rentals: {
    list: (params) => request('GET', '/rentals', { params }),
    create: (body) => request('POST', '/rentals', { body }),
    get: (id) => request('GET', `/rentals/${id}`),
    approve: (id) => request('POST', `/rentals/${id}/approve`),
    reject: (id, reason) =>
      request('POST', `/rentals/${id}/reject`, { body: { reason } }),
    assignTrays: (id, tray_ids) =>
      request('POST', `/rentals/${id}/assign-trays`, { body: { tray_ids } }),
    link: (code) => request('POST', '/rentals/link', { body: { code } }),
    cancel: (id, reason) =>
      request('POST', `/rentals/${id}/cancel`, { body: { reason } }),
  },
  packages: {
    list: (params) => request('GET', '/packages', { params }),
    create: (body) => request('POST', '/packages', { body }),
    get: (id) => request('GET', `/packages/${id}`),
    update: (id, body) => request('PUT', `/packages/${id}`, { body }),
    remove: (id) => request('DELETE', `/packages/${id}`),
  },
  users: {
    list: (params) => request('GET', '/users', { params }),
    create: (body) => request('POST', '/users', { body }),
    get: (id) => request('GET', `/users/${id}`),
    update: (id, body) => request('PUT', `/users/${id}`, { body }),
    resetPassword: (id, new_password) =>
      request('PUT', `/users/${id}/reset-password`, { body: { new_password } }),
  },
};

export default api;
