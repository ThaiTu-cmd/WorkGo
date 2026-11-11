import { useTranslations } from "next-intl";
import React, { useState } from 'react';
import { useMyServices } from '../../hooks/useMyServices';
import { NOT_PROVIDER_MESSAGE } from '../../api/axiosClient';
import ServicesToolbar from './components/ServicesToolbar/ServicesToolbar';
import ServicesTable from './components/ServicesTable/ServicesTable';
import { ArrowLeft, ShieldCheck, CalendarClock, Store } from 'lucide-react';
import styles from './MyServicesPage.module.css';
const STATE_MESSAGES = {
  // Keys of the "misc" dictionary; forbidden keeps axiosClient's own message.
  loading: 'm1649',
  'needs-login': 'm1650',
  forbidden: NOT_PROVIDER_MESSAGE,
  error: 'm1651'
};

// Live list from catalog-service. Duplicating is not offered (no copy endpoint).
export default function MyServicesPage({
  onSelectService,
  onGoHome,
  onShowToast,
  onOpenCreateForm,
  onOpenEditForm,
  onOpenAvailability,
  onOpenProviderOnboarding
}) {
  const tr = useTranslations("misc");
  // Loads on mount, so returning here after the service form shows the saved changes.
  const {
    status,
    services,
    reload,
    deleteService,
    setStatus
  } = useMyServices();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const handleClearFilters = () => {
    setActiveTab('ALL');
    setSearchQuery('');
    setSelectedCategory('ALL');
  };
  const tabCounts = {
    all: services.length,
    active: services.filter(s => s.status === 'ACTIVE').length,
    pending: services.filter(s => s.status === 'PENDING').length,
    paused: services.filter(s => s.status === 'PAUSED').length,
    draft: services.filter(s => s.status === 'DRAFT').length
  };
  const filteredServices = services.filter(service => {
    if (activeTab !== 'ALL' && service.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = service.title.toLowerCase().includes(q);
      const matchCat = (service.categoryName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCat) return false;
    }
    if (selectedCategory !== 'ALL' && service.categorySlug !== selectedCategory) {
      return false;
    }
    return true;
  });
  const handleToggleSelect = serviceId => {
    setSelectedIds(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
  };
  const handleSelectAll = () => {
    if (selectedIds.length === filteredServices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredServices.map(s => s.serviceId));
    }
  };
  const handleToggleStatus = async serviceId => {
    const s = services.find(item => item.serviceId === serviceId);
    if (!s) return;
    const next = s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await setStatus(serviceId, next);
      if (onShowToast) {
        onShowToast(next === 'ACTIVE' ? tr("m587", {
          p0: s.title
        }) : tr("m588", {
          p0: s.title
        }));
      }
    } catch (err) {
      if (onShowToast) onShowToast(tr("m1452", {
        p0: err?.message || tr("m1303")
      }));
    }
  };

  // R6: bulk Activate/Pause confirm like bulk Delete.
  const setManyStatus = async (rowStatus, verb) => {
    if (!window.confirm(tr("m590", {
      p0: verb,
      p1: selectedIds.length
    }))) return;
    const ids = [...selectedIds];
    const results = await Promise.allSettled(ids.map(id => setStatus(id, rowStatus)));
    const failed = results.filter(r => r.status === 'rejected').length;
    if (onShowToast) {
      onShowToast(failed ? tr("m591", {
        p0: verb,
        p1: ids.length - failed,
        p2: ids.length,
        p3: failed
      }) : tr("m592", {
        p0: verb.toLowerCase(),
        p1: ids.length
      }));
    }
    setSelectedIds([]);
  };
  const handleBulkActivate = () => setManyStatus('ACTIVE', tr("m593"));
  const handleBulkPause = () => setManyStatus('PAUSED', tr("m559"));
  const removeMany = async ids => {
    const results = await Promise.allSettled(ids.map(id => deleteService(id)));
    const failed = results.filter(r => r.status === 'rejected').length;
    setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    return failed;
  };
  const handleBulkDelete = async () => {
    if (!window.confirm(tr("m594", {
      p0: selectedIds.length
    }))) return;
    const count = selectedIds.length;
    const failed = await removeMany(selectedIds);
    if (onShowToast) {
      onShowToast(failed ? tr("m595", {
        p0: count - failed,
        p1: count,
        p2: failed
      }) : tr("m596", {
        p0: count
      }));
    }
  };
  const handleDeleteService = async serviceId => {
    const s = services.find(item => item.serviceId === serviceId);
    if (!window.confirm(tr("m597", {
      p0: s?.title
    }))) return;
    const failed = await removeMany([serviceId]);
    if (onShowToast) {
      onShowToast(failed ? tr("m598", {
        p0: s?.title
      }) : tr("m599", {
        p0: s?.title
      }));
    }
  };
  return <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.topBar}>
          <div className={styles.breadcrumbNav}>
            <button type="button" className={styles.backBtn} onClick={onGoHome} title={tr("m476")}>
              <ArrowLeft size={16} />{tr("m242")}</button>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcLink}>{tr("m177")}</span>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcCurrent}>{tr("m602")}</span>
          </div>

          <div className={styles.providerBadgeBox}>
            <ShieldCheck size={16} className={styles.shieldIcon} />
            <span>{tr("m177")}</span>
          </div>
        </div>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <Store size={26} className={styles.titleIcon} aria-hidden="true" />{tr("m176")}</h1>
            <p className={styles.pageSubtitle}>{tr("m603")}</p>
          </div>
          {onOpenAvailability && <button type="button" className={styles.availabilityBtn} onClick={onOpenAvailability}>
              <CalendarClock size={16} />{tr("m178")}</button>}
        </div>


        <ServicesToolbar activeTab={activeTab} onSelectTab={setActiveTab} tabCounts={tabCounts} searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} onOpenCreateModal={() => onOpenCreateForm && onOpenCreateForm()} />

        {status !== 'ready' ? <div className={styles.pageSubtitle} role={status === 'error' ? 'alert' : 'status'}>
            <p>{status === 'forbidden' ? STATE_MESSAGES[status] : tr(STATE_MESSAGES[status])}</p>
            {status === 'error' && <button type="button" className={styles.availabilityBtn} onClick={reload}>{tr("m604")}</button>}
            {status === 'forbidden' && onOpenProviderOnboarding && <button type="button" className={styles.availabilityBtn} onClick={onOpenProviderOnboarding}>{tr("m605")}</button>}
          </div> : <ServicesTable services={filteredServices} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} onSelectAll={handleSelectAll} onViewService={onSelectService} onEditService={s => onOpenEditForm ? onOpenEditForm(s.serviceId) : onShowToast && onShowToast(tr("m600", {
        p0: s.title
      }))} onToggleStatus={handleToggleStatus} onDeleteService={handleDeleteService} onBulkActivate={handleBulkActivate} onBulkPause={handleBulkPause} onBulkDelete={handleBulkDelete} onClearFilters={handleClearFilters} onCreateService={() => onOpenCreateForm && onOpenCreateForm()} />}
      </div>
    </div>;
}