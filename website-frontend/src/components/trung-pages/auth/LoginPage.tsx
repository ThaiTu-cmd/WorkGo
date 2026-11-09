"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LogIn } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { authApi } from "../../webapp-bridge/backend";
import { loginSchema } from "./authValidation";
import styles from "./LoginPage.module.css";
export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};
export default function LoginPage({
  onNavigate,
  onShowToast
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    userName?: string;
    password?: string;
    form?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({
      userName,
      password
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        userName: flat.userName?.[0],
        password: flat.password?.[0]
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await authApi.login(parsed.data.userName.trim(), parsed.data.password);
    } catch (err) {
      const status = (err as {
        status?: number;
      })?.status;
      setErrors({
        form: status === 401 || status === 404 ? tr("m11") : status === 0 || status !== undefined && status >= 500 ? tr("m12") : (err as Error)?.message || tr("m1140")
      });
      return;
    } finally {
      setSubmitting(false);
    }
    onShowToast(tr("m1141"));
    // Signed-in default view is the catalog, not the guest landing.
    onNavigate("catalog");
  };
  return <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <LogIn size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1145")}</h1>
        <p className={styles.sub}>{tr("m1146")}</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m22")}</span>
            <input type="text" autoFocus autoComplete="username" value={userName} onChange={e => setUserName(e.target.value)} placeholder={tr("m24")} aria-invalid={errors.userName ? true : undefined} />
            {errors.userName ? <em className={styles.error}>{errors.userName}</em> : null}
          </label>
          <label className={styles.field}>
            <span>{tr("m41")}</span>
            <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder={tr("m1142")} aria-invalid={errors.password ? true : undefined} />
            {errors.password ? <em className={styles.error}>{errors.password}</em> : null}
          </label>
          {errors.form ? <em className={styles.error} role="alert">
              {errors.form}
            </em> : null}
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? tr("m1143") : tr("m32")}
          </button>
        </form>
        <p className={styles.swap}>{tr("m29")}{" "}
          <button type="button" className={styles.link} onClick={() => onNavigate("register")}>{tr("m31")}</button>
        </p>
      </div>
    </main>;
}