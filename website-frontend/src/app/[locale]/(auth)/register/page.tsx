"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const t = useTranslations("register");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const tErr = useTranslations("error");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      userName: "",
      email: "",
      phone: "",
      password: "",
      confirm: "",
      agreeTerms: false,
    },
  });

  const agreeTerms = useWatch({ control, name: "agreeTerms" });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      // 1. Call register BFF
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.userName,
          password: data.password,
          phone: data.phone,
          email: data.email,
        }),
      });

      const regData = await regRes.json();

      if (!regRes.ok || (regData.code && regData.code !== 1000)) {
        if (
          regData.code === 1002 ||
          regData.message?.toLowerCase().includes("exist") ||
          regData.message?.toLowerCase().includes("taken")
        ) {
          setServerError(t("userNameTaken"));
        } else {
          setServerError(regData.message || tErr("generic"));
        }
        return;
      }

      // 2. Auto login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: data.userName,
          password: data.password,
        }),
      });

      if (loginRes.ok) {
        router.push(`/${locale}/client`);
        router.refresh();
      } else {
        router.push(`/${locale}/login`);
      }
    } catch {
      setServerError(tErr("network"));
    }
  };

  const getValidationMsg = (msg?: string) => {
    if (!msg) return undefined;
    if (msg.startsWith("validation.")) {
      return tVal(msg.replace("validation.", "") as never);
    }
    return msg;
  };

  return (
    <Card glass className="w-full shadow-xl border-border/80 backdrop-blur-xl my-4">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div
            className="mb-5 p-3 rounded-control bg-danger-bg border border-danger/30 text-danger text-sm flex items-start gap-2.5"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="flex-1">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label={t("lastName")}
              required
              error={getValidationMsg(errors.lastName?.message)}
            >
              <Input
                {...register("lastName")}
                placeholder={t("lastNamePlaceholder")}
                disabled={isSubmitting}
              />
            </Field>

            <Field
              label={t("firstName")}
              required
              error={getValidationMsg(errors.firstName?.message)}
            >
              <Input
                {...register("firstName")}
                placeholder={t("firstNamePlaceholder")}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <Field
            label={t("userName")}
            required
            error={getValidationMsg(errors.userName?.message)}
          >
            <Input
              {...register("userName")}
              autoComplete="username"
              placeholder={t("userNamePlaceholder")}
              disabled={isSubmitting}
            />
          </Field>

          <Field
            label={t("email")}
            required
            error={getValidationMsg(errors.email?.message)}
          >
            <Input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              disabled={isSubmitting}
            />
          </Field>

          <Field
            label={t("phone")}
            required
            error={getValidationMsg(errors.phone?.message)}
          >
            <Input
              {...register("phone")}
              type="tel"
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
              disabled={isSubmitting}
            />
          </Field>

          <Field
            label={t("password")}
            required
            error={getValidationMsg(errors.password?.message)}
          >
            <div className="relative">
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("passwordPlaceholder")}
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-tertiary hover:text-fg p-1 rounded-control transition-colors cursor-pointer"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field
            label={t("confirmPassword")}
            required
            error={getValidationMsg(errors.confirm?.message)}
          >
            <div className="relative">
              <Input
                {...register("confirm")}
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("confirmPasswordPlaceholder")}
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-tertiary hover:text-fg p-1 rounded-control transition-colors cursor-pointer"
                aria-label={showConfirm ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <div className="pt-1">
            <div className="flex items-start gap-2">
              <Checkbox
                id="agreeTerms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setValue("agreeTerms", Boolean(checked))}
                disabled={isSubmitting}
                className="mt-0.5"
              />
              <Label htmlFor="agreeTerms" className="text-xs text-fg-secondary font-normal cursor-pointer leading-tight">
                {t("termsAgree")}
              </Label>
            </div>
            {errors.agreeTerms && (
              <p className="text-xs text-danger mt-1 font-medium">{errors.agreeTerms.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-3"
            isLoading={isSubmitting}
            loadingText={tCommon("loading")}
          >
            {t("submit")}
          </Button>

          <div className="text-center text-xs text-fg-secondary pt-3 border-t border-border mt-4">
            <span>{t("haveAccount")} </span>
            <Link
              href={`/${locale}/login`}
              className="font-semibold text-primary hover:underline underline-offset-2 ml-1"
            >
              {t("loginNow")}
            </Link>
          </div>

          <div className="text-center pt-2">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1.5 text-xs text-fg-tertiary hover:text-fg transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{locale === "vi" ? "Quay về trang giới thiệu" : "Back to landing page"}</span>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
