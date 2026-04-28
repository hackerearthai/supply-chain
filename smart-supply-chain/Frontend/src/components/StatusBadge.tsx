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

const dotClasses: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-foreground",
  muted: "bg-muted-foreground",
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
        "inline-flex items-center gap-2 text-xs font-medium text-foreground",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[tone])} />
      {status}
    </span>
  );
};
