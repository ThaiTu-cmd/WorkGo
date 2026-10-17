"use client";

import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import styles from "./TrungSubNav.module.css";

export type TrungSubNavProps = {
  current: string;
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
};

const LINKS: Array<{ key: TrungPageKey; label: string }> = [
  { key: "register", label: "Đăng ký" },
  { key: "login", label: "Đăng nhập" },
  { key: "profile-settings", label: "Hồ sơ" },
  { key: "address-book", label: "Địa chỉ" },
  { key: "provider-onboarding", label: "Làm Provider" },
  { key: "provider-profile", label: "Provider" },
  { key: "job-list", label: "Tìm việc" },
  { key: "job-post", label: "Đăng việc" },
  { key: "submit-proposal", label: "Gửi đề xuất" },
  { key: "proposal-review", label: "Duyệt đề xuất" },
  { key: "payment-gateway", label: "Nạp tiền" },
  { key: "wallet", label: "Ví" },
  { key: "payout-settings", label: "Rút tiền" },
  { key: "review-form", label: "Đánh giá" },
  { key: "dispute-center", label: "Tranh chấp" },
];

export default function TrungSubNav({ current, onNavigate }: TrungSubNavProps) {
  return (
    <nav className={styles.bar} aria-label="Điều hướng bổ sung WorkGo">
      <div className={styles.inner}>
        {LINKS.map((l) => (
          <button
            key={l.key}
            type="button"
            className={l.key === current ? `${styles.link} ${styles.active}` : styles.link}
            aria-current={l.key === current ? "page" : undefined}
            onClick={() => onNavigate(l.key)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
