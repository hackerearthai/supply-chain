const router  = require("express").Router();
const multer  = require("multer");
const { parse } = require("csv-parse/sync");
const db      = require("../db");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── User ─────────────────────────────────────────────────────────────────────
router.get("/me", async (req, res, next) => {
  try { res.json(await db.getCurrentUser()); } catch (e) { next(e); }
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get("/dashboard/kpis", async (req, res, next) => {
  try { res.json(await db.getDashboardKPIs()); } catch (e) { next(e); }
});
router.get("/dashboard/alerts", async (req, res, next) => {
  try { res.json(await db.getDashboardAlerts()); } catch (e) { next(e); }
});

// ─── Orders (CSV) ─────────────────────────────────────────────────────────────
// GET /api/orders?q=...&warehouse=...&status=...
router.get("/orders", async (req, res, next) => {
  try {
    const { q, warehouse, status } = req.query;
    res.json(await db.getOrders({ q, warehouse, status }));
  } catch (e) { next(e); }
});

// POST /api/orders/upload  — multipart CSV file field named "file"
router.post("/orders/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded. Send field name: file" });

    const csvText = req.file.buffer.toString("utf8");

    // Parse CSV — columns: user, order_id, sku, quantity, payment, warehouse, location
    const rows = parse(csvText, {
      columns: true,          // use first row as header
      skip_empty_lines: true,
      trim: true,
    });

    // Normalise column names (lowercase + trim)
    const normalised = rows.map(row => {
      const out = {};
      for (const [k, v] of Object.entries(row)) {
        out[k.toLowerCase().trim().replace(/\s+/g, "_")] = v;
      }
      // Coerce numeric fields
      if (out.quantity !== undefined) out.quantity = Number(out.quantity) || 0;
      if (out.payment  !== undefined) out.payment  = Number(out.payment)  || 0;
      return out;
    });

    const inserted = await db.bulkInsertOrders(normalised);
    res.json({ success: true, inserted: inserted.length, sample: inserted.slice(0, 3) });
  } catch (e) { next(e); }
});

// ─── Warehouses ───────────────────────────────────────────────────────────────
// GET /api/warehouses?status=Operational&q=mumbai
router.get("/warehouses", async (req, res, next) => {
  try {
    const { status, q } = req.query;
    res.json(await db.getWarehouses({ status, q }));
  } catch (e) { next(e); }
});

// POST /api/warehouses  — add a new warehouse
router.post("/warehouses", async (req, res, next) => {
  try {
    const { id, name, location, capacity, currentLoad, status } = req.body;
    if (!name || !location || !capacity) {
      return res.status(400).json({ error: "name, location and capacity are required" });
    }
    const data = {
      id:          id || `WH-${Date.now()}`,
      name:        name.trim(),
      location:    location.trim(),
      capacity:    Number(capacity)    || 0,
      currentLoad: Number(currentLoad) || 0,
      status:      status || "Operational",
    };
    res.status(201).json(await db.addWarehouse(data));
  } catch (e) { next(e); }
});

// PATCH /api/warehouses/:id  — update warehouse fields
router.patch("/warehouses/:id", async (req, res, next) => {
  try {
    const allowed = ["name", "location", "capacity", "currentLoad", "status"];
    const update  = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (update.capacity)    update.capacity    = Number(update.capacity);
    if (update.currentLoad) update.currentLoad = Number(update.currentLoad);
    const item = await db.updateWarehouse(req.params.id, update);
    if (!item) return res.status(404).json({ error: "Warehouse not found" });
    res.json(item);
  } catch (e) { next(e); }
});

// DELETE /api/warehouses/:id
router.delete("/warehouses/:id", async (req, res, next) => {
  try { res.json(await db.deleteWarehouse(req.params.id)); } catch (e) { next(e); }
});

module.exports = router;
