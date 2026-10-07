import { CheckCircle2, Star, Award, Calendar } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDateOnly } from "@/lib/format";
import type { ProviderProfileResponse } from "@/lib/adapters/identity";

export function ProviderHeader({
  provider,
  locale = "vi",
}: {
  provider: ProviderProfileResponse;
  locale?: string;
}) {
  const isVerified = provider.verificationStatus === "VERIFIED";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 rounded-card bg-surface border border-border shadow-xs mb-8">
      <Avatar
        name={provider.businessName}
        size="lg"
        className="h-20 w-20 text-2xl border-2 border-primary/20 shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-fg leading-tight truncate">
            {provider.businessName}
          </h1>

          <Badge variant={provider.providerType === "COMPANY" ? "info" : "secondary"}>
            {provider.providerType === "COMPANY" ? "Doanh nghiệp" : "Cá nhân"}
          </Badge>

          {isVerified && (
            <Badge variant="success" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
              Đã xác thực
            </Badge>
          )}

          <Badge variant={provider.isAcceptingOrders ? "primary" : "outline"}>
            {provider.isAcceptingOrders ? "Đang nhận việc" : "Tạm dừng nhận việc"}
          </Badge>
        </div>

        <div className="flex items-center gap-6 flex-wrap text-sm text-fg-secondary mt-3">
          <div className="flex items-center gap-1.5 font-medium text-fg">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>{provider.ratingAvg.toFixed(1)}</span>
            <span className="text-xs text-fg-tertiary">({provider.ratingCount} đánh giá)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-primary" />
            <span>Đã hoàn thành <strong>{provider.completedOrderCount}</strong> đơn</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-fg-tertiary">
            <Calendar className="h-3.5 w-3.5" />
            <span>Thành viên từ {formatDateOnly(provider.joinedAt, locale)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
