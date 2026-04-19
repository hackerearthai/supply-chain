interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}

export const PageHeader = ({ title, description, actions, eyebrow = "Overview" }: PageHeaderProps) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="micro-label mb-2">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
