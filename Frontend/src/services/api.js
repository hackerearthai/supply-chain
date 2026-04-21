const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}
async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}
async function patch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}
async function del(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  getCurrentUser:    () => get("/me"),
  getDashboardKPIs:  () => get("/dashboard/kpis"),
  getDashboardAlerts:() => get("/dashboard/alerts"),

  // Orders (CSV)
  getOrders:         (params = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v)));
    return get(`/orders${q.toString() ? "?" + q : ""}`);
  },
  uploadOrdersCSV:   (file) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${BASE_URL}/orders/upload`, { method: "POST", body: form }).then(r => r.json());
  },

  // Warehouses
  getWarehouses:     () => get("/warehouses"),
  addWarehouse:      (data) => post("/warehouses", data),
  updateWarehouse:   (id, data) => patch(`/warehouses/${id}`, data),
  deleteWarehouse:   (id) => del(`/warehouses/${id}`),
};

export default api;
