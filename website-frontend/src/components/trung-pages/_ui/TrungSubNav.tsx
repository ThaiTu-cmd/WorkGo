"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import styles from "./TrungSubNav.module.css";
export type TrungSubNavProps = {
  current: string;
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  /** Cycle 4: hide the Đăng nhập / Đăng ký entries once the user is signed in. */
  isAuthenticated?: boolean;
};
// `label` is a key of the "misc" dictionary, translated with tr() at render.
const LINKS: Array<{
  key: TrungPageKey;
  label: string;
}> = [{
  key: "register",
  label: "m1694"
}, {
  key: "login",
  label: "m1695"
}, {
  key: "profile-settings",
  label: "m1696"
}, {
  key: "address-book",
  label: "m1697"
}, {
  key: "provider-onboarding",
  label: "m1698"
}, {
  key: "provider-profile",
  label: "m1699"
}, {
  key: "job-list",
  label: "m1700"
}, {
  key: "job-post",
  label: "m1701"
}, {
  key: "submit-proposal",
  label: "m1702"
}, {
  key: "proposal-review",
  label: "m1703"
}, {
  key: "payment-gateway",
  label: "m1665"
}, {
  key: "wallet",
  label: "m1664"
}, {
  key: "payout-settings",
  label: "m1666"
}, {
  key: "review-form",
  label: "m1704"
}, {
  key: "dispute-center",
  label: "m1705"
}];

// Cycle 4: the two auth entry points disappear from the auxiliary nav once a
// session exists (the header account group takes over). LINKS stays complete so
// the route table is still the single source of truth for every trung page.
const AUTH_LINK_KEYS = ["register", "login"];
export default function TrungSubNav({
  current,
  onNavigate,
  isAuthenticated = false
}: TrungSubNavProps) {
  const tr = useTranslations("misc");
  const barRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const links = isAuthenticated ? LINKS.filter(l => !AUTH_LINK_KEYS.includes(l.key)) : LINKS;

  // UI cycle 2 — scroll affordance: phát trạng thái tràn 2 đầu qua data-attribute
  // trên .bar (KHÔNG setState → không vi phạm react-hooks/set-state-in-effect;
  // HTML SSR không có attribute → không hydration mismatch).
  useEffect(() => {
    const bar = barRef.current;
    const inner = innerRef.current;
    if (!bar || !inner) return;
    const update = () => {
      bar.dataset.fadeLeft = inner.scrollLeft > 2 ? "true" : "false";
      bar.dataset.fadeRight = inner.scrollLeft + inner.clientWidth < inner.scrollWidth - 2 ? "true" : "false";
    };
    update();
    inner.addEventListener("scroll", update, {
      passive: true
    });
    window.addEventListener("resize", update, {
      passive: true
    });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
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
    if (e.key === "Home") next = 0;else if (e.key === "End") next = buttons.length - 1;else if (e.key === "ArrowLeft") next = idx <= 0 ? 0 : idx - 1;else next = idx < 0 ? 0 : Math.min(idx + 1, buttons.length - 1);
    e.preventDefault();
    buttons[next].focus();
    buttons[next].scrollIntoView({
      block: "nearest",
      inline: "center"
    });
  };
  return <nav ref={barRef} className={styles.bar} aria-label={tr("m1443")}>
      <div ref={innerRef} className={styles.inner} onKeyDown={onKeyDown}>
        {links.map(l => <button key={l.key} type="button" className={l.key === current ? `${styles.link} ${styles.active}` : styles.link} aria-current={l.key === current ? "page" : undefined} onClick={() => onNavigate(l.key)}>
            {tr(l.label)}
          </button>)}
      </div>
    </nav>;
}