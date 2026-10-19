"use client";

import { useRef, useState } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { saveAuth } from "../_stores/auth";
import { loginSchema } from "./authValidation";
import styles from "./LoginPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

type Field = "email" | "password";
type Values = { email: string; password: string };

const quotaToast =
  "Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.";

function fieldError(field: Field, values: Values): string | undefined {
  const parsed = loginSchema.safeParse(values);
  if (parsed.success) return undefined;
  return parsed.error.flatten().fieldErrors[field]?.[0];
}

export default function LoginPage({ onNavigate, onShowToast }: TrungPageProps) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const values: Values = { email, password };

  const handleChange = (field: Field, value: string) => {
    if (field === "email") setEmail(value);
    else setPassword(value);
    // BUG-4 (cycle 4): clear the stale error as soon as the user edits the field.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleBlur = (field: Field) => {
    setErrors((prev) => ({ ...prev, [field]: fieldError(field, values) }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setErrors({});
    const isDemoAdmin = email.trim().toLowerCase() === "admin";
    const user = isDemoAdmin
      ? { name: "admin", email: "admin@workgo.vn" }
      : { name: email.trim(), email: email.trim() };
    if (!saveAuth(user)) {
      onShowToast(quotaToast);
      return;
    }
    onShowToast(isDemoAdmin ? "Đăng nhập thành công với tài khoản Admin (Demo)!" : "Đăng nhập thành công!");
    onNavigate("catalog");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Đăng nhập WorkGo</h1>
        <p className={styles.sub}>Chào mừng bạn quay trở lại sàn dịch vụ WorkGo.</p>
        <div className={styles.demoBox}>
          <span>Tài khoản demo: <strong>admin</strong> | Mật khẩu: <strong>123456</strong></span>
          <button
            type="button"
            className={styles.demoFillBtn}
            onClick={() => {
              setEmail("admin");
              setPassword("123456");
              setErrors({});
            }}
          >
            Điền nhanh
          </button>
        </div>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>Tài khoản / Email</span>
            <input
              ref={emailRef}
              type="text"
              autoFocus
              autoComplete="username"
              value={email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder="admin hoặc ban@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
            {errors.email ? (
              <em id="login-email-error" className={styles.error}>
                {errors.email}
              </em>
            ) : null}
          </label>
          <label className={styles.field}>
            <span>Mật khẩu</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder="Tối thiểu 6 ký tự"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "login-password-error" : undefined}
            />
            {errors.password ? (
              <em id="login-password-error" className={styles.error}>
                {errors.password}
              </em>
            ) : null}
          </label>
          <button type="submit" className={styles.submit}>
            Đăng nhập
          </button>
        </form>
        <p className={styles.swap}>
          Chưa có tài khoản?{" "}
          <button type="button" className={styles.link} onClick={() => onNavigate("register")}>
            Đăng ký ngay
          </button>
        </p>
      </div>
    </main>
  );
}
