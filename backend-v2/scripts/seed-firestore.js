// scripts/seed-firestore.js
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccount.json");
const seed = require("../src/data/seed");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  // Warehouses
  for (const w of seed.warehouses) {
    await db.collection("warehouses").doc(w.id).set(w);
    console.log("seeded warehouse", w.id);
  }
  // Inventory
  for (const i of seed.inventory) {
    await db.collection("inventory").doc(i.sku).set(i);
    console.log("seeded inventory", i.sku);
  }
  // Shipments
  for (const s of seed.shipments) {
    await db.collection("shipments").doc(s.orderId).set(s);
    console.log("seeded shipment", s.orderId);
  }
  // Forecast
  for (const f of seed.demandForecast) {
    await db.collection("demandForecast").doc(f.month).set(f);
    console.log("seeded forecast", f.month);
  }
  // AI Recommendations
  for (const r of seed.aiRecommendations) {
    await db.collection("aiRecommendations").doc(r.id).set(r);
    console.log("seeded recommendation", r.id);
  }

  console.log("\n✅ Firestore seeded!");
  process.exit(0);
}

run().catch(console.error);