import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium h-6 select-none transition-all duration-150",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary border border-primary/30 shadow-xs",
        primary: "bg-gradient-to-r from-primary/20 to-[#38BDF8]/20 text-primary border border-primary/35 shadow-xs font-semibold",
        secondary: "bg-muted/80 text-fg-secondary border border-border",
        success: "bg-success/15 text-success border border-success/30 shadow-xs",
        warning: "bg-warning/15 text-warning border border-warning/30 shadow-xs",
        danger: "bg-danger/15 text-danger border border-danger/30 shadow-xs",
        info: "bg-info/15 text-info border border-info/30 shadow-xs",
        outline: "border border-border text-fg-secondary bg-surface/60 backdrop-blur-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        "inline-flex items-center justify-center leading-none select-none",
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0 inline-flex items-center justify-center">{icon}</span>}
      <span className="inline-flex items-center gap-1.5 leading-none">{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };
