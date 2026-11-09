"use client";

import { useTranslations } from "next-intl";
import React, { useEffect, useRef } from "react";
import styles from "./NotFoundPage.module.css";
interface Props {
  requestedKey?: string;
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
}
export default function NotFoundPage({
  requestedKey = "",
  onNavigate
}: Props) {
  const tr = useTranslations("misc");
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    headingRef.current?.focus({
      preventScroll: true
    });
  }, [requestedKey]);
  const navigateTo = (page: string) => {
    if (typeof onNavigate === "function") {
      onNavigate(page);
    }
  };
  return <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBadge}>404</div>
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>{tr("m606")}</h1>
        <p className={styles.description}>{tr("m607")}</p>
        {requestedKey && <div className={styles.keyInfo}>
            <span className={styles.keyLabel}>{tr("m608")}</span>
            <code className={styles.keyCode}>{requestedKey}</code>
          </div>}
        <div className={styles.actions}>
          <button type="button" onClick={() => navigateTo("home")} className={styles.btnPrimary}>{tr("m241")}</button>
          <button type="button" onClick={() => navigateTo("catalog")} className={styles.btnSecondary}>{tr("m609")}</button>
        </div>
      </div>
    </div>;
}