import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Route, Tag, Building2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

const typeIcons: Record<string, any> = {
  Restock: TrendingUp,
  Reroute: Route,
  Pricing: Tag,
  Capacity: Building2,
};

const AIRecommendations = () => {
  const [recs, setRecs] = useState<any[]>([]);

  useEffect(() => {
    api.getAIRecommendations().then(setRecs);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Intelligence"
        title="AI Recommendations"
        description="Model-suggested actions to optimize your supply chain."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {recs.map((r) => {
          const Icon = typeIcons[r.type] ?? Sparkles;
          return (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-card p-5 transition-base hover:border-foreground/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                  <Icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{r.type}</span>
                    <span className="text-[11px] text-muted-foreground">· {Math.round(r.confidence * 100)}% confidence</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold tracking-tight text-foreground">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{r.impact}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm">Apply</Button>
                    <Button size="sm" variant="ghost">Dismiss</Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Hook into a real model via <code className="rounded bg-muted px-1.5 py-0.5 font-mono">api.getAIRecommendations()</code>
      </div>
    </div>
  );
};

export default AIRecommendations;
