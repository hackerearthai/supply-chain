// =============================================================================
// db/index.js — Data Access Layer
// Two Firestore collections: "orders" (from CSV) and "warehouses"
// =============================================================================

const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccount.json");

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

const USE_FIREBASE = process.env.DB_ADAPTER === "firebase";

// ─── Firestore helpers ────────────────────────────────────────────────────────
async function fsCollection(name) {
  const snap = await db.collection(name).get();
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}
async function fsDoc(collection, id) {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) return null;
  return { _id: doc.id, ...doc.data() };
}
async function fsAdd(collection, data) {
  const ref = await db.collection(collection).add(data);
  return { _id: ref.id, ...data };
}
async function fsSet(collection, id, data) {
  await db.collection(collection).doc(id).set(data);
  return { _id: id, ...data };
}
async function fsUpdate(collection, id, data) {
  await db.collection(collection).doc(id).update(data);
  return fsDoc(collection, id);
}
async function fsDelete(collection, id) {
  await db.collection(collection).doc(id).delete();
}

// ─── Mock fallback data ───────────────────────────────────────────────────────
const mockWarehouses = [
  { id: "WH-01", name: "Mumbai Central DC",   location: "Mumbai, IN",    capacity: 12000, currentLoad: 8400, status: "Operational"  },
  { id: "WH-02", name: "Delhi North Hub",     location: "Delhi, IN",     capacity: 9500,  currentLoad: 9100, status: "Near Capacity" },
  { id: "WH-03", name: "Bengaluru Tech Park", location: "Bengaluru, IN", capacity: 7000,  currentLoad: 3200, status: "Operational"  },
  { id: "WH-04", name: "Chennai Port DC",     location: "Chennai, IN",   capacity: 11000, currentLoad: 5400, status: "Operational"  },
  { id: "WH-05", name: "Kolkata East Hub",    location: "Kolkata, IN",   capacity: 8000,  currentLoad: 7600, status: "Near Capacity" },
  { id: "WH-06", name: "Hyderabad Cargo",     location: "Hyderabad, IN", capacity: 6500,  currentLoad: 1200, status: "Maintenance"  },
];
const mockOrders = [];

// =============================================================================
const adapter = {

  getCurrentUser: async () => ({
    name: "Aarav Mehta", role: "Supply Chain Manager",
    email: "aarav@chainops.io", avatar: "AM",
  }),

  getDashboardKPIs: async () => {
    if (USE_FIREBASE) {
      const [orders, warehouses] = await Promise.all([
        fsCollection("orders"), fsCollection("warehouses"),
      ]);
      const today = new Date().toISOString().slice(0, 10);
      return {
        totalOrders:      orders.length,
        ordersToday:      orders.filter(o => (o.createdAt || "").startsWith(today)).length,
        totalWarehouses:  warehouses.length,
        pendingShipments: orders.filter(o => o.status && o.status !== "Delivered").length,
      };
    }
    return { totalOrders: mockOrders.length, ordersToday: 0, totalWarehouses: mockWarehouses.length, pendingShipments: 0 };
  },

  getDashboardAlerts: async () => {
    if (USE_FIREBASE) {
      const [orders, warehouses] = await Promise.all([
        fsCollection("orders"), fsCollection("warehouses"),
      ]);
      const alerts = [];
      warehouses.forEach(w => {
        const pct = w.capacity ? Math.round((w.currentLoad / w.capacity) * 100) : 0;
        if (pct >= 90) alerts.push({ id: `alert-wh-${w._id}`, severity: "destructive", title: `${w.name} near capacity`, description: `Load at ${pct}%.` });
      });
      const delayed = orders.filter(o => o.status === "Delayed");
      if (delayed.length) alerts.push({ id: "alert-delayed", severity: "warning", title: `${delayed.length} delayed order(s)`, description: delayed.slice(0, 2).map(o => o.order_id || o._id).join(", ") });
      return alerts.length ? alerts : [{ id: "ok", severity: "info", title: "All systems normal", description: "No active alerts." }];
    }
    return [{ id: "A1", severity: "info", title: "No data yet", description: "Upload a CSV to get started." }];
  },

  getOrders: async ({ q, warehouse, status } = {}) => {
    if (USE_FIREBASE) {
      let items = await fsCollection("orders");
      if (warehouse) items = items.filter(o => o.warehouse === warehouse);
      if (status)    items = items.filter(o => o.status === status);
      if (q) {
        const lq = q.toLowerCase();
        items = items.filter(o =>
          (o.order_id || "").toLowerCase().includes(lq) ||
          (o.sku      || "").toLowerCase().includes(lq) ||
          (o.user     || "").toLowerCase().includes(lq)
        );
      }
      return items;
    }
    return mockOrders;
  },

  bulkInsertOrders: async (rows) => {
    if (USE_FIREBASE) {
      const BATCH_SIZE = 500;
      const inserted = [];
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const chunk = rows.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        for (const row of chunk) {
          const ref = db.collection("orders").doc();
          const doc = { ...row, createdAt: new Date().toISOString() };
          batch.set(ref, doc);
          inserted.push({ _id: ref.id, ...doc });
        }
        await batch.commit();
      }
      return inserted;
    }
    mockOrders.push(...rows);
    return rows;
  },

  getWarehouses: async ({ status, q } = {}) => {
    if (USE_FIREBASE) {
      let items = await fsCollection("warehouses");
      if (status) items = items.filter(w => w.status === status);
      if (q) {
        const lq = q.toLowerCase();
        items = items.filter(w => (w.name || "").toLowerCase().includes(lq) || (w.location || "").toLowerCase().includes(lq));
      }
      return items;
    }
    let items = mockWarehouses;
    if (status) items = items.filter(w => w.status === status);
    if (q)      items = items.filter(w => w.name.toLowerCase().includes(q.toLowerCase()));
    return items;
  },

  addWarehouse: async (data) => {
    if (USE_FIREBASE) {
      if (data.id) return fsSet("warehouses", data.id, data);
      return fsAdd("warehouses", data);
    }
    mockWarehouses.push(data);
    return data;
  },

  updateWarehouse: async (id, data) => {
    if (USE_FIREBASE) return fsUpdate("warehouses", id, data);
    const w = mockWarehouses.find(w => w.id === id || w._id === id);
    if (!w) return null;
    Object.assign(w, data);
    return w;
  },

  deleteWarehouse: async (id) => {
    if (USE_FIREBASE) { await fsDelete("warehouses", id); return { deleted: true }; }
    const idx = mockWarehouses.findIndex(w => w.id === id);
    if (idx !== -1) mockWarehouses.splice(idx, 1);
    return { deleted: true };
  },
};

module.exports = adapter;
