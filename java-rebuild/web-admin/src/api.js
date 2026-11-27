const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "API error");
  return data;
}

export const login = (email, password) =>
  api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

export const dashboard = () => api("/dashboard/summary");
export const sensorHistory = () => api("/sensors/history");
export const devices = () => api("/devices");
export const toggleDevice = (id) => api(`/devices/${id}/toggle`, { method: "POST" });
