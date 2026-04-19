import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import api from "@/services/api";

interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentLoad: number;
  status: string;
}

const Warehouses = () => {
  const [items, setItems] = useState<Warehouse[]>([]);
  const { searchQuery, searchFilter } = useApp();

  useEffect(() => {
    api.getWarehouses().then(setItems);
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim() || searchFilter !== "warehouse") return items;
    const q = searchQuery.toLowerCase();
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
                  </p>
                </div>
                <StatusBadge status={w.status} />
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="micro-label">Load</span>
                  <span className="text-sm font-medium tabular-nums text-foreground">{pct}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-foreground transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {w.currentLoad.toLocaleString()} / {w.capacity.toLocaleString()} units
                </p>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No warehouses match your search.</p>
        )}
      </div>
    </div>
  );
};

export default Warehouses;
