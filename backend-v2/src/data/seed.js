// =============================================================================
// Seed data — field names match the frontend's api.js exactly so responses
// can be consumed without any mapping on the frontend side.
// =============================================================================

const warehouses = [
  { id: "WH-01", name: "Mumbai Central DC",  location: "Mumbai, IN",    capacity: 12000, currentLoad: 8400, status: "Operational"  },
  { id: "WH-02", name: "Delhi North Hub",    location: "Delhi, IN",     capacity: 9500,  currentLoad: 9100, status: "Near Capacity" },
  { id: "WH-03", name: "Bengaluru Tech Park",location: "Bengaluru, IN", capacity: 7000,  currentLoad: 3200, status: "Operational"  },
  { id: "WH-04", name: "Chennai Port DC",    location: "Chennai, IN",   capacity: 11000, currentLoad: 5400, status: "Operational"  },
  { id: "WH-05", name: "Kolkata East Hub",   location: "Kolkata, IN",   capacity: 8000,  currentLoad: 7600, status: "Near Capacity" },
  { id: "WH-06", name: "Hyderabad Cargo",    location: "Hyderabad, IN", capacity: 6500,  currentLoad: 1200, status: "Maintenance"  },
];

const inventory = [
  { sku: "SKU-1001", name: "Wireless Headphones",  warehouse: "Mumbai Central DC",  quantity: 320, reorderLevel: 100, status: "In Stock"     },
  { sku: "SKU-1002", name: "USB-C Cable 1m",        warehouse: "Delhi North Hub",    quantity: 18,  reorderLevel: 50,  status: "Low Stock"    },
  { sku: "SKU-1003", name: "Mechanical Keyboard",   warehouse: "Bengaluru Tech Park",quantity: 0,   reorderLevel: 25,  status: "Out of Stock" },
  { sku: "SKU-1004", name: "27\" 4K Monitor",        warehouse: "Chennai Port DC",   quantity: 145, reorderLevel: 40,  status: "In Stock"     },
  { sku: "SKU-1005", name: "Ergo Office Chair",      warehouse: "Mumbai Central DC", quantity: 62,  reorderLevel: 30,  status: "In Stock"     },
  { sku: "SKU-1006", name: "Standing Desk Frame",    warehouse: "Kolkata East Hub",  quantity: 9,   reorderLevel: 20,  status: "Low Stock"    },
  { sku: "SKU-1007", name: "Webcam 1080p",           warehouse: "Delhi North Hub",   quantity: 240, reorderLevel: 80,  status: "In Stock"     },
  { sku: "SKU-1008", name: "Bluetooth Mouse",        warehouse: "Hyderabad Cargo",   quantity: 0,   reorderLevel: 60,  status: "Out of Stock" },
  { sku: "SKU-1009", name: "Laptop Stand",           warehouse: "Bengaluru Tech Park",quantity: 410, reorderLevel: 100, status: "In Stock"    },
  { sku: "SKU-1010", name: "USB Hub 7-Port",         warehouse: "Chennai Port DC",   quantity: 27,  reorderLevel: 50,  status: "Low Stock"    },
  { sku: "SKU-1011", name: "Noise-Cancel Earbuds",   warehouse: "Mumbai Central DC", quantity: 180, reorderLevel: 75,  status: "In Stock"     },
  { sku: "SKU-1012", name: "Portable SSD 1TB",       warehouse: "Delhi North Hub",   quantity: 92,  reorderLevel: 40,  status: "In Stock"     },
];

