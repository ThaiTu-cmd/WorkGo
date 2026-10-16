import React, { useState } from "react";
import { Star, Heart, Clock, CheckCircle } from "lucide-react";
import styles from "./ServiceCard.module.css";

export default function ServiceCard({ service }) {
  const [isFavorited, setIsFavorited] = useState(false);

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

  const getBadgeLabel = (type) => {
    switch (type) {
      case "DIGITAL":
        return "Online";
      case "ONSITE":
        return "Tại nhà";
      case "DELIVERY":
        return "Giao nhận";
      case "APPOINTMENT":
        return "Lịch hẹn";
      default:
        return "Dịch vụ";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={styles.card}>
      {/* Cover image container */}
      <div className={styles.imageWrapper}>
        <img
          src={service.coverImage}
          alt={service.title}
          className={styles.coverImage}
          loading="lazy"
        />
        <div className={styles.imageOverlay} />

        {/* Execution Type Tag */}
        <span
          className={`${styles.typeBadge} ${getBadgeClass(service.executionType)}`}
        >
          {getBadgeLabel(service.executionType)}
        </span>

        {/* Favorite button */}
        <button
          type="button"
          className={`${styles.favoriteBtn} ${isFavorited ? styles.favoriteActive : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          aria-label="Lưu dịch vụ"
        >
          <Heart
            size={18}
            fill={isFavorited ? "#ef4444" : "none"}
            color={isFavorited ? "#ef4444" : "#ffffff"}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className={styles.cardContent}>
        {/* Provider info row */}
        <div className={styles.providerRow}>
          <img
            src={service.provider.avatar}
            alt={service.provider.name}
            className={styles.avatar}
          />
          <div className={styles.providerInfo}>
            <div className={styles.providerNameWrap}>
              <span className={styles.providerName}>
                {service.provider.name}
              </span>
              <CheckCircle size={13} className={styles.verifiedIcon} />
            </div>
            <span className={styles.providerLevel}>
              {service.provider.badge}
            </span>
          </div>
        </div>

        {/* Service Title */}
        <h3 className={styles.serviceTitle} title={service.title}>
          {service.title}
        </h3>

        {/* Rating and Reviews */}
        <div className={styles.ratingRow}>
          <Star size={15} className={styles.starIcon} fill="var(--wg-star)" />
          <span className={styles.ratingScore}>
            {service.avgRating.toFixed(1)}
          </span>
          <span className={styles.reviewCount}>({service.reviewCount})</span>
        </div>

        {/* Divider */}
        <div className={styles.cardDivider} />

        {/* Footer: Delivery Time & Starting Price */}
        <div className={styles.cardFooter}>
          <div className={styles.deliveryBadge}>
            <Clock size={13} />
            <span>{service.deliveryDays} ngày</span>
          </div>
          <div className={styles.priceContainer}>
            <span className={styles.priceLabel}>Khởi điểm</span>
            <span className={styles.priceValue}>
              {formatPrice(service.basePrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
