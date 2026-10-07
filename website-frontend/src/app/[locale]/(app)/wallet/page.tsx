"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { walletApi } from "@/lib/adapters/wallet";
import { WalletSummary } from "@/components/domain/wallet-summary";
import { PaymentPanel } from "@/components/domain/payment-panel";
import { TransactionRow, type TransactionItem } from "@/components/composed/transaction-row";

export default function WalletPage() {
  const t = useTranslations("wallet");
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const { toast } = useToast();

  type WalletData = Awaited<ReturnType<typeof walletApi.getSummary>>;
  const [wallet, setWallet] = React.useState<WalletData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [depositOpen, setDepositOpen] = React.useState(false);

  const loadWallet = React.useCallback(async () => {
    try {
      const data = await walletApi.getSummary();
      setWallet({ ...data });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handleDepositSuccess = async (txId: string) => {
    setDepositOpen(false);
    toast({
      type: "success",
      title: "Nạp tiền thành công!",
      description: `Mã giao dịch: ${txId}`,
    });
    await loadWallet();
  };

  return (
    <PageContainer>
      <SectionHeading
        title={t("title")}
        subtitle="Quản lý nguồn tiền khả dụng, tiền tạm giữ Escrow và lịch sử giao dịch chi tiết"
        level={1}
      />

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : !wallet ? (
        <EmptyState title="Không thể tải thông tin ví" />
      ) : (
        <>
          {/* Summary Cards */}
          <WalletSummary
            availableBalance={wallet.availableBalance}
            escrowBalance={wallet.escrowBalance}
            earnedBalance={wallet.earnedBalance}
            onOpenDeposit={() => setDepositOpen(true)}
            locale={locale}
          />

          {/* Transactions Table */}
          <Card glass>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <span>{t("txHistory")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {wallet.transactions.length === 0 ? (
                <div className="p-8 text-center text-sm text-fg-secondary">
                  Chưa có giao dịch phát sinh nào trong tài khoản.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-y border-border text-[12px] font-semibold text-fg-tertiary uppercase tracking-wider">
                        <th className="py-3 px-4">{t("txDate")}</th>
                        <th className="py-3 px-4">{t("txType")}</th>
                        <th className="py-3 px-4">Nội dung & Mã tham chiếu</th>
                        <th className="py-3 px-4 text-right">{t("txAmount")}</th>
                        <th className="py-3 px-4 text-right">{t("txBalanceAfter")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {wallet.transactions.map((tx: TransactionItem) => (
                        <TransactionRow key={tx.id} tx={tx} locale={locale} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Deposit Modal with PaymentPanel */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Nạp tiền vào ví WorkGo</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <PaymentPanel
              onSuccess={handleDepositSuccess}
              onError={() => {}}
              locale={locale}
            />
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
