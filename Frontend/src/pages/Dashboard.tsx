import { useEffect, useState } from "react";
import { Package, ShoppingCart, Warehouse, Truck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { KPICard } from "@/components/KPICard";
import { AlertCard } from "@/components/AlertCard";
import api from "@/services/api";

const Dashboard = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    api.getDashboardKPIs().then(setKpis);
    api.getDashboardAlerts().then(setAlerts);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Real-time supply chain operations snapshot."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Live
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Total Orders" value={kpis?.totalOrders.toLocaleString() ?? "—"} icon={ShoppingCart} trend={{ value: "+4.2% vs last week", positive: true }} />
        <KPICard label="Orders Today" value={kpis?.ordersToday ?? "—"} icon={Package} trend={{ value: "Last sync 1 min ago", positive: true }} />
        <KPICard label="Total Warehouses" value={kpis?.totalWarehouses ?? "—"} icon={Warehouse} trend={{ value: "All regions", positive: true }} />
        <KPICard label="Pending Shipments" value={kpis?.pendingShipments ?? "—"} icon={Truck} trend={{ value: "In transit + delayed", positive: false }} />
      </div>

      <section className="mt-12">
        <p className="micro-label mb-4">Active Alerts</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {alerts.map((a) => (
            <AlertCard key={a.id} severity={a.severity} title={a.title} description={a.description} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
