# Smart Supply Chain Web App

A comprehensive full-stack application for managing supply chain operations with real-time data synchronization, intelligent stock suggestions, and multi-source data integration.

## 🏗️ Architecture Overview

### Technology Stack
- **Backend**: Node.js + Express.js
- **Frontend**: React + TypeScript + Vite
- **Database**: MongoDB
- **Data Sources**: CSV, Google Sheets, API

### Project Structure

```
supply-chain/
├── backend/
│   ├── models/              # MongoDB schemas
│   ├── controllers/         # Business logic
│   ├── routes/              # API endpoints
│   ├── services/            # External integrations & utilities
│   ├── middleware/          # Express middleware
│   ├── uploads/             # CSV upload directory
│   ├── server.js            # Main server file
│   └── .env                 # Environment variables
│
└── Frontend/
    ├── src/
    │   ├── pages/           # React pages
    │   ├── components/      # Reusable components
    │   ├── services/        # API service layer
    │   ├── context/         # React context
    │   └── App.tsx          # Main app component
    └── vite.config.ts       # Vite config with proxy
```

## 📦 Database Collections

### 1. **Warehouses**
```javascript
{
  warehouse_name: String (unique),
  location: String,
  city: String,
  state: String,
  latitude: Number,
  longitude: Number,
  capacity: Number,
  currentStock: Number,
  created_at: Date
}
```

