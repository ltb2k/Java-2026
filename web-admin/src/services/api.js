const API = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  let res;
  try {
    res = await fetch(API + path, { ...options, headers });
  } catch {
    throw new Error("Không thể kết nối máy chủ. Kiểm tra backend và cấu hình API.");
  }
  if (options.raw) {
    if (res.status === 401) window.dispatchEvent(new Event("auth:expired"));
    return res;
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/auth/login" && path !== "/auth/register") {
    window.dispatchEvent(new Event("auth:expired"));
  }
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

export const login = (email, password) => api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const register = (fullName, email, password, phone) => api("/auth/register", { method: "POST", body: JSON.stringify({ fullName, email, password, phone }) });
export const me = () => api("/auth/me");
export const updateMe = (x) => api("/auth/me", { method: "PATCH", body: JSON.stringify(x) });

export const dashboard = () => api("/dashboard/summary");
export const sensorHistory = () => api("/sensors/history");
export const sensorLatest = () => api("/sensors/latest");
export const outdoorWeather = () => api("/external/weather/current");
export const outdoorWeatherHistory = (start, end) => api(`/external/weather/history?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
export const referenceMedia = () => api("/reference/media");
export const cultivationGuides = () => api("/reference/cultivation-guides");

export const rooms = () => api("/rooms");
export const createRoom = (x) => api("/rooms", { method: "POST", body: JSON.stringify(x) });
export const updateRoom = (id, x) => api(`/rooms/${id}`, { method: "PATCH", body: JSON.stringify(x) });
export const deleteRoom = (id) => api(`/rooms/${id}`, { method: "DELETE" });

export const trays = (scope) => api("/trays" + (scope ? `?scope=${scope}` : ""));
export const createTray = (x) => api("/trays", { method: "POST", body: JSON.stringify(x) });
export const updateTray = (id, x) => api(`/trays/${id}`, { method: "PATCH", body: JSON.stringify(x) });
export const deleteTray = (id) => api(`/trays/${id}`, { method: "DELETE" });
export const registerTray = (code, packageId) => api("/trays/register", { method: "POST", body: JSON.stringify({ code, packageId }) });

export const devices = () => api("/devices");
export const createDevice = (x) => api("/devices", { method: "POST", body: JSON.stringify(x) });
export const toggleDevice = (id, body) => api(`/devices/${id}/toggle`, { method: "PATCH", body: JSON.stringify(body) });
export const deleteDevice = (id) => api(`/devices/${id}`, { method: "DELETE" });

export const cameras = () => api("/cameras");
export const createCamera = (x) => api("/cameras", { method: "POST", body: JSON.stringify(x) });
export const updateCamera = (id, x) => api(`/cameras/${id}`, { method: "PATCH", body: JSON.stringify(x) });

export const progress = (trayId) => api("/progress" + (trayId ? `?trayId=${trayId}` : ""));
export const createProgress = (x) => api("/progress", { method: "POST", body: JSON.stringify(x) });

export const notifications = () => api("/notifications");
export const readNotification = (id) => api(`/notifications/${id}/read`, { method: "PATCH" });

export const harvests = () => api("/harvests");
export const createHarvest = (x) => api("/harvests", { method: "POST", body: JSON.stringify(x) });
export const updateHarvest = (id, x) => api(`/harvests/${id}`, { method: "PATCH", body: JSON.stringify(x) });

export const packages = () => api("/packages");
export const createPackage = (x) => api("/packages", { method: "POST", body: JSON.stringify(x) });
export const updatePackage = (id, x) => api(`/packages/${id}`, { method: "PATCH", body: JSON.stringify(x) });
export const deletePackage = (id) => api(`/packages/${id}`, { method: "DELETE" });

export const rentals = () => api("/rentals");
export const createRental = (x) => api("/rentals", { method: "POST", body: JSON.stringify(x) });
export const updateRental = (id, x) => api(`/rentals/${id}`, { method: "PATCH", body: JSON.stringify(x) });
export const transactions = () => api("/transactions");

export const users = () => api("/users");
export const createUser = (x) => api("/users", { method: "POST", body: JSON.stringify(x) });
export const updateUser = (id, x) => api(`/users/${id}`, { method: "PATCH", body: JSON.stringify(x) });
export const deleteUser = (id) => api(`/users/${id}`, { method: "DELETE" });

export const thresholds = () => api("/thresholds");
export const saveThresholds = (x) => api("/thresholds", { method: "PUT", body: JSON.stringify(x) });

export const reportSummary = () => api("/reports/summary");
export async function exportReport(type) {
  const res = await api(`/reports/export?type=${type}`, { raw: true });
  if (!res.ok) throw new Error("Không xuất được báo cáo");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
