import { useEffect, useMemo, useState } from "react";
<<<<<<< HEAD
import { MapPin, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
=======
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
>>>>>>> 764b0188947957e32badcd05401a3e015ee89f4b
import { useApp } from "@/context/AppContext";
import api from "@/services/api";

interface Warehouse {
<<<<<<< HEAD
  _id?: string;
  id?: string;
=======
  id: string;
>>>>>>> 764b0188947957e32badcd05401a3e015ee89f4b
  name: string;
  location: string;
  capacity: number;
  currentLoad: number;
  status: string;
}

<<<<<<< HEAD
const STATUS_OPTIONS = ["Operational", "Near Capacity", "Maintenance"];

const emptyForm = { id: "", name: "", location: "", capacity: "", currentLoad: "", status: "Operational" };

const Warehouses = () => {
  const [items, setItems]       = useState<Warehouse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const { searchQuery, searchFilter } = useApp();

  const load = () => api.getWarehouses().then(setItems);
  useEffect(() => { load(); }, []);
=======
const Warehouses = () => {
  const [items, setItems] = useState<Warehouse[]>([]);
  const { searchQuery, searchFilter } = useApp();

  useEffect(() => {
    api.getWarehouses().then(setItems);
  }, []);
>>>>>>> 764b0188947957e32badcd05401a3e015ee89f4b

  const filtered = useMemo(() => {
    if (!searchQuery.trim() || searchFilter !== "warehouse") return items;
    const q = searchQuery.toLowerCase();
<<<<<<< HEAD
    return items.filter(w => w.name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q));
  }, [items, searchQuery, searchFilter]);

  const handleSubmit = async () => {
    setError("");
    if (!form.name || !form.location || !form.capacity) {
      setError("Name, location and capacity are required."); return;
    }
    setSaving(true);
    try {
      await api.addWarehouse({
        id:          form.id || undefined,
        name:        form.name,
        location:    form.location,
        capacity:    Number(form.capacity),
        currentLoad: Number(form.currentLoad) || 0,
        status:      form.status,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e.message || "Failed to add warehouse.");
    } finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Network"
        title="Warehouses"
        description="Network capacity and operational status."
        actions={
          <Button size="sm" onClick={() => { setShowForm(true); setError(""); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Warehouse
          </Button>
        }
      />

      {/* ── Add Warehouse Form ─────────────────────────────────────────── */}
      {showForm && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">New Warehouse</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="micro-label">Warehouse ID <span className="text-muted-foreground">(optional)</span></label>
              <Input placeholder="e.g. WH-07" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="micro-label">Name *</label>
              <Input placeholder="e.g. Pune Distribution Centre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="micro-label">Location *</label>
              <Input placeholder="e.g. Pune, IN" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="micro-label">Capacity (units) *</label>
              <Input type="number" placeholder="e.g. 10000" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="micro-label">Current Load (units)</label>
              <Input type="number" placeholder="e.g. 0" value={form.currentLoad} onChange={e => setForm(f => ({ ...f, currentLoad: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="micro-label">Status</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

          <div className="mt-5 flex gap-2">
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : "Add Warehouse"}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* ── Warehouse Cards ────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((w) => {
          const key = w._id || w.id || w.name;
          const pct = w.capacity ? Math.round((w.currentLoad / w.capacity) * 100) : 0;
          return (
            <div key={key} className="rounded-xl border border-border bg-card p-5 transition-base hover:border-foreground/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{w.id || w._id}</p>
                  <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">{w.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" strokeWidth={1.5} />{w.location}
=======
    return items.filter((w) => w.name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q));
  }, [items, searchQuery, searchFilter]);

  return (
    <div className="animate-fade-in">
      <PageHeader eyebrow="Network" title="Warehouses" description="Network capacity and operational status." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((w) => {
          const pct = Math.round((w.currentLoad / w.capacity) * 100);
          return (
            <div
              key={w.id}
              className="rounded-xl border border-border bg-card p-5 transition-base hover:border-foreground/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{w.id}</p>
                  <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">{w.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" strokeWidth={1.5} />
                    {w.location}
>>>>>>> 764b0188947957e32badcd05401a3e015ee89f4b
                  </p>
                </div>
                <StatusBadge status={w.status} />
              </div>
<<<<<<< HEAD
=======

>>>>>>> 764b0188947957e32badcd05401a3e015ee89f4b
              <div className="mt-6 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="micro-label">Load</span>
                  <span className="text-sm font-medium tabular-nums text-foreground">{pct}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
<<<<<<< HEAD
                  <div className="h-full bg-foreground transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {(w.currentLoad || 0).toLocaleString()} / {(w.capacity || 0).toLocaleString()} units
=======
                  <div
                    className="h-full bg-foreground transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {w.currentLoad.toLocaleString()} / {w.capacity.toLocaleString()} units
>>>>>>> 764b0188947957e32badcd05401a3e015ee89f4b
                </p>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
<<<<<<< HEAD
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No warehouses found.</p>
=======
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No warehouses match your search.</p>
>>>>>>> 764b0188947957e32badcd05401a3e015ee89f4b
        )}
      </div>
    </div>
  );
};

export default Warehouses;
