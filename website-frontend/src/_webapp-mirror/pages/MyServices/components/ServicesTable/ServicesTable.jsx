import React, { useState, useEffect, useRef } from 'react';
import StatusBadge from '../StatusBadge/StatusBadge';
import { 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Star, 
  ShoppingBag, 
  Laptop, 
  MapPin, 
  Truck,
  MoreVertical,
  AlertCircle,
  RotateCcw,
  Plus
} from 'lucide-react';
import styles from './ServicesTable.module.css';

export default function ServicesTable({
  services = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onToggleStatus,
  onViewService,
  onEditService,
  onDuplicateService,
  onDeleteService,
  onBulkPause,
  onBulkActivate,
  onBulkDelete,
  onClearFilters,
  onCreateService,
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // R3: Escape closes the row dropdown; outside click does too.
  useEffect(() => {
    if (!activeMenuId) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setActiveMenuId(null);
    };
    const onPointer = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenuId(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [activeMenuId]);

  const isAllSelected = services.length > 0 && selectedIds.length === services.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < services.length;

  const getExecutionBadge = (type) => {
    switch (type) {
      case 'DIGITAL':
        return (
          <span className={`${styles.execBadge} ${styles.execDigital}`} title="Thực hiện Online 100%">
            <Laptop size={12} /> Số (Digital)
          </span>
        );
      case 'ONSITE':
        return (
          <span className={`${styles.execBadge} ${styles.execOnsite}`} title="Khảo sát / Thực hiện tại nhà">
            <MapPin size={12} /> Tận nơi
          </span>
        );
      case 'DELIVERY':
        return (
          <span className={`${styles.execBadge} ${styles.execDelivery}`} title="Giao nhận vận chuyển">
            <Truck size={12} /> Giao nhận
          </span>
        );
      default:
        return null;
    }
  };

  if (services.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <AlertCircle size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>Không tìm thấy dịch vụ nào</h3>
        <p className={styles.emptyText}>
          Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.
          Mọi thay đổi của bạn vẫn được lưu tự động trên thiết bị này.
        </p>
        <div className={styles.emptyActions}>
          {onClearFilters && (
            <button
              type="button"
              className={styles.emptyResetBtn}
              onClick={onClearFilters}
            >
              <RotateCcw size={16} />
              <span>Xóa tất cả bộ lọc</span>
            </button>
          )}
          {onCreateService && (
            <button
              type="button"
              className={styles.emptySecondaryBtn}
              onClick={onCreateService}
            >
              <Plus size={16} />
              <span>Tạo dịch vụ mới</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      {selectedIds.length > 0 && (
        <div className={styles.bulkActionBar}>
          <div className={styles.bulkCount} aria-live="polite" aria-atomic="true">
            Đã chọn <strong>{selectedIds.length}</strong> dịch vụ
          </div>
          <div className={styles.bulkButtons}>
            {onBulkActivate && (
              <button
                type="button"
                className={styles.bulkBtn}
                onClick={onBulkActivate}
              >
                Kích hoạt hàng loạt
              </button>
            )}
            {onBulkPause && (
              <button
                type="button"
                className={styles.bulkBtn}
                onClick={onBulkPause}
              >
                Tạm ngưng hàng loạt
              </button>
            )}
            <button
              type="button"
              className={`${styles.bulkBtn} ${styles.bulkDeleteBtn}`}
              onClick={onBulkDelete}
            >
              <Trash2 size={14} /> Xóa đã chọn
            </button>
          </div>
        </div>
      )}

      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th className={styles.thCheck}>
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={onSelectAll}
                className={styles.checkbox}
                aria-label="Chọn tất cả"
              />
            </th>
            <th className={styles.thService}>Dịch vụ đang cung cấp</th>
            <th className={styles.thPrice}>Mức giá & Gói</th>
            <th className={styles.thStats}>Hiệu quả hoạt động</th>
            <th className={styles.thStatus}>Trạng thái</th>
            <th className={styles.thToggle}>Nhận đơn</th>
            <th className={styles.thActions}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => {
            const isSelected = selectedIds.includes(service.serviceId);
            const isMenuOpen = activeMenuId === service.serviceId;
            const isActive = service.status === 'ACTIVE';

            return (
              <tr
                key={service.serviceId}
                className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
              >
                <td className={styles.tdCheck}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(service.serviceId)}
                    className={styles.checkbox}
                    aria-label={`Chọn ${service.title}`}
                  />
                </td>

                <td className={styles.tdService}>
                  <div className={styles.serviceCell}>
                    <img
                      src={service.coverImage}
                      alt={service.title}
                      className={styles.thumbnail}
                    />
                    <div className={styles.serviceMeta}>
                      <button
                        type="button"
                        className={styles.titleLink}
                        onClick={() => onViewService(service)}
                        title="Xem chi tiết dịch vụ"
                      >
                        {service.title}
                      </button>
                      <div className={styles.badgeLine}>
                        <span className={styles.categoryPill}>{service.categoryName}</span>
                        {getExecutionBadge(service.executionType)}
                      </div>
                    </div>
                  </div>
                </td>

                <td className={styles.tdPrice}>
                  <div className={styles.priceCell}>
                    <span className={styles.priceRange}>{service.priceRange || 'Theo gói'}</span>
                    <span className={styles.pkgCountBadge}>{service.packagesCount ?? 0} gói dịch vụ</span>
                  </div>
                </td>

                <td className={styles.tdStats}>
                  <div className={styles.statsCell}>
                    {service.impressions != null && (
                      <div className={styles.statLine}>
                        <Eye size={13} className={styles.statIcon} title="Lượt hiển thị" />
                        <span>{new Intl.NumberFormat('vi-VN').format(service.impressions)} lượt xem</span>
                      </div>
                    )}
                    {service.ordersCount != null && (
                      <div className={styles.statLine}>
                        <ShoppingBag size={13} className={styles.statIcon} title="Đơn hàng tích lũy" />
                        <span><strong>{service.ordersCount}</strong> đơn hàng</span>
                      </div>
                    )}
                    {service.avgRating > 0 && (
                      <div className={styles.ratingLine}>
                        <Star size={13} className={styles.starIcon} />
                        <span><strong>{service.avgRating}</strong> ({service.reviewCount})</span>
                      </div>
                    )}
                  </div>
                </td>

                <td className={styles.tdStatus}>
                  <StatusBadge status={service.status} />
                </td>

                <td className={styles.tdToggle}>
                  <label className={styles.switch} title={isActive ? 'Bấm để Tạm ngưng nhận đơn' : 'Bấm để Kích hoạt nhận đơn'}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => onToggleStatus && onToggleStatus(service.serviceId)}
                      disabled={!onToggleStatus || service.status === 'PENDING'}
                    />
                    <span className={styles.slider} />
                  </label>
                </td>

                <td className={styles.tdActions}>
                  <div className={styles.actionButtonsRow}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => onViewService(service)}
                      title="Xem trang công khai"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => onEditService(service)}
                      title="Chỉnh sửa nội dung"
                    >
                      <Edit3 size={16} />
                    </button>

                    <div className={styles.menuWrapper} ref={isMenuOpen ? menuRef : undefined}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => setActiveMenuId(isMenuOpen ? null : service.serviceId)}
                        title="Tùy chọn khác"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <div className={styles.dropdownMenu}>
                          {onDuplicateService && (
                            <button
                              type="button"
                              className={styles.dropdownItem}
                              onClick={() => {
                                onDuplicateService(service);
                                setActiveMenuId(null);
                              }}
                            >
                              <Copy size={14} />
                              <span>Nhân bản dịch vụ</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className={`${styles.dropdownItem} ${styles.dropdownItemDelete}`}
                            onClick={() => {
                              onDeleteService(service.serviceId);
                              setActiveMenuId(null);
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Xóa dịch vụ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
