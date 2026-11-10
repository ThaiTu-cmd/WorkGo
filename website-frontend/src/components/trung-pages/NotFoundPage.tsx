"use client";

import React, { useEffect, useRef } from "react";
import styles from "./NotFoundPage.module.css";

interface Props {
  requestedKey?: string;
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
}

export default function NotFoundPage({ requestedKey = "", onNavigate }: Props) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [requestedKey]);

  const navigateTo = (page: string) => {
    if (typeof onNavigate === "function") {
      onNavigate(page);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBadge}>404</div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={styles.title}
        >
          Không tìm thấy trang yêu cầu
        </h1>
        <p className={styles.description}>
          Trang bạn đang tìm kiếm không tồn tại hoặc nội dung đang được cập nhật trong phiên bản tiếp theo.
        </p>
        {requestedKey && (
          <div className={styles.keyInfo}>
            <span className={styles.keyLabel}>Đường dẫn yêu cầu:</span>
            <code className={styles.keyCode}>{requestedKey}</code>
          </div>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => navigateTo("home")}
            className={styles.btnPrimary}
          >
            Về Trang chủ
          </button>
          <button
            type="button"
            onClick={() => navigateTo("catalog")}
            className={styles.btnSecondary}
          >
            Khám phá dịch vụ
          </button>
        </div>
      </div>
    </div>
  );
}
