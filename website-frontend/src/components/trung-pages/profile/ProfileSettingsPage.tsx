"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";
import Image from "next/image";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { authApi, joinFullName, splitFullName, useAuthToken } from "../../webapp-bridge/backend";
import styles from "./ProfileSettingsPage.module.css";
export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};
export function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}
export function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

// identity-service UserResponse (GET /identity/users/myInfo).
type MyInfo = {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  userName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};
type LoadState = "loading" | "ready" | "needs-login" | "error";
export default function ProfileSettingsPage({
  onNavigate,
  onShowToast
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [result, setResult] = useState<{
    token: string;
    state: LoadState;
  } | null>(null);
  const state: LoadState = !token ? "needs-login" : result?.token === token ? result.state : "loading";
  const [me, setMe] = useState<MyInfo | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    authApi.getMyInfo().then((res: {
      result?: MyInfo;
    }) => {
      if (cancelled || !res?.result) return;
      const user = res.result;
      setMe(user);
      setName(joinFullName(user));
      setPhone(user.phone ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
      setResult({
        token,
        state: "ready"
      });
    }).catch((err: {
      status?: number;
    }) => {
      if (!cancelled) setResult({
        token,
        state: err?.status === 401 ? "needs-login" : "error"
      });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    const cleanName = sanitizeText(name);
    const cleanPhone = sanitizeText(phone);
    const cleanAvatar = sanitizeText(avatarUrl);
    const next: typeof errors = {};
    if (cleanName.length < 2) next.name = tr("m1333");
    if (!/^0\d{9}$/.test(cleanPhone)) next.phone = tr("m1306");
    setErrors(next);
    if (next.name ?? next.phone) return;
    setSaving(true);
    try {
      const res = await authApi.updateMyInfo({
        ...splitFullName(cleanName),
        phone: cleanPhone,
        avatarUrl: cleanAvatar || null
      });
      if (res?.result) setMe(res.result);
      onShowToast(tr("m1334"));
    } catch (err) {
      onShowToast(tr("m1463", {
        p0: (err as Error)?.message || tr("m1303")
      }));
    } finally {
      setSaving(false);
    }
  };
  if (state !== "ready") {
    return <main className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            <UserCog size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1338")}</h1>
          {state === "loading" ? <p className={styles.sub}>{tr("m1339")}</p> : null}
          {state === "needs-login" ? <>
              <p className={styles.sub}>{tr("m1340")}</p>
              <button type="button" className={styles.submit} onClick={() => onNavigate("login")}>{tr("m32")}</button>
            </> : null}
          {state === "error" ? <p className={styles.error} role="alert">{tr("m1341")}</p> : null}
        </div>
      </main>;
  }
  return <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <UserCog size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1338")}</h1>
        <p className={styles.sub}>{tr("m46")}<strong>{me?.userName}</strong>
          {me?.email ? ` • ${me.email}` : ""}
        </p>
        {avatarUrl.trim() !== "" ? <Image className={styles.preview} src={sanitizeText(avatarUrl)} alt={tr("m1336")} width={96} height={96} unoptimized /> : null}
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m1342")}</span>
            <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." inputMode="url" />
          </label>
          <label className={styles.field}>
            <span>{tr("m295")}</span>
            <input type="text" autoFocus autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder={tr("m66")} aria-invalid={errors.name ? true : undefined} />
            {errors.name ? <em className={styles.error}>{errors.name}</em> : null}
          </label>
          <label className={styles.field}>
            <span>{tr("m1155")}</span>
            <input type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901234567" inputMode="tel" aria-invalid={errors.phone ? true : undefined} />
            {errors.phone ? <em className={styles.error}>{errors.phone}</em> : null}
          </label>
          <button type="submit" className={styles.submit} disabled={saving}>
            {saving ? tr("m1130") : tr("m1337")}
          </button>
        </form>
      </div>
    </main>;
}