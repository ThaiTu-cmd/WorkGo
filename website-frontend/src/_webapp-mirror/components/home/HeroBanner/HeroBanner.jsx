import React from "react";
import SearchBar from "../../common/SearchBar/SearchBar";
import { ShieldCheck, Award, Zap } from "lucide-react";
import styles from "./HeroBanner.module.css";

export default function HeroBanner({ onSearch }) {
  const trendingTags = [
    { label: "Thiết kế Logo", query: "Thiết kế Logo" },
    { label: "Lập trình Website", query: "Lập trình Website" },
    { label: "Sửa điện nước", query: "Sửa điện nước" },
    { label: "Dọn dẹp nhà", query: "Dọn dẹp nhà" },
    { label: "Giao hàng hỏa tốc", query: "Giao hàng hỏa tốc" },
    { label: "Figma UI/UX", query: "Figma UI/UX" },
  ];

  return (
    <section className={styles.heroSection}>
      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroContent}>
          {/* Main Headline */}
          <h1 className={styles.headline}>
            Tìm chuyên gia & dịch vụ cho mọi nhu cầu
          </h1>

          {/* Subtitle */}
          <p className={styles.subtitle}>
            Dịch vụ online, tại nhà và giao nhận — thanh toán ký quỹ an toàn.
          </p>

          {/* Central Search Component */}
          <div className={styles.searchWrapper}>
            <SearchBar onSearch={onSearch} />
          </div>

          {/* Popular Trending Tags */}
          <div className={styles.trendingWrap}>
            <span className={styles.trendingLabel}>Phổ biến:</span>
            <div className={styles.tagList}>
              {trendingTags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.tagBtn}
                  onClick={() =>
                    onSearch &&
                    onSearch({ keyword: tag.query, executionType: "ALL" })
                  }
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Value Trust Badges at bottom of Hero */}
        <div className={styles.trustBanner}>
          <div className={styles.trustItem}>
            <ShieldCheck size={22} className={styles.trustIcon} />
            <div className={styles.trustText}>
              <strong>Ký quỹ Escrow</strong>
              <span>Hài lòng mới giải ngân</span>
            </div>
          </div>

          <div className={styles.trustItem}>
            <Award size={22} className={styles.trustIcon} />
            <div className={styles.trustText}>
              <strong>Chuyên gia đã duyệt</strong>
              <span>Hồ sơ xác minh</span>
            </div>
          </div>

          <div className={styles.trustItem}>
            <Zap size={22} className={styles.trustIcon} />
            <div className={styles.trustText}>
              <strong>Phản hồi nhanh</strong>
              <span>Trong 15 phút</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
