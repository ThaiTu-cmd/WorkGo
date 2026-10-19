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
          <h1 className={`${styles.headline} reveal`}>
            Tìm kiếm chuyên gia & dịch vụ hoàn hảo cho mọi nhu cầu công việc
          </h1>

          {/* Subtitle */}
          <p className={`${styles.subtitle} reveal reveal-delay-1`}>
            Kết nối tin cậy giữa Khách hàng và Chuyên gia. Mua bán dịch vụ
            Online, đặt lịch tại nhà (Onsite) và Giao nhận với cơ chế thanh toán
            đảm bảo an toàn tuyệt đối.
          </p>

          {/* Central Search Component */}
          <div className={`${styles.searchWrapper} reveal reveal-delay-2`}>
            <SearchBar onSearch={onSearch} />
          </div>

          {/* Popular Trending Tags */}
          <div className={`${styles.trendingWrap} reveal reveal-delay-3`}>
            <span className={styles.trendingLabel}>Tìm kiếm phổ biến:</span>
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
        <div className={`${styles.trustBanner} reveal reveal-delay-4`}>
          <div className={styles.trustItem}>
            <ShieldCheck size={22} className={styles.trustIcon} />
            <div className={styles.trustText}>
              <strong>Bảo chứng Ký quỹ (Escrow)</strong>
              <span>Chỉ giải ngân khi bạn đã hài lòng</span>
            </div>
          </div>

          <div className={styles.trustItem}>
            <Award size={22} className={styles.trustIcon} />
            <div className={styles.trustText}>
              <strong>Chuyên gia đã kiểm duyệt</strong>
              <span>Hồ sơ & năng lực xác minh kỹ càng</span>
            </div>
          </div>

          <div className={styles.trustItem}>
            <Zap size={22} className={styles.trustIcon} />
            <div className={styles.trustText}>
              <strong>Nhận việc & phản hồi nhanh</strong>
              <span>Báo giá và phản hồi trong 15 phút</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
