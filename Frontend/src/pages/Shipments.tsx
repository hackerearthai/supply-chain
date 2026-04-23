import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import api from "@/services/api";

interface Shipment {
  orderId: string;
  from: string;
  to: string;
  status: string;
  eta: string;
}

const Shipments = () => {
  const [items, setItems] = useState<Shipment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { searchQuery, searchFilter } = useApp();

  useEffect(() => {
    api.getShipments().then(setItems);
  }, []);

  const filtered = useMemo(() => {
    if (!items || items.length === 0) return [];
    let data = items;
    if (statusFilter !== "all") data = data.filter((s) => s.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((s) => {
        if (searchFilter === "orderId") return s.orderId?.toLowerCase().includes(q) || false;
        if (searchFilter === "warehouse") return (s.from?.toLowerCase().includes(q) || false) || (s.to?.toLowerCase().includes(q) || false);
        return true;
      });
    }
    return data;
  }, [items, statusFilter, searchQuery, searchFilter]);

  const columns: Column<Shipment>[] = [
    { key: "orderId", header: "Order ID", render: (r) => <span className="font-mono text-xs font-medium text-foreground">{r.orderId}</span> },
    {
      key: "route",
      header: "Route",
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{r.from}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-muted-foreground">{r.to}</span>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "eta", header: "ETA", render: (r) => <span className="tabular-nums text-muted-foreground">{r.eta}</span> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Logistics"
        title="Shipments"
        description="Track in-transit and delivered orders across the network."
        actions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="In Transit">In Transit</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="mb-4 flex items-baseline justify-between">
        <p className="micro-label">All Shipments</p>
        <span className="text-xs text-muted-foreground">{filtered.length} of {items.length}</span>
      </div>
      <DataTable columns={columns} data={filtered} rowKey={(r) => r.orderId} />
    </div>
  );
};

export default Shipments;
