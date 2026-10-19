"use client";

import { useState } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { saveAuth } from "../_stores/auth";
import { registerSchema } from "./authValidation";
import styles from "./RegisterPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

type Field = "name" | "email" | "password";
type Values = { name: string; email: string; password: string };

const quotaToast =
  "Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.";

function fieldError(field: Field, values: Values): string | undefined {
  const parsed = registerSchema.safeParse(values);
  if (parsed.success) return undefined;
  return parsed.error.flatten().fieldErrors[field]?.[0];
}

export default function RegisterPage({ onNavigate, onShowToast }: TrungPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const values: Values = { name, email, password };

  const handleChange = (field: Field, value: string) => {
    if (field === "name") setName(value);
    else if (field === "email") setEmail(value);
    else setPassword(value);
    // BUG-4 (cycle 4): clear the stale error as soon as the user edits the field.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleBlur = (field: Field) => {
    setErrors((prev) => ({ ...prev, [field]: fieldError(field, values) }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ name: flat.name?.[0], email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setErrors({});
    // BUG-3 (cycle 4): a mock registration signs the user straight in and lands
    // on home — bouncing back to the login form made the flow feel broken.
    if (!saveAuth({ name: parsed.data.name, email: parsed.data.email })) {
      onShowToast(quotaToast);
      return;
    }
    onShowToast("Đăng ký thành công!");
    onNavigate("home");
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
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              placeholder="Nguyễn Văn A"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "register-name-error" : undefined}
            />
            {errors.name ? (
              <em id="register-name-error" className={styles.error}>
                {errors.name}
              </em>
            ) : null}
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder="ban@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "register-email-error" : undefined}
            />
            {errors.email ? (
              <em id="register-email-error" className={styles.error}>
                {errors.email}
              </em>
            ) : null}
          </label>
          <label className={styles.field}>
            <span>Mật khẩu</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder="Tối thiểu 6 ký tự"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "register-password-error" : undefined}
            />
            {errors.password ? (
              <em id="register-password-error" className={styles.error}>
                {errors.password}
              </em>
            ) : null}
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
