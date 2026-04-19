import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import api from "@/services/api";

const DemandForecast = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    api.getDemandForecast().then(setData);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Analytics"
        title="Demand Forecast"
        description="Predicted demand vs. historical actuals."
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <p className="micro-label mb-2">Order Volume · 8M</p>
            <h3 className="text-2xl font-semibold tracking-tight">Demand trajectory</h3>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            Mock data
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="actual" stroke="hsl(var(--foreground))" strokeWidth={2} fill="url(#actualFill)" name="Actual" />
              <Area type="monotone" dataKey="forecast" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" fill="transparent" name="Forecast" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 flex gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            <span className="text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-4 bg-muted-foreground" />
            <span className="text-muted-foreground">Forecast</span>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Replace <code className="rounded bg-muted px-1.5 py-0.5 font-mono">api.getDemandForecast()</code> with a real ML endpoint.
      </div>
    </div>
  );
};

export default DemandForecast;
