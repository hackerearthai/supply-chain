import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive?: boolean };
  accent?: "primary" | "accent" | "warning" | "success";
}

export const KPICard = ({ label, value, icon: Icon, trend }: KPICardProps) => {
  return (
    <Card className="rounded-xl border border-border bg-card p-5 shadow-none transition-base hover:border-foreground/20">
      <div className="flex items-start justify-between gap-4">
        <p className="micro-label">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">{value}</p>
      {trend && (
        <p
          className={cn(
            "mt-2 text-xs",
            trend.positive ? "text-muted-foreground" : "text-destructive",
          )}
        >
          {trend.value}
        </p>
      )}
    </Card>
  );
};
