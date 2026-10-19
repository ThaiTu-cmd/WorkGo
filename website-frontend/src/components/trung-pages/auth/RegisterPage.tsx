"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { authApi, splitFullName } from "../../webapp-bridge/backend";
import { registerSchema } from "./authValidation";
import styles from "./RegisterPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

export default function RegisterPage({ onNavigate, onShowToast }: TrungPageProps) {
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"name" | "userName" | "email" | "phone" | "password" | "form", string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ name, userName, email, phone, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        name: flat.name?.[0],
        userName: flat.userName?.[0],
        email: flat.email?.[0],
        phone: flat.phone?.[0],
        password: flat.password?.[0],
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { name: fullName, ...rest } = parsed.data;
      await authApi.register({ ...splitFullName(fullName), ...rest });
    } catch (err) {
      setErrors({ form: (err as Error)?.message || "Không kết nối được máy chủ. Vui lòng thử lại." });
      return;
    } finally {
      setSubmitting(false);
    }
    onShowToast("Đăng ký thành công! Mời bạn đăng nhập.");
    onNavigate("login");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <UserPlus size={24} className={styles.titleIcon} aria-hidden="true" /> Tạo tài khoản WorkGo
        </h1>
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
            <span>Tên đăng nhập</span>
            <input
              type="text"
              autoComplete="username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="nguyenvana"
              aria-invalid={errors.userName ? true : undefined}
            />
            {errors.userName ? <em className={styles.error}>{errors.userName}</em> : null}
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
            <span>Số điện thoại</span>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              aria-invalid={errors.phone ? true : undefined}
            />
            {errors.phone ? <em className={styles.error}>{errors.phone}</em> : null}
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
          {errors.form ? (
            <em className={styles.error} role="alert">
              {errors.form}
            </em>
          ) : null}
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Đang đăng ký..." : "Đăng ký"}
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
