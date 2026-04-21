# ChainOps Backend

Express API built to match the ChainOps frontend exactly — every function in
`src/services/api.js` maps to a route here with the same response shape.

---

## Quick start

```bash
cp .env.example .env
npm install
node index.js
# → http://localhost:3001
```

---

## Connect the frontend

1. Add to your frontend `.env`:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

2. Replace `src/services/api.js` with the `frontend-api.js` file included here.

That's it — no page components need to change.

---

## API routes

| Frontend call | Method | Path |
|---|---|---|
| `getCurrentUser()` | GET | `/api/me` |
| `getDashboardKPIs()` | GET | `/api/dashboard/kpis` |
| `getDashboardAlerts()` | GET | `/api/dashboard/alerts` |
| `getInventory()` | GET | `/api/inventory` |
| `getInventoryAlerts()` | GET | `/api/inventory/alerts` |
| `getShipments()` | GET | `/api/shipments` |
| `getWarehouses()` | GET | `/api/warehouses` |
| `getDemandForecast()` | GET | `/api/forecast` |
| `getAIRecommendations()` | GET | `/api/recommendations` |
| `applyRecommendation(id)` | POST | `/api/recommendations/:id/apply` |
| `dismissRecommendation(id)` | POST | `/api/recommendations/:id/dismiss` |
| `updateInventoryItem(sku, data)` | PATCH | `/api/inventory/:sku` |
| `updateShipment(orderId, data)` | PATCH | `/api/shipments/:orderId` |

### Optional query params

- `GET /api/inventory?status=Low+Stock&warehouse=Delhi+North+Hub&q=cable`
- `GET /api/shipments?status=Delayed&q=ORD-50023`
- `GET /api/warehouses?status=Operational`
- `GET /api/recommendations?type=Restock`

---

## Switching to Firebase

### 1. Install Firebase Admin

```bash
npm install firebase-admin
```

### 2. Add your service account

Download the JSON key from Firebase Console →
Project Settings → Service Accounts → Generate new private key.

Save it as `serviceAccount.json` in the project root.
**Add `serviceAccount.json` to `.gitignore` — never commit it.**

### 3. Flip the adapter

In `.env`:
```
DB_ADAPTER=firebase
```

### 4. Uncomment the Firebase code

Open `src/db/index.js`. Every function has a commented Firebase block directly
below the mock implementation. Uncomment the Firebase block and delete (or
comment out) the mock block for each function you want to migrate.

You can migrate one function at a time — mix mock and Firebase freely during
the transition.

### 5. Seed Firestore (one-time)

Run this script to copy seed.js data into Firestore:

```bash
node scripts/seed-firestore.js
```

(Create this script when ready — it's just a loop over each seed array calling
`db.collection("inventory").doc(item.sku).set(item)` etc.)

---

## Project structure

```
chainops-backend/
├── index.js                  # App entry, middleware, listen
├── .env.example              # Copy to .env
├── frontend-api.js           # Drop into frontend src/services/api.js
├── src/
│   ├── db/
│   │   └── index.js          # ← THE ONLY FILE THAT TOUCHES DATA
│   │                         #   Swap mock ↔ Firebase here
│   ├── data/
│   │   └── seed.js           # Mock data (same shape as Firestore docs)
│   ├── routes/
│   │   └── index.js          # All route handlers (call db/, never data/ directly)
│   └── middleware/
│       └── error.js          # 404 + error handler
└── README.md
```

The key design: **routes call `db/`, `db/` calls either seed data or Firestore**.
Routes never import seed data directly, so you only edit one file to switch databases.
