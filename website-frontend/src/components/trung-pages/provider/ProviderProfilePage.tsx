"use client";

import { useTranslations } from "next-intl";
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
  VERIFIED: "Verified",
  PENDING: "Awaiting verification",
  REJECTED: "Verification refused",
  SUSPENDED: "Temporarily locked"
};
export default function ProviderProfilePage({
  onNavigate,
  onShowToast,
  providerId
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const requestKey = `${token}|${providerId ?? ""}`;
  const [result, setResult] = useState<{
    key: string;
    state: LoadState;
    provider: Provider | null;
  } | null>(null);
  const state: LoadState = !token ? "needs-login" : result?.key === requestKey ? result.state : "loading";
  const provider = result?.key === requestKey ? result.provider : null;
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    const done = (next: LoadState, p: Provider | null = null) => {
      if (!cancelled) setResult({
        key: requestKey,
        state: next,
        provider: p
      });
    };
    // No id → the signed-in provider's own profile.
    const req = providerId ? providerApi.getProvider(providerId) : providerApi.getMyProfile();
    req.then((res: {
      result?: unknown;
    }) => {
      if (!res?.result) done("not-found");else done("ready", toProvider(res.result));
    }).catch((err: {
      status?: number;
    }) => {
      if (err?.status === 401) done("needs-login");else if (err?.status === 404 || err?.status === 400) done("not-found");else done("error");
    });
    return () => {
      cancelled = true;
    };
  }, [token, providerId, requestKey]);
  if (state !== "ready" || !provider) {
    return <main className={styles.wrap}>
        <section className={styles.hero}>
          {state === "loading" ? <p className={styles.bio}>{tr("m1378")}</p> : null}
          {state === "needs-login" ? <>
              <p className={styles.bio}>{tr("m1379")}</p>
              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={() => onNavigate("login")}>{tr("m32")}</button>
              </div>
            </> : null}
          {state === "not-found" ? <p className={styles.bio}>
              {providerId ? tr("m1372") : tr("m1373")}
            </p> : null}
          {state === "error" ? <p className={styles.bio} role="alert">{tr("m1381")}</p> : null}
        </section>
      </main>;
  }
  return <main className={styles.wrap}>
      <section className={styles.hero} aria-label={tr("m1374", {
      p0: provider.name
    })}>
        <div className={styles.idRow}>
          <span className={styles.avatar} aria-hidden="true">
            {provider.name.charAt(0)}
          </span>
          <div className={styles.idText}>
            <h1 className={styles.name}>{provider.name}</h1>
            <p className={styles.meta}>
              <BadgeCheck size={16} className={styles.star} aria-hidden="true" />
              <span>
                {VERIFICATION_LABEL[provider.verificationStatus ?? ""] ?? tr("m1375")}
                {provider.providerType ? ` • ${provider.providerType}` : ""}
              </span>
            </p>
            {provider.joinedAt ? <p className={styles.meta}>
                <CalendarDays size={16} aria-hidden="true" />
                <span>Tham gia từ {new Date(provider.joinedAt).toLocaleDateString("vi-VN")}</span>
              </p> : null}
          </div>
        </div>
        {provider.bio ? <p className={styles.bio}>{provider.bio}</p> : null}
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => onShowToast(tr("m1376"))}>
            <MessageCircle size={18} aria-hidden="true" />{tr("m875")}</button>
        </div>
      </section>
    </main>;
}