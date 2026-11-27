"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, MessageCircle, Edit3, Check, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import type { CatalogFilterParams, PageKey } from "../../shell/MarketplaceShell";
import { providerApi, verificationApi, catalogApi, trustApi, toProvider, useAuthToken } from "../../shell/backend";
import styles from "./ProviderProfilePage.module.css";
import ScoreReviewHistory from "./ScoreReviewHistory";

export type PageProps = {
  onNavigate: (page: PageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  providerId?: string;
};

type Provider = ReturnType<typeof toProvider>;
type LoadState = "loading" | "ready" | "needs-login" | "not-found" | "error";

type VerificationRecord = {
  providerVerificationId?: string;
  id?: string;
  verificationType?: string;
  documentType?: string;
  verificationStatus?: string;
  status?: string;
  submittedAt?: string;
};

// Keys of the "misc" dictionary, translated with tr() at render.
const VERIFICATION_LABEL: Record<string, string> = {
  VERIFIED: "m1690",
  PENDING: "m1691",
  REJECTED: "m1692",
  SUSPENDED: "m1693"
};

export default function ProviderProfilePage({
  onNavigate,
  onShowToast,
  providerId
}: PageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const isOwnProfile = !providerId;
  const requestKey = `${token}|${providerId ?? ""}`;

  const [result, setResult] = useState<{
    key: string;
    state: LoadState;
    provider: Provider | null;
  } | null>(null);

  const state: LoadState = !token ? "needs-login" : result?.key === requestKey ? result.state : "loading";
  const provider = result?.key === requestKey ? result.provider : null;

  // KYC verification info
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);

  // Edit mode states (for own profile)
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAccepting, setEditAccepting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    const done = (next: LoadState, p: Provider | null = null) => {
      if (!cancelled) {
        setResult({
          key: requestKey,
          state: next,
          provider: p
        });
        if (p) {
          setEditName(p.name || "");
          setEditBio(p.bio || "");
          setEditAccepting(p.acceptingOrders === true);
        }
      }
    };

    // No id → the signed-in provider's own profile.
    const req = providerId ? providerApi.getProvider(providerId) : providerApi.getMyProfile();
    req.then((res: { result?: unknown }) => {
      if (!res?.result) {
        done("not-found");
      } else {
        const prov = toProvider(res.result);
        done("ready", prov);
      }
    }).catch((err: { status?: number }) => {
      if (err?.status === 401) done("needs-login");
      else if (err?.status === 404 || err?.status === 400) done("not-found");
      else done("error");
    });

    // If own profile, load verifications
    if (isOwnProfile) {
      verificationApi.getMy(0, 5).then((res: unknown) => {
        if (cancelled) return;
        const apiRes = res as { result?: { data?: VerificationRecord[] } | VerificationRecord[] };
        const list = (apiRes?.result && "data" in apiRes.result ? apiRes.result.data : apiRes?.result) || [];
        setVerifications(Array.isArray(list) ? list : []);
      }).catch(() => {
        if (!cancelled) setVerifications([]);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [token, providerId, requestKey, isOwnProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      onShowToast("Tên thương hiệu không được để trống");
      return;
    }
    setSaving(true);
    try {
      const res = await providerApi.updateMyProfile({
        businessName: editName.trim(),
        bio: editBio.trim(),
        isAcceptingOrders: editAccepting
      });
      if (!res?.result?.providerProfileId) throw new Error('Thiếu xác nhận hồ sơ từ server.');
      if (res.result) {
        const updated = toProvider(res.result);
        setResult({
          key: requestKey,
          state: "ready",
          provider: updated
        });
      }
      setIsEditing(false);
      onShowToast("Cập nhật thông tin chuyên gia thành công!");
    } catch (err) {
      onShowToast((err as Error)?.message || "Không thể cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  const [providerServices, setProviderServices] = useState<Array<{ serviceId: string; title: string }>>([]);
  const [providerReviews, setProviderReviews] = useState<Array<{ orderId: string; rating: number; comment: string }>>([]);

  useEffect(() => {
    const pid = provider?.providerId;
    if (!pid || !token) return undefined;
    let cancelled = false;
    catalogApi
      .listServices({ page: 0, size: 100 })
      .then((res: unknown) => {
        if (cancelled) return;
        const data = (res as { result?: { data?: unknown[] } })?.result?.data;
        const list = Array.isArray(data) ? data : [];
        const filtered = list
          .filter((s: unknown) => String((s as { providerId?: string })?.providerId ?? "") === String(pid))
          .map((s: unknown) => ({
            serviceId: String((s as { serviceId?: string })?.serviceId ?? ""),
            title: String((s as { title?: string })?.title ?? "Dịch vụ"),
          }))
          .filter(s => s.serviceId);
        setProviderServices(filtered);
      })
      .catch(() => {
        if (!cancelled) setProviderServices([]);
      });

    trustApi
      .getProviderReviews(pid, { page: 0, size: 10 })
      .then((res: unknown) => {
        if (cancelled) return;
        const data = (res as { result?: { data?: unknown[] } })?.result?.data;
        const list = Array.isArray(data) ? data : [];
        setProviderReviews(
          list.map((r: unknown) => ({
            orderId: String((r as { orderId?: string })?.orderId ?? ""),
            rating: Number((r as { rating?: number })?.rating ?? 0),
            comment: String((r as { comment?: string })?.comment ?? ""),
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setProviderReviews([]);
      });

    return () => {
      cancelled = true;
    };
  }, [provider?.providerId, token]);

  const hasPendingKyc = verifications.some(
    v => (v.verificationStatus || v.status) === "PENDING"
  );
  const isKycVerified = provider?.verificationStatus === "VERIFIED" || verifications.some(
    v => (v.verificationStatus || v.status) === "VERIFIED"
  );

  if (state !== "ready" || !provider) {
    return (
      <main className={styles.wrap}>
        <section className={styles.hero}>
          {state === "loading" ? <p className={styles.bio}>{tr("m1378")}</p> : null}
          {state === "needs-login" ? (
            <>
              <p className={styles.bio}>{tr("m1379")}</p>
              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={() => onNavigate("login")}>
                  {tr("m32")}
                </button>
              </div>
            </>
          ) : null}
          {state === "not-found" ? (
            <p className={styles.bio}>
              {providerId ? tr("m1372") : tr("m1373")}
            </p>
          ) : null}
          {state === "error" ? <p className={styles.bio} role="alert">{tr("m1381")}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <section className={styles.hero} aria-label={tr("m1374", { p0: provider.name })}>
        <div className={styles.idRow}>
          <span className={styles.avatar} aria-hidden="true">
            {provider.name.charAt(0)}
          </span>
          <div className={styles.idText}>
            <h1 className={styles.name}>{provider.name}</h1>
            <p className={styles.meta}>
              <BadgeCheck size={16} className={styles.star} aria-hidden="true" />
              <span>
                {tr(VERIFICATION_LABEL[provider.verificationStatus ?? ""] ?? "m1375")}
                {provider.providerType ? ` • ${provider.providerType}` : ""}
              </span>
            </p>

            {/* KYC status tag */}
            {isOwnProfile && (
              <div style={{ marginTop: "6px" }}>
                {isKycVerified ? (
                  <span className={`${styles.kycTag} ${styles.kycVerified}`}>
                    <ShieldCheck size={14} /> Đã xác minh CCCD (KYC Verified)
                  </span>
                ) : hasPendingKyc ? (
                  <span className={`${styles.kycTag} ${styles.kycPending}`}>
                    <Clock size={14} /> KYC CCCD đang chờ duyệt
                  </span>
                ) : (
                  <span className={`${styles.kycTag} ${styles.kycMissing}`}>
                    <ShieldAlert size={14} /> Chưa xác minh danh tính CCCD
                  </span>
                )}
              </div>
            )}

            {provider.joinedAt ? (
              <p className={styles.meta}>
                <CalendarDays size={16} aria-hidden="true" />
                <span>Tham gia từ {new Date(provider.joinedAt).toLocaleDateString("vi-VN")}</span>
              </p>
            ) : null}
          </div>
        </div>

        {provider.bio ? <p className={styles.bio}>{provider.bio}</p> : null}

        {/* Action buttons */}
        <div className={styles.actions}>
          {!isOwnProfile ? (
            <button type="button" className={styles.primary} onClick={() => onNavigate("messages")}>
              <MessageCircle size={18} aria-hidden="true" />
              {tr("m875")}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 size={16} />
                {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa thông tin"}
              </button>

              {!isKycVerified && (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => onNavigate("provider-onboarding")}
                >
                  <ShieldCheck size={16} />
                  Xác minh KYC CCCD
                </button>
              )}

              <button
                type="button"
                className={styles.secondary}
                onClick={() => onNavigate("my-services")}
              >
                Quản lý dịch vụ
              </button>
            </>
          )}
        </div>

        {/* Edit profile form for own profile */}
        {isOwnProfile && isEditing && (
          <form onSubmit={handleSaveProfile} className={styles.editCard}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--wg-text)" }}>
              Chỉnh sửa thông tin Chuyên gia
            </h2>

            <label className={styles.editField}>
              <span>Tên thương hiệu / hiển thị dịch vụ *</span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </label>

            <label className={styles.editField}>
              <span>Giới thiệu bản thân & kinh nghiệm *</span>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={4}
                required
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "var(--wg-text)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={editAccepting}
                onChange={(e) => setEditAccepting(e.target.checked)}
                style={{ width: "18px", height: "18px" }}
              />
              <span>Đang mở nhận đơn đặt hàng dịch vụ mới</span>
            </label>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button type="submit" className={styles.primary} disabled={saving}>
                <Check size={16} />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button type="button" className={styles.secondary} onClick={() => setIsEditing(false)}>
                Hủy
              </button>
            </div>
          </form>
        )}
      {isOwnProfile && <ScoreReviewHistory providerId={provider.providerId} />}
      <div style={{ marginTop: "16px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Dịch vụ đang cung cấp</h2>
        {providerServices.length === 0 ? (
          <p className={styles.bio}>Chưa có dịch vụ nào.</p>
        ) : (
          <ul style={{ paddingLeft: "18px" }}>
            {providerServices.map(s => (
              <li key={s.serviceId}>{s.title}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: "16px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Đánh giá gần đây</h2>
        {providerReviews.length === 0 ? (
          <p className={styles.bio}>Chưa có đánh giá nào.</p>
        ) : (
          <ul style={{ paddingLeft: "18px" }}>
            {providerReviews.map((r, i) => (
              <li key={`${r.orderId}-${i}`}>
                {"★".repeat(r.rating)} {r.comment}
              </li>
            ))}
          </ul>
        )}
      </div>

      </section>
    </main>
  );
}
