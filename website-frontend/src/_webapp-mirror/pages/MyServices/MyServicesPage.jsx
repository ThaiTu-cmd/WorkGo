import React, { useState } from 'react';
import { useMyServices } from '../../hooks/useMyServices';
import { NOT_PROVIDER_MESSAGE } from '../../api/axiosClient';
import ServicesToolbar from './components/ServicesToolbar/ServicesToolbar';
import ServicesTable from './components/ServicesTable/ServicesTable';
import {
  ArrowLeft,
  ShieldCheck,
  CalendarClock,
  Store,
} from 'lucide-react';
import styles from './MyServicesPage.module.css';

const STATE_MESSAGES = {
  loading: 'Đang tải danh sách dịch vụ...',
  'needs-login': 'Đăng nhập bằng tài khoản Chuyên gia để quản lý dịch vụ.',
  forbidden: NOT_PROVIDER_MESSAGE,
  error: 'Không tải được danh sách dịch vụ từ máy chủ.',
};

// Live list from catalog-service. Status toggles / duplicates are not offered:
// ServiceUpdateRequest has no status field yet (BACKEND_GAPS.md).
export default function MyServicesPage({
  onSelectService,
  onGoHome,
  onShowToast,
  onOpenCreateForm,
  onOpenEditForm,
  onOpenAvailability,
  onOpenProviderOnboarding,
}) {
  // Loads on mount, so returning here after the service form shows the saved changes.
  const { status, services, reload, deleteService } = useMyServices();

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
    active: services.filter((s) => s.status === 'ACTIVE').length,
    pending: services.filter((s) => s.status === 'PENDING').length,
    paused: services.filter((s) => s.status === 'PAUSED').length,
    draft: services.filter((s) => s.status === 'DRAFT').length,
  };

  const filteredServices = services.filter((service) => {
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

  const handleToggleSelect = (serviceId) => {
    setSelectedIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredServices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredServices.map((s) => s.serviceId));
    }
  };

  const removeMany = async (ids) => {
    const results = await Promise.allSettled(ids.map((id) => deleteService(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    return failed;
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} dịch vụ đã chọn không?`)) return;
    const count = selectedIds.length;
    const failed = await removeMany(selectedIds);
    if (onShowToast) {
      onShowToast(
        failed ? `Đã xóa ${count - failed}/${count} dịch vụ, ${failed} dịch vụ lỗi` : `Đã xóa ${count} dịch vụ khỏi hệ thống`
      );
    }
  };

  const handleDeleteService = async (serviceId) => {
    const s = services.find((item) => item.serviceId === serviceId);
    if (!window.confirm(`Xác nhận xóa dịch vụ "${s?.title}"?`)) return;
    const failed = await removeMany([serviceId]);
    if (onShowToast) {
      onShowToast(failed ? `Không xóa được dịch vụ "${s?.title}"` : `Đã xóa dịch vụ "${s?.title}"`);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.topBar}>
          <div className={styles.breadcrumbNav}>
            <button type="button" className={styles.backBtn} onClick={onGoHome} title="Về trang chủ">
              <ArrowLeft size={16} /> Trang chủ
            </button>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcLink}>Kênh Chuyên gia</span>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcCurrent}>Quản lý Dịch vụ (My Services)</span>
          </div>

          <div className={styles.providerBadgeBox}>
            <ShieldCheck size={16} className={styles.shieldIcon} />
            <span>Kênh Chuyên gia</span>
          </div>
        </div>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <Store size={26} className={styles.titleIcon} aria-hidden="true" /> Quản lý dịch vụ
            </h1>
            <p className={styles.pageSubtitle}>
              Theo dõi tình trạng hiển thị, mức giá, số lượt xem và hiệu suất các gói dịch vụ bạn cung cấp trên WorkGo.
            </p>
          </div>
          {onOpenAvailability && (
            <button type="button" className={styles.availabilityBtn} onClick={onOpenAvailability}>
              <CalendarClock size={16} /> Lịch rảnh
            </button>
          )}
        </div>


        <ServicesToolbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          tabCounts={tabCounts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onOpenCreateModal={() => onOpenCreateForm && onOpenCreateForm()}
        />

        {status !== 'ready' ? (
          <div className={styles.pageSubtitle} role={status === 'error' ? 'alert' : 'status'}>
            <p>{STATE_MESSAGES[status]}</p>
            {status === 'error' && (
              <button type="button" className={styles.availabilityBtn} onClick={reload}>
                Thử lại
              </button>
            )}
            {status === 'forbidden' && onOpenProviderOnboarding && (
              <button type="button" className={styles.availabilityBtn} onClick={onOpenProviderOnboarding}>
                Đăng ký làm Chuyên gia
              </button>
            )}
          </div>
        ) : (
        <ServicesTable
          services={filteredServices}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onViewService={onSelectService}
          onEditService={(s) =>
            onOpenEditForm
              ? onOpenEditForm(s.serviceId)
              : onShowToast && onShowToast(`Mở chỉnh sửa cho "${s.title}"`)
          }
          onDeleteService={handleDeleteService}
          onBulkDelete={handleBulkDelete}
          onClearFilters={handleClearFilters}
          onCreateService={() => onOpenCreateForm && onOpenCreateForm()}
        />
        )}
      </div>
    </div>
  );
}
