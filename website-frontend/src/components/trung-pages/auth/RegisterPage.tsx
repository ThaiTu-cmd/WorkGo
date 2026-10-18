"use client";

import { useState } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { KEYS } from "../_stores/keys";
import { registerSchema } from "./authValidation";
import styles from "./RegisterPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

export default function RegisterPage({ onNavigate, onShowToast }: TrungPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ name: flat.name?.[0], email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setErrors({});
    try {
      window.localStorage.setItem(KEYS.authToken, `mock-token-${Date.now()}`);
    } catch {
      onShowToast("Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.");
      return;
    }
    onShowToast("Đăng ký thành công!");
    onNavigate("login");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Tạo tài khoản WorkGo</h1>
        <p className={styles.sub}>Đăng ký miễn phí để thuê dịch vụ hoặc trở thành provider.</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>Họ và tên</span>
            <input
              type="text"
              autoFocus
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              aria-invalid={errors.name ? true : undefined}
            />
            {errors.name ? <em className={styles.error}>{errors.name}</em> : null}
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              aria-invalid={errors.password ? true : undefined}
            />
            {errors.password ? <em className={styles.error}>{errors.password}</em> : null}
          </label>
          <button type="submit" className={styles.submit}>
            Đăng ký
          </button>
        </form>
        <p className={styles.swap}>
          Đã có tài khoản?{" "}
          <button type="button" className={styles.link} onClick={() => onNavigate("login")}>
            Đăng nhập
          </button>
        </p>
      </div>
    </main>
  );
}
