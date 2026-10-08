import * as React from "react";
import { Badge, type BadgeProps } from "./badge";
import { cn } from "@/lib/utils";

export type StatusType =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "CLOSED"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "DISPUTED"
  | "RESOLVED"
  | "SUCCESS"
  | "FAILED"
  | "ACTIVE"
  | "SUSPENDED"
  | "CLIENT"
  | "PROVIDER"
  | "ADMIN"
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
  variant?: "success" | "warning" | "danger" | "info" | "secondary" | "default";
}

/**
 * StatusBadge: Unified status indicator for tables, order timelines, and entity cards.
 * Automatically maps standard business status codes to semantic tokens.
 */
export function StatusBadge({
  status,
  label,
  className,
  variant: explicitVariant,
}: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase();

  let resolvedVariant: NonNullable<BadgeProps["variant"]> = "secondary";
  const displayLabel = label || status;

  if (explicitVariant) {
    resolvedVariant = explicitVariant;
  } else {
    switch (normalized) {
      case "COMPLETED":
      case "ACCEPTED":
      case "RESOLVED":
      case "SUCCESS":
      case "ACTIVE":
        resolvedVariant = "success";
        break;
      case "IN_PROGRESS":
      case "PENDING":
        resolvedVariant = "warning";
        break;
      case "CANCELLED":
      case "REJECTED":
      case "FAILED":
      case "SUSPENDED":
      case "DISPUTED":
        resolvedVariant = "danger";
        break;
      case "OPEN":
      case "CLIENT":
      case "PROVIDER":
      case "ADMIN":
        resolvedVariant = "info";
        break;
      default:
        resolvedVariant = "secondary";
        break;
    }
  }

  return (
    <Badge variant={resolvedVariant} className={cn("font-medium", className)}>
      {displayLabel}
    </Badge>
  );
}

export default StatusBadge;
