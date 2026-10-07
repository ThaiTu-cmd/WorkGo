import { ArrowDownLeft, ArrowUpRight, ShieldCheck, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDate } from "@/lib/format";

export interface TransactionItem {
  id: string;
  date: string;
  type: "DEPOSIT" | "PAYOUT" | "ORDER_PAYMENT" | "ORDER_RELEASE" | "REFUND";
  amount: number;
  balanceAfter: number;
  reference: string;
  description: string;
}

const TYPE_CONFIG = {
  DEPOSIT: {
    label: "Nạp tiền",
    badge: "success" as const,
    icon: ArrowDownLeft,
  },
  PAYOUT: {
    label: "Rút tiền",
    badge: "outline" as const,
    icon: ArrowUpRight,
  },
  ORDER_PAYMENT: {
    label: "Thanh toán đơn",
    badge: "warning" as const,
    icon: ShieldCheck,
  },
  ORDER_RELEASE: {
    label: "Nhận tiền đơn",
    badge: "primary" as const,
    icon: ArrowDownLeft,
  },
  REFUND: {
    label: "Hoàn tiền",
    badge: "info" as const,
    icon: RefreshCw,
  },
};

export function TransactionRow({
  tx,
  locale = "vi",
}: {
  tx: TransactionItem;
  locale?: string;
}) {
  const config = TYPE_CONFIG[tx.type] || {
    label: tx.type,
    badge: "secondary" as const,
    icon: ArrowDownLeft,
  };
  const Icon = config.icon;
  const isPositive = tx.amount > 0;

  return (
    <tr className="hover:bg-muted/50 transition-colors text-sm">
      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-fg-secondary">
        {formatDate(tx.date, locale)}
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap">
        <Badge variant={config.badge} className="gap-1 text-xs">
          <Icon className="h-3 w-3" />
          <span>{config.label}</span>
        </Badge>
      </td>

      <td className="py-3.5 px-4">
        <p className="text-xs text-fg font-medium line-clamp-1">{tx.description}</p>
        <span className="font-mono text-[11px] text-fg-tertiary">{tx.reference}</span>
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-semibold">
        <span className={isPositive ? "text-success" : "text-danger"}>
          {isPositive ? `+${formatVND(tx.amount, locale)}` : formatVND(tx.amount, locale)}
        </span>
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono text-xs text-fg-secondary">
        {formatVND(tx.balanceAfter, locale)}
      </td>
    </tr>
  );
}
