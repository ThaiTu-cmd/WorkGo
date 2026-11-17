"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Star } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { trustApi, useAuthToken } from "../../webapp-bridge/backend";
import { mockReviews, type Review } from "../_mocks/mockReviews";
import styles from "./ReviewFormPage.module.css";
export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  orderId?: string;
};
const REVIEWS_KEY = "workgo_reviews";
function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}
function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}
function loadReviews(): Review[] {
  if (typeof window === "undefined") return mockReviews;
  try {
    const raw = window.localStorage.getItem(REVIEWS_KEY);
    if (!raw) return mockReviews;
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) && p.length > 0 ? p as Review[] : mockReviews;
  } catch {
    return mockReviews;
  }
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
      if (token) {
        await trustApi.submitReview({
          orderId: cleanOrder,
          rating: stars,
          comment: cleanComment,
        });
      }
      // Keep local store synchronized for offline view
      const existing = loadReviews();
      try {
        window.localStorage.setItem(REVIEWS_KEY, JSON.stringify([{
          orderId: cleanOrder,
          stars,
          comment: cleanComment,
          at: new Date().toISOString().slice(0, 10)
        }, ...existing]));
      } catch {
        /* storage full */
      }
      onShowToast(tr("m1429"));
      onNavigate("detail");
    } catch (err: unknown) {
      setError((err as Error)?.message || tr("m1140"));
    } finally {
      setSubmitting(false);
    }
  };
  return <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <Star size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1434")}</h1>
        <p className={styles.sub}>{tr("m1435")}</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m1416")}</span>
            <input type="text" autoFocus value={order} onChange={e => setOrder(e.target.value)} placeholder="ORD-1042" />
          </label>
          <fieldset className={styles.stars}>
            <legend>{tr("m1436")}</legend>
            <div className={styles.starRow} role="radiogroup" aria-label={tr("m1430")}>
              {[1, 2, 3, 4, 5].map(n => <label key={n} className={n <= stars ? `${styles.star} ${styles.starOn}` : styles.star}>
                  <input type="radio" name="stars" value={n} checked={stars === n} onChange={() => setStars(n)} className={styles.radio} aria-label={`${n} sao`} />
                  <Star size={28} aria-hidden="true" fill={n <= stars ? "#ffb33e" : "none"} />
                </label>)}
            </div>
          </fieldset>
          <label className={styles.field}>
            <span>{tr("m1437")}</span>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder={tr("m1431")} />
          </label>
          {error ? <em className={styles.error}>{error}</em> : null}
          <button type="submit" className={styles.submit} disabled={submitting}>{submitting ? tr("m1143") : tr("m1438")}</button>
        </form>

        <h2 className={styles.historyTitle}>{tr("m1439")}</h2>
        <ul className={styles.reviewList}>
          {loadReviews().map(r => <li key={r.orderId} className={styles.reviewItem}>
              <div className={styles.reviewItemHead}>
                <span className={styles.reviewOrder}>{tr("m1567")}{r.orderId}</span>
                <span className={styles.reviewStars}>
                  {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)} ({r.stars}/5)
                </span>
              </div>
              <p className={styles.reviewComment}>{r.comment}</p>
              <span className={styles.reviewDate}>{r.at}</span>
            </li>)}
        </ul>
      </div>
    </main>;
}