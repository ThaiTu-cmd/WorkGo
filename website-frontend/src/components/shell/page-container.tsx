import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "narrow" | "wide";
}

export function PageContainer({
  className,
  size = "default",
  children,
  ...props
}: PageContainerProps) {
  const maxW = {
    narrow: "max-w-4xl",
    default: "max-w-7xl", // 1280px
    wide: "max-w-[1440px]",
  };

  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8",
        maxW[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
