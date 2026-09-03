import { ArchiveX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="paper-surface relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gold/50 px-6 py-14 text-center">
      <div className="absolute -top-10 -end-10 h-32 w-32 rounded-full border border-gold/20" />
      <div className="absolute -bottom-14 -start-12 h-40 w-40 rounded-full border border-primary/10" />
      <div className="relative mb-5 grid h-20 w-20 place-items-center rounded-2xl border border-gold/35 bg-ivory text-primary shadow-[0_12px_30px_rgba(15,76,69,.10)]">
        {icon || <ArchiveX className="h-9 w-9" strokeWidth={1.5} />}
      </div>
      <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
