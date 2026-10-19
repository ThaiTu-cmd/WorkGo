"use client";

import { useEffect, useRef } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import styles from "./TrungSubNav.module.css";

export type TrungSubNavProps = {
  current: string;
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  /** Cycle 4: hide the Đăng nhập / Đăng ký entries once the user is signed in. */
  isAuthenticated?: boolean;
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

// Cycle 4: the two auth entry points disappear from the auxiliary nav once a
// session exists (the header account group takes over). LINKS stays complete so
// the route table is still the single source of truth for every trung page.
const AUTH_LINK_KEYS = ["register", "login"];

export default function TrungSubNav({ current, onNavigate, isAuthenticated = false }: TrungSubNavProps) {
  const barRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const links = isAuthenticated ? LINKS.filter((l) => !AUTH_LINK_KEYS.includes(l.key)) : LINKS;

  // UI cycle 2 — scroll affordance: phát trạng thái tràn 2 đầu qua data-attribute
  // trên .bar (KHÔNG setState → không vi phạm react-hooks/set-state-in-effect;
  // HTML SSR không có attribute → không hydration mismatch).
  useEffect(() => {
    const bar = barRef.current;
    const inner = innerRef.current;
    if (!bar || !inner) return;
    const update = () => {
      bar.dataset.fadeLeft = inner.scrollLeft > 2 ? "true" : "false";
      bar.dataset.fadeRight =
        inner.scrollLeft + inner.clientWidth < inner.scrollWidth - 2 ? "true" : "false";
    };
    update();
    inner.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(inner);
    document.fonts?.ready.then(update).catch(() => {});
    return () => {
      inner.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, []);

  // UI cycle 2 — roving focus bằng phím (D14): Arrow trái/phải di chuyển focus
  // giữa 15 nút, Home/End nhảy đầu/cuối, cuộn nút vào giữa tầm nhìn.
  // block:"nearest" để không giật trang dọc; preventDefault chặn scroll ngang mặc định.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const inner = innerRef.current;
    if (!inner) return;
    const buttons = Array.from(inner.querySelectorAll("button"));
    if (buttons.length === 0) return;
    const active = document.activeElement;
    const idx = active instanceof HTMLButtonElement ? buttons.indexOf(active) : -1;
    let next = idx;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = buttons.length - 1;
    else if (e.key === "ArrowLeft") next = idx <= 0 ? 0 : idx - 1;
    else next = idx < 0 ? 0 : Math.min(idx + 1, buttons.length - 1);
    e.preventDefault();
    buttons[next].focus();
    buttons[next].scrollIntoView({ block: "nearest", inline: "center" });
  };

  return (
    <nav ref={barRef} className={styles.bar} aria-label="Điều hướng bổ sung WorkGo">
      <div ref={innerRef} className={styles.inner} onKeyDown={onKeyDown}>
        {links.map((l) => (
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
