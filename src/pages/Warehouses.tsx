import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import api from "@/services/api";

interface Warehouse {
  _id: string;
  warehouse_name: string;
  location: string;
  pincode: string;
  capacity: number;
}

const Warehouses = () => {
  const [items, setItems] = useState<Warehouse[]>([]);
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [warehousePincode, setWarehousePincode] = useState("");
  const [warehouseCapacity, setWarehouseCapacity] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { searchQuery, searchFilter } = useApp();

  const loadWarehouses = async () => {
    try {
      const data = await api.getWarehouses();
      setItems(data ?? []);
    } catch (err: any) {
      setError(err?.message || "Unable to load warehouses.");
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await api.addWarehouse({
        warehouse_name: warehouseName,
        location: warehouseLocation,
        pincode: warehousePincode,
        capacity: warehouseCapacity,
      });
      setMessage("Warehouse added successfully.");
      setWarehouseName("");
      setWarehouseLocation("");
      setWarehousePincode("");
      setWarehouseCapacity(0);
      await loadWarehouses();
    } catch (err: any) {
      setError(err?.message || "Failed to add warehouse.");
    }
  };

  const handleDelete = async (id: string, warehouseName: string) => {
    const confirmed = window.confirm(`Delete warehouse "${warehouseName}"?`);
    if (!confirmed) return;

    try {
      setError(null);
      setMessage(null);
      await api.deleteWarehouse(id);
      setMessage(`Warehouse "${warehouseName}" removed.`);
      await loadWarehouses();
    } catch (err: any) {
      setError(err?.message || "Failed to delete warehouse.");
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim() || searchFilter !== "warehouse") return items;
    const q = searchQuery.toLowerCase();
    return items.filter((w) =>
      w.warehouse_name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q),
    );
  }, [items, searchQuery, searchFilter]);

  return (
    <div className="animate-fade-in">
      <PageHeader eyebrow="Network" title="Warehouses" description="Manage warehouse definitions and view open inventory capacity." />

      <div className="grid gap-4 xl:grid-cols-[424px_1fr]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Add Warehouse</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create a named warehouse and preserve location-driven order validation.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Name</label>
              <Input value={warehouseName} onChange={(event) => setWarehouseName(event.target.value)} placeholder="Mumbai Central DC" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Location</label>
              <Input value={warehouseLocation} onChange={(event) => setWarehouseLocation(event.target.value)} placeholder="Mumbai" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Pincode</label>
              <Input value={warehousePincode} onChange={(event) => setWarehousePincode(event.target.value)} placeholder="560001" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Capacity</label>
              <Input
                type="number"
                min={1}
                value={warehouseCapacity}
                onChange={(event) => setWarehouseCapacity(Number(event.target.value))}
                placeholder="12000"
              />
            </div>
            <Button type="submit">Create warehouse</Button>
            {message && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">{message}</div>}
            {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</div>}
          </form>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Warehouse list</h2>
              <p className="text-sm text-muted-foreground">Existing warehouses are required for all order submissions.</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{items.length} warehouses</span>
          </div>

          <div className="mt-6 grid gap-4">
            {filtered.length > 0 ? (
              filtered.map((warehouse) => (
                <div key={warehouse._id || warehouse.warehouse_name} className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{warehouse.warehouse_name}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" strokeWidth={1.5} />
                        {warehouse.location} - {warehouse.pincode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="Operational" />
                      <Button variant="outline" size="sm" onClick={() => handleDelete(warehouse._id, warehouse.warehouse_name)}>
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <span>Capacity</span>
                    <span>{warehouse.capacity.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-border/60 bg-background p-6 text-center text-sm text-muted-foreground">No warehouses available.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Warehouses;
