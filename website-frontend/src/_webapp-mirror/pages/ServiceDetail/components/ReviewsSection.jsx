import React, { useState } from 'react';
import { Star, CheckCircle, ThumbsUp } from 'lucide-react';
import styles from './ReviewsSection.module.css';

export default function ReviewsSection({
  reviews = [],
  avgRating = 5.0,
  reviewCount = 0
}) {
  const [filterRating, setFilterRating] = useState('ALL');
  const [helpfulCounts, setHelpfulCounts] = useState({});

  const handleHelpful = (id) => {
    setHelpfulCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'ALL') return true;
    return r.rating === Number(filterRating);
  });

  const ratingBars = [
    { star: 5, pct: 92, count: Math.round(reviewCount * 0.92) },
    { star: 4, pct: 6, count: Math.round(reviewCount * 0.06) },
    { star: 3, pct: 2, count: Math.round(reviewCount * 0.02) },
    { star: 2, pct: 0, count: 0 },
    { star: 1, pct: 0, count: 0 },
  ];

  return (
    <section className={styles.reviewsSection}>
      <h2 className={styles.sectionTitle}>
        Đánh giá & Nhận xét từ khách hàng ({reviewCount})
      </h2>

      {/* Summary Score & Distribution Bars */}
      <div className={styles.summaryCard}>
        <div className={styles.scoreBlock}>
          <div className={styles.bigScore}>{avgRating}</div>
          <div className={styles.starsRow}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} className={styles.starFill} />
            ))}
          </div>
          <div className={styles.scoreLabel}>
            Dựa trên {reviewCount} đánh giá từ khách hàng đã nghiệm thu
          </div>
        </div>

        <div className={styles.distributionBlock}>
          {ratingBars.map((bar) => (
            <div key={bar.star} className={styles.barRow}>
              <span className={styles.barLabel}>{bar.star} sao</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
              <span className={styles.barCount}>({bar.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          type="button"
          className={`${styles.filterBtn} ${filterRating === 'ALL' ? styles.filterActive : ''}`}
          onClick={() => setFilterRating('ALL')}
        >
          Tất cả ({reviews.length})
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${filterRating === '5' ? styles.filterActive : ''}`}
          onClick={() => setFilterRating('5')}
        >
          5 sao
        </button>
      </div>

      {/* Reviews List */}
      <div className={styles.reviewsList}>
        {filteredReviews.map((rev) => (
          <div key={rev.id} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <img
                src={rev.avatar}
                alt={rev.author}
                className={styles.reviewerAvatar}
              />
              <div className={styles.reviewerMeta}>
                <div className={styles.reviewerTop}>
                  <strong className={styles.reviewerName}>{rev.author}</strong>
                  <span className={styles.verifiedTag}>
                    <CheckCircle size={12} /> Đã xác thực hoàn thành đơn
                  </span>
                </div>
                <div className={styles.ratingAndDate}>
                  <div className={styles.starsInline}>
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} size={13} className={styles.starSmall} />
                    ))}
                  </div>
                  <span className={styles.dot}>•</span>
                  <span className={styles.reviewDate}>{rev.date}</span>
                </div>
              </div>
            </div>

            {rev.packageUsed && (
              <div className={styles.packageUsedBadge}>
                Gói đã sử dụng: <strong>{rev.packageUsed}</strong>
              </div>
            )}

            <p className={styles.reviewComment}>{rev.comment}</p>

            <div className={styles.reviewFooter}>
              <button
                type="button"
                className={styles.helpfulBtn}
                onClick={() => handleHelpful(rev.id)}
              >
                <ThumbsUp size={14} />
                <span>Hữu ích ({helpfulCounts[rev.id] || 0})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
