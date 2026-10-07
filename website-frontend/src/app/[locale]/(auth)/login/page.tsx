"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, AlertCircle, Zap } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

function LoginFormContent() {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const tErr = useTranslations("error");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  const rawNext = searchParams.get("next");
  const nextUrl = rawNext
    ? rawNext.startsWith(`/${locale}`)
      ? rawNext
      : `/${locale}${rawNext.startsWith("/") ? rawNext : `/${rawNext}`}`
    : `/${locale}/client`;

  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userName: "",
      password: "",
      remember: false,
    },
  });

  const remember = useWatch({ control, name: "remember" });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: data.userName,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401 || result.code === 1006) {
          setServerError(t("invalidCredentials"));
        } else if (result.code === 1007 || result.message?.toLowerCase().includes("suspend")) {
          setServerError(t("suspended"));
        } else {
          setServerError(result.message || tErr("generic"));
        }
        return;
      }

      // Successful login
      const targetRole = result.result?.role;
      let destination = nextUrl;
      if (destination === `/${locale}/client` && targetRole === "PROVIDER") {
        destination = `/${locale}/provider`;
      }
      router.push(destination);
      router.refresh();
    } catch {
      setServerError(tErr("network"));
    }
  };

  const handleQuickLogin = (userType: "CLIENT" | "PROVIDER") => {
    const creds: LoginFormData = userType === "CLIENT"
      ? { userName: "demouser1", password: "Demo@12345", remember: false }
      : { userName: "provider1", password: "Demo@12345", remember: false };
    setValue("userName", creds.userName);
    setValue("password", creds.password);
    onSubmit(creds);
  };

  return (
    <Card glass className="w-full shadow-xl border-border/80 backdrop-blur-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div
            className="mb-5 p-3 rounded-control bg-danger-bg border border-red-200 text-danger text-sm flex items-start gap-2.5"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="flex-1">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field
            label={t("userNameLabel")}
            required
            error={errors.userName?.message ? tVal(errors.userName.message as never) : undefined}
          >
            <Input
              {...register("userName")}
              type="text"
              autoComplete="username"
              placeholder={t("userNamePlaceholder")}
              disabled={isSubmitting}
            />
          </Field>

          <Field
            label={t("passwordLabel")}
            required
            error={errors.password?.message ? tVal(errors.password.message as never) : undefined}
          >
            <div className="relative">
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setValue("remember", Boolean(checked))}
                disabled={isSubmitting}
              />
              <Label htmlFor="remember" className="font-normal text-fg-secondary cursor-pointer">
                {t("rememberMe")}
              </Label>
            </div>

            <span
              className="text-fg-tertiary cursor-not-allowed"
              title="Tính năng đang được phát triển"
            >
              {t("forgotPassword")}
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isSubmitting}
            loadingText={tCommon("loading")}
          >
            {t("submit")}
          </Button>

          {/* Quick Demo Login Buttons */}
          <div className="pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-2 text-[11px] text-fg-tertiary uppercase tracking-wider">
                Chế độ thử nghiệm Dev
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-9 gap-1 font-medium"
                disabled={isSubmitting}
                onClick={() => handleQuickLogin("CLIENT")}
              >
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span>Demo Khách hàng</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-9 gap-1 font-medium"
                disabled={isSubmitting}
                onClick={() => handleQuickLogin("PROVIDER")}
              >
                <Zap className="h-3.5 w-3.5 text-warning" />
                <span>Demo Provider</span>
              </Button>
            </div>
          </div>

          <div className="text-center text-xs text-fg-secondary pt-3 border-t border-border mt-4">
            <span>{t("noAccount")} </span>
            <Link
              href={`/${locale}/register`}
              className="font-semibold text-primary hover:underline underline-offset-2 ml-1"
            >
              {t("registerNow")}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginFormContent />
    </React.Suspense>
  );
}
