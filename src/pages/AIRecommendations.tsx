import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Route, Tag, Building2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
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
        title="AI Recommendations"
        description="Model-suggested actions to optimize your supply chain (placeholder — connect a real model)."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {recs.map((r) => {
          const Icon = typeIcons[r.type] ?? Sparkles;
          return (
            <Card key={r.id} className="gradient-surface p-5 shadow-elegant transition-base hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-accent text-accent-foreground shadow-glow">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">{r.type}</span>
                    <span className="text-xs text-muted-foreground">Confidence {Math.round(r.confidence * 100)}%</span>
                  </div>
                  <h3 className="mt-2 font-semibold text-foreground">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{r.impact}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm">Apply</Button>
                    <Button size="sm" variant="outline">Dismiss</Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        💡 Hook into a real model via <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">api.getAIRecommendations()</code>.
      </div>
    </div>
  );
};

export default AIRecommendations;
