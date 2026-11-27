"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { CatalogFilterParams, PageKey } from "../../shell/MarketplaceShell";
import { authApi, splitFullName, useAuthToken } from "../../shell/backend";
import { registerSchema } from "./authValidation";
import styles from "./RegisterPage.module.css";
export type PageProps = {
  onNavigate: (page: PageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};
export default function RegisterPage({
  onNavigate,
  onShowToast
}: PageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"name" | "userName" | "email" | "phone" | "password" | "form", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse({
      name,
      userName,
      email,
      phone,
      password
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        name: flat.name?.[0],
        userName: flat.userName?.[0],
        email: flat.email?.[0],
        phone: flat.phone?.[0],
        password: flat.password?.[0]
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const {
        name: fullName,
        ...rest
      } = parsed.data;
      await authApi.register({
        ...splitFullName(fullName),
        ...rest
      });
    } catch (err) {
      setErrors({
        form: (err as Error)?.message || tr("m1140")
      });
      return;
    } finally {
      setSubmitting(false);
    }
    onShowToast(tr("m1149"));
    onNavigate("login");
  };

  if (token) {
    return (
      <main className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            <UserPlus size={24} className={styles.titleIcon} aria-hidden="true" />
            {tr("m1152")}
          </h1>
          <p className={styles.sub}>Bạn hiện đang đăng nhập trên hệ thống WorkGo.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
            <button type="button" className={styles.submit} onClick={() => onNavigate("profile-settings")}>
              Quản lý hồ sơ cá nhân
            </button>
            <button type="button" className={styles.submit} style={{ background: "transparent", color: "var(--wg-primary)", border: "1px solid var(--wg-primary)" }} onClick={() => onNavigate("catalog")}>
              Đến danh mục dịch vụ
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <UserPlus size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1152")}</h1>
        <p className={styles.sub}>{tr("m1153")}</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m295")}</span>
            <input type="text" autoFocus autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder={tr("m66")} aria-invalid={errors.name ? true : undefined} />
            {errors.name ? <em className={styles.error}>{errors.name}</em> : null}
          </label>
          <label className={styles.field}>
            <span>{tr("m1154")}</span>
            <input type="text" autoComplete="username" value={userName} onChange={e => setUserName(e.target.value)} placeholder="nguyenvana" aria-invalid={errors.userName ? true : undefined} />
            {errors.userName ? <em className={styles.error}>{errors.userName}</em> : null}
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@example.com" aria-invalid={errors.email ? true : undefined} />
            {errors.email ? <em className={styles.error}>{errors.email}</em> : null}
          </label>
          <label className={styles.field}>
            <span>{tr("m1155")}</span>
            <input type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901234567" aria-invalid={errors.phone ? true : undefined} />
            {errors.phone ? <em className={styles.error}>{errors.phone}</em> : null}
          </label>
          <label className={styles.field}>
            <span>{tr("m41")}</span>
            <input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder={tr("m1142")} aria-invalid={errors.password ? true : undefined} />
            {errors.password ? <em className={styles.error}>{errors.password}</em> : null}
          </label>
          {errors.form ? <em className={styles.error} role="alert">
              {errors.form}
            </em> : null}
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? tr("m1150") : tr("m36")}
          </button>
        </form>
        <p className={styles.swap}>{tr("m30")}{" "}
          <button type="button" className={styles.link} onClick={() => onNavigate("login")}>{tr("m32")}</button>
        </p>
      </div>
    </main>;
}