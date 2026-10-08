import Link from "next/link";
import { Wallet, ShieldAlert, ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/format";

export interface WalletSummaryProps {
  availableBalance: number;
  escrowBalance: number;
  earnedBalance: number;
  onOpenDeposit: () => void;
  locale?: string;
}

export function WalletSummary({
  availableBalance,
  escrowBalance,
  earnedBalance,
  onOpenDeposit,
  locale = "vi",
}: WalletSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      {/* 1. Available Balance */}
      <Card glass className="border-primary/40 bg-gradient-to-br from-primary/15 via-surface to-surface shadow-xl shadow-primary/5 relative overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Số dư khả dụng
            </span>
            <div className="flex items-center justify-center shrink-0 p-2.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div className="font-mono text-2xl md:text-3xl font-black text-primary tabular-nums tracking-tight">
            {formatVND(availableBalance, locale)}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-primary/20">
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenDeposit}
              className="gap-1.5 flex-1 shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              <span>Nạp tiền</span>
            </Button>

            <Link href={`/${locale}/settings?tab=payout`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1.5 bg-surface/50">
                <ArrowUpRight className="h-4 w-4" />
                <span>Rút tiền</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 2. Escrow Balance */}
      <Card glass className="border-border/80 shadow-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-secondary">
              Đang giữ Escrow
            </span>
            <div className="flex items-center justify-center shrink-0 p-2.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>

          <div className="font-mono text-2xl md:text-3xl font-black text-fg tabular-nums tracking-tight">
            {formatVND(escrowBalance, locale)}
          </div>

          <p className="text-xs text-fg-secondary pt-2 border-t border-border">
            Tiền tạm giữ cho các đơn hàng đang triển khai
          </p>
        </CardContent>
      </Card>

      {/* 3. Earned Balance */}
      <Card glass className="border-border/80 shadow-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-secondary">
              Tổng thu nhập đã nhận
            </span>
            <div className="flex items-center justify-center shrink-0 p-2.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>

          <div className="font-mono text-2xl md:text-3xl font-black text-fg tabular-nums tracking-tight">
            {formatVND(earnedBalance, locale)}
          </div>

          <p className="text-xs text-fg-secondary pt-2 border-t border-border">
            Tổng giá trị đơn hàng đã nghiệm thu giải ngân
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
