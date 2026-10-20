"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, MessageCircle } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { providerApi, toProvider, useAuthToken } from "../../webapp-bridge/backend";
import styles from "./ProviderProfilePage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  providerId?: string;
};

type Provider = ReturnType<typeof toProvider>;
type LoadState = "loading" | "ready" | "needs-login" | "not-found" | "error";

const VERIFICATION_LABEL: Record<string, string> = {
  VERIFIED: "Đã xác minh",
  PENDING: "Đang chờ xác minh",
  REJECTED: "Bị từ chối xác minh",
  SUSPENDED: "Tạm khóa",
};

export default function ProviderProfilePage({ onNavigate, onShowToast, providerId }: TrungPageProps) {
  const token = useAuthToken();
  const requestKey = `${token}|${providerId ?? ""}`;
  const [result, setResult] = useState<{ key: string; state: LoadState; provider: Provider | null } | null>(null);
  const state: LoadState = !token ? "needs-login" : result?.key === requestKey ? result.state : "loading";
  const provider = result?.key === requestKey ? result.provider : null;

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    const done = (next: LoadState, p: Provider | null = null) => {
      if (!cancelled) setResult({ key: requestKey, state: next, provider: p });
    };
    // No id → the signed-in provider's own profile.
    const req = providerId ? providerApi.getProvider(providerId) : providerApi.getMyProfile();
    req
      .then((res: { result?: unknown }) => {
        if (!res?.result) done("not-found");
        else done("ready", toProvider(res.result));
      })
      .catch((err: { status?: number }) => {
        if (err?.status === 401) done("needs-login");
        else if (err?.status === 404 || err?.status === 400) done("not-found");
        else done("error");
      });
    return () => {
      cancelled = true;
    };
  }, [token, providerId, requestKey]);

  if (state !== "ready" || !provider) {
    return (
      <main className={styles.wrap}>
        <section className={styles.hero}>
          {state === "loading" ? <p className={styles.bio}>Đang tải hồ sơ provider...</p> : null}
          {state === "needs-login" ? (
            <>
              <p className={styles.bio}>Đăng nhập để xem hồ sơ provider.</p>
              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={() => onNavigate("login")}>
                  Đăng nhập
                </button>
              </div>
            </>
          ) : null}
          {state === "not-found" ? (
            <p className={styles.bio}>
              {providerId ? "Không tìm thấy provider này." : "Tài khoản của bạn chưa có hồ sơ provider."}
            </p>
          ) : null}
          {state === "error" ? (
            <p className={styles.bio} role="alert">
              Không tải được hồ sơ provider. Kiểm tra kết nối tới máy chủ rồi thử lại.
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <section className={styles.hero} aria-label={`Hồ sơ của ${provider.name}`}>
        <div className={styles.idRow}>
          <span className={styles.avatar} aria-hidden="true">
            {provider.name.charAt(0)}
          </span>
          <div className={styles.idText}>
            <h1 className={styles.name}>{provider.name}</h1>
            <p className={styles.meta}>
              <BadgeCheck size={16} className={styles.star} aria-hidden="true" />
              <span>
                {VERIFICATION_LABEL[provider.verificationStatus ?? ""] ?? "Chưa xác minh"}
                {provider.providerType ? ` • ${provider.providerType}` : ""}
              </span>
            </p>
            {provider.joinedAt ? (
              <p className={styles.meta}>
                <CalendarDays size={16} aria-hidden="true" />
                <span>Tham gia từ {new Date(provider.joinedAt).toLocaleDateString("vi-VN")}</span>
              </p>
            ) : null}
          </div>
        </div>
        {provider.bio ? <p className={styles.bio}>{provider.bio}</p> : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onShowToast("Tính năng nhắn tin chưa được hỗ trợ.")}
          >
            <MessageCircle size={18} aria-hidden="true" />
            Nhắn tin
          </button>
        </div>
      </section>
    </main>
  );
}
