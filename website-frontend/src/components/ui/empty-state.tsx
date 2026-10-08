import * as React from "react";
import { FolderSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-card border border-dashed border-border bg-surface/50 max-w-lg mx-auto my-6",
        className
      )}
      {...props}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface/80 backdrop-blur-xs border border-border/60 text-fg-tertiary shadow-xs mb-4">
        {icon || <FolderSearch className="h-8 w-8 stroke-1" />}
      </div>
      <h3 className="text-base font-semibold text-fg mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-fg-secondary max-w-sm mb-5">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