### 2. **Orders**
```javascript
{
  user: String (required),
  order_id: String (unique),
  product_id: String (SKU),
  quantity: Number,
  warehouse: String,
  location: String (destination),
  paymentStatus: String (pending, completed, failed),
  status: String (pending, shipped, delivered),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Inventory**
```javascript
{
  warehouse_name: String,
  warehouseId: ObjectId (ref: Warehouse),
  product_id: String (SKU),
  sku: String,
  current_stock: Number,
  stockAvailable: Number,
  reservedStock: Number,
  incoming_stock: Number,
  updated_at: Date
}
```

### 4. **Shipments**
```javascript
{
  shipment_id: String (unique),
  product_id: String,
  sku: String,
  from: String (warehouse name),
  fromWarehouse: ObjectId (ref: Warehouse),
  to: String (destination),
  toLocation: String,
  quantity: Number,
  status: String (CREATED, DISPATCHED, IN_TRANSIT, DELIVERED),
  timestamps: {
    createdAt: Date,
    dispatchedAt: Date,
    inTransitAt: Date,
    deliveredAt: Date
  }
}
```

### 5. **DataSources**
```javascript
{
  type: String (csv, google_sheet, api),
  sourceUrl: String,
  isActive: Boolean,
  lastSyncedAt: Date,
  lastError: String,
  syncInterval: Number (milliseconds),
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **DemandAnalytics**
```javascript
{
  sku: String,
  location: String,
  demandScore: Number,
  orderCount: Number,
  totalQuantityDemanded: Number,
  lastCalculated: Date
}
```

### 7. **StockSuggestion**
```javascript
{
  sku: String,
  suggestions: [{
    warehouseId: ObjectId,
    warehouseName: String,
    suggestedQuantity: Number,
    ratioPercentage: Number
  }],
  totalSuggestedQuantity: Number,
  basedOnDemandScore: Number,
  calculatedAt: Date
}
```

## 🚀 API Endpoints

### Warehouses
- `GET    /api/warehouses`                  - List all warehouses
- `POST   /api/warehouses`                  - Create new warehouse
- `GET    /api/warehouses/:id`              - Get warehouse by ID
- `PUT    /api/warehouses/:id`              - Update warehouse
- `DELETE /api/warehouses/:id`              - Delete warehouse

### Orders
- `GET    /api/orders`                      - List orders (with filters)
- `POST   /api/orders`                      - Create order
- `GET    /api/orders/:id`                  - Get order by ID
- `PUT    /api/orders/:id`                  - Update order
- `DELETE /api/orders/:id`                  - Delete order
- `GET    /api/orders/stats`                - Order statistics

### Inventory
- `GET    /api/inventory`                   - List inventory items
- `POST   /api/inventory`                   - Create inventory item
- `GET    /api/inventory/:id`               - Get inventory item
- `PUT    /api/inventory/:id`               - Update inventory
- `DELETE /api/inventory/:id`               - Delete inventory
- `GET    /api/inventory/low-stock`         - Get low stock items
- `GET    /api/inventory/stats`             - Inventory statistics

### Shipments
- `GET    /api/shipments`                   - List shipments
- `POST   /api/shipments`                   - Create shipment
- `GET    /api/shipments/:id`               - Get shipment
- `PUT    /api/shipments/:id`               - Update shipment status
- `DELETE /api/shipments/:id`               - Delete shipment
- `GET    /api/shipments/stats`             - Shipment statistics

### Data Sources
- `POST   /api/data-sources/upload-csv`     - Upload CSV file
- `POST   /api/data-sources/connect-sheet`  - Connect Google Sheet
- `POST   /api/data-sources/sync-sheet/:id` - Manual sync
- `GET    /api/data-sources`                - List data sources
- `GET    /api/data-sources/:id`            - Get data source
- `PATCH  /api/data-sources/:id/disable`    - Disable auto-sync

### Dashboard
- `GET    /api/dashboard/summary`           - Dashboard summary (KPIs)
- `GET    /api/dashboard/demand/:sku`       - Demand analytics for SKU
- `GET    /api/dashboard/suggestions/:sku`  - Stock suggestions
- `POST   /api/dashboard/suggestions`       - Calculate suggestions

## 📥 CSV File Formats

### Inventory CSV
```csv
warehouse_name,product_id,sku,current_stock
Warehouse A,SKU001,SKU001,100
Warehouse B,SKU002,SKU002,200
```

### Orders CSV
```csv
user,order_id,product_id,sku,quantity,warehouse,location,paymentStatus
John Doe,ORD001,SKU001,SKU001,10,Warehouse A,NYC,pending
Jane Smith,ORD002,SKU002,SKU002,20,Warehouse B,LA,completed
```

## 🔄 Google Sheets Integration

### Features
- **Real-time Sync**: Automatically sync every 30 seconds (configurable)
- **No Duplicates**: Upsert-based updates prevent data duplication
- **Error Tracking**: Logs sync errors for debugging
- **Manual Sync**: Trigger sync on-demand
- **Auto Disable**: Stops syncing when data source is disabled

### Setup
1. Create a Google Sheet with columns: `warehouse_name`, `product_id`, `sku`, `current_stock`
2. Make the sheet publicly readable (Share > Anyone with link)
3. Copy the sheet URL
4. Paste in the frontend Google Sheets Integration page
5. Set sync interval (default: 30 seconds)
6. Click "Connect Sheet" to start auto-sync

### Sheet URL Format
```
https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
```

## 🧠 Stock Suggestion Logic

### Algorithm
1. **Demand Analysis**: Calculates total demand per SKU and location
2. **Demand Score**: `orderCount × totalQuantityDemanded`
3. **Distribution Methods**:
   - **Demand-based**: Distributes stock proportional to demand
   - **Ratio-based**: Allows custom ratios (e.g., 6:2:2:1)

### Example Request
```javascript
POST /api/dashboard/suggestions
{
  "sku": "SKU001",
  "totalQuantity": 1000,
  "ratios": [6, 2, 2, 1]  // Optional: custom distribution
}
```

### Response
```javascript
{
  "sku": "SKU001",
  "totalQuantity": 1000,
  "suggestions": [
    {
      "warehouseId": "...",
      "warehouseName": "Warehouse A",
      "suggestedQuantity": 600,
      "ratioPercentage": 60
    },
    // ... more suggestions
  ]
}
```

## 🛠️ Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and port
   ```

3. **Start Server**
   ```bash
   # Development with auto-reload
   npm run dev
   
   # Production
   npm start
   ```

   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd Frontend
   npm install
   # or
   bun install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

   Frontend runs on `http://localhost:8080` (with proxy to backend)

## 🔧 Environment Variables

### Backend (.env)
```env
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/supply_chain
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/supply_chain

# Server
PORT=5000
NODE_ENV=development

# Optional
GOOGLE_SHEETS_API_KEY=your_api_key_here
```

### Frontend (vite.config.ts)
Proxy is already configured:
```typescript
proxy: {
  "/api": {
    target: "http://localhost:5000",
    changeOrigin: true,
  },
}
```

## 💡 Key Features

### 1. Multi-Source Data Integration
- **CSV Upload**: Bulk import with validation
- **Google Sheets**: Real-time sync with configurable intervals
- **API Ready**: Placeholder for future API integrations

### 2. Smart Inventory Management
- Low stock alerts
- Automatic demand tracking
- Intelligent stock distribution suggestions
- Reserve stock management

### 3. Order Management
- Create, track, update orders
- Payment status tracking
- Order-to-inventory synchronization
- Demand analytics

### 4. Shipment Tracking
- Status tracking (Created → Delivered)
- Timestamp history
- Warehouse-to-location mapping
- Shipment statistics

### 5. Dashboard Analytics
- Real-time KPIs
- Low stock alerts
- Recent shipment history
- Order and shipment status breakdown

## 🧪 Testing the API

### Create Warehouse
```bash
curl -X POST http://localhost:5000/api/warehouses \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_name": "Warehouse A",
    "location": "New York",
    "city": "New York",
    "state": "NY",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "capacity": 1000
  }'
```

### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user": "John Doe",
    "order_id": "ORD001",
    "product_id": "SKU001",
    "quantity": 10,
    "warehouse": "Warehouse A",
    "location": "NYC",
    "paymentStatus": "pending",
    "status": "pending"
  }'
