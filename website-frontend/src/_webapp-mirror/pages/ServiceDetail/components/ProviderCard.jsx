import React from 'react';
import { CheckCircle2, Star, Clock, Globe, Calendar, MessageSquare, Award } from 'lucide-react';
import styles from './ProviderCard.module.css';

export default function ProviderCard({
  provider = {},
  sellerBio = '',
  responseTime = '< 1 giờ',
  lastDelivery = 'Vài giờ trước',
  memberSince = '2023',
  languages = ['Tiếng Việt', 'Tiếng Anh'],
  avgRating = 5.0,
  reviewCount = 0,
  ordersInQueue = 2,
  onContactSeller
}) {
  return (
    <section className={styles.sellerSection}>
      <h2 className={styles.sectionTitle}>Thông tin Chuyên gia</h2>

      <div className={styles.cardContainer}>
        {/* Top Header */}
        <div className={styles.cardHeader}>
          <div className={styles.avatarWrapper}>
            <img src={provider.avatar} alt={provider.name} className={styles.avatarImg} />
            {provider.isVerified && (
              <span className={styles.verifiedBadge} title="Đã xác thực danh tính">
                <CheckCircle2 size={16} />
              </span>
            )}
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <h3 className={styles.providerName}>{provider.name}</h3>
              {provider.level && (
                <span className={styles.levelTag}>
                  <Award size={12} /> {provider.level}
                </span>
              )}
            </div>

            <p className={styles.providerBadge}>{provider.badge || 'Chuyên gia uy tín'}</p>

            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                <Star size={15} className={styles.starIcon} />
                <span className={styles.ratingVal}>{avgRating}</span>
                <span className={styles.reviewCount}>({reviewCount} đánh giá)</span>
              </div>
              <span className={styles.dotSep}>•</span>
              <span className={styles.queueText}>{ordersInQueue} đơn đang xử lý</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {sellerBio && <p className={styles.sellerBio}>{sellerBio}</p>}

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <Calendar size={16} className={styles.statIcon} />
            <div className={styles.statText}>
              <span className={styles.statLabel}>Thành viên từ</span>
              <span className={styles.statVal}>{memberSince}</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <Clock size={16} className={styles.statIcon} />
            <div className={styles.statText}>
              <span className={styles.statLabel}>Thời gian phản hồi</span>
              <span className={styles.statVal}>{responseTime}</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <Clock size={16} className={styles.statIcon} />
            <div className={styles.statText}>
              <span className={styles.statLabel}>Lần giao gần nhất</span>
              <span className={styles.statVal}>{lastDelivery}</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <Globe size={16} className={styles.statIcon} />
            <div className={styles.statText}>
              <span className={styles.statLabel}>Ngôn ngữ</span>
              <span className={styles.statVal}>{languages.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className={styles.footerAction}>
          <button type="button" className={styles.contactBtn} onClick={onContactSeller}>
            <MessageSquare size={16} />
            <span>Nhắn tin cho {provider.name}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
