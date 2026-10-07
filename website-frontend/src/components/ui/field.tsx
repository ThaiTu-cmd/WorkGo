import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
}

export function Field({
  id,
  label,
  required,
  error,
  description,
  className,
  children,
  ...props
}: FieldProps) {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const errorId = `${fieldId}-error`;
  const descId = `${fieldId}-desc`;

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)} {...props}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <div className="w-full">
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<{ id?: string; error?: boolean; "aria-describedby"?: string }>, {
              id: fieldId,
              error: Boolean(error),
              "aria-describedby": error
                ? errorId
                : description
                ? descId
                : undefined,
            })
          : children}
      </div>
      {description && !error && (
        <p id={descId} className="text-xs text-fg-secondary">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger font-medium flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
