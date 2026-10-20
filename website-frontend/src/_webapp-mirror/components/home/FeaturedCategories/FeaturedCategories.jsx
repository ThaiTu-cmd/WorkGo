import React from "react";
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
import { useCatalogCategories } from "../../../hooks/useCatalogCategories";
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

const DEFAULT_ACCENT = "#1dbf73";

export default function FeaturedCategories({ onSelectCategory }) {
  // Root categories from catalog-service (CategoryResponse: name, slug, description, children).
  const { categories, status } = useCatalogCategories();

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
            <h2 className={styles.sectionTitle}>Danh mục nổi bật</h2>
            <p className={styles.sectionSubtitle}>
              Hàng trăm lĩnh vực cho cá nhân & doanh nghiệp
            </p>
          </div>
          <a href="#all-categories" className={styles.viewAllLink}>
            <span>Xem tất cả</span>
            <ArrowRight size={16} />
          </a>
        </div>

        {categories.length === 0 && (
          <p className={styles.sectionSubtitle}>
            {status === "loading"
              ? "Đang tải danh mục..."
              : status === "needs-login"
                ? "Đăng nhập để xem danh mục dịch vụ."
                : status === "error"
                  ? "Không tải được danh mục từ máy chủ."
                  : "Chưa có danh mục nào."}
          </p>
        )}

        {/* Categories Grid */}
        <div className={styles.categoryGrid}>
          {categories.map((cat, idx) => {
            const IconComponent = ICON_MAP[cat.iconName] || ICON_MAP.Default;
            const accent = cat.accentColor || DEFAULT_ACCENT;
            const tags = cat.popularTags || [...(cat.children || [])].map((c) => c.name);

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
                      backgroundColor: `${accent}18`,
                      color: accent,
                    }}
                  >
                    <IconComponent size={26} />
                  </div>
                  {cat.executionLabel && (
                    <span
                      className={`${styles.typeBadge} ${getBadgeClass(cat.executionType)}`}
                    >
                      {cat.executionLabel}
                    </span>
                  )}
                </div>

                {/* Category name & description */}
                <h3 className={styles.categoryName}>{cat.name}</h3>
                <p className={styles.categoryDesc}>{cat.description}</p>

                {/* Subcategory / Popular Tags */}
                <div className={styles.tagWrap}>
                  {tags.slice(0, 3).map((tag, tIdx) => (
                    <span key={tIdx} className={styles.tagItem}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Card footer */}
                <div className={styles.cardFooter}>
                  <span className={styles.countText}>
                    {cat.serviceCount != null ? `${cat.serviceCount}+ dịch vụ` : ""}
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
