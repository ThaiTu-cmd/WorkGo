import React from 'react';
import { Package, Eye, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import styles from './StatsCards.module.css';

export default function StatsCards({ services = [] }) {
  const activeCount = services.filter((s) => s.status === 'ACTIVE').length;
  const totalImpressions = services.reduce((sum, s) => sum + (s.impressions || 0), 0);
  const totalOrders = services.reduce((sum, s) => sum + (s.ordersCount || 0), 0);
  const ratedServices = services.filter((s) => s.avgRating > 0);
  const avgRating = ratedServices.length > 0
    ? (ratedServices.reduce((sum, s) => sum + s.avgRating, 0) / ratedServices.length).toFixed(2)
    : '5.00';

  const stats = [
    {
      title: 'Dịch vụ Đang bán',
      value: `${activeCount} / ${services.length}`,
      subtext: 'Hoạt động sẵn sàng nhận đơn',
      icon: <Package size={22} className={styles.iconGreen} />,
      badge: '+1 tuần này',
      badgePositive: true,
    },
    {
      title: 'Lượt xem (30 ngày)',
      value: new Intl.NumberFormat('vi-VN').format(totalImpressions),
      subtext: 'Lượt hiển thị trên kết quả tìm kiếm',
      icon: <Eye size={22} className={styles.iconBlue} />,
      badge: '+18.4%',
      badgePositive: true,
    },
    {
      title: 'Đơn hàng tích lũy',
      value: `${totalOrders} đơn`,
      subtext: 'Tỉ lệ hoàn thành đạt 99.2%',
      icon: <ShoppingBag size={22} className={styles.iconOrange} />,
      badge: 'Escrow an toàn',
      badgePositive: true,
    },
    {
      title: 'Điểm đánh giá trung bình',
      value: `${avgRating} ★`,
      subtext: 'Dựa trên tất cả dịch vụ có review',
      icon: <Star size={22} className={styles.iconYellow} />,
      badge: 'Chuyên gia Pro',
      badgePositive: true,
    },
  ];

  return (
    <div className={styles.statsGrid}>
      {stats.map((item, idx) => (
        <div key={idx} className={styles.statCard}>
          <div className={styles.cardHeader}>
            <span className={styles.statTitle}>{item.title}</span>
            <div className={styles.iconWrapper}>{item.icon}</div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.statValue}>{item.value}</div>
            <div className={styles.cardFooter}>
              <span className={styles.statSubtext}>{item.subtext}</span>
              {item.badge && (
                <span className={item.badgePositive ? styles.badgePos : styles.badgeNeutral}>
                  <TrendingUp size={12} /> {item.badge}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
