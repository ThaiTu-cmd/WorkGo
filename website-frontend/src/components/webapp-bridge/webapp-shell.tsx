"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/_webapp-mirror/components/common/Header/Header";
import HeroBanner from "@/_webapp-mirror/components/home/HeroBanner/HeroBanner";
import TrustedBy from "@/_webapp-mirror/components/home/TrustedBy/TrustedBy";
import FeaturedCategories from "@/_webapp-mirror/components/home/FeaturedCategories/FeaturedCategories";
import PopularServices from "@/_webapp-mirror/components/home/PopularServices/PopularServices";
import ValueProposition from "@/_webapp-mirror/components/home/ValueProposition/ValueProposition";
import HowItWorks from "@/_webapp-mirror/components/home/HowItWorks/HowItWorks";
import DualCTA from "@/_webapp-mirror/components/home/DualCTA/DualCTA";
import Footer from "@/_webapp-mirror/components/common/Footer/Footer";
import AuthModal from "@/_webapp-mirror/components/common/AuthModal/AuthModal";
import CatalogSearchPage from "@/_webapp-mirror/pages/CatalogSearch/CatalogSearchPage";
import ServiceDetailPage from "@/_webapp-mirror/pages/ServiceDetail/ServiceDetailPage";
import MyServicesPage from "@/_webapp-mirror/pages/MyServices/MyServicesPage";
import ServiceFormPage from "@/_webapp-mirror/pages/ServiceForm/ServiceFormPage";
import AvailabilityPage from "@/_webapp-mirror/pages/Availability/AvailabilityPage";
import CheckoutPage from "@/_webapp-mirror/pages/Checkout/CheckoutPage";
import OrderDashboardPage from "@/_webapp-mirror/pages/OrderDashboard/OrderDashboardPage";
import { mockProviderServices } from "@/_webapp-mirror/data/mockProviderServices";
import {
  initialProviderServices,
  persistProviderServices,
} from "@/_webapp-mirror/pages/MyServices/providerServicesStore";
import TrungSubNav from "../trung-pages/_ui/TrungSubNav";
import RegisterPage from "../trung-pages/auth/RegisterPage";
import LoginPage from "../trung-pages/auth/LoginPage";
import ProfileSettingsPage from "../trung-pages/profile/ProfileSettingsPage";
import AddressBookPage from "../trung-pages/profile/AddressBookPage";
import ProviderOnboardingPage from "../trung-pages/provider/ProviderOnboardingPage";
import ProviderProfilePage from "../trung-pages/provider/ProviderProfilePage";
import JobListPage from "../trung-pages/jobs/JobListPage";
import JobPostPage from "../trung-pages/jobs/JobPostPage";
import SubmitProposalPage from "../trung-pages/jobs/SubmitProposalPage";
import ProposalReviewPage from "../trung-pages/jobs/ProposalReviewPage";
import PaymentGatewayPage from "../trung-pages/payment/PaymentGatewayPage";
import WalletPage from "../trung-pages/payment/WalletPage";
import PayoutSettingsPage from "../trung-pages/payment/PayoutSettingsPage";
import ReviewFormPage from "../trung-pages/trust/ReviewFormPage";
import DisputeCenterPage from "../trung-pages/trust/DisputeCenterPage";
import { Info } from "lucide-react";
import styles from "./webapp-shell.module.css";

export type CatalogFilterParams = {
  category?: string;
  executionType?: string;
  query?: string;
  jobId?: string;
  providerId?: string;
  orderId?: string;
};

export type TrungPageKey =
  | "home"
  | "catalog"
  | "detail"
  | "my-services"
  | "service-form"
  | "availability"
  | "checkout"
  | "orders"
  | "register"
  | "login"
  | "profile-settings"
  | "provider-onboarding"
  | "address-book"
  | "provider-profile"
  | "job-list"
  | "job-post"
  | "submit-proposal"
  | "proposal-review"
  | "payment-gateway"
  | "wallet"
  | "payout-settings"
  | "review-form"
  | "dispute-center";

type CategorySelection = {
  slug: string;
  executionType?: string;
  name: string;
};

type ServiceSelection = {
  serviceId: string;
};

type SavedService = {
  serviceId: string;
  title: string;
};

type ProviderService = (typeof mockProviderServices)[number] | SavedService;

