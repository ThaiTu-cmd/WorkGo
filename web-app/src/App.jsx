import React, { useState } from 'react';
import Header from './components/common/Header/Header';
import HeroBanner from './components/home/HeroBanner/HeroBanner';
import TrustedBy from './components/home/TrustedBy/TrustedBy';
import FeaturedCategories from './components/home/FeaturedCategories/FeaturedCategories';
import PopularServices from './components/home/PopularServices/PopularServices';
import ValueProposition from './components/home/ValueProposition/ValueProposition';
import HowItWorks from './components/home/HowItWorks/HowItWorks';
import DualCTA from './components/home/DualCTA/DualCTA';
import Footer from './components/common/Footer/Footer';
import AuthModal from './components/common/AuthModal/AuthModal';
import CatalogSearchPage from './pages/CatalogSearch/CatalogSearchPage';
import ServiceDetailPage from './pages/ServiceDetail/ServiceDetailPage';
import MyServicesPage from './pages/MyServices/MyServicesPage';
import ServiceFormPage from './pages/ServiceForm/ServiceFormPage';
import { mockProviderServices } from './data/mockProviderServices';
import { Info } from 'lucide-react';
import styles from './App.module.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'catalog' | 'detail' | 'my-services' | 'service-form'
  const [previousPage, setPreviousPage] = useState('home');
  const [selectedServiceId, setSelectedServiceId] = useState('svc-1');
  const [providerServices, setProviderServices] = useState(mockProviderServices);
  const [serviceFormMode, setServiceFormMode] = useState('create'); // 'create' | 'edit'
  const [editServiceId, setEditServiceId] = useState(null);
  const [catalogFilters, setCatalogFilters] = useState({
    category: 'ALL',
    executionType: 'ALL',
    query: '',
  });

  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Navigate handler from Header or links
  const handleNavigate = (page, params = {}) => {
    setPreviousPage(currentPage);
    setCurrentPage(page);
    if (page === 'catalog') {
      setCatalogFilters({
        category: params.category || 'ALL',
        executionType: params.executionType || 'ALL',
        query: params.query || '',
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search from HeroBanner
  const handleHeroSearch = ({ keyword, executionType }) => {
    setPreviousPage('home');
    setCurrentPage('catalog');
    setCatalogFilters({
      category: 'ALL',
      executionType: executionType || 'ALL',
      query: keyword || '',
    });
    showToast(`Đang tìm: "${keyword || 'Tất cả dịch vụ'}"`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select category from Home Category Grid
  const handleSelectCategory = (category) => {
    setPreviousPage(currentPage);
    setCurrentPage('catalog');
    setCatalogFilters({
      category: category.slug,
      executionType: category.executionType || 'ALL',
      query: '',
    });
    showToast(`Xem danh mục: ${category.name}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectService = (service) => {
    setPreviousPage(currentPage);
    setSelectedServiceId(service.serviceId);
    setCurrentPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCreateForm = () => {
    setServiceFormMode('create');
    setEditServiceId(null);
    setPreviousPage(currentPage);
    setCurrentPage('service-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditForm = (serviceId) => {
    setServiceFormMode('edit');
    setEditServiceId(serviceId);
    setPreviousPage(currentPage);
    setCurrentPage('service-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServiceFormSuccess = (savedService, isEdit) => {
    setProviderServices((prev) => {
      if (isEdit) {
        return prev.map((s) => (s.serviceId === savedService.serviceId ? { ...s, ...savedService } : s));
      }
      return [savedService, ...prev];
    });
    showToast(isEdit ? `Đã cập nhật dịch vụ "${savedService.title}"!` : `Đã tạo thành công dịch vụ mới "${savedService.title}"!`);
    setCurrentPage('my-services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.appRoot}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toastNotification}>
          <Info size={18} className={styles.toastIcon} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header (hidden on service-form for focused wizard view) */}
      {currentPage !== 'service-form' && (
        <Header
          activePage={currentPage}
          onNavigate={handleNavigate}
          onOpenAuth={(mode) => setAuthModal(mode)}
        />
      )}

      {/* Main Content Router */}
      {currentPage === 'home' && (
        <main>
          {/* 1. Hero Banner with Central Search */}
          <HeroBanner onSearch={handleHeroSearch} />

          {/* 2. Trusted By enterprise logos */}
          <TrustedBy />

          {/* 3. Featured Categories Grid */}
          <FeaturedCategories onSelectCategory={handleSelectCategory} />

          {/* 4. Popular Services Carousel */}
          <PopularServices
            onSelectService={handleSelectService}
            onViewAll={() => handleNavigate('catalog')}
          />

          {/* 5. Value Proposition (Escrow & Packages) */}
          <ValueProposition />

          {/* 6. How It Works (4 steps) */}
          <HowItWorks />

          {/* 7. Dual Call-to-Action */}
          <DualCTA onOpenAuth={(mode) => setAuthModal(mode)} />
        </main>
      )}

      {currentPage === 'catalog' && (
        /* Catalog Search Page */
        <CatalogSearchPage
          key={`${catalogFilters.category}-${catalogFilters.executionType}-${catalogFilters.query}`}
          initialCategory={catalogFilters.category}
          initialExecutionType={catalogFilters.executionType}
          initialSearchQuery={catalogFilters.query}
          onSelectService={handleSelectService}
          onGoHome={() => handleNavigate('home')}
        />
      )}

      {currentPage === 'detail' && (
        /* Service Detail Page */
        <ServiceDetailPage
          key={selectedServiceId}
          serviceId={selectedServiceId}
          onGoBack={() => setCurrentPage(previousPage || 'catalog')}
          onSelectCategory={handleSelectCategory}
          onGoHome={() => handleNavigate('home')}
          onShowToast={showToast}
        />
      )}

      {currentPage === 'my-services' && (
        /* Provider My Services Page */
        <MyServicesPage
          services={providerServices}
          onUpdateServices={setProviderServices}
          onSelectService={handleSelectService}
          onGoHome={() => handleNavigate('home')}
          onShowToast={showToast}
          onOpenCreateForm={handleOpenCreateForm}
          onOpenEditForm={handleOpenEditForm}
        />
      )}

      {currentPage === 'service-form' && (
        /* Provider Multi-step Service Form Wizard */
        <ServiceFormPage
          mode={serviceFormMode}
          serviceId={editServiceId}
          onCancel={() => {
            setCurrentPage('my-services');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSaveSuccess={handleServiceFormSuccess}
          onShowToast={showToast}
        />
      )}

      {/* Footer (hidden on service-form wizard for clean focus) */}
      {currentPage !== 'service-form' && <Footer />}

      {/* Authentication Modal */}
      {authModal && (
        <AuthModal
          initialMode={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}
    </div>
  );
}
