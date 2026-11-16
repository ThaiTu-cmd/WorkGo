import { useTranslations } from "next-intl";
import React, { useState, useEffect, useRef } from 'react';
import StatusBadge from '../StatusBadge/StatusBadge';
import { Eye, Edit3, Copy, Trash2, ExternalLink, Star, ShoppingBag, Laptop, MapPin, Truck, MoreVertical, AlertCircle, RotateCcw, Plus } from 'lucide-react';
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
  onCreateService
}) {
  const tr = useTranslations("misc");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // R3: Escape closes the row dropdown; outside click does too.
  useEffect(() => {
    if (!activeMenuId) return;
    const onKey = e => {
      if (e.key === 'Escape') setActiveMenuId(null);
    };
    const onPointer = e => {
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
  const getExecutionBadge = type => {
    switch (type) {
      case 'DIGITAL':
        return <span className={`${styles.execBadge} ${styles.execDigital}`} title={tr("m524")}>
            <Laptop size={12} />{tr("m538")}</span>;
      case 'ONSITE':
        return <span className={`${styles.execBadge} ${styles.execOnsite}`} title={tr("m525")}>
            <MapPin size={12} />{tr("m539")}</span>;
      case 'DELIVERY':
        return <span className={`${styles.execBadge} ${styles.execDelivery}`} title={tr("m526")}>
            <Truck size={12} />{tr("m76")}</span>;
      default:
        return null;
    }
  };
  if (services.length === 0) {
    return <div className={styles.emptyContainer}>
        <AlertCircle size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>{tr("m540")}</h3>
        <p className={styles.emptyText}>{tr("m1500")}</p>
        <div className={styles.emptyActions}>
          {onClearFilters && <button type="button" className={styles.emptyResetBtn} onClick={onClearFilters}>
              <RotateCcw size={16} />
              <span>{tr("m401")}</span>
            </button>}
          {onCreateService && <button type="button" className={styles.emptySecondaryBtn} onClick={onCreateService}>
              <Plus size={16} />
              <span>{tr("m542")}</span>
            </button>}
        </div>
      </div>;
  }
  return <div className={styles.tableWrapper}>
      {selectedIds.length > 0 && <div className={styles.bulkActionBar}>
          <div className={styles.bulkCount} aria-live="polite" aria-atomic="true">{tr("m543")} <strong>{selectedIds.length}</strong> {tr("m438")}</div>
          <div className={styles.bulkButtons}>
            {onBulkActivate && <button type="button" className={styles.bulkBtn} onClick={onBulkActivate}>{tr("m544")}</button>}
            {onBulkPause && <button type="button" className={styles.bulkBtn} onClick={onBulkPause}>{tr("m545")}</button>}
            <button type="button" className={`${styles.bulkBtn} ${styles.bulkDeleteBtn}`} onClick={onBulkDelete}>
              <Trash2 size={14} />{tr("m546")}</button>
          </div>
        </div>}

      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th className={styles.thCheck}>
              <input type="checkbox" checked={isAllSelected} ref={el => {
              if (el) el.indeterminate = isIndeterminate;
            }} onChange={onSelectAll} className={styles.checkbox} aria-label={tr("m527")} />
            </th>
            <th className={styles.thService}>{tr("m547")}</th>
            <th className={styles.thPrice}>{tr("m548")}</th>
            <th className={styles.thStats}>{tr("m549")}</th>
            <th className={styles.thStatus}>{tr("m259")}</th>
            <th className={styles.thToggle}>{tr("m550")}</th>
            <th className={styles.thActions}>{tr("m551")}</th>
          </tr>
        </thead>
        <tbody>
          {services.map(service => {
          const isSelected = selectedIds.includes(service.serviceId);
          const isMenuOpen = activeMenuId === service.serviceId;
          const isActive = service.status === 'ACTIVE';
          return <tr key={service.serviceId} className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}>
                <td className={styles.tdCheck}>
                  <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(service.serviceId)} className={styles.checkbox} aria-label={tr("m528", {
                p0: service.title
              })} />
                </td>

                <td className={styles.tdService}>
                  <div className={styles.serviceCell}>
                    <img src={service.coverImage} alt={service.title} className={styles.thumbnail} />
                    <div className={styles.serviceMeta}>
                      <button type="button" className={styles.titleLink} onClick={() => onViewService(service)} title={tr("m529")}>
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
                    <span className={styles.priceRange}>{service.priceRange || tr("m530")}</span>
                    <span className={styles.pkgCountBadge}>{service.packagesCount ?? 0}{tr("m1501")}</span>
                  </div>
                </td>

                <td className={styles.tdStats}>
                  <div className={styles.statsCell}>
                    {service.impressions != null && <div className={styles.statLine}>
                        <Eye size={13} className={styles.statIcon} title={tr("m531")} />
                        <span>{new Intl.NumberFormat('vi-VN').format(service.impressions)}{tr("m1502")}</span>
                      </div>}
                    {service.ordersCount != null && <div className={styles.statLine}>
                        <ShoppingBag size={13} className={styles.statIcon} title={tr("m532")} />
                        <span><strong>{service.ordersCount}</strong>{tr("m555")}</span>
                      </div>}
                    {service.avgRating > 0 && <div className={styles.ratingLine}>
                        <Star size={13} className={styles.starIcon} />
                        <span><strong>{service.avgRating}</strong> ({service.reviewCount})</span>
                      </div>}
                  </div>
                </td>

                <td className={styles.tdStatus}>
                  <StatusBadge status={service.status} />
                </td>

                <td className={styles.tdToggle}>
                  <label className={styles.switch} title={isActive ? tr("m533") : tr("m534")}>
                    <input type="checkbox" checked={isActive} onChange={() => onToggleStatus && onToggleStatus(service.serviceId)} disabled={!onToggleStatus || service.status === 'PENDING'} />
                    <span className={styles.slider} />
                  </label>
                </td>

                <td className={styles.tdActions}>
                  <div className={styles.actionButtonsRow}>
                    <button type="button" className={styles.iconBtn} onClick={() => onViewService(service)} title={tr("m535")}>
                      <ExternalLink size={16} />
                    </button>
                    <button type="button" className={styles.iconBtn} onClick={() => onEditService(service)} title={tr("m536")}>
                      <Edit3 size={16} />
                    </button>

                    <div className={styles.menuWrapper} ref={isMenuOpen ? menuRef : undefined}>
                      <button type="button" className={styles.iconBtn} onClick={() => setActiveMenuId(isMenuOpen ? null : service.serviceId)} title={tr("m537")}>
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && <div className={styles.dropdownMenu}>
                          {onDuplicateService && <button type="button" className={styles.dropdownItem} onClick={() => {
                      onDuplicateService(service);
                      setActiveMenuId(null);
                    }}>
                              <Copy size={14} />
                              <span>{tr("m556")}</span>
                            </button>}
                          <button type="button" className={`${styles.dropdownItem} ${styles.dropdownItemDelete}`} onClick={() => {
                      onDeleteService(service.serviceId);
                      setActiveMenuId(null);
                    }}>
                            <Trash2 size={14} />
                            <span>{tr("m557")}</span>
                          </button>
                        </div>}
                    </div>
                  </div>
                </td>
              </tr>;
        })}
        </tbody>
      </table>
    </div>;
}