"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Shield, Building2, Plus } from "lucide-react";
import { payoutSchema, type PayoutFormData } from "@/lib/schemas/payout";
import { walletApi } from "@/lib/adapters/wallet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MockChip } from "@/components/ui/mock-chip";
import { useToast } from "@/components/ui/toast";

export function PayoutForm() {
  const t = useTranslations("payout");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const { toast } = useToast();

  const [banks, setBanks] = React.useState<Array<{ code: string; name: string }>>([]);
  type PayoutAccountItem = Awaited<ReturnType<typeof walletApi.getPayoutAccounts>>[number];
  const [accounts, setAccounts] = React.useState<PayoutAccountItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddForm, setShowAddForm] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      accountType: "BANK",
      bankCode: "VCB",
      accountNumber: "",
      accountHolderName: "",
      isDefault: false,
    },
  });

  const isDefault = useWatch({ control, name: "isDefault" });

  React.useEffect(() => {
    async function loadData() {
      try {
        const [bankList, accList] = await Promise.all([
          walletApi.getBanks(),
          walletApi.getPayoutAccounts(),
        ]);
        setBanks(bankList);
        setAccounts(accList);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const onSubmit = async (data: PayoutFormData) => {
    try {
      const created = await walletApi.addPayoutAccount(data);
      setAccounts((prev) => [created, ...prev]);
      setShowAddForm(false);
      reset();
      toast({
        type: "success",
        title: t("addSuccess"),
      });
    } catch {
      toast({
        type: "error",
        title: "Không thể thêm tài khoản",
        description: "Vui lòng thử lại sau.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and security notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-fg">{t("title")}</h2>
            <MockChip />
          </div>
          <p className="text-sm text-fg-secondary mt-0.5">{t("description")}</p>
        </div>

        {!showAddForm && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>{t("addBtn")}</span>
          </Button>
        )}
      </div>

      <div className="p-3.5 rounded-card bg-primary-subtle/50 border border-primary/20 flex items-start gap-3">
        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-primary leading-relaxed">{t("securityNotice")}</p>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <Card className="border-primary/30 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t("addBtn")}</CardTitle>
            <CardDescription>Nhập thông tin tài khoản ngân hàng chính chủ để rút tiền</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field label={t("bankSelect")} required error={errors.bankCode?.message}>
                <select
                  {...register("bankCode")}
                  className="flex h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isSubmitting}
                >
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={t("accountNumber")}
                required
                error={errors.accountNumber?.message ? tVal(errors.accountNumber.message as never) : undefined}
              >
                <Input
                  {...register("accountNumber")}
                  placeholder="Ví dụ: 0071001234567"
                  disabled={isSubmitting}
                />
              </Field>

              <Field
                label={t("accountHolder")}
                required
                error={errors.accountHolderName?.message ? tVal(errors.accountHolderName.message as never) : undefined}
                description="Tên in hoa không dấu khớp với tên tài khoản tại ngân hàng"
              >
                <Input
                  {...register("accountHolderName")}
                  placeholder="TRAN HUU TRUNG"
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setValue("accountHolderName", e.target.value.toUpperCase());
                  }}
                />
              </Field>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="defaultPayout"
                  checked={isDefault}
                  onCheckedChange={(checked) => setValue("isDefault", Boolean(checked))}
                  disabled={isSubmitting}
                />
                <Label htmlFor="defaultPayout" className="text-xs text-fg-secondary font-normal cursor-pointer">
                  {t("defaultAccount")}
                </Label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  loadingText={tCommon("loading")}
                >
                  {tCommon("save")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Saved Accounts List */}
      <div>
        <h3 className="text-sm font-semibold text-fg uppercase tracking-wider mb-3">
          {t("savedAccounts")} ({accounts.length})
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-card animate-pulse" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-card bg-surface/50 text-fg-secondary text-sm">
            Chưa có tài khoản rút tiền nào được liên kết.
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => (
              <Card key={acc.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-control bg-primary-subtle text-primary flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-fg">{acc.bankName}</span>
                      {acc.isDefault && (
                        <Badge variant="primary" className="text-[10px] h-4">
                          Mặc định
                        </Badge>
                      )}
                      <Badge variant="success" className="text-[10px] h-4">
                        {acc.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-fg-secondary mt-0.5">
                      {acc.accountNumber} • {acc.accountHolderName}
                    </p>
                  </div>
                </div>

                {!acc.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary"
                    onClick={async () => {
                      await walletApi.setDefaultPayoutAccount(acc.id);
                      setAccounts((prev) =>
                        prev.map((a) => ({ ...a, isDefault: a.id === acc.id }))
                      );
                      toast({
                        type: "success",
                        title: "Đã đặt làm tài khoản mặc định",
                      });
                    }}
                  >
                    Đặt mặc định
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
