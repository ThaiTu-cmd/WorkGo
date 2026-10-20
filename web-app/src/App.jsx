import React, { useState, useEffect, useRef, Suspense, startTransition } from 'react';
import Header from './components/common/Header/Header';
import HeroBanner from './components/home/HeroBanner/HeroBanner';
import TrustedBy from './components/home/TrustedBy/TrustedBy';
import FeaturedCategories from './components/home/FeaturedCategories/FeaturedCategories';
import PopularServices from './components/home/PopularServices/PopularServices';
import ValueProposition from './components/home/ValueProposition/ValueProposition';
import HowItWorks from './components/home/HowItWorks/HowItWorks';
import DualCTA from './components/home/DualCTA/DualCTA';
import Footer from './components/common/Footer/Footer';
import CatalogSearchPage from './pages/CatalogSearch/CatalogSearchPage';
import ServiceDetailPage from './pages/ServiceDetail/ServiceDetailPage';
import MyServicesPage from './pages/MyServices/MyServicesPage';
import PublicInfoPage from './pages/PublicInfo/PublicInfoPage';
import { PUBLIC_INFO_PAGE_KEYS } from './pages/PublicInfo/publicInfoContent';
import VerificationCenterPage from './pages/BackendParity/VerificationCenterPage';
import BookingSlotsPage from './pages/BackendParity/BookingSlotsPage';
import AdminConsolePage from './pages/BackendParity/AdminConsolePage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
// R5: split rarely-opened heavy views out of the initial bundle.
const AuthModal = React.lazy(() => import('./components/common/AuthModal/AuthModal'));
const ServiceFormPage = React.lazy(() => import('./pages/ServiceForm/ServiceFormPage'));
import {
  initialProviderServices,
  persistProviderServices,
} from './pages/MyServices/providerServicesStore';
import { Info } from 'lucide-react';
import styles from './App.module.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'catalog' | 'detail' | 'my-services' | 'service-form'
  const [previousPage, setPreviousPage] = useState('home');
  const [selectedServiceId, setSelectedServiceId] = useState('svc-1');
  // C2-5: persisted snapshot wins on reload; bundled mocks are fallback.
  // (MyServicesPage edits funnel through onUpdateServices into this state,
  // so persistence must live here — otherwise reload restores the mock.)
  const [providerServices, setProviderServices] = useState(initialProviderServices);

  // Write-through: toggle/bulk/duplicate/delete/form-success all land here.
  // R2: on write failure the store keeps a session in-memory copy; toast once.
  // S4: offline state for the banner (M3) — refreshed on online/offline events.
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  // R2: on write failure the store keeps a session in-memory copy; toast once.
  const persistFailedRef = useRef(false);
  useEffect(() => {
    if (persistProviderServices(providerServices) === false) {
      if (!persistFailedRef.current) {
        persistFailedRef.current = true;
        showToast('Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.');
      }
    } else {
      persistFailedRef.current = false;
    }
    // showToast identity changes per render; depending on it would re-toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerServices]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const id = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50);
      return () => clearTimeout(id);
    }
  }, [currentPage]);
  const [serviceFormMode, setServiceFormMode] = useState('create'); // 'create' | 'edit'
  const [editServiceId, setEditServiceId] = useState(null);
  const [catalogFilters, setCatalogFilters] = useState({
    category: 'ALL',
    executionType: 'ALL',
    query: '',
  });

  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  // F6: toast queue (max 3, newest on top) — showToast(message) signature unchanged
  // so MyServicesPage/ServiceDetail call-sites need no edits.
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef({});

  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => Object.values(timers).forEach((t) => clearTimeout(t));
  }, []);

  const dismissToast = (id) => {
    const timer = toastTimersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete toastTimersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
    toastTimersRef.current[id] = setTimeout(() => dismissToast(id), 3500);
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
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  useEffect(() => {
    const handleCustomNav = (e) => {
      if (e.detail?.page) {
        handleNavigate(e.detail.page, e.detail.params || {});
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('workgo-navigate', handleCustomNav);
      return () => window.removeEventListener('workgo-navigate', handleCustomNav);
    }
  }, []);

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
    // R5: entering the lazy service-form suspends — transition keeps input responsive.
    startTransition(() => {
      setServiceFormMode('create');
      setEditServiceId(null);
      setPreviousPage(currentPage);
      setCurrentPage('service-form');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditForm = (serviceId) => {
    startTransition(() => {
      setServiceFormMode('edit');
      setEditServiceId(serviceId);
      setPreviousPage(currentPage);
      setCurrentPage('service-form');
    });
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
      {/* S4: offline banner — local data keeps working, user must know why */}
      {!isOnline && (
        <div className={styles.offlineBanner} role="status">
          <span>Bạn đang ngoại tuyến — ứng dụng vẫn dùng được với dữ liệu đã lưu trên thiết bị này.</span>
        </div>
      )}
      {/* Toast queue (max 3, each auto-dismisses + manual close) */}
      {toasts.length > 0 && (
        <div className={styles.toastStack}>
          {toasts.map((t) => (
            <div key={t.id} className={styles.toastNotification} role="status">
              <Info size={18} className={styles.toastIcon} />
              <span>{t.message}</span>
              <button
                type="button"
                className={styles.toastClose}
                onClick={() => dismissToast(t.id)}
                aria-label="Đóng thông báo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Header (hidden on service-form for focused wizard view) */}
      {currentPage !== 'service-form' && (
        <Header
          activePage={currentPage}
          onNavigate={handleNavigate}
          onOpenAuth={(mode) => startTransition(() => setAuthModal(mode))}
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
          <DualCTA onOpenAuth={(mode) => startTransition(() => setAuthModal(mode))} />
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
        /* Provider Multi-step Service Form Wizard (lazy chunk) */
        <Suspense fallback={<div className={styles.lazyFallback} role="status">Đang tải biểu mẫu...</div>}>
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
        </Suspense>
      )}

      {/* 12 Public Info Content Pages */}
      {[
        'how-it-works',
        'escrow-protection',
        'refund-policy',
        'faq',
        'verification-standards',
        'package-rules',
        'community',
        'about',
        'careers',
        'terms',
        'privacy',
        'contact',
      ].includes(currentPage) && (
        <PublicInfoPage
          pageKey={currentPage}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {/* 3 Backend Parity Pages */}
      {currentPage === 'verification-center' && (
        <VerificationCenterPage
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {currentPage === 'booking-slots' && (
        <BookingSlotsPage
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {currentPage === 'admin-console' && (
        <AdminConsolePage
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {/* Fallback NotFoundPage cho 13 page key legacy Header hoặc route chưa xác định */}
      {currentPage !== 'home' &&
        currentPage !== 'catalog' &&
        currentPage !== 'detail' &&
        currentPage !== 'my-services' &&
        currentPage !== 'service-form' &&
        currentPage !== 'verification-center' &&
        currentPage !== 'booking-slots' &&
        currentPage !== 'admin-console' &&
        ![
          'how-it-works',
          'escrow-protection',
          'refund-policy',
          'faq',
          'verification-standards',
          'package-rules',
          'community',
          'about',
          'careers',
          'terms',
          'privacy',
          'contact',
        ].includes(currentPage) && (
          <NotFoundPage
            requestedKey={currentPage}
            onNavigate={handleNavigate}
          />
        )}

      {/* Footer (hidden on service-form wizard for clean focus) */}
      {currentPage !== 'service-form' && <Footer onNavigate={handleNavigate} />}

      {/* Authentication Modal (lazy chunk) */}
      {authModal && (
        <Suspense fallback={<div className={styles.lazyFallback} role="status">Đang tải...</div>}>
          <AuthModal
            initialMode={authModal}
            onClose={() => setAuthModal(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
