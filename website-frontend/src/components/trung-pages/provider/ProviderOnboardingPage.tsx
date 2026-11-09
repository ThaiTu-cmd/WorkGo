"use client";

import { useTranslations } from "next-intl";
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
  PENDING: "Profile is waiting for admin approval. Once approved, log out and log back in to gain access to the service.",
  VERIFIED: "You are already an Expert. If you can't sign up to the service, sign out and sign back in to update permissions.",
  REJECTED: "The application has been rejected. Please contact WorkGo for support.",
  SUSPENDED: "The Expert account is temporarily locked."
};
export default function ProviderOnboardingPage({
  onNavigate,
  onShowToast
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [result, setResult] = useState<{
    token: string;
    state: LoadState;
    provider: Provider | null;
  } | null>(null);
  const state: LoadState = !token ? "needs-login" : result?.token === token ? result.state : "loading";
  const provider = result?.token === token ? result.provider : null;
  const [providerType, setProviderType] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    businessName?: string;
    bio?: string;
    agreed?: string;
    form?: string;
  }>({});

  // An existing profile (any status) replaces the form with its status.
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    providerApi.getMyProfile().then((res: {
      result?: unknown;
    }) => {
      if (cancelled) return;
      setResult(res?.result ? {
        token,
        state: "has-profile",
        provider: toProvider(res.result)
      } : {
        token,
        state: "none",
        provider: null
      });
    }).catch((err: {
      status?: number;
    }) => {
      if (cancelled) return;
      // 404 / 400 = PROVIDER_PROFILE_NOT_EXISTED → show the form.
      const next: LoadState = err?.status === 401 ? "needs-login" : err?.status === 404 || err?.status === 400 ? "none" : "error";
      setResult({
        token,
        state: next,
        provider: null
      });
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
      next.businessName = tr("m1348");
    }
    if (cleanBio.length < 20) {
      next.bio = tr("m1349");
    }
    if (!agreed) {
      next.agreed = tr("m1350");
    }
    setErrors(next);
    if (next.businessName ?? next.bio ?? next.agreed) return;
    setSubmitting(true);
    try {
      const res = await providerApi.createProfile({
        providerType,
        businessName: cleanBusiness,
        bio: cleanBio
      });
      setResult({
        token,
        state: "has-profile",
        provider: res?.result ? toProvider(res.result) : null
      });
      onShowToast(tr("m1351"));
    } catch (err) {
      setErrors({
        form: tr("m1464", {
          p0: (err as Error)?.message || tr("m1303")
        })
      });
    } finally {
      setSubmitting(false);
    }
  };
  if (state !== "none") {
    return <main className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            <BadgeCheck size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1357")}</h1>
          {state === "loading" ? <p className={styles.sub}>{tr("m1358")}</p> : null}
          {state === "needs-login" ? <>
              <p className={styles.sub}>{tr("m1359")}</p>
              <button type="button" className={styles.submit} onClick={() => onNavigate("login")}>{tr("m32")}</button>
            </> : null}
          {state === "error" ? <p className={styles.error} role="alert">{tr("m1360")}</p> : null}
          {state === "has-profile" ? <>
              <p className={styles.sub}>{tr("m47")}<strong>{provider?.name}</strong>{tr("m1361")}<strong>{provider?.verificationStatus ?? "PENDING"}</strong>
              </p>
              <p className={styles.sub}>{STATUS_TEXT[provider?.verificationStatus ?? "PENDING"]}</p>
              {provider?.verificationStatus === "VERIFIED" ? <button type="button" className={styles.submit} onClick={() => onNavigate("my-services")}>{tr("m176")}</button> : null}
            </> : null}
        </div>
      </main>;
  }
  return <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <BadgeCheck size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1357")}</h1>
        <p className={styles.sub}>{tr("m1566")}</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m272")}</span>
            <select value={providerType} onChange={e => setProviderType(e.target.value as "INDIVIDUAL" | "COMPANY")}>
              <option value="INDIVIDUAL">{tr("m226")}</option>
              <option value="COMPANY">{tr("m225")}</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>{tr("m1363")}</span>
            <input type="text" autoFocus value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder={tr("m1353")} aria-invalid={errors.businessName ? true : undefined} />
            {errors.businessName ? <em className={styles.error}>{errors.businessName}</em> : null}
          </label>
          <label className={styles.field}>
            <span>{tr("m1364")}</span>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder={tr("m1354")} rows={5} aria-invalid={errors.bio ? true : undefined} />
            {errors.bio ? <em className={styles.error}>{errors.bio}</em> : null}
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />{tr("m1365")}</label>
          {errors.agreed ? <em className={styles.error}>{errors.agreed}</em> : null}
          {errors.form ? <em className={styles.error} role="alert">
              {errors.form}
            </em> : null}
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? tr("m699") : tr("m635")}
          </button>
          <div style={{
          marginTop: '16px',
          textAlign: 'center',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '12px'
        }}>
            <span style={{
            fontSize: '0.875rem',
            color: '#64748b'
          }}>{tr("m1367")}</span>
            <button type="button" onClick={() => onNavigate("verification-center")} style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
            minHeight: '44px'
          }}>{tr("m1368")}</button>
          </div>
        </form>
      </div>
    </main>;
}