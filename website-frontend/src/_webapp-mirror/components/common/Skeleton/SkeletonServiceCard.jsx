import React from 'react';
import styles from './SkeletonServiceCard.module.css';

// Loading placeholder for the Catalog services grid. Rendered inside the
// parent's grid container so track sizing/gap match the real ServiceCard
// grid exactly (no layout shift when results arrive).
export default function SkeletonServiceCard({ count = 6 }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <>
      {items.map((i) => (
        <div key={i} className={styles.skCard} aria-hidden="true">
          <div className={`${styles.skBlock} ${styles.skCover}`} />
          <div className={styles.skBody}>
            <div className={styles.skProviderRow}>
              <div className={`${styles.skBlock} ${styles.skAvatar}`} />
              <div className={styles.skProviderMeta}>
                <div className={`${styles.skBlock} ${styles.skLineName}`} />
                <div className={`${styles.skBlock} ${styles.skLineLevel}`} />
              </div>
            </div>
            <div className={`${styles.skBlock} ${styles.skLineTitle}`} />
            <div className={`${styles.skBlock} ${styles.skLineTitleShort}`} />
            <div className={styles.skRatingRow}>
              <div className={`${styles.skBlock} ${styles.skStar}`} />
              <div className={`${styles.skBlock} ${styles.skLineRating}`} />
            </div>
            <div className={styles.skDivider} />
            <div className={styles.skFooter}>
              <div className={`${styles.skBlock} ${styles.skLineDelivery}`} />
              <div className={`${styles.skBlock} ${styles.skLinePrice}`} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
