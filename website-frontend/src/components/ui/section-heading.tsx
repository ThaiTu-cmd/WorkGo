import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  level?: 1 | 2 | 3;
}

export function SectionHeading({
  title,
  subtitle,
  action,
  level = 2,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border mb-6",
        className
      )}
      {...props}
    >
      <div>
        {level === 1 ? (
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fg leading-tight">
            {title}
          </h1>
        ) : level === 2 ? (
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-fg leading-snug">
            {title}
          </h2>
        ) : (
          <h3 className="text-lg font-semibold text-fg leading-snug">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-fg-secondary mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
