"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ShieldCheck, ArrowUpRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatVND } from "@/lib/format";

export interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    slug: string;
    category_id: string;
    execution_type: "DIGITAL" | "ONSITE" | "DELIVERY" | "APPOINTMENT";
    base_price: number;
    currency: "VND";
    avg_rating: number;
    review_count: number;
    cover_url?: string;
    provider: {
      full_name: string;
      avatar_url?: string;
      verification_status: string;
    };
  };
  locale?: "vi" | "en";
  onPress?: (id: string) => void;
}

const EXECUTION_VARIANTS: Record<
  ServiceCardProps["service"]["execution_type"],
  "execDigital" | "execOnsite" | "execDelivery" | "execAppointment"
> = {
  DIGITAL: "execDigital",
  ONSITE: "execOnsite",
  DELIVERY: "execDelivery",
  APPOINTMENT: "execAppointment",
};

const EXECUTION_LABELS: Record<
  ServiceCardProps["service"]["execution_type"],
  string
> = {
  DIGITAL: "Trực tuyến",
  ONSITE: "Tại chỗ",
  DELIVERY: "Giao nhận",
  APPOINTMENT: "Lịch hẹn",
};

/**
 * ServiceCard: Gig-style service presentation card ready for future Service API.
 * Currently backend does not have /services API (BLOCKED for live routes), but this
 * contract component matches the required data shape and design system.
 */
export function ServiceCard({
  service,
  locale = "vi",
  onPress,
}: ServiceCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onPress) {
      e.preventDefault();
      onPress(service.id);
    }
  };

  const badgeVariant = EXECUTION_VARIANTS[service.execution_type] || "execDigital";
  const badgeLabel = EXECUTION_LABELS[service.execution_type] || service.execution_type;

  return (
    <Link
      href={`/${locale}/services/${service.id}`}
      onClick={handleClick}
      className="block h-full group"
    >
      <Card
        hoverable
        glass
        className="h-full flex flex-col justify-between overflow-hidden border-border/80 hover:border-primary/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 rounded-card"
      >
        {/* Cover 16:10 Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-muted border-b border-border/60 flex items-center justify-center">
          {service.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={service.cover_url}
              alt={service.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 text-fg-tertiary p-4">
              <Sparkles className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors" />
            </div>
          )}

          <div className="absolute left-3 top-3 z-10">
            <Badge variant={badgeVariant} className="text-[11px] font-semibold shadow-xs">
              {badgeLabel}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Avatar
                name={service.provider.full_name}
                src={service.provider.avatar_url || undefined}
                size="xs"
              />
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-xs font-semibold text-fg truncate">
                  {service.provider.full_name}
                </span>
                {service.provider.verification_status === "VERIFIED" && (
                  <ShieldCheck className="h-3.5 w-3.5 text-[#00732E] shrink-0" />
                )}
              </div>
            </div>

            <h3 className="font-semibold text-sm text-fg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {service.title}
            </h3>
          </div>

          <div>
            <div className="flex items-center gap-1 text-xs text-fg-tertiary pt-2 border-t border-border/70 mb-2">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-fg">{service.avg_rating.toFixed(1)}</span>
              <span>({service.review_count})</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[11px] text-fg-tertiary block leading-none mb-1">
                  Khởi điểm từ
                </span>
                <span className="text-sm font-bold font-mono text-primary">
                  Từ {formatVND(service.base_price, locale)}
                </span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-subtle text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default ServiceCard;
