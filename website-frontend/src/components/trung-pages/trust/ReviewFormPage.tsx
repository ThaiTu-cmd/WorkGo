"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Star } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { trustApi, useAuthToken } from "../../webapp-bridge/backend";
import styles from "./ReviewFormPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  orderId?: string;
};

function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

export default function ReviewFormPage({
  onNavigate,
  onShowToast,
  orderId
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [order, setOrder] = useState(orderId ?? "");
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOrder = sanitizeText(order);
    const cleanComment = sanitizeText(comment);

    if (!token) {
      setError("Vui lòng đăng nhập để gửi đánh giá.");
      return;
    }
    if (cleanOrder.length < 2) {
      setError(tr("m1400"));
      return;
    }
    if (stars < 1 || stars > 5) {
      setError(tr("m1426"));
      return;
    }
    if (cleanComment.length < 10) {
      setError(tr("m1427"));
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await trustApi.submitReview({
        orderId: cleanOrder,
        rating: stars,
        comment: cleanComment,
      });
      onShowToast(tr("m1429"));
      onNavigate("detail");
    } catch (err: unknown) {
      setError((err as Error)?.message || tr("m1140"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <Star size={24} className={styles.titleIcon} aria-hidden="true" />
          {tr("m1434")}
        </h1>
        <p className={styles.sub}>{tr("m1435")}</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m1416")}</span>
            <input
              type="text"
              autoFocus
              value={order}
              onChange={e => setOrder(e.target.value)}
              placeholder="ORD-1042"
            />
          </label>
          <fieldset className={styles.stars}>
            <legend>{tr("m1436")}</legend>
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                className={s <= stars ? styles.starOn : styles.starOff}
                aria-label={tr("m1428", { p0: s })}
                onClick={() => setStars(s)}
              >
                ★
              </button>
            ))}
          </fieldset>
          <label className={styles.field}>
            <span>{tr("m1437")}</span>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder={tr("m1438")}
            />
          </label>
          {error ? <em className={styles.error}>{error}</em> : null}
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? tr("m1143") : tr("m1439")}
          </button>
        </form>
      </div>
    </main>
  );
}
