import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "destructive" | "info" | "muted";

const toneMap: Record<string, Tone> = {
  // Shipments
  "Delivered": "success",
  "In Transit": "info",
  "Delayed": "destructive",
  // Inventory
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "destructive",
  // Warehouses
  "Operational": "success",
  "Near Capacity": "warning",
  "Maintenance": "muted",
};

const toneClasses: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-info/15 text-info border-info/30",
  muted: "bg-muted text-muted-foreground border-border",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const tone = toneMap[status] ?? "muted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", {
        "bg-success": tone === "success",
        "bg-warning": tone === "warning",
        "bg-destructive": tone === "destructive",
        "bg-info": tone === "info",
        "bg-muted-foreground": tone === "muted",
      })} />
      {status}
    </span>
  );
};
