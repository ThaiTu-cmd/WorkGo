import React, { useState } from "react";
import {
  Code2,
  Palette,
  Wrench,
  Sparkles,
  PenLine,
  Truck,
  Megaphone,
  GraduationCap,
  ArrowRight,
  FolderTree,
} from "lucide-react";
import { mockCategories } from "../../../data/mockCategories";
import styles from "./FeaturedCategories.module.css";

const ICON_MAP = {
  Code2: Code2,
  Palette: Palette,
  Wrench: Wrench,
  Sparkles: Sparkles,
  PenLine: PenLine,
  Truck: Truck,
  Megaphone: Megaphone,
  GraduationCap: GraduationCap,
  Default: FolderTree,
};

export default function FeaturedCategories({ onSelectCategory }) {
  const [categories] = useState(mockCategories);

  const getBadgeClass = (type) => {
    switch (type) {
      case "DIGITAL":
        return styles.badgeDigital;
      case "ONSITE":
        return styles.badgeOnsite;
      case "DELIVERY":
        return styles.badgeDelivery;
      case "APPOINTMENT":
        return styles.badgeAppointment;
      default:
        return styles.badgeDigital;
    }
  };

  return (
    <section className={styles.section} id="categories">
      <div className="container">
        {/* Section Header */}
        <div className={`${styles.sectionHeader} reveal`}>
          <div>
            <h2 className={styles.sectionTitle}>Danh mục dịch vụ nổi bật</h2>
            <p className={styles.sectionSubtitle}>
              Hàng trăm lĩnh vực chuyên môn sẵn sàng phục vụ nhu cầu cá nhân &
              doanh nghiệp
            </p>
          </div>
          <a href="#all-categories" className={styles.viewAllLink}>
            <span>Xem tất cả danh mục</span>
            <ArrowRight size={16} />
          </a>
        </div>

        {/* Categories Grid */}
        <div className={styles.categoryGrid}>
          {categories.map((cat, idx) => {
            const IconComponent = ICON_MAP[cat.iconName] || ICON_MAP.Default;

            return (
              <div
                key={cat.categoryId}
                className={`${styles.categoryCard} reveal reveal-delay-${(idx % 4) + 1}`}
                onClick={() => onSelectCategory && onSelectCategory(cat)}
              >
                {/* Top header inside card */}
                <div className={styles.cardTop}>
                  <div
                    className={styles.iconBox}
                    style={{
                      backgroundColor: `${cat.accentColor}18`,
                      color: cat.accentColor,
                    }}
                  >
                    <IconComponent size={26} />
                  </div>
                  <span
                    className={`${styles.typeBadge} ${getBadgeClass(cat.executionType)}`}
                  >
                    {cat.executionLabel}
                  </span>
                </div>

                {/* Category name & description */}
                <h3 className={styles.categoryName}>{cat.name}</h3>
                <p className={styles.categoryDesc}>{cat.description}</p>

                {/* Subcategory / Popular Tags */}
                <div className={styles.tagWrap}>
                  {cat.popularTags?.slice(0, 3).map((tag, tIdx) => (
                    <span key={tIdx} className={styles.tagItem}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Card footer */}
                <div className={styles.cardFooter}>
                  <span className={styles.countText}>
                    {cat.serviceCount}+ dịch vụ
                  </span>
                  <span className={styles.exploreBtn}>
                    <span>Khám phá</span>
                    <ArrowRight size={14} className={styles.arrowIcon} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
