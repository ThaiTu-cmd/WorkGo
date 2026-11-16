import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { Star, Heart, Clock, CheckCircle } from "lucide-react";
import styles from "./ServiceCard.module.css";
export default function ServiceCard({
  service
}) {
  const tr = useTranslations("misc");
  const [isFavorited, setIsFavorited] = useState(false);
  const getBadgeClass = type => {
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
  const getBadgeLabel = type => {
    switch (type) {
      case "DIGITAL":
        return "Online";
      case "ONSITE":
        return tr("m82");
      case "DELIVERY":
        return tr("m76");
      case "APPOINTMENT":
        return tr("m83");
      default:
        return tr("m84");
    }
  };
  const formatPrice = price => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(price);
  };
  return <div className={styles.card}>
      {/* Cover image container */}
      <div className={styles.imageWrapper}>
        <img src={service.coverImage} alt={service.title} className={styles.coverImage} loading="lazy" />
        <div className={styles.imageOverlay} />

        {/* Placeholder image label */}
        {service.imageSource === 'placeholder' && <span style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 6,
        background: 'rgba(0,0,0,0.55)',
        color: '#fff',
        zIndex: 2
      }}>{tr("m88")}</span>}

        {/* Execution Type Tag */}
        <span className={`${styles.typeBadge} ${getBadgeClass(service.executionType)}`}>
          {getBadgeLabel(service.executionType)}
        </span>

        {/* Favorite button */}
        <button type="button" className={`${styles.favoriteBtn} ${isFavorited ? styles.favoriteActive : ""}`} onClick={e => {
        e.stopPropagation();
        setIsFavorited(!isFavorited);
      }} aria-label={tr("m85")}>
          <Heart size={18} fill={isFavorited ? "#ef4444" : "none"} color={isFavorited ? "#ef4444" : "#ffffff"} />
        </button>
      </div>

      {/* Card Content */}
      <div className={styles.cardContent}>
        {/* Provider info row */}
        <div className={styles.providerRow}>
          <img src={service.provider?.avatar} alt={service.provider?.name || tr("m60")} className={styles.avatar} />
          <div className={styles.providerInfo}>
            <div className={styles.providerNameWrap}>
              <span className={styles.providerName}>
                {service.provider?.name || tr("m86")}
              </span>
              {service.provider?.isVerified && <CheckCircle size={13} className={styles.verifiedIcon} />}
              {service.providerSource && service.providerSource !== 'real' && <span style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 4,
              background: 'rgba(245,158,11,0.15)',
              color: '#b45309',
              marginLeft: 4
            }} title={tr("m87")}>{tr("m90")}</span>}
            </div>
            {service.provider?.badge && <span className={styles.providerLevel}>
                {service.provider.badge}
              </span>}
          </div>
        </div>

        {/* Service Title */}
        <h3 className={styles.serviceTitle} title={service.title}>
          {service.title}
        </h3>

        {/* Rating and Reviews */}
        <div className={styles.ratingRow}>
          <Star size={15} className={styles.starIcon} fill="var(--wg-star)" />
          {service.reviewCount > 0 ? <>
              <span className={styles.ratingScore}>
                {Number(service.avgRating).toFixed(1)}
              </span>
              <span className={styles.reviewCount}>({service.reviewCount})</span>
            </> : <span className={styles.reviewCount}>{tr("m91")}</span>}
        </div>

        {/* Divider */}
        <div className={styles.cardDivider} />

        {/* Footer: Delivery Time & Starting Price */}
        <div className={styles.cardFooter}>
          {service.deliveryDays != null ? <div className={styles.deliveryBadge}>
              <Clock size={13} />
              <span>{service.deliveryDays}{tr("m1465")}</span>
            </div> : <span />}
          <div className={styles.priceContainer}>
            <span className={styles.priceLabel}>{tr("m93")}</span>
            <span className={styles.priceValue}>
              {formatPrice(service.basePrice)}
            </span>
          </div>
        </div>
      </div>
    </div>;
}