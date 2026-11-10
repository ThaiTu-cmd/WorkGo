"use client";

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

export default function LoginPage({ onNavigate, onShowToast }: TrungPageProps) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ userName?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ userName, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ userName: flat.userName?.[0], password: flat.password?.[0] });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await authApi.login(parsed.data.userName, parsed.data.password);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      setErrors({
        form:
          status === 401 || status === 404
            ? "Sai tên đăng nhập hoặc mật khẩu."
            : (err as Error)?.message || "Không kết nối được máy chủ. Vui lòng thử lại.",
      });
      return;
    } finally {
      setSubmitting(false);
    }
    onShowToast("Đăng nhập thành công!");
    onNavigate("home");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <LogIn size={24} className={styles.titleIcon} aria-hidden="true" /> Đăng nhập WorkGo
        </h1>
        <p className={styles.sub}>Chào mừng bạn quay trở lại sàn dịch vụ WorkGo.</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>Tên đăng nhập</span>
            <input
              type="text"
              autoFocus
              autoComplete="username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="nguyenvana"
              aria-invalid={errors.userName ? true : undefined}
            />
            {errors.userName ? <em className={styles.error}>{errors.userName}</em> : null}
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
          {errors.form ? (
            <em className={styles.error} role="alert">
              {errors.form}
            </em>
          ) : null}
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
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
