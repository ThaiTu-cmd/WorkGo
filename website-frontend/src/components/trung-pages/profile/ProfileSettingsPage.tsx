"use client";

import { useState } from "react";
import Image from "next/image";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { KEYS } from "../_stores/keys";
import { mockProfile } from "../_mocks/mockProfile";
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

type Profile = { name: string; phone: string; avatarUrl: string };

function loadProfile(): Profile {
  if (typeof window === "undefined") return mockProfile;
  try {
    const raw = window.localStorage.getItem(KEYS.profile);
    if (!raw) return mockProfile;
    const p = JSON.parse(raw) as Partial<Profile>;
    return {
      name: typeof p.name === "string" && p.name ? p.name : mockProfile.name,
      phone: typeof p.phone === "string" && p.phone ? p.phone : mockProfile.phone,
      avatarUrl: typeof p.avatarUrl === "string" && p.avatarUrl ? p.avatarUrl : mockProfile.avatarUrl,
    };
  } catch {
    return mockProfile;
  }
}

export default function ProfileSettingsPage({ onShowToast }: TrungPageProps) {
  const [name, setName] = useState(() => loadProfile().name);
  const [phone, setPhone] = useState(() => loadProfile().phone);
  const [avatarUrl, setAvatarUrl] = useState(() => loadProfile().avatarUrl);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name);
    const cleanPhone = sanitizeText(phone);
    const cleanAvatar = sanitizeText(avatarUrl);
    const next: typeof errors = {};
    if (cleanName.length < 2) next.name = "Vui lòng nhập tên từ 2 ký tự!";
    if (!/^0\d{9}$/.test(cleanPhone)) next.phone = "Số điện thoại phải 10 số, bắt đầu bằng 0!";
    setErrors(next);
    if (next.name ?? next.phone) return;
    try {
      window.localStorage.setItem(
        KEYS.profile,
        JSON.stringify({ name: cleanName, phone: cleanPhone, avatarUrl: cleanAvatar }),
      );
    } catch {
      onShowToast("Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.");
      return;
    }
    onShowToast("Đã lưu hồ sơ của bạn!");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cài đặt hồ sơ</h1>
        <p className={styles.sub}>Thông tin này hiển thị cho khách hàng khi bạn nhận việc.</p>
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
          <button type="submit" className={styles.submit}>
            Lưu hồ sơ
          </button>
        </form>
      </div>
    </main>
  );
}
