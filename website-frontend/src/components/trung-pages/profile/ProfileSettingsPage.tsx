"use client";

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

export default function ProfileSettingsPage({ onNavigate, onShowToast }: TrungPageProps) {
  const token = useAuthToken();
  const [result, setResult] = useState<{ token: string; state: LoadState } | null>(null);
  const state: LoadState = !token ? "needs-login" : result?.token === token ? result.state : "loading";
  const [me, setMe] = useState<MyInfo | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; password?: string }>({});

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    authApi
      .getMyInfo()
      .then((res: { result?: MyInfo }) => {
        if (cancelled || !res?.result) return;
        const user = res.result;
        setMe(user);
        setName(joinFullName(user));
        setPhone(user.phone ?? "");
        setAvatarUrl(user.avatarUrl ?? "");
        setResult({ token, state: "ready" });
      })
      .catch((err: { status?: number }) => {
        if (!cancelled) setResult({ token, state: err?.status === 401 ? "needs-login" : "error" });
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
    if (cleanName.length < 2) next.name = "Vui lòng nhập tên từ 2 ký tự!";
    if (!/^0\d{9}$/.test(cleanPhone)) next.phone = "Số điện thoại phải 10 số, bắt đầu bằng 0!";
    if (password.length < 6) next.password = "Nhập mật khẩu hiện tại để xác nhận (tối thiểu 6 ký tự)!";
    setErrors(next);
    if (next.name ?? next.phone ?? next.password) return;

    // PUT /users/{id} overwrites every field and re-hashes `password`,
    // so send the full record plus the current password (see BACKEND_GAPS.md).
    setSaving(true);
    try {
      const res = await authApi.updateUser(me.userId, {
        ...splitFullName(cleanName),
        userName: me.userName,
        email: me.email ?? null,
        phone: cleanPhone,
        avatarUrl: cleanAvatar || null,
        password,
      });
      if (res?.result) setMe(res.result);
      setPassword("");
      onShowToast("Đã lưu hồ sơ của bạn!");
    } catch (err) {
      onShowToast(`Không lưu được hồ sơ: ${(err as Error)?.message || "lỗi kết nối máy chủ"}`);
    } finally {
      setSaving(false);
    }
  };

  if (state !== "ready") {
    return (
      <main className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            <UserCog size={24} className={styles.titleIcon} aria-hidden="true" /> Cài đặt hồ sơ
          </h1>
          {state === "loading" ? <p className={styles.sub}>Đang tải hồ sơ...</p> : null}
          {state === "needs-login" ? (
            <>
              <p className={styles.sub}>Đăng nhập để xem và chỉnh sửa hồ sơ của bạn.</p>
              <button type="button" className={styles.submit} onClick={() => onNavigate("login")}>
                Đăng nhập
              </button>
            </>
          ) : null}
          {state === "error" ? (
            <p className={styles.error} role="alert">
              Không tải được hồ sơ. Kiểm tra kết nối tới máy chủ rồi thử lại.
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <UserCog size={24} className={styles.titleIcon} aria-hidden="true" /> Cài đặt hồ sơ
        </h1>
        <p className={styles.sub}>
          Tài khoản <strong>{me?.userName}</strong>
          {me?.email ? ` • ${me.email}` : ""}
        </p>
        {avatarUrl.trim() !== "" ? (
          <Image
            className={styles.preview}
            src={sanitizeText(avatarUrl)}
            alt="Ảnh đại diện xem trước"
            width={96}
            height={96}
            unoptimized
          />
        ) : null}
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>Ảnh đại diện (URL)</span>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              inputMode="url"
            />
          </label>
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
            <span>Số điện thoại</span>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              inputMode="tel"
              aria-invalid={errors.phone ? true : undefined}
            />
            {errors.phone ? <em className={styles.error}>{errors.phone}</em> : null}
          </label>
          <label className={styles.field}>
            <span>Mật khẩu hiện tại (để xác nhận)</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={errors.password ? true : undefined}
            />
            {errors.password ? <em className={styles.error}>{errors.password}</em> : null}
          </label>
          <button type="submit" className={styles.submit} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu hồ sơ"}
          </button>
        </form>
      </div>
    </main>
  );
}
