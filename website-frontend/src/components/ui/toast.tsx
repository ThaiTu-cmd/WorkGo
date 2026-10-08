"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    ({ duration = 4000, ...item }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { ...item, id, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div
        className="fixed z-[100] flex flex-col gap-2 pointer-events-none p-4 bottom-0 right-0 w-full sm:max-w-md max-h-screen overflow-hidden"
        aria-live="polite"
        role="region"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastCard({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-danger shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning shrink-0" />,
    info: <Info className="h-5 w-5 text-info shrink-0" />,
  };

  const borderColors = {
    success: "border-green-200 bg-surface",
    error: "border-red-200 bg-surface",
    warning: "border-amber-200 bg-surface",
    info: "border-sky-200 bg-surface",
  };

  const progressBg = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 rounded-card border shadow-lg backdrop-blur-md bg-surface/90 transition-all duration-200 animate-in slide-in-from-bottom-5",
        borderColors[item.type]
      )}
      role="alert"
    >
      {icons[item.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-fg leading-5">{item.title}</h4>
        {item.description && (
          <p className="text-xs text-fg-secondary mt-0.5 leading-4">{item.description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-fg-tertiary hover:text-fg rounded-control p-1 transition-colors cursor-pointer"
        aria-label="Đóng thông báo"
      >
        <X className="h-4 w-4" />
      </button>

      {item.duration && item.duration > 0 ? (
        <div
          className={cn("absolute bottom-0 left-0 h-1", progressBg[item.type])}
          style={{
            animation: `toastCountdown ${item.duration}ms linear forwards`,
            width: "100%",
          }}
        />
      ) : null}
    </div>
  );
}
