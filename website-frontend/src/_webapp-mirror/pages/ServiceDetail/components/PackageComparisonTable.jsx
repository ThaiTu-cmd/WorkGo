import React from 'react';
import { Check, X } from 'lucide-react';
import styles from './PackageComparisonTable.module.css';

export default function PackageComparisonTable({
  packages = [],
  matrix = [],
  selectedPackageId,
  onSelectPackage
}) {
  if (!packages || packages.length === 0) return null;

  const basicPkg = packages.find((p) => p.tier === 'BASIC') || packages[0];
  const standardPkg = packages.find((p) => p.tier === 'STANDARD') || packages[1];
  const premiumPkg = packages.find((p) => p.tier === 'PREMIUM') || packages[2];

  const formatPrice = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' ₫';

  const renderValue = (val) => {
    if (val === true) {
      return <Check size={20} className={styles.iconCheck} />;
    }
    if (val === false) {
      return <X size={20} className={styles.iconClose} />;
    }
    return <span className={styles.cellText}>{val}</span>;
  };

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>So sánh chi tiết các gói dịch vụ</h2>
        <p className={styles.sectionSubtitle}>
          Đối chiếu minh bạch từng tính năng, thời hạn và quyền lợi để chọn gói phù hợp nhất với nhu cầu của bạn.
        </p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th className={styles.thFeature}>Gói dịch vụ</th>
              <th className={`${styles.thPackage} ${basicPkg?.id === selectedPackageId ? styles.activeCol : ''}`}>
                <div className={styles.pkgTier}>Cơ bản</div>
                <div className={styles.pkgPrice}>{formatPrice(basicPkg?.price)}</div>
                <div className={styles.pkgName}>{basicPkg?.name}</div>
              </th>
              <th className={`${styles.thPackage} ${styles.standardTh} ${standardPkg?.id === selectedPackageId ? styles.activeCol : ''}`}>
                <span className={styles.popularBadge}>Khuyên dùng</span>
                <div className={styles.pkgTier}>Tiêu chuẩn</div>
                <div className={styles.pkgPrice}>{formatPrice(standardPkg?.price)}</div>
                <div className={styles.pkgName}>{standardPkg?.name}</div>
              </th>
              <th className={`${styles.thPackage} ${premiumPkg?.id === selectedPackageId ? styles.activeCol : ''}`}>
                <div className={styles.pkgTier}>Cao cấp</div>
                <div className={styles.pkgPrice}>{formatPrice(premiumPkg?.price)}</div>
                <div className={styles.pkgName}>{premiumPkg?.name}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 1 ? styles.altRow : ''}>
                <td className={styles.tdFeature}>{row.title}</td>
                <td className={`${styles.tdValue} ${basicPkg?.id === selectedPackageId ? styles.activeCol : ''}`}>
                  {renderValue(row.basic)}
                </td>
                <td className={`${styles.tdValue} ${standardPkg?.id === selectedPackageId ? styles.activeCol : ''}`}>
                  {renderValue(row.standard)}
                </td>
                <td className={`${styles.tdValue} ${premiumPkg?.id === selectedPackageId ? styles.activeCol : ''}`}>
                  {renderValue(row.premium)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className={styles.tdFeature}>Lựa chọn</td>
              <td className={`${styles.tdValue} ${basicPkg?.id === selectedPackageId ? styles.activeCol : ''}`}>
                <button
                  type="button"
                  className={`${styles.selectBtn} ${basicPkg?.id === selectedPackageId ? styles.selectedBtn : ''}`}
                  onClick={() => onSelectPackage(basicPkg?.id)}
                >
                  {basicPkg?.id === selectedPackageId ? 'Đang chọn' : 'Chọn gói này'}
                </button>
              </td>
              <td className={`${styles.tdValue} ${standardPkg?.id === selectedPackageId ? styles.activeCol : ''}`}>
                <button
                  type="button"
                  className={`${styles.selectBtn} ${styles.primarySelectBtn} ${standardPkg?.id === selectedPackageId ? styles.selectedBtn : ''}`}
                  onClick={() => onSelectPackage(standardPkg?.id)}
                >
                  {standardPkg?.id === selectedPackageId ? 'Đang chọn' : 'Chọn gói này'}
                </button>
              </td>
              <td className={`${styles.tdValue} ${premiumPkg?.id === selectedPackageId ? styles.activeCol : ''}`}>
                <button
                  type="button"
                  className={`${styles.selectBtn} ${premiumPkg?.id === selectedPackageId ? styles.selectedBtn : ''}`}
                  onClick={() => onSelectPackage(premiumPkg?.id)}
                >
                  {premiumPkg?.id === selectedPackageId ? 'Đang chọn' : 'Chọn gói này'}
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
