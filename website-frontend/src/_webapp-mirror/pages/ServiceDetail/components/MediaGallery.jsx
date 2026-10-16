import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import styles from './MediaGallery.module.css';

export default function MediaGallery({ mediaList = [], title = '' }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!mediaList || mediaList.length === 0) {
    return (
      <div className={styles.emptyGallery}>
        <ImageIcon size={48} className={styles.emptyIcon} />
        <p>Chưa có hình ảnh giới thiệu</p>
      </div>
    );
  }

  const currentMedia = mediaList[activeIndex] || mediaList[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.galleryWrapper}>
      {/* Main Large Media Viewer */}
      <div className={styles.mainViewer}>
        <img
          src={currentMedia.url}
          alt={currentMedia.alt || title}
          className={styles.mainImage}
          loading="eager"
        />

        {mediaList.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.prevBtn}`}
              onClick={handlePrev}
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.nextBtn}`}
              onClick={handleNext}
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        <div className={styles.indexBadge}>
          {activeIndex + 1} / {mediaList.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {mediaList.length > 1 && (
        <div className={styles.thumbnailStrip}>
          {mediaList.map((item, idx) => (
            <button
              key={item.id || idx}
              type="button"
              className={`${styles.thumbBtn} ${idx === activeIndex ? styles.thumbActive : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Xem ảnh ${idx + 1}`}
            >
              <img src={item.url} alt={item.alt || `Thumbnail ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
