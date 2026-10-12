"use client";

import * as React from "react";
import { Check, Info, DollarSign, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ServiceFormStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

const STEPS = [
  { step: 1, label: "Thông tin cơ bản", icon: Info },
  { step: 2, label: "Bảng giá & Ngân sách", icon: DollarSign },
  { step: 3, label: "Tệp đính kèm & Xác nhận", icon: ImageIcon },
];

export function ServiceFormStepper({
  currentStep,
  onStepClick,
  className,
}: ServiceFormStepperProps) {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className={cn("w-full mb-8", className)}>
      {/* Progress Bar background */}
      <div className="relative mb-4">
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Pills / Icons */}
      <div className="flex items-center justify-between">
        {STEPS.map((s) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const isAccessible = s.step <= currentStep;
          const Icon = s.icon;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isAccessible}
              onClick={() => onStepClick && isAccessible && onStepClick(s.step)}
              className={cn(
                "flex items-center gap-2.5 text-left transition-all duration-200 select-none",
                isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                  isCompleted
                    ? "bg-primary text-white shadow-xs"
                    : isCurrent
                    ? "bg-primary text-white ring-4 ring-primary/20 shadow-sm"
                    : "bg-surface border border-border text-fg-tertiary"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>

              <div className="hidden sm:block">
                <span
                  className={cn(
                    "text-[11px] block uppercase tracking-wider font-semibold",
                    isCurrent ? "text-primary" : "text-fg-tertiary"
                  )}
                >
                  Bước {s.step}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium block leading-tight",
                    isCurrent ? "text-fg font-semibold" : "text-fg-secondary"
                  )}
                >
                  {s.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ServiceFormStepper;
