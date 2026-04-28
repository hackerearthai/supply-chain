import { useEffect, useMemo, useState } from "react";
import { Package, ShoppingCart, Warehouse } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { KPICard } from "@/components/KPICard";
import { Input } from "@/components/ui/input";
import api from "@/services/api";

const Dashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [skuFilter, setSkuFilter] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderRows, inventoryRows, shipmentRows, warehouseRows] = await Promise.all([
          api.getOrders({ limit: 5000 }),
          api.getInventory(),
          api.getShipments({ limit: 5000 }),
          api.getWarehouses()
        ]);
        setOrders(orderRows || []);
        setInventory(inventoryRows || []);
        setShipments(shipmentRows || []);
        setWarehouses(warehouseRows || []);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };

    loadData();
  }, []);

  const warehouseOptions = useMemo(() => {
    const values = new Set<string>();
    warehouses.forEach((warehouse) => values.add(warehouse.warehouse_name));
    orders.forEach((order) => order.warehouse && values.add(order.warehouse));
    inventory.forEach((item) => item.warehouse && values.add(item.warehouse));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [warehouses, orders, inventory]);

  const skuOptions = useMemo(() => {
    const values = new Set<string>();
    orders.forEach((order) => order.sku && values.add(order.sku));
    inventory.forEach((item) => item.sku && values.add(item.sku));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [orders, inventory]);

  const normalizedSkuFilter = skuFilter.trim().toLowerCase();

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const warehouseMatch = selectedWarehouse === "all" || order.warehouse === selectedWarehouse;
        const skuMatch = !normalizedSkuFilter || (order.sku || "").toLowerCase().includes(normalizedSkuFilter);
        return warehouseMatch && skuMatch;
      }),
    [orders, selectedWarehouse, normalizedSkuFilter]
  );

  const filteredInventory = useMemo(
    () =>
      inventory.filter((item) => {
        const warehouseMatch = selectedWarehouse === "all" || item.warehouse === selectedWarehouse;
        const skuMatch = !normalizedSkuFilter || (item.sku || "").toLowerCase().includes(normalizedSkuFilter);
        return warehouseMatch && skuMatch;
      }),
    [inventory, selectedWarehouse, normalizedSkuFilter]
  );

  const filteredShipments = useMemo(
    () =>
      shipments.filter((shipment) => {
        const shipmentWarehouse = shipment.origin?.warehouse || shipment.warehouse || shipment.from_warehouse || "";
        const warehouseMatch = selectedWarehouse === "all" || shipmentWarehouse === selectedWarehouse;
        const shipmentSkus = Array.isArray(shipment.items) ? shipment.items.map((item: any) => item.sku || "") : [];
        const skuMatch = !normalizedSkuFilter || shipmentSkus.some((sku: string) => sku.toLowerCase().includes(normalizedSkuFilter));
        return warehouseMatch && skuMatch;
      }),
    [shipments, selectedWarehouse, normalizedSkuFilter]
  );

  const summary = useMemo(() => {
    const uniqueSkus = new Set<string>();
    filteredOrders.forEach((order) => order.sku && uniqueSkus.add(order.sku));
    filteredInventory.forEach((item) => item.sku && uniqueSkus.add(item.sku));

    const warehouseSet = new Set<string>();
    filteredOrders.forEach((order) => order.warehouse && warehouseSet.add(order.warehouse));
    filteredInventory.forEach((item) => item.warehouse && warehouseSet.add(item.warehouse));

    return {
      totalProducts: uniqueSkus.size,
      totalOrders: filteredOrders.length,
      totalWarehouses: warehouseSet.size || (selectedWarehouse === "all" ? warehouses.length : Number(Boolean(selectedWarehouse !== "all"))),
      inTransit: filteredShipments.filter((shipment) => shipment.status === "in_transit").length,
      delivered: filteredShipments.filter((shipment) => shipment.status === "delivered").length,
    };
  }, [filteredOrders, filteredInventory, filteredShipments, warehouses.length, selectedWarehouse]);

  const ordersPerWarehouse = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredOrders.forEach((order) => {
      const key = order.warehouse || "Unassigned";
      grouped.set(key, (grouped.get(key) || 0) + Number(order.quantity || 0));
    });
    return Array.from(grouped.entries())
      .map(([warehouse, count]) => ({ warehouse, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredOrders]);

  const topSkus = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredOrders.forEach((order) => {
      const key = order.sku || "unknown";
      grouped.set(key, (grouped.get(key) || 0) + Number(order.quantity || 0));
    });
    return Array.from(grouped.entries())
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [filteredOrders]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Filter the network by warehouse and SKU to understand exactly what is happening in that slice of your data."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Live
          </span>
        }
      />

      <section className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-4 lg:grid-cols-[220px_1fr]">
        <div>
          <label className="mb-2 block text-sm font-medium">Warehouse slicer</label>
          <select
            value={selectedWarehouse}
            onChange={(event) => setSelectedWarehouse(event.target.value)}
            className="w-full rounded border bg-background p-2 text-sm"
          >
            <option value="all">All warehouses</option>
            {warehouseOptions.map((warehouse) => (
              <option key={warehouse} value={warehouse}>
                {warehouse}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">SKU slicer</label>
          <Input
            list="dashboard-skus"
            value={skuFilter}
            onChange={(event) => setSkuFilter(event.target.value)}
            placeholder="Filter by SKU or paste an exact SKU code"
          />
          <datalist id="dashboard-skus">
            {skuOptions.map((sku) => (
              <option key={sku} value={sku} />
            ))}
          </datalist>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KPICard
          label="SKUs In View"
          value={summary.totalProducts.toLocaleString()}
          icon={Package}
        />
        <KPICard
          label="Orders In View"
          value={summary.totalOrders.toLocaleString()}
          icon={ShoppingCart}
        />
        <KPICard
          label="Warehouses In View"
          value={summary.totalWarehouses.toLocaleString()}
          icon={Warehouse}
          trend={{ value: selectedWarehouse === "all" ? "All selected" : selectedWarehouse, positive: true }}
        />
      </div>

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Demand by warehouse</h2>
            <p className="text-sm text-muted-foreground">Order quantity after filters</p>
          </div>
          <div className="mt-5 grid gap-3">
            {ordersPerWarehouse.length > 0 ? (
              ordersPerWarehouse.map((item) => (
                <div key={item.warehouse} className="rounded-xl border border-border/60 bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.warehouse}</p>
                    <p className="text-lg font-semibold">{item.count}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No warehouse demand matches the current filters.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top SKUs</h2>
            <p className="text-sm text-muted-foreground">Most demanded products in the current view</p>
          </div>
          <div className="mt-5 grid gap-3">
            {topSkus.length > 0 ? (
              topSkus.map((item) => (
                <div key={item.sku} className="rounded-xl border border-border/60 bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.sku}</p>
                    <p className="text-lg font-semibold">{item.quantity}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No SKU demand matches the current filters.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
