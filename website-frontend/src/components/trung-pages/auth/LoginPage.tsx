"use client";

import { useRef, useState } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { KEYS } from "../_stores/keys";
import { loginSchema } from "./authValidation";
import styles from "./LoginPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

export default function LoginPage({ onNavigate, onShowToast }: TrungPageProps) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setErrors({});
    try {
      window.localStorage.setItem(KEYS.authToken, `mock-token-${Date.now()}`);
    } catch {
      onShowToast("Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.");
      return;
    }
    onShowToast("Đăng nhập thành công!");
    onNavigate("home");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Đăng nhập WorkGo</h1>
        <p className={styles.sub}>Chào mừng bạn quay trở lại sàn dịch vụ WorkGo.</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              ref={emailRef}
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@example.com"
              aria-invalid={errors.email ? true : undefined}
            />
            {errors.email ? <em className={styles.error}>{errors.email}</em> : null}
          </label>
          <label className={styles.field}>
            <span>Mật khẩu</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              aria-invalid={errors.password ? true : undefined}
            />
            {errors.password ? <em className={styles.error}>{errors.password}</em> : null}
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
