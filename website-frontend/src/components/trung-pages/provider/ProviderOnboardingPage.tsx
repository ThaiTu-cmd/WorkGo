"use client";

import { useState } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { KEYS } from "../_stores/keys";
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

export default function ProviderOnboardingPage({ onNavigate, onShowToast }: TrungPageProps) {
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{ businessName?: string; bio?: string; agreed?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
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
    try {
      window.localStorage.setItem(
        KEYS.providerRequest,
        JSON.stringify({ businessName: cleanBusiness, bio: cleanBio, agreed: true, status: "PENDING" }),
      );
    } catch {
      onShowToast("Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.");
      return;
    }
    onShowToast("Đã gửi yêu cầu trở thành provider!");
    onNavigate("provider-profile", { providerId: "pv-1" });
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Trở thành provider</h1>
        <p className={styles.sub}>Hoàn tất hồ sơ kinh doanh để bắt đầu nhận việc trên WorkGo.</p>
        <form onSubmit={submit} noValidate className={styles.form}>
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
          <button type="submit" className={styles.submit}>
            Gửi yêu cầu
          </button>
          <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Đã có tài khoản chuyên gia? </span>
            <button
              type="button"
              onClick={() => onNavigate("verification-center")}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                minHeight: '44px',
              }}
            >
              Xác thực hồ sơ tại Verification Center →
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
