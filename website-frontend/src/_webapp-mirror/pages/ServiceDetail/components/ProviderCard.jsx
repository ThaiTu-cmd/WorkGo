import { useTranslations } from "next-intl";
import React from 'react';
import { CheckCircle2, Star, Clock, Globe, Calendar, MessageSquare, Award } from 'lucide-react';
import styles from './ProviderCard.module.css';
export default function ProviderCard({
  provider = {},
  sellerBio = '',
  responseTime = '< 1 giờ',
  lastDelivery,
  memberSince = '2023',
  languages,
  avgRating = 5.0,
  reviewCount = 0,
  ordersInQueue = 2,
  onContactSeller
}) {
  const tr = useTranslations("misc");
  lastDelivery ??= tr("m1661");
  languages ??= [tr("m1662"), tr("m1663")];
  return <section className={styles.sellerSection}>
      <h2 className={styles.sectionTitle}>{tr("m953")}</h2>

      <div className={styles.cardContainer}>
        {/* Top Header */}
        <div className={styles.cardHeader}>
          <div className={styles.avatarWrapper}>
            <img src={provider.avatar} alt={provider.name} className={styles.avatarImg} />
            {provider.isVerified && <span className={styles.verifiedBadge} title={tr("m952")}>
                <CheckCircle2 size={16} />
              </span>}
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <h3 className={styles.providerName}>{provider.name}</h3>
              {provider.level && <span className={styles.levelTag}>
                  <Award size={12} /> {provider.level}
                </span>}
            </div>

            {(provider.badge || provider.isVerified) && <p className={styles.providerBadge}>{provider.badge || tr("m460")}</p>}

            {(avgRating != null || ordersInQueue != null) && <div className={styles.ratingRow}>
                {avgRating != null && <div className={styles.stars}>
                    <Star size={15} className={styles.starIcon} />
                    <span className={styles.ratingVal}>{avgRating}</span>
                    <span className={styles.reviewCount}>({reviewCount}{tr("m1542")}</span>
                  </div>}
                {avgRating != null && ordersInQueue != null && <span className={styles.dotSep}>•</span>}
                {ordersInQueue != null && <span className={styles.queueText}>{ordersInQueue}{tr("m1543")}</span>}
              </div>}
          </div>
        </div>

        {/* Bio */}
        {sellerBio && <p className={styles.sellerBio}>{sellerBio}</p>}

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {memberSince && <div className={styles.statItem}>
              <Calendar size={16} className={styles.statIcon} />
              <div className={styles.statText}>
                <span className={styles.statLabel}>{tr("m957")}</span>
                <span className={styles.statVal}>{memberSince}</span>
              </div>
            </div>}

          {responseTime && <div className={styles.statItem}>
              <Clock size={16} className={styles.statIcon} />
              <div className={styles.statText}>
                <span className={styles.statLabel}>{tr("m958")}</span>
                <span className={styles.statVal}>{responseTime}</span>
              </div>
            </div>}

          {lastDelivery && <div className={styles.statItem}>
              <Clock size={16} className={styles.statIcon} />
              <div className={styles.statText}>
                <span className={styles.statLabel}>{tr("m959")}</span>
                <span className={styles.statVal}>{lastDelivery}</span>
              </div>
            </div>}

          {languages?.length > 0 && <div className={styles.statItem}>
              <Globe size={16} className={styles.statIcon} />
              <div className={styles.statText}>
                <span className={styles.statLabel}>{tr("m960")}</span>
                <span className={styles.statVal}>{languages.join(', ')}</span>
              </div>
            </div>}
        </div>

        {/* Action Button */}
        <div className={styles.footerAction}>
          <button type="button" className={styles.contactBtn} onClick={onContactSeller}>
            <MessageSquare size={16} />
            <span>{tr("m1544")}{provider.name}</span>
          </button>
        </div>
      </div>
    </section>;
}