const shipments = [
  { orderId: "ORD-50021", from: "Mumbai Central DC",  to: "Pune Retail",       status: "In Transit", eta: "2025-04-21" },
  { orderId: "ORD-50022", from: "Delhi North Hub",    to: "Jaipur Store",      status: "Delivered",  eta: "2025-04-18" },
  { orderId: "ORD-50023", from: "Bengaluru Tech Park",to: "Mysore Outlet",     status: "Delayed",    eta: "2025-04-22" },
  { orderId: "ORD-50024", from: "Chennai Port DC",    to: "Coimbatore Hub",    status: "In Transit", eta: "2025-04-23" },
  { orderId: "ORD-50025", from: "Kolkata East Hub",   to: "Patna Depot",       status: "Delivered",  eta: "2025-04-17" },
  { orderId: "ORD-50026", from: "Mumbai Central DC",  to: "Nashik Store",      status: "In Transit", eta: "2025-04-24" },
  { orderId: "ORD-50027", from: "Hyderabad Cargo",    to: "Vijayawada DC",     status: "Delayed",    eta: "2025-04-25" },
  { orderId: "ORD-50028", from: "Delhi North Hub",    to: "Chandigarh Store",  status: "In Transit", eta: "2025-04-22" },
  { orderId: "ORD-50029", from: "Chennai Port DC",    to: "Madurai Hub",       status: "Delivered",  eta: "2025-04-16" },
  { orderId: "ORD-50030", from: "Bengaluru Tech Park",to: "Hubli Outlet",      status: "In Transit", eta: "2025-04-26" },
];

const demandForecast = [
  { month: "Nov", actual: 8200,  forecast: 8000  },
  { month: "Dec", actual: 9400,  forecast: 9100  },
  { month: "Jan", actual: 7800,  forecast: 8200  },
  { month: "Feb", actual: 8600,  forecast: 8500  },
  { month: "Mar", actual: 9900,  forecast: 9700  },
  { month: "Apr", actual: null,  forecast: 10400 },
  { month: "May", actual: null,  forecast: 10800 },
  { month: "Jun", actual: null,  forecast: 11200 },
];

const aiRecommendations = [
  { id: "R1", type: "Restock",  title: "Reorder SKU-1002 (USB-C Cable)",                    impact: "Prevents 4-day stockout",           confidence: 0.92 },
  { id: "R2", type: "Reroute",  title: "Shift 200 units SKU-1009 → Hyderabad Cargo",        impact: "Balances load, -12% transit cost",  confidence: 0.86 },
  { id: "R3", type: "Pricing",  title: "Promote SKU-1011 in South region",                  impact: "+8% projected sell-through",        confidence: 0.78 },
  { id: "R4", type: "Capacity", title: "Open overflow bay at Delhi Hub",                    impact: "Avoids near-capacity bottleneck",   confidence: 0.81 },
];

const currentUser = {
  name:   "Aarav Mehta",
  role:   "Supply Chain Manager",
  email:  "aarav@chainops.io",
  avatar: "AM",
};

// Derived — matches frontend dashboardKPIs shape
function getDashboardKPIs() {
  return {
    totalOrders:      12480,
    ordersToday:      184,
    totalWarehouses:  warehouses.length,
    pendingShipments: shipments.filter((s) => s.status !== "Delivered").length,
  };
}

// Matches frontend dashboardAlerts shape
function getDashboardAlerts() {
  return [
    { id: "A1", severity: "warning",     title: "Low stock on USB-C Cable",    description: "Delhi North Hub is below reorder threshold (18 / 50)." },
    { id: "A2", severity: "destructive", title: "Shipment ORD-50023 delayed",  description: "Bengaluru → Mysore expected 2 days late."              },
    { id: "A3", severity: "info",        title: "Anomaly detected",            description: "Mumbai DC outbound 22% above 7-day average."           },
  ];
}

// Matches frontend inventoryAlerts shape
function getInventoryAlerts() {
  const outOfStock = inventory.filter((i) => i.status === "Out of Stock").map((i) => i.name);
  const lowStock   = inventory.filter((i) => i.status === "Low Stock").length;
  return [
    { id: "I1", severity: "destructive", title: `${outOfStock.length} SKUs out of stock`, description: outOfStock.join(", ") },
    { id: "I2", severity: "warning",     title: `${lowStock} SKUs below reorder level`,  description: "Trigger procurement workflow."  },
  ];
}

module.exports = {
  warehouses,
  inventory,
  shipments,
  demandForecast,
  aiRecommendations,
  currentUser,
  getDashboardKPIs,
  getDashboardAlerts,
  getInventoryAlerts,
};
