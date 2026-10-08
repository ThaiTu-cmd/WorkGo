import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
}

export function ErrorState({
  title = "Đã xảy ra lỗi kết nối",
  description = "Không thể tải dữ liệu vào lúc này. Vui lòng kiểm tra đường truyền và thử lại.",
  onRetry,
  retryText = "Thử lại",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-card border border-red-200 bg-red-50/40 max-w-lg mx-auto my-6",
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-danger mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-fg mb-1">{title}</h3>
      <p className="text-sm text-fg-secondary max-w-sm mb-5">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>{retryText}</span>
        </Button>
      )}
    </div>
  );
}
