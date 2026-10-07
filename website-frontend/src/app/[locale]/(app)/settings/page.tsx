"use client";

import * as React from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  MapPin,
  ShieldCheck,
  CreditCard,
  Plus,
  Info,
} from "lucide-react";
import { PageContainer } from "@/components/shell/page-container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  identityApi,
  type UserResponse,
  type AddressResponse,
  type ProviderProfileResponse,
} from "@/lib/adapters/identity";
import {
  userProfileSchema,
  providerProfileSchema,
  type UserProfileFormData,
  type ProviderProfileFormData,
} from "@/lib/schemas/profile";
import type { AddressFormData } from "@/lib/schemas/address";
import { AddressCard } from "@/components/composed/address-card";
import { AddressDialog } from "@/components/composed/address-dialog";
import { PayoutForm } from "@/components/domain/payout-form";

function SettingsContent() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tProfile = useTranslations("profile");
  const tAddr = useTranslations("addresses");
  const tOnboard = useTranslations("providerOnboarding");
  const { toast } = useToast();

  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  const currentTab = searchParams.get("tab") || "profile";

  // State
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<UserResponse | null>(null);
  const [providerProfile, setProviderProfile] = React.useState<ProviderProfileResponse | null>(null);
  const [addresses, setAddresses] = React.useState<AddressResponse[]>([]);

  // Address dialog states
  const [addressDialogOpen, setAddressDialogOpen] = React.useState(false);
  const [addressToEdit, setAddressToEdit] = React.useState<AddressResponse | null>(null);
  const [addressToDelete, setAddressToDelete] = React.useState<string | null>(null);

  // Provider onboarding state
  const [showProviderForm, setShowProviderForm] = React.useState(false);

  // Profile form
  const {
    register: regProfile,
    handleSubmit: submitProfile,
    reset: resetProfile,
    formState: { isSubmitting: savingProfile, errors: profileErrors },
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
  });

  // Provider form
  const {
    register: regProvider,
    handleSubmit: submitProvider,
    reset: resetProvider,
    setValue: setProviderVal,
    control: controlProvider,
    formState: { isSubmitting: savingProvider, errors: providerErrors },
  } = useForm<ProviderProfileFormData>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      providerType: "INDIVIDUAL",
      businessName: "",
      bio: "",
      isAcceptingOrders: true,
    },
  });

  const isAcceptingOrders = useWatch({
    control: controlProvider,
    name: "isAcceptingOrders",
  });

  // Load user data
  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [userData, providerData, addressData] = await Promise.allSettled([
          identityApi.getMyInfo(),
          identityApi.getMyProviderProfile(),
          identityApi.getMyAddresses(),
        ]);

        if (userData.status === "fulfilled") {
          setUser(userData.value);
          resetProfile({
            firstName: userData.value.firstName,
            lastName: userData.value.lastName,
            phone: userData.value.phone,
            email: userData.value.email,
          });
        }

        if (providerData.status === "fulfilled" && providerData.value) {
          setProviderProfile(providerData.value);
          resetProvider({
            providerType: providerData.value.providerType,
            businessName: providerData.value.businessName,
            bio: providerData.value.bio,
            isAcceptingOrders: providerData.value.isAcceptingOrders,
          });
        }

        if (addressData.status === "fulfilled") {
          setAddresses(addressData.value.data);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resetProfile, resetProvider]);

  const handleTabChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", value);
    router.push(`/${locale}/settings?${nextParams.toString()}`);
  };

  // Profile Save
  const onProfileSave = async (data: UserProfileFormData) => {
    if (!user || !user.userId) {
      toast({
        type: "error",
        title: "Không thể lưu thông tin hồ sơ",
        description: "Chưa có thông tin người dùng hoặc máy chủ đang ngoại tuyến.",
      });
      return;
    }
    try {
      const updated = await identityApi.updateMyInfo(user.userId, data);
      setUser(updated);
      toast({
        type: "success",
        title: t("profileSaved"),
      });
    } catch {
      toast({
        type: "error",
        title: "Không thể lưu thông tin hồ sơ",
        description: "Vui lòng kiểm tra lại kết nối.",
      });
    }
  };

  // Provider Save
  const onProviderSave = async (data: ProviderProfileFormData) => {
    try {
      if (providerProfile) {
        const updated = await identityApi.updateMyProviderProfile(data);
        setProviderProfile(updated);
        toast({
          type: "success",
          title: tOnboard("updateSuccess"),
        });
      } else {
        const created = await identityApi.createProviderProfile(data);
        setProviderProfile(created);
        setShowProviderForm(false);
        toast({
          type: "success",
          title: tOnboard("registerSuccess"),
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Có lỗi xảy ra",
        description: "Không thể lưu thông tin Provider.",
      });
    }
  };

  // Address Submit (Add / Edit)
  const onAddressSubmit = async (data: AddressFormData) => {
    try {
      if (addressToEdit) {
        const updated = await identityApi.updateAddress(addressToEdit.addressId, data);
        setAddresses((prev) =>
          prev.map((a) => (a.addressId === addressToEdit.addressId ? updated : a))
        );
        toast({
          type: "success",
          title: tAddr("updateSuccess"),
        });
      } else {
        const created = await identityApi.createAddress(data);
        setAddresses((prev) => [created, ...prev]);
        toast({
          type: "success",
          title: tAddr("createSuccess"),
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Có lỗi xảy ra",
        description: "Không thể lưu thông tin địa chỉ.",
      });
    }
  };

  // Address Delete Confirm
  const onConfirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    try {
      await identityApi.deleteAddress(addressToDelete);
      setAddresses((prev) => prev.filter((a) => a.addressId !== addressToDelete));
      toast({
        type: "success",
        title: tAddr("deleteSuccess"),
      });
    } catch {
      toast({
        type: "error",
        title: "Không thể xóa địa chỉ",
      });
    } finally {
      setAddressToDelete(null);
    }
  };

  const isProvider = Boolean(providerProfile);

  return (
    <PageContainer>
      <SectionHeading
        title={t("title")}
        subtitle="Quản lý thông tin cá nhân, địa chỉ giao nhận và hồ sơ đối tác"
        level={1}
      />

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="overflow-x-auto no-scrollbar">
          <TabsTrigger value="profile" className="gap-2 shrink-0">
            <User className="h-4 w-4" />
            <span>{t("tabProfile")}</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-2 shrink-0">
            <MapPin className="h-4 w-4" />
            <span>{t("tabAddresses")} ({addresses.length})</span>
          </TabsTrigger>
          <TabsTrigger value="provider" className="gap-2 shrink-0">
            <ShieldCheck className="h-4 w-4" />
            <span>{t("tabProvider")}</span>
          </TabsTrigger>
          {isProvider && (
            <TabsTrigger value="payout" className="gap-2 shrink-0">
              <CreditCard className="h-4 w-4" />
              <span>{t("tabPayout")}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* TAB 1: PROFILE */}
            <TabsContent value="profile" className="space-y-6 max-w-3xl">
              <Card>
                <CardHeader>
                  <CardTitle>{tProfile("title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitProfile(onProfileSave)} className="space-y-4">
                    <div className="p-3 rounded-control bg-slate-50 border border-border text-xs text-fg-secondary flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary shrink-0" />
                      <span>{t("avatarNotice")}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Họ và tên đệm" required error={profileErrors.lastName?.message}>
                        <Input {...regProfile("lastName")} disabled={savingProfile} />
                      </Field>
                      <Field label="Tên" required error={profileErrors.firstName?.message}>
                        <Input {...regProfile("firstName")} disabled={savingProfile} />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label={tProfile("userName")}>
                        <Input value={user?.userName || ""} disabled className="bg-muted text-fg-tertiary" />
                      </Field>
                      <Field label={tProfile("email")}>
                        <Input value={user?.email || ""} disabled className="bg-muted text-fg-tertiary" />
                      </Field>
                    </div>

                    <Field label="Số điện thoại" required error={profileErrors.phone?.message}>
                      <Input {...regProfile("phone")} type="tel" disabled={savingProfile} />
                    </Field>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={savingProfile}
                        loadingText={tCommon("loading")}
                      >
                        {tCommon("save")}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Read-only System Metrics */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-fg-tertiary">
                    {tProfile("readOnlySection")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-fg-secondary">{tProfile("userId")}</span>
                    <p className="font-mono text-xs truncate mt-0.5">{user?.userId || "—"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-fg-secondary">{tProfile("rating")}</span>
                    <p className="font-semibold text-base text-fg mt-0.5">5.0 ★</p>
                  </div>
                  <div>
                    <span className="text-xs text-fg-secondary">{tProfile("completedOrders")}</span>
                    <p className="font-semibold text-base text-fg mt-0.5">
                      {providerProfile?.completedOrderCount || 0} đơn
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: ADDRESSES */}
            <TabsContent value="addresses" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-fg">{tAddr("title")}</h2>
                  <p className="text-sm text-fg-secondary">
                    Danh sách các địa chỉ dùng để đặt dịch vụ tại nhà hoặc giao nhận
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setAddressToEdit(null);
                    setAddressDialogOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>{tAddr("addAddress")}</span>
                </Button>
              </div>

              {addresses.length === 0 ? (
                <EmptyState
                  title={tAddr("title")}
                  description="Chưa có địa chỉ nào trong sổ địa chỉ. Hãy thêm địa chỉ để thuận tiện yêu cầu dịch vụ tại chỗ."
                  action={
                    <Button
                      variant="primary"
                      onClick={() => {
                        setAddressToEdit(null);
                        setAddressDialogOpen(true);
                      }}
                    >
                      {tAddr("addAddress")}
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <AddressCard
                      key={addr.addressId}
                      address={addr}
                      onEdit={(a) => {
                        setAddressToEdit(a);
                        setAddressDialogOpen(true);
                      }}
                      onDelete={(id) => setAddressToDelete(id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: PROVIDER ONBOARDING */}
            <TabsContent value="provider" className="space-y-6 max-w-3xl">
              {!providerProfile && !showProviderForm ? (
                <EmptyState
                  title={tOnboard("title")}
                  description={tOnboard("description")}
                  action={
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setShowProviderForm(true)}
                    >
                      {tOnboard("ctaBecome")}
                    </Button>
                  }
                />
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>
                          {providerProfile ? "Hồ sơ Năng lực Provider" : tOnboard("title")}
                        </CardTitle>
                        <CardDescription>
                          {providerProfile
                            ? "Cập nhật thông tin hiển thị trên trang hồ sơ công khai"
                            : tOnboard("description")}
                        </CardDescription>
                      </div>

                      {providerProfile && (
                        <Badge
                          variant={
                            providerProfile.verificationStatus === "VERIFIED"
                              ? "success"
                              : providerProfile.verificationStatus === "REJECTED"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {providerProfile.verificationStatus === "VERIFIED"
                            ? tOnboard("statusVerified")
                            : providerProfile.verificationStatus === "REJECTED"
                            ? tOnboard("statusRejected")
                            : tOnboard("statusPending")}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={submitProvider(onProviderSave)} className="space-y-4">
                      {!providerProfile && (
                        <Field label={tOnboard("providerType")} required>
                          <div className="flex items-center gap-6 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="radio"
                                value="INDIVIDUAL"
                                {...regProvider("providerType")}
                                className="h-4 w-4 text-primary"
                              />
                              <span>{tOnboard("individual")}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="radio"
                                value="COMPANY"
                                {...regProvider("providerType")}
                                className="h-4 w-4 text-primary"
                              />
                              <span>{tOnboard("company")}</span>
                            </label>
                          </div>
                        </Field>
                      )}

                      <Field
                        label={tOnboard("businessName")}
                        required
                        error={providerErrors.businessName?.message}
                      >
                        <Input
                          {...regProvider("businessName")}
                          placeholder="Ví dụ: Thiết kế đồ họa chuyên nghiệp"
                          disabled={savingProvider}
                        />
                      </Field>

                      <Field
                        label={tOnboard("bio")}
                        required
                        error={providerErrors.bio?.message}
                        description="Tối thiểu 20 ký tự mô tả kinh nghiệm, chuyên môn và kỹ năng"
                      >
                        <Textarea
                          {...regProvider("bio")}
                          placeholder={tOnboard("bioPlaceholder")}
                          disabled={savingProvider}
                          className="min-h-[120px]"
                        />
                      </Field>

                      {providerProfile && (
                        <div className="flex items-center justify-between p-3.5 rounded-card border border-border bg-slate-50">
                          <div>
                            <Label htmlFor="acceptJobs" className="font-medium text-sm cursor-pointer">
                              {tOnboard("isAcceptingOrders")}
                            </Label>
                            <p className="text-xs text-fg-secondary mt-0.5">
                              Bật trạng thái này để nhận yêu cầu công việc mới từ khách hàng
                            </p>
                          </div>
                          <Switch
                            id="acceptJobs"
                            checked={isAcceptingOrders}
                            onCheckedChange={(c) => setProviderVal("isAcceptingOrders", c)}
                            disabled={savingProvider}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2">
                        {!providerProfile && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowProviderForm(false)}
                            disabled={savingProvider}
                          >
                            {tCommon("cancel")}
                          </Button>
                        )}
                        <Button
                          type="submit"
                          variant="primary"
                          isLoading={savingProvider}
                          loadingText={tCommon("loading")}
                        >
                          {tCommon("save")}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 4: PAYOUT (Provider Only) */}
            {isProvider && (
              <TabsContent value="payout" className="max-w-3xl">
                <PayoutForm />
              </TabsContent>
            )}
          </>
        )}
      </Tabs>

      {/* Address Add / Edit Dialog */}
      <AddressDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        addressToEdit={addressToEdit}
        onSubmit={onAddressSubmit}
      />

      {/* Delete Address Confirmation Dialog */}
      <Dialog
        open={Boolean(addressToDelete)}
        onOpenChange={(open) => !open && setAddressToDelete(null)}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{tAddr("deleteTitle")}</DialogTitle>
            <DialogDescription>{tAddr("deleteDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressToDelete(null)}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={onConfirmDeleteAddress}>
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

export default function SettingsPage() {
  return (
    <React.Suspense fallback={null}>
      <SettingsContent />
    </React.Suspense>
  );
}
