import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import api from "@/services/api";

interface Order {
  _id?: string;
  user: string;
  order_id: string;
  sku: string;
  quantity: number;
  payment: number;
  warehouse: string;
  location: string;
  status?: string;
  createdAt?: string;
}

const Orders = () => {
  const [items, setItems]       = useState<Order[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage]   = useState("");
  const fileRef                 = useRef<HTMLInputElement>(null);
  const { searchQuery, searchFilter } = useApp();

  const load = () => api.getOrders().then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(o =>
      (o.order_id  || "").toLowerCase().includes(q) ||
      (o.sku       || "").toLowerCase().includes(q) ||
      (o.user      || "").toLowerCase().includes(q) ||
      (o.warehouse || "").toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const result = await api.uploadOrdersCSV(file);
      if (result.success) {
        setMessage(`✓ Imported ${result.inserted} orders.`);
        load();
      } else {
        setMessage(result.error || "Upload failed.");
      }
    } catch (e: any) {
      setMessage(e.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const columns: Column<Order>[] = [
    { key: "order_id",  header: "Order ID",  render: r => <span className="font-mono text-xs font-medium">{r.order_id}</span> },
    { key: "user",      header: "User",      render: r => <span>{r.user}</span> },
    { key: "sku",       header: "SKU",       render: r => <span className="font-mono text-xs">{r.sku}</span> },
    { key: "quantity",  header: "Qty",       className: "text-right", render: r => <span className="tabular-nums">{r.quantity}</span> },
    { key: "payment",   header: "Payment",   className: "text-right", render: r => <span className="tabular-nums">${Number(r.payment).toFixed(2)}</span> },
    { key: "warehouse", header: "Warehouse", render: r => <span className="text-muted-foreground">{r.warehouse}</span> },
    { key: "location",  header: "Location",  render: r => <span className="text-muted-foreground">{r.location}</span> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Operations"
        title="Orders"
        description="All orders imported from CSV."
        actions={
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-muted-foreground">{message}</span>}
            <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" />
              {uploading ? "Uploading…" : "Upload CSV"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        }
      />

      {items.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border p-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" strokeWidth={1} />
          <div>
            <p className="font-medium text-foreground">No orders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a CSV with columns: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">user, order_id, sku, quantity, payment, warehouse, location</code>
            </p>
          </div>
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1.5 h-4 w-4" /> Upload CSV
          </Button>
        </div>
      ) : (
        <section className="mt-6">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="micro-label">All Orders</p>
            <span className="text-xs text-muted-foreground">{filtered.length} of {items.length}</span>
          </div>
          <DataTable columns={columns} data={filtered} rowKey={r => r._id || r.order_id} />
        </section>
      )}
    </div>
  );
};

export default Orders;
