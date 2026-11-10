import React from 'react';
import { Clock, RotateCcw, Check, Plus, ShieldCheck, MessageSquare, ArrowRight } from 'lucide-react';
import styles from './PackageSidebar.module.css';

export default function PackageSidebar({
  packages = [],
  selectedPackageId,
  onSelectPackage,
  addons = [],
  selectedAddonIds = [],
  onToggleAddon,
  onOrder,
  onContactSeller
}) {
  if (!packages || packages.length === 0) return null;

  const currentPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];

  // Calculate total price: Package price + active addons
  const activeAddonsList = addons.filter((a) => selectedAddonIds.includes(a.id));
  const addonsTotal = activeAddonsList.reduce((sum, item) => sum + item.price, 0);
  const totalPrice = (currentPackage.price || 0) + addonsTotal;

  const formatPrice = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' ₫';

  return (
    <aside className={styles.sidebarContainer}>
      {/* 1. Package Tabs (Basic / Standard / Premium) */}
      <div className={styles.tabsHeader}>
        {packages.map((pkg) => {
          const isActive = pkg.id === currentPackage.id;
          return (
            <button
              key={pkg.id}
              type="button"
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
              onClick={() => onSelectPackage(pkg.id)}
            >
              <span className={styles.tabName}>{pkg.tier === 'BASIC' ? 'Cơ bản' : pkg.tier === 'STANDARD' ? 'Tiêu chuẩn' : 'Cao cấp'}</span>
              {pkg.popular && <span className={styles.popularBadge}>Ưa chuộng</span>}
            </button>
          );
        })}
      </div>

      <div className={styles.sidebarContent}>
        {/* 2. Package Overview & Price */}
        <div className={styles.priceSection}>
          <div className={styles.packageTitleRow}>
            <h3 className={styles.packageName}>{currentPackage.name}</h3>
            <div className={styles.packagePrice}>{formatPrice(currentPackage.price)}</div>
          </div>
          <p className={styles.packageDesc}>{currentPackage.description}</p>
        </div>

        {/* 3. Delivery Time & Revisions Meta */}
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <Clock size={16} className={styles.metaIcon} />
            <span>Giao trong <strong>{currentPackage.deliveryDays} ngày</strong></span>
          </div>
          <div className={styles.metaItem}>
            <RotateCcw size={16} className={styles.metaIcon} />
            <span>Chỉnh sửa: <strong>{currentPackage.revisionLimit}</strong></span>
          </div>
        </div>

        {/* 4. Feature Checklist */}
        {currentPackage.features && currentPackage.features.length > 0 && (
          <div className={styles.featuresList}>
            <h4 className={styles.featuresTitle}>Gói này bao gồm:</h4>
            <ul>
              {currentPackage.features.map((feat, index) => {
                const isCheck = feat.included !== false;
                return (
                  <li key={index} className={isCheck ? styles.featItemOk : styles.featItemMuted}>
                    <Check size={16} className={isCheck ? styles.checkIcon : styles.checkIconMuted} />
                    <span>
                      {feat.name}
                      {feat.value && <strong> ({feat.value})</strong>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 5. Add-ons Selection */}
        {addons && addons.length > 0 && (
          <div className={styles.addonsSection}>
            <h4 className={styles.addonsTitle}>
              <Plus size={16} /> Dịch vụ bổ sung (Add-ons):
            </h4>
            <div className={styles.addonsList}>
              {addons.map((addon) => {
                const isChecked = selectedAddonIds.includes(addon.id);
                return (
                  <label
                    key={addon.id}
                    className={`${styles.addonCard} ${isChecked ? styles.addonCardActive : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleAddon(addon.id)}
                      className={styles.addonCheckbox}
                    />
                    <div className={styles.addonInfo}>
                      <span className={styles.addonName}>{addon.name}</span>
                      {addon.description && (
                        <span className={styles.addonSub}>{addon.description}</span>
                      )}
                    </div>
                    <span className={styles.addonPrice}>+{formatPrice(addon.price)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Total Summary & CTAs */}
        <div className={styles.checkoutFooter}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Tổng tạm tính:</span>
            <span className={styles.totalAmount}>{formatPrice(totalPrice)}</span>
          </div>

          <button
            type="button"
            className={styles.btnOrder}
            onClick={() => onOrder(currentPackage, activeAddonsList, totalPrice)}
          >
            <span>Tiếp tục đặt hàng ({formatPrice(totalPrice)})</span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            className={styles.btnChat}
            onClick={onContactSeller}
          >
            <MessageSquare size={16} />
            <span>Liên hệ trao đổi với Chuyên gia</span>
          </button>

          {/* 7. WorkGo Escrow Trust Notice */}
          <div className={styles.escrowNotice}>
            <ShieldCheck size={18} className={styles.escrowIcon} />
            <div className={styles.escrowText}>
              <strong>Bảo chứng thanh toán Escrow:</strong> Tiền được giữ an toàn 100% tại WorkGo, chỉ giải ngân khi bạn đã hài lòng và nghiệm thu.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
