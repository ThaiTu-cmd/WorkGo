"use client";

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { providerApi, toProvider, useAuthToken } from "../../webapp-bridge/backend";
import styles from "./ProviderOnboardingPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

type Provider = ReturnType<typeof toProvider>;
// none = signed in without a provider profile yet (the form is shown).
type LoadState = "loading" | "needs-login" | "none" | "has-profile" | "error";

const STATUS_TEXT: Record<string, string> = {
  PENDING: "Hồ sơ đang chờ admin duyệt. Sau khi được duyệt, hãy đăng xuất rồi đăng nhập lại để có quyền đăng dịch vụ.",
  VERIFIED:
    "Bạn đã là Chuyên gia. Nếu chưa đăng được dịch vụ, hãy đăng xuất rồi đăng nhập lại để cập nhật quyền.",
  REJECTED: "Hồ sơ đã bị từ chối. Vui lòng liên hệ WorkGo để được hỗ trợ.",
  SUSPENDED: "Tài khoản Chuyên gia đang bị tạm khóa.",
};

export default function ProviderOnboardingPage({ onNavigate, onShowToast }: TrungPageProps) {
  const token = useAuthToken();
  const [result, setResult] = useState<{ token: string; state: LoadState; provider: Provider | null } | null>(null);
  const state: LoadState = !token ? "needs-login" : result?.token === token ? result.state : "loading";
  const provider = result?.token === token ? result.provider : null;

  const [providerType, setProviderType] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ businessName?: string; bio?: string; agreed?: string; form?: string }>({});

  // An existing profile (any status) replaces the form with its status.
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    providerApi
      .getMyProfile()
      .then((res: { result?: unknown }) => {
        if (cancelled) return;
        setResult(
          res?.result
            ? { token, state: "has-profile", provider: toProvider(res.result) }
            : { token, state: "none", provider: null },
        );
      })
      .catch((err: { status?: number }) => {
        if (cancelled) return;
        // 404 / 400 = PROVIDER_PROFILE_NOT_EXISTED → show the form.
        const next: LoadState =
          err?.status === 401 ? "needs-login" : err?.status === 404 || err?.status === 400 ? "none" : "error";
        setResult({ token, state: next, provider: null });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const cleanBusiness = sanitizeText(businessName);
    const cleanBio = sanitizeText(bio);
    const next: typeof errors = {};
    if (cleanBusiness.length < 5 || cleanBusiness.length > 100) {
      next.businessName = "Vui lòng nhập tên kinh doanh từ 5 đến 100 ký tự!";
    }
    if (cleanBio.length < 20) {
      next.bio = "Vui lòng nhập giới thiệu chi tiết từ 20 ký tự trở lên!";
    }
    if (!agreed) {
      next.agreed = "Bạn cần đồng ý điều khoản dành cho provider để tiếp tục!";
    }
    setErrors(next);
    if (next.businessName ?? next.bio ?? next.agreed) return;

    setSubmitting(true);
    try {
      const res = await providerApi.createProfile({ providerType, businessName: cleanBusiness, bio: cleanBio });
      setResult({ token, state: "has-profile", provider: res?.result ? toProvider(res.result) : null });
      onShowToast("Đã gửi hồ sơ Chuyên gia! Vui lòng chờ admin duyệt.");
    } catch (err) {
      setErrors({ form: `Không gửi được hồ sơ: ${(err as Error)?.message || "lỗi kết nối máy chủ"}` });
    } finally {
      setSubmitting(false);
    }
  };

  if (state !== "none") {
    return (
      <main className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            <BadgeCheck size={24} className={styles.titleIcon} aria-hidden="true" /> Trở thành provider
          </h1>
          {state === "loading" ? <p className={styles.sub}>Đang kiểm tra hồ sơ Chuyên gia...</p> : null}
          {state === "needs-login" ? (
            <>
              <p className={styles.sub}>Đăng nhập để gửi hồ sơ trở thành Chuyên gia.</p>
              <button type="button" className={styles.submit} onClick={() => onNavigate("login")}>
                Đăng nhập
              </button>
            </>
          ) : null}
          {state === "error" ? (
            <p className={styles.error} role="alert">
              Không kiểm tra được hồ sơ Chuyên gia. Kiểm tra kết nối tới máy chủ rồi thử lại.
            </p>
          ) : null}
          {state === "has-profile" ? (
            <>
              <p className={styles.sub}>
                Hồ sơ <strong>{provider?.name}</strong> — trạng thái: <strong>{provider?.verificationStatus ?? "PENDING"}</strong>
              </p>
              <p className={styles.sub}>{STATUS_TEXT[provider?.verificationStatus ?? "PENDING"]}</p>
              {provider?.verificationStatus === "VERIFIED" ? (
                <button type="button" className={styles.submit} onClick={() => onNavigate("my-services")}>
                  Quản lý dịch vụ
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <BadgeCheck size={24} className={styles.titleIcon} aria-hidden="true" /> Trở thành provider
        </h1>
        <p className={styles.sub}>
          Hoàn tất hồ sơ kinh doanh để bắt đầu nhận việc trên WorkGo. Hồ sơ cần được admin duyệt trước khi bạn đăng dịch
          vụ.
        </p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>Loại hình</span>
            <select
              value={providerType}
              onChange={(e) => setProviderType(e.target.value as "INDIVIDUAL" | "COMPANY")}
            >
              <option value="INDIVIDUAL">Cá nhân</option>
              <option value="COMPANY">Doanh nghiệp</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Tên kinh doanh</span>
            <input
              type="text"
              autoFocus
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Studio Sáng Tạo Mới"
              aria-invalid={errors.businessName ? true : undefined}
            />
            {errors.businessName ? <em className={styles.error}>{errors.businessName}</em> : null}
          </label>
          <label className={styles.field}>
            <span>Giới thiệu (tối thiểu 20 ký tự)</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Kinh nghiệm, thế mạnh và cam kết phục vụ của bạn..."
              rows={5}
              aria-invalid={errors.bio ? true : undefined}
            />
            {errors.bio ? <em className={styles.error}>{errors.bio}</em> : null}
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            Tôi đồng ý với điều khoản dành cho provider của WorkGo
          </label>
          {errors.agreed ? <em className={styles.error}>{errors.agreed}</em> : null}
          {errors.form ? (
            <em className={styles.error} role="alert">
              {errors.form}
            </em>
          ) : null}
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </form>
      </div>
    </main>
  );
}
