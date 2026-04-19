import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
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
      <PageHeader title="Warehouses" description="Network capacity and operational status." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((w) => {
          const pct = Math.round((w.currentLoad / w.capacity) * 100);
          return (
            <Card key={w.id} className="gradient-surface p-5 shadow-elegant transition-base hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono font-semibold text-primary">{w.id}</p>
                  <h3 className="mt-0.5 font-semibold text-foreground">{w.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {w.location}
                  </p>
                </div>
                <StatusBadge status={w.status} />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Load</span>
                  <span className="font-semibold tabular-nums">
                    {w.currentLoad.toLocaleString()} / {w.capacity.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-muted-foreground">No warehouses match your search.</p>
        )}
      </div>
    </div>
  );
};

export default Warehouses;
