import React, { useState } from 'react';
import { mockProviderServices } from '../../data/mockProviderServices';
import StatsCards from './components/StatsCards/StatsCards';
import ServicesToolbar from './components/ServicesToolbar/ServicesToolbar';
import ServicesTable from './components/ServicesTable/ServicesTable';
import CreateServiceModal from './components/CreateServiceModal/CreateServiceModal';
import { 
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import styles from './MyServicesPage.module.css';

export default function MyServicesPage({
  onSelectService,
  onGoHome,
  onShowToast,
  onOpenCreateForm,
  onOpenEditForm,
  services: externalServices,
  onUpdateServices,
}) {
  const [internalServices, setInternalServices] = useState(mockProviderServices);
  const services = externalServices || internalServices;
  const setServices = (newValOrFn) => {
    if (onUpdateServices) {
      if (typeof newValOrFn === 'function') {
        onUpdateServices((prev) => newValOrFn(prev || services));
      } else {
        onUpdateServices(newValOrFn);
      }
    } else {
      setInternalServices(newValOrFn);
    }
  };

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      const matchCat = service.categoryName.toLowerCase().includes(q);
      if (!matchTitle && !matchCat) return false;
    }
    if (selectedCategory !== 'ALL' && service.categorySlug !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleToggleStatus = (serviceId) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.serviceId === serviceId) {
          const nextStatus = s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          if (onShowToast) {
            onShowToast(
              nextStatus === 'ACTIVE'
                ? `Đã kích hoạt dịch vụ "${s.title}"`
                : `Đã tạm ngưng nhận đơn cho "${s.title}"`
            );
          }
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

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

  const handleBulkActivate = () => {
    setServices((prev) =>
      prev.map((s) =>
        selectedIds.includes(s.serviceId) ? { ...s, status: 'ACTIVE' } : s
      )
    );
    if (onShowToast) {
      onShowToast(`Đã kích hoạt ${selectedIds.length} dịch vụ đã chọn`);
    }
    setSelectedIds([]);
  };

  const handleBulkPause = () => {
    setServices((prev) =>
      prev.map((s) =>
        selectedIds.includes(s.serviceId) ? { ...s, status: 'PAUSED' } : s
      )
    );
    if (onShowToast) {
      onShowToast(`Đã tạm ngưng ${selectedIds.length} dịch vụ đã chọn`);
    }
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} dịch vụ đã chọn không?`)) {
      setServices((prev) => prev.filter((s) => !selectedIds.includes(s.serviceId)));
      if (onShowToast) {
        onShowToast(`Đã xóa ${selectedIds.length} dịch vụ khỏi hệ thống`);
      }
      setSelectedIds([]);
    }
  };

  const handleDeleteService = (serviceId) => {
    const s = services.find((item) => item.serviceId === serviceId);
    if (window.confirm(`Xác nhận xóa dịch vụ "${s?.title}"?`)) {
      setServices((prev) => prev.filter((item) => item.serviceId !== serviceId));
      setSelectedIds((prev) => prev.filter((id) => id !== serviceId));
      if (onShowToast) {
        onShowToast(`Đã xóa dịch vụ "${s?.title}"`);
      }
    }
  };

  const handleDuplicateService = (service) => {
    const duplicated = {
      ...service,
      serviceId: `svc-${Date.now()}`,
      title: `${service.title} (Bản sao)`,
      status: 'DRAFT',
      impressions: 0,
      clicks: 0,
      ordersCount: 0,
      updatedAt: new Date().toISOString(),
    };
    setServices((prev) => [duplicated, ...prev]);
    if (onShowToast) {
      onShowToast('Đã tạo bản sao ở trạng thái Bản nháp');
    }
  };

  const handleCreateService = (newService) => {
    setServices((prev) => [newService, ...prev]);
    if (onShowToast) {
      onShowToast(`Đã tạo thành công dịch vụ mới: "${newService.title}"`);
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
            <span>Tài khoản Chuyên gia: <strong>Trần Minh Quang</strong> (Top Rated)</span>
          </div>
        </div>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Danh mục Dịch vụ đang bán</h1>
            <p className={styles.pageSubtitle}>
              Theo dõi tình trạng hiển thị, mức giá, số lượt xem và hiệu suất các gói dịch vụ bạn cung cấp trên WorkGo.
            </p>
          </div>
        </div>

        <StatsCards services={services} />

        <ServicesToolbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          tabCounts={tabCounts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onOpenCreateModal={() => (onOpenCreateForm ? onOpenCreateForm() : setIsCreateModalOpen(true))}
        />

        <ServicesTable
          services={filteredServices}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onToggleStatus={handleToggleStatus}
          onViewService={onSelectService}
          onEditService={(s) =>
            onOpenEditForm
              ? onOpenEditForm(s.serviceId)
              : onShowToast && onShowToast(`Mở chỉnh sửa cho "${s.title}"`)
          }
          onDuplicateService={handleDuplicateService}
          onDeleteService={handleDeleteService}
          onBulkActivate={handleBulkActivate}
          onBulkPause={handleBulkPause}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <CreateServiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateService}
      />
    </div>
  );
}
