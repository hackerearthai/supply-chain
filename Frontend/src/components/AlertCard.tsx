import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertSeverity = "warning" | "destructive" | "info";

interface AlertCardProps {
  severity: AlertSeverity;
  title: string;
  description: string;
  onDismiss?: () => void;
}

const dotClass: Record<AlertSeverity, string> = {
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-foreground",
};

export const AlertCard = ({ severity, title, description, onDismiss }: AlertCardProps) => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-base hover:border-foreground/20">
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotClass[severity])} />
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={dismiss}
        className="rounded-md p-1 text-muted-foreground opacity-0 transition-base hover:text-foreground group-hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
