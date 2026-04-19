import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import api from "@/services/api";

const DemandForecast = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    api.getDemandForecast().then(setData);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Demand Forecast" description="Predicted demand vs. historical actuals (placeholder — wire to ML API)." />

      <Card className="p-6 shadow-elegant">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h3 className="text-lg font-semibold">8-Month Demand Trajectory</h3>
            <p className="text-sm text-muted-foreground">Units forecasted based on historical seasonality.</p>
          </div>
          <span className="rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">Mock data</span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} name="Actual" />
              <Line type="monotone" dataKey="forecast" stroke="hsl(var(--accent))" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4 }} name="Forecast" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        💡 Replace <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">api.getDemandForecast()</code> with a real ML endpoint to power this chart.
      </div>
    </div>
  );
};

export default DemandForecast;
