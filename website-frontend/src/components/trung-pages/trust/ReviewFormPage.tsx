"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { trustApi, useAuthToken } from "../../webapp-bridge/backend";
import styles from "./ReviewFormPage.module.css";
import type { ReviewItem } from "./types";

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

export const QUOTA_ERROR_MESSAGE = "Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.";

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
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [recentReviews, setRecentReviews] = useState<ReviewItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Check order status when order changes
  useEffect(() => {
    let cancelled = false;
    const checkOrder = async () => {
      const cleanOrder = sanitizeText(order);
      if (!cleanOrder || cleanOrder.length < 2 || !token) {
        if (!cancelled) setAlreadyReviewed(false);
        return;
      }
      try {
        const res = (await trustApi.getOrderReviewStatus(cleanOrder)) as {
          result?: { clientReviewed?: boolean; providerReviewed?: boolean; canReview?: boolean };
        };
        if (!cancelled) {
          setAlreadyReviewed(Boolean(res?.result?.clientReviewed));
        }
      } catch {
        if (!cancelled) setAlreadyReviewed(false);
      }
    };
    checkOrder();
    return () => {
      cancelled = true;
    };
  }, [order, token]);

  // Load user's recent reviews from real backend
  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const res = (await trustApi.getMyReviews({ size: 10 })) as {
          result?: { data?: unknown[] };
        };
        if (cancelled) return;
        const list = (res?.result?.data || (Array.isArray(res?.result) ? res.result : [])) as Array<{
          orderId?: string;
          rating?: number;
          comment?: string;
          createdAt?: string;
        }>;
        if (Array.isArray(list)) {
          setRecentReviews(
            list.map(r => ({
              orderId: r.orderId || "",
              stars: r.rating || 5,
              comment: r.comment || "",
              at: r.createdAt ? r.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            }))
          );
        }
      } catch {
        if (!cancelled) setRecentReviews([]);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [token]);

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
    if (alreadyReviewed) {
      setError("Đơn hàng này đã được đánh giá!");
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
      // Add to recent reviews list
      setRecentReviews(prev => [
        {
          orderId: cleanOrder,
          stars,
          comment: cleanComment,
          at: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
      setAlreadyReviewed(true);
      if (!orderId) {
        setOrder("");
        setComment("");
        setStars(5);
      }
      onNavigate("detail");
    } catch (err: unknown) {
      const msg = (err as Error)?.message || tr("m1140");
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("reviewed")) {
        setError("Đơn hàng này đã được đánh giá!");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const starLabels: Record<number, string> = {
    1: "1 sao — Rất không hài lòng",
    2: "2 sao — Chưa hài lòng",
    3: "3 sao — Bình thường",
    4: "4 sao — Hài lòng",
    5: "5 sao — Rất tuyệt vời",
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
          {alreadyReviewed && (
            <div className={styles.checkedNote}>
              Đơn hàng này đã được đánh giá! Bạn có thể xem lại trong lịch sử bên dưới.
            </div>
          )}
          <fieldset className={styles.stars} role="radiogroup" aria-label="Đánh giá số sao">
            <legend>{tr("m1436")}</legend>
            <div className={styles.starRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <label key={s} className={`${styles.star} ${s <= stars ? styles.starOn : styles.starOff}`}>
                  <input
                    type="radio"
                    name="stars"
                    value={s}
                    checked={stars === s}
                    onChange={() => setStars(s)}
                    className={styles.radio}
                    aria-label={`${s} sao`}
                  />
                  <span aria-hidden="true">★</span>
                </label>
              ))}
            </div>
            <span className={styles.starLabel}>{starLabels[stars] || `${stars} sao`}</span>
          </fieldset>
          <label className={styles.field}>
            <span>{tr("m1437")}</span>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={tr("m1438")}
            />
            <div className={styles.charCount}>
              {comment.length} / 2000 ký tự (tối thiểu 10 ký tự)
            </div>
          </label>
          {error ? <em className={styles.error}>{error}</em> : null}
          <button type="submit" className={styles.submit} disabled={submitting || alreadyReviewed}>
            {submitting ? tr("m1143") : tr("m1439")}
          </button>
        </form>

        <h2 className={styles.historyTitle}>{tr("m1439")}</h2>
        {loadingHistory ? (
          <p className={styles.sub}>Đang tải lịch sử đánh giá...</p>
        ) : recentReviews.length === 0 ? (
          <p className={styles.sub}>Chưa có đánh giá nào được gửi.</p>
        ) : (
          <ul className={styles.reviewList}>
            {recentReviews.map((r, i) => (
              <li key={`${r.orderId}-${i}`} className={styles.reviewItem}>
                <div className={styles.reviewItemHead}>
                  <span className={styles.reviewOrder}>Đơn #{r.orderId}</span>
                  <span className={styles.reviewStars}>
                    {"★".repeat(r.stars)}
                    {"☆".repeat(5 - r.stars)}
                  </span>
                </div>
                <p className={styles.reviewComment}>{r.comment}</p>
                <span className={styles.reviewDate}>{r.at}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
