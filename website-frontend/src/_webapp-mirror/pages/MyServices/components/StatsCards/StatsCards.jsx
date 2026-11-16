import { useTranslations } from "next-intl";
import React from 'react';
import { Package, Eye, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import styles from './StatsCards.module.css';
export default function StatsCards({
  services = []
}) {
  const tr = useTranslations("misc");
  const activeCount = services.filter(s => s.status === 'ACTIVE').length;
  const totalImpressions = services.reduce((sum, s) => sum + (s.impressions || 0), 0);
  const totalOrders = services.reduce((sum, s) => sum + (s.ordersCount || 0), 0);
  const ratedServices = services.filter(s => s.avgRating > 0);
  const avgRating = ratedServices.length > 0 ? (ratedServices.reduce((sum, s) => sum + s.avgRating, 0) / ratedServices.length).toFixed(2) : '5.00';
  const stats = [{
    title: tr("m566"),
    value: `${activeCount} / ${services.length}`,
    subtext: tr("m567"),
    icon: <Package size={22} className={styles.iconGreen} />,
    badge: tr("m568"),
    badgePositive: true
  }, {
    title: tr("m569"),
    value: new Intl.NumberFormat('vi-VN').format(totalImpressions),
    subtext: tr("m570"),
    icon: <Eye size={22} className={styles.iconBlue} />,
    badge: '+18.4%',
    badgePositive: true
  }, {
    title: tr("m532"),
    value: tr("m571", {
      p0: totalOrders
    }),
    subtext: tr("m572"),
    icon: <ShoppingBag size={22} className={styles.iconOrange} />,
    badge: tr("m573"),
    badgePositive: true
  }, {
    title: tr("m574"),
    value: `${avgRating} ★`,
    subtext: tr("m575"),
    icon: <Star size={22} className={styles.iconYellow} />,
    badge: tr("m576"),
    badgePositive: true
  }];
  return <div className={styles.statsGrid}>
      {stats.map((item, idx) => <div key={idx} className={styles.statCard}>
          <div className={styles.cardHeader}>
            <span className={styles.statTitle}>{item.title}</span>
            <div className={styles.iconWrapper}>{item.icon}</div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.statValue}>{item.value}</div>
            <div className={styles.cardFooter}>
              <span className={styles.statSubtext}>{item.subtext}</span>
              {item.badge && <span className={item.badgePositive ? styles.badgePos : styles.badgeNeutral}>
                  <TrendingUp size={12} /> {item.badge}
                </span>}
            </div>
          </div>
        </div>)}
    </div>;
}