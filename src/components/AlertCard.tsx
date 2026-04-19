import { useState } from "react";
import { AlertTriangle, Info, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertSeverity = "warning" | "destructive" | "info";

interface AlertCardProps {
  severity: AlertSeverity;
  title: string;
  description: string;
  onDismiss?: () => void;
}

const config = {
  warning: { icon: AlertTriangle, classes: "border-warning/40 bg-warning/10 text-warning-foreground", iconClass: "text-warning" },
  destructive: { icon: ShieldAlert, classes: "border-destructive/40 bg-destructive/10 text-destructive", iconClass: "text-destructive" },
  info: { icon: Info, classes: "border-info/40 bg-info/10 text-info", iconClass: "text-info" },
};

export const AlertCard = ({ severity, title, description, onDismiss }: AlertCardProps) => {
  const [visible, setVisible] = useState(true);
  const { icon: Icon, classes, iconClass } = config[severity];

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-4 shadow-sm animate-fade-in", classes)}>
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass)} />
      <div className="flex-1 space-y-0.5">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={dismiss}
        className="rounded-md p-1 text-muted-foreground transition-base hover:bg-background hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
