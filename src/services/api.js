const resolveBaseUrl = () => {
  const configuredBase =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    "http://localhost:5000";

  return configuredBase.endsWith("/api")
    ? configuredBase.slice(0, -4)
    : configuredBase;
};

const BASE_URL = resolveBaseUrl();


// Store current userId from Firebase
let currentUserId = "demo-user"; // Default user ID for testing

export const setCurrentUser = (userId) => {
  currentUserId = userId || "demo-user";
};

export const getCurrentUser = () => currentUserId;

const handleResponse = async (response) => {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error || payload?.message || response.statusText || "API request failed.";
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json().catch(() => null);
};

const buildUrl = (path) => `${BASE_URL}${path}`;

const getHeaders = (includeContentType = true) => {
  const headers = {
    "x-user-id": currentUserId,
  };
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};
console.log("API BASE:", BASE_URL);
export const loginUser = async (uid, email, name, avatar) => {
  return handleResponse(
    await fetch(buildUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email, name, avatar }),
    }),
  );
};

export const api = {
  // Warehouses
  getWarehouses: async () => {
    try {
      return await handleResponse(await fetch(buildUrl("/api/warehouses"), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
      return [];
    }
  },

  addWarehouse: async (warehouse) => {
    return handleResponse(
      await fetch(buildUrl("/api/warehouses"), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(warehouse),
      }),
    );
  },

  deleteWarehouse: async (id) => {
    return handleResponse(
      await fetch(buildUrl(`/api/warehouses/${id}`), {
        method: "DELETE",
        headers: getHeaders(false),
      }),
    );
  },

  // CSV Upload
  uploadCsv: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      return handleResponse(
        await fetch(buildUrl("/api/upload"), {
          method: "POST",
          headers: { "x-user-id": currentUserId },
          body: formData,
        }),
      );
    } catch (error) {
      console.error("CSV upload failed:", error);
      throw new Error("Backend not running or network error. Please ensure the backend server is started.");
    }
  },

  mapAndStoreCsv: async (csvData, mapping, dataType, sourceMeta = {}) => {
    try {
      return handleResponse(
        await fetch(buildUrl("/api/upload/map-data"), {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ csvData, mapping, dataType, ...sourceMeta }),
        }),
      );
    } catch (error) {
      console.error("Data mapping failed:", error);
      throw error;
    }
  },

  // Dashboard
  getDashboardKPIs: async () => {
    try {
      return await handleResponse(await fetch(buildUrl("/api/dashboard/summary"), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Return safe defaults
      return {
        inventory: { totalProducts: 0, totalStock: 0, lowStockItems: 0, avgStock: 0 },
        orders: { totalOrders: 0, pendingOrders: 0, totalOrderQuantity: 0 },
        shipments: { totalShipments: 0, inTransit: 0, delivered: 0 },
        warehouses: { totalWarehouses: 0, totalCapacity: 0, totalCurrentStock: 0 },
        ordersPerWarehouse: [],
        alerts: []
      };
    }
  },

  // Inventory
  getInventory: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters);
      return await handleResponse(await fetch(buildUrl(`/api/inventory?${queryParams}`), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      return [];
    }
  },

  getInventorySummary: async () => {
    try {
      return await handleResponse(await fetch(buildUrl("/api/inventory/summary"), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch inventory summary:", error);
      return { totalProducts: 0, totalStock: 0, totalValue: 0, lowStockCount: 0 };
    }
  },

  // Orders
  getOrders: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters);
      return await handleResponse(await fetch(buildUrl(`/api/orders?${queryParams}`), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      return [];
    }
  },

  getOrderSummary: async () => {
    try {
      return await handleResponse(await fetch(buildUrl("/api/orders/summary"), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch order summary:", error);
      return {
        totalOrders: 0,
        totalQuantity: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0
      };
    }
  },

  getOrderTrends: async () => {
    try {
      return await handleResponse(await fetch(buildUrl("/api/orders/trends"), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch order trends:", error);
      return [];
    }
  },

  createOrder: async (order) => {
    return handleResponse(
      await fetch(buildUrl("/api/orders"), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(order),
      }),
    );
  },

  // Shipments
  getShipments: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters);
      return await handleResponse(await fetch(buildUrl(`/api/shipments?${queryParams}`), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
      return [];
    }
  },

  getShipmentSummary: async () => {
    try {
      return await handleResponse(await fetch(buildUrl("/api/shipments/summary"), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch shipment summary:", error);
      return {
        totalShipments: 0,
        totalQuantity: 0,
        pendingShipments: 0,
        inTransitShipments: 0,
        deliveredShipments: 0,
        delayedShipments: 0
      };
    }
  },

  suggestWarehouse: async (location) => {
    try {
      return await handleResponse(await fetch(buildUrl(`/api/warehouses/suggest?location=${encodeURIComponent(location)}`), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to get warehouse suggestion:", error);
      return null;
    }
  },

  getDashboardAlerts: async () => {
    try {
      const data = await api.getDashboardKPIs();
      return data.alerts || [];
    } catch (error) {
      return [
        { id: "A1", severity: "warning", title: "Backend Connection", description: "Unable to connect to backend server. Some features may not work." },
      ];
    }
  },

  // Demand Forecast
  getDemandForecast: async () => {
    try {
      return await handleResponse(await fetch(buildUrl("/api/demand-forecast"), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch demand forecast:", error);
      // Return mock data for demo purposes
      return {
        totalSkus: 0,
        totalOrderLines: 0,
        topSkus: [],
      };
    }
  },

  previewGoogleSheet: async (sheetUrl, dataType) => {
    return handleResponse(
      await fetch(buildUrl("/api/upload/google-sheet/preview"), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ sheetUrl, dataType }),
      }),
    );
  },

  mapAndStoreSheet: async (sheetUrl, mapping, dataType) => {
    return handleResponse(
      await fetch(buildUrl("/api/upload/google-sheet/map-data"), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ sheetUrl, mapping, dataType }),
      }),
    );
  },

  getImportHistory: async () => {
    try {
      return await handleResponse(await fetch(buildUrl("/api/upload/history"), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch import history:", error);
      return [];
    }
  },

  getImportHistoryItem: async (id) => {
    return handleResponse(
      await fetch(buildUrl(`/api/upload/history/${id}`), {
        headers: getHeaders(false),
      }),
    );
  },

  deleteImportHistoryItem: async (id) => {
    return handleResponse(
      await fetch(buildUrl(`/api/upload/history/${id}`), {
        method: "DELETE",
        headers: getHeaders(false),
      }),
    );
  },

  getDemandForecastSkus: async (search = "", limit = 200) => {
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      query.set("limit", String(limit));
      return await handleResponse(await fetch(buildUrl(`/api/demand-forecast/skus?${query.toString()}`), {
        headers: getHeaders(false)
      }));
    } catch (error) {
      console.error("Failed to fetch demand forecast SKU suggestions:", error);
      return [];
    }
  },

  allocateStock: async (data) => {
    return handleResponse(
      await fetch(buildUrl("/api/demand-forecast/allocate-stock"), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      }),
    );
  },
};

export const syncGoogleSheet = (sheetUrl, dataType) => api.previewGoogleSheet(sheetUrl, dataType);
export const mapAndStoreSheet = (sheetUrl, mapping, dataType) => api.mapAndStoreSheet(sheetUrl, mapping, dataType);

export default api;
