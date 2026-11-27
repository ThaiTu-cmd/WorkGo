import { useTranslations } from "next-intl";
import React from "react";
import SearchBar from "../../common/SearchBar/SearchBar";
import { ShieldCheck, Award, Zap } from "lucide-react";
import styles from "./HeroBanner.module.css";
export default function HeroBanner({
  onSearch
}) {
  const tr = useTranslations("misc");
  const trendingTags = [{
    label: tr("m114"),
    query: tr("m114")
  }, {
    label: tr("m115"),
    query: tr("m115")
  }, {
    label: tr("m116"),
    query: tr("m116")
  }, {
    label: tr("m117"),
    query: tr("m117")
  }, {
    label: tr("m118"),
    query: tr("m118")
  }, {
    label: "Figma UI/UX",
    query: "Figma UI/UX"
  }];
  return <section className={styles.heroSection}>
      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroContent}>
          {/* Main Headline */}
          <h1 className={styles.headline}>{tr("m119")}</h1>

          {/* Subtitle */}
          <p className={styles.subtitle}>{tr("m120")}</p>

          {/* Central Search Component */}
          <div className={styles.searchWrapper}>
            <SearchBar onSearch={onSearch} />
          </div>

          {/* Popular Trending Tags */}
          <div className={styles.trendingWrap}>
            <span className={styles.trendingLabel}>{tr("m121")}</span>
            <div className={styles.tagList}>
              {trendingTags.map((tag, idx) => <button key={idx} type="button" className={styles.tagBtn} onClick={() => onSearch && onSearch({
              keyword: tag.query,
              executionType: "ALL"
            })}>
                  {tag.label}
                </button>)}
            </div>
          </div>
        </div>

        {/* Value Trust Badges at bottom of Hero */}
        <div className={styles.trustBanner}>
          <div className={styles.trustItem}>
            <ShieldCheck size={22} className={styles.trustIcon} />
            <div className={styles.trustText}>
              <strong>{tr("m122")}</strong>
              <span>{tr("m123")}</span>
            </div>
          </div>

          <div className={styles.trustItem}>
            <Award size={22} className={styles.trustIcon} />
            <div className={styles.trustText}>
              <strong>{tr("m124")}</strong>
              <span>{tr("m125")}</span>
            </div>
          </div>

          <div className={styles.trustItem}>
            <Zap size={22} className={styles.trustIcon} />
            <div className={styles.trustText}>
              <strong>{tr("m126")}</strong>
              <span>{tr("m127")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>;
}