```

### Get Dashboard Summary
```bash
curl http://localhost:5000/api/dashboard/summary
```

### Upload CSV
```bash
curl -X POST http://localhost:5000/api/data-sources/upload-csv \
  -F "file=@orders.csv" \
  -F "dataType=orders"
```

## 📊 Dashboard Pages

### 1. **Dashboard** (`/`)
- KPI cards (Total Orders, Warehouses, Shipments)
- Low stock warnings
- Recent shipments
- Status breakdown charts

### 2. **Inventory** (`/inventory`)
- Inventory levels by warehouse
- Low stock alerts
- Stock availability view
- Inventory statistics

### 3. **Orders** (`/orders`)
- Create new orders
- Filter by status
- Order history
- Payment status tracking

### 4. **Shipments** (`/shipments`)
- Track active shipments
- Status updates
- Transit history
- Delivery confirmation

### 5. **Warehouses** (`/warehouses`)
- Add/edit warehouses
- Location management
- Capacity tracking
- Warehouse-location mapping

### 6. **CSV Upload** (`/upload`)
- Drag-and-drop file upload
- Inventory or Orders data
- Template download
- Import summary

### 7. **Google Sheets** (`/sheets`)
- Connect Google Sheets
- Configure auto-sync interval
- Manual sync trigger
- Active sync status

### 8. **Demand Forecast** (`/forecast`)
- Demand prediction analytics
- Historical trends

### 9. **AI Recommendations** (`/ai`)
- Smart suggestions
- Optimization recommendations

## 🔐 Security Considerations

1. **Validate All Inputs**: All endpoints validate request data
2. **Duplicate Prevention**: Unique indexes on critical fields
3. **Error Handling**: Comprehensive error messages without exposing internals
4. **CORS**: Configured for same-origin requests
5. **File Upload**: Validates file type and stores in designated directory

## 📈 Performance Optimizations

1. **Database Indexes**: Unique indexes on `warehouse_name` and `order_id`
2. **Lean Queries**: Use `.lean()` for read-only queries
3. **Batch Operations**: CSV import processes in batches
4. **Aggregation Pipeline**: Efficient grouping for statistics
5. **Pagination**: Support for limit/skip on list endpoints

## 🚨 Error Handling

All endpoints return structured error responses:
```javascript
{
  "error": "Descriptive error message"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `409`: Conflict (duplicate)
- `500`: Server Error

## 📝 Notes

- All timestamps use ISO 8601 format
- Text fields are automatically trimmed
- Duplicate orders/shipments are prevented via unique constraints
- Inventory is automatically updated when orders are created
- Demand analytics are tracked per SKU and location

## 🤝 Contributing

1. Follow MVC pattern for new features
2. Use async/await for async operations
3. Add error handling for all database operations
4. Update API documentation when adding endpoints
5. Test endpoints before committing

## 📄 License

This project is part of the Smart Supply Chain initiative.
