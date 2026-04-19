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
      <PageHeader title="Dashboard" description="Real-time pulse of your supply chain operations." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Total Orders" value={kpis?.totalOrders.toLocaleString() ?? "—"} icon={ShoppingCart} accent="primary" trend={{ value: "+4.2% vs last week", positive: true }} />
        <KPICard label="Orders Today" value={kpis?.ordersToday ?? "—"} icon={Package} accent="accent" trend={{ value: "+12 vs yesterday", positive: true }} />
        <KPICard label="Total Warehouses" value={kpis?.totalWarehouses ?? "—"} icon={Warehouse} accent="success" />
        <KPICard label="Pending Shipments" value={kpis?.pendingShipments ?? "—"} icon={Truck} accent="warning" trend={{ value: "2 delayed", positive: false }} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Active alerts</h2>
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