// Port 1:1 of web-app/src/App.jsx state machine (minus App.module.css,
// which carries the Turbopack-impure `main` selector). Data import resolves
// through turbopack.resolveAlias to engine-backed shims; without the alias
// it falls back to the mirror's own web-app mocks.
export default function WebAppShell() {
  const [currentPage, setCurrentPage] = useState<TrungPageKey>("home"); // 'home' | 'catalog' | 'detail' | 'my-services' | 'service-form' | 'availability' | 'checkout' | 'orders' + 15 trung-pages
  const [previousPage, setPreviousPage] = useState<TrungPageKey>("home");
  const [selectedServiceId, setSelectedServiceId] = useState("svc-1");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  // { service, pkg, addons } handed over by ServiceDetailPage "Tiếp tục đặt hàng".
  const [checkoutOrder, setCheckoutOrder] = useState<Record<string, unknown> | null>(null);
  // C2-5: same persistence contract as web-app MyServicesPage — the
  // persisted snapshot wins on reload, bundled mocks are the fallback.
  // (Without this, the shell would feed the stale mock list and the
  // mirrored page would overwrite the snapshot on mount.)
  const [providerServices, setProviderServices] = useState<ProviderService[]>(
    () => initialProviderServices() as ProviderService[]
  );

  // Write-through: form create/edit flows land here first.
  // S4: offline state for the banner (M3) — refreshed on online/offline events.
  // SSR-safe: initial true matches server HTML (no banner); the real
  // navigator.onLine value syncs on mount to avoid hydration mismatch
  // (Node defines global navigator but navigator.onLine is undefined).
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    // Sync browser-only navigator.onLine post-hydration so server HTML
    // (assumed online) matches first client render; avoids hydration
    // mismatch (Node's global navigator exists but onLine is undefined).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  const [serviceFormMode, setServiceFormMode] = useState<"create" | "edit">("create");
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [catalogFilters, setCatalogFilters] = useState({
    category: "ALL",
    executionType: "ALL",
    query: "",
  });

  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  // F6: toast queue (max 3, newest on top) — showToast(message) signature unchanged.
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => Object.values(timers).forEach((t) => clearTimeout(t));
  }, []);

  const dismissToast = (id: number) => {
    const timer = toastTimersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete toastTimersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = useCallback((message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
    toastTimersRef.current[id] = setTimeout(() => dismissToast(id), 3500);
  }, []);

  // R2 (parity with web-app): toast once when the write fails (quota/private-mode).
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
  }, [providerServices, showToast]);

  // Navigate handler from Header or links
  const handleNavigate = (page: TrungPageKey, params: CatalogFilterParams = {}) => {
    setPreviousPage(currentPage);
    setCurrentPage(page);
    if (page === "catalog") {
      setCatalogFilters({
        category: params.category || "ALL",
        executionType: params.executionType || "ALL",
        query: params.query || "",
      });
    }
    if (page === "provider-profile" && params.providerId) setSelectedProviderId(params.providerId);
    if (page === "submit-proposal" && params.jobId) setSelectedJobId(params.jobId);
    if (page === "proposal-review" && params.jobId) setSelectedJobId(params.jobId);
    if (page === "review-form" && params.orderId) setSelectedOrderId(params.orderId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Search from HeroBanner
  const handleHeroSearch = ({
    keyword,
    executionType,
  }: {
    keyword?: string;
    executionType?: string;
  }) => {
    setPreviousPage("home");
    setCurrentPage("catalog");
    setCatalogFilters({
      category: "ALL",
      executionType: executionType || "ALL",
      query: keyword || "",
    });
    showToast(`Đang tìm: "${keyword || "Tất cả dịch vụ"}"`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Select category from Home Category Grid
  const handleSelectCategory = (category: CategorySelection) => {
    setPreviousPage(currentPage);
    setCurrentPage("catalog");
    setCatalogFilters({
      category: category.slug,
      executionType: category.executionType || "ALL",
      query: "",
    });
    showToast(`Xem danh mục: ${category.name}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectService = (service: ServiceSelection) => {
    setPreviousPage(currentPage);
    setSelectedServiceId(service.serviceId);
    setCurrentPage("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenCreateForm = () => {
    setServiceFormMode("create");
    setEditServiceId(null);
    setPreviousPage(currentPage);
    setCurrentPage("service-form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenEditForm = (serviceId: string) => {
    setServiceFormMode("edit");
    setEditServiceId(serviceId);
    setPreviousPage(currentPage);
    setCurrentPage("service-form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleServiceFormSuccess = (savedService: SavedService, isEdit: boolean) => {
    setProviderServices((prev) => {
      if (isEdit) {
        return prev.map((s) => (s.serviceId === savedService.serviceId ? { ...s, ...savedService } : s));
      }
      return [savedService, ...prev];
    });
    showToast(
      isEdit
        ? `Đã cập nhật dịch vụ "${savedService.title}"!`
        : `Đã tạo thành công dịch vụ mới "${savedService.title}"!`
    );
    setCurrentPage("my-services");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`${styles.appRoot} ${styles["webapp-scope"]}`}>
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
      {currentPage !== "service-form" && (
        <Header
          activePage={currentPage}
          onNavigate={handleNavigate}
          onOpenAuth={(mode: "login" | "register") => setAuthModal(mode)}
        />
      )}

      {/* Trung auxiliary nav (Header mirror can't carry the 15 new links) */}
      <TrungSubNav current={currentPage} onNavigate={handleNavigate} />

      {/* Main Content Router */}
      {currentPage === "home" && (
        <main className={styles.main}>
          {/* 1. Hero Banner with Central Search */}
          <HeroBanner onSearch={handleHeroSearch} />

          {/* 2. Trusted By enterprise logos */}
          <TrustedBy />

          {/* 3. Featured Categories Grid */}
          <FeaturedCategories onSelectCategory={handleSelectCategory} />

          {/* 4. Popular Services Carousel (mirror ignores onViewAll; navigation via select) */}
          <PopularServices onSelectService={handleSelectService} />

          {/* 5. Value Proposition (Escrow & Packages) */}
          <ValueProposition />

          {/* 6. How It Works (4 steps) */}
          <HowItWorks />

          {/* 7. Dual Call-to-Action */}
          <DualCTA onOpenAuth={(mode: "login" | "register") => setAuthModal(mode)} />
        </main>
      )}

      {currentPage === "catalog" && (
        /* Catalog Search Page */
        <CatalogSearchPage
          key={`${catalogFilters.category}-${catalogFilters.executionType}-${catalogFilters.query}`}
          initialCategory={catalogFilters.category}
          initialExecutionType={catalogFilters.executionType}
          initialSearchQuery={catalogFilters.query}
          onSelectService={handleSelectService}
          onGoHome={() => handleNavigate("home")}
        />
      )}

      {currentPage === "detail" && (
        /* Service Detail Page */
        <ServiceDetailPage
          key={selectedServiceId}
          serviceId={selectedServiceId}
          onGoBack={() => setCurrentPage(previousPage || "catalog")}
          onSelectCategory={handleSelectCategory}
          onGoHome={() => handleNavigate("home")}
          onShowToast={showToast}
          onCheckout={(order: Record<string, unknown>) => {
            setCheckoutOrder(order);
            handleNavigate("checkout");
          }}
        />
      )}

      {currentPage === "checkout" && (
        /* Checkout: Order Snapshot + payment gateway (mock) */
        <CheckoutPage
          order={checkoutOrder}
          onGoBack={() => setCurrentPage("detail")}
          onShowToast={showToast}
          onDone={() => handleNavigate("home")}
          onViewOrders={() => handleNavigate("orders")}
        />
      )}

      {currentPage === "orders" && (
        /* Client / Provider order dashboard */
        <OrderDashboardPage onGoHome={() => handleNavigate("home")} onShowToast={showToast} />
      )}

      {currentPage === "my-services" && (
        /* Provider My Services Page */
        <MyServicesPage
          services={providerServices}
          onUpdateServices={setProviderServices}
          onSelectService={handleSelectService}
          onGoHome={() => handleNavigate("home")}
          onShowToast={showToast}
          onOpenCreateForm={handleOpenCreateForm}
          onOpenEditForm={handleOpenEditForm}
          onOpenAvailability={() => handleNavigate("availability")}
        />
      )}

      {currentPage === "availability" && (
        /* Provider weekly availability / booking slots */
        <AvailabilityPage
          onGoBack={() => handleNavigate("my-services")}
          onShowToast={showToast}
        />
      )}

      {currentPage === "service-form" && (
        /* Provider Multi-step Service Form Wizard */
        <ServiceFormPage
          mode={serviceFormMode}
          // Mirror defaults serviceId=null so tsc narrows the prop; at runtime
          // it accepts a string (used in .find for edit prefill, as App.jsx does).
          serviceId={editServiceId as unknown as null}
          onCancel={() => {
            setCurrentPage("my-services");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onSaveSuccess={handleServiceFormSuccess}
          onShowToast={showToast}
        />
      )}

      {currentPage === "register" && (
        <RegisterPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {currentPage === "login" && (
        <LoginPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {currentPage === "profile-settings" && (
        <ProfileSettingsPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {currentPage === "address-book" && (
        <AddressBookPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {currentPage === "provider-onboarding" && (
        <ProviderOnboardingPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {currentPage === "provider-profile" && (
        <ProviderProfilePage
          onNavigate={handleNavigate}
          onShowToast={showToast}
          providerId={selectedProviderId || undefined}
        />
      )}

      {currentPage === "job-list" && (
        <JobListPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {currentPage === "job-post" && (
        <JobPostPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {currentPage === "submit-proposal" && (
        <SubmitProposalPage
          onNavigate={handleNavigate}
          onShowToast={showToast}
          jobId={selectedJobId || undefined}
        />
      )}

      {currentPage === "proposal-review" && (
        <ProposalReviewPage
          onNavigate={handleNavigate}
          onShowToast={showToast}
          jobId={selectedJobId || undefined}
        />
      )}

      {currentPage === "payment-gateway" && (
        <PaymentGatewayPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {currentPage === "wallet" && (
        <WalletPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {currentPage === "payout-settings" && (
        <PayoutSettingsPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {currentPage === "review-form" && (
        <ReviewFormPage
          onNavigate={handleNavigate}
          onShowToast={showToast}
          orderId={selectedOrderId || undefined}
        />
      )}

      {currentPage === "dispute-center" && (
        <DisputeCenterPage onNavigate={handleNavigate} onShowToast={showToast} />
      )}

      {/* Footer (hidden on service-form wizard for clean focus) */}
      {currentPage !== "service-form" && <Footer />}

      {/* Authentication Modal */}
      {authModal && (
        <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} />
      )}
    </div>
  );
}
