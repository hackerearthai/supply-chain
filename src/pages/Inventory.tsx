import { useEffect, useMemo, useState } from "react";
import { Package, AlertTriangle, XCircle, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { KPICard } from "@/components/KPICard";
import { AlertCard } from "@/components/AlertCard";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import api from "@/services/api";

interface InventoryItem {
  sku: string;
  name: string;
  warehouse: string;
  quantity: number;
  reorderLevel: number;
  status: string;
}

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const { searchQuery, searchFilter } = useApp();

  useEffect(() => {
    api.getInventory().then(setItems);
    api.getInventoryAlerts().then(setAlerts);
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((i) => {
      if (searchFilter === "sku") return i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
      if (searchFilter === "warehouse") return i.warehouse.toLowerCase().includes(q);
      return true;
    });
  }, [items, searchQuery, searchFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    low: items.filter((i) => i.status === "Low Stock").length,
    out: items.filter((i) => i.status === "Out of Stock").length,
    value: items.reduce((sum, i) => sum + i.quantity * 45, 0),
  }), [items]);

  const columns: Column<InventoryItem>[] = [
    { key: "sku", header: "SKU Code", render: (r) => <span className="font-mono text-xs font-semibold text-primary">{r.sku}</span> },
    { key: "name", header: "Product Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "warehouse", header: "Warehouse" },
    { key: "quantity", header: "Quantity", className: "text-right", render: (r) => <span className="tabular-nums">{r.quantity}</span> },
    { key: "reorderLevel", header: "Reorder Level", className: "text-right", render: (r) => <span className="tabular-nums text-muted-foreground">{r.reorderLevel}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Inventory" description="Stock levels across all warehouses." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Total SKUs" value={stats.total} icon={Package} accent="primary" />
        <KPICard label="Low Stock Items" value={stats.low} icon={AlertTriangle} accent="warning" />
        <KPICard label="Out of Stock" value={stats.out} icon={XCircle} accent="warning" />
        <KPICard label="Stock Value" value={`$${(stats.value / 1000).toFixed(1)}K`} icon={DollarSign} accent="success" />
      </div>

      <section className="my-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Stock alerts</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {alerts.map((a) => (
            <AlertCard key={a.id} severity={a.severity} title={a.title} description={a.description} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">All items</h2>
          <span className="text-sm text-muted-foreground">{filtered.length} of {items.length}</span>
        </div>
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.sku} />
      </section>
    </div>
  );
};

export default Inventory;
