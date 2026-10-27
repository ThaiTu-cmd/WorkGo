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
import PublicInfoPage, { isPublicInfoPageKey, type PublicInfoPageKey } from "../trung-pages/public/PublicInfoPage";
import { PUBLIC_INFO_PAGE_KEYS } from "../trung-pages/public/publicInfoContent.js";
import NotFoundPage from "../trung-pages/NotFoundPage";
import MessagesPage from "../trung-pages/messages/MessagesPage";
import type { ChatTarget } from "../trung-pages/messages/types";
import { getAccessToken } from "@/_webapp-mirror/api/axiosClient";
import { messageApi } from "./backend";
import { Info } from "lucide-react";
import styles from "./webapp-shell.module.css";

export type CatalogFilterParams = {
  category?: string;
  executionType?: string;
  query?: string;
  jobId?: string;
  providerId?: string;
  orderId?: string;
  serviceId?: string;
  // "messages": thread to open (created if this is the first contact).
  chat?: ChatTarget;
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
  | "dispute-center"
  | "how-it-works"
  | "escrow-protection"
  | "refund-policy"
  | "faq"
  | "verification-standards"
  | "package-rules"
  | "community"
  | "about"
  | "careers"
  | "terms"
  | "privacy"
  | "contact"
  | "messages"
  | PublicInfoPageKey;

const TRUNG_PAGE_KEYS = new Set<string>([
  "register",
  "login",
  "profile-settings",
  "provider-onboarding",
  "address-book",
  "provider-profile",
  "job-list",
  "job-post",
  "submit-proposal",
  "proposal-review",
  "payment-gateway",
  "wallet",
  "payout-settings",
  "review-form",
  "dispute-center",
  ...PUBLIC_INFO_PAGE_KEYS,
  "messages",
]);

const CORE_PAGE_KEYS = new Set<string>([
  "home",
  "catalog",
  "detail",
  "my-services",
  "service-form",
  "availability",
  "checkout",
  "orders",
]);

const KNOWN_PAGE_KEYS = new Set<string>([...CORE_PAGE_KEYS, ...TRUNG_PAGE_KEYS]);

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

// Force instantaneous scroll to top regardless of CSS scroll-behavior: smooth on html/body
function scrollToTopInstant() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  const prevRootBehavior = root.style.scrollBehavior;
  const prevBodyBehavior = body ? body.style.scrollBehavior : "";

  root.style.scrollBehavior = "auto";
  if (body) body.style.scrollBehavior = "auto";

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  root.scrollTop = 0;
  if (body) body.scrollTop = 0;

  requestAnimationFrame(() => {
    root.style.scrollBehavior = prevRootBehavior;
    if (body) body.style.scrollBehavior = prevBodyBehavior;
  });
}

// Port 1:1 of web-app/src/App.jsx state machine (minus App.module.css,
// which carries the Turbopack-impure `main` selector). Data import resolves
// through turbopack.resolveAlias to engine-backed shims; without the alias
// it falls back to the mirror's own web-app mocks.
export default function WebAppShell() {
  const [currentPage, setCurrentPage] = useState<TrungPageKey>("home"); // 'home' | 'catalog' | 'detail' | 'my-services' | 'service-form' | 'availability' | 'checkout' | 'orders' + 15 trung-pages
  const [previousPage, setPreviousPage] = useState<TrungPageKey>("home");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [chatConversationId, setChatConversationId] = useState("");
  // { service, pkg, addons } handed over by ServiceDetailPage "Tiếp tục đặt hàng".
  const [checkoutOrder, setCheckoutOrder] = useState<Record<string, unknown> | null>(null);
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

  // Reset scroll to top on every page change and manage landmark focus
  useEffect(() => {
    scrollToTopInstant();

    // A11y focus management: Focus main heading or main landmark on navigation
    requestAnimationFrame(() => {
      const mainHeading = document.querySelector<HTMLElement>("main h1, [role='main'] h1, h1");
      if (mainHeading) {
        if (!mainHeading.hasAttribute("tabindex")) {
          mainHeading.setAttribute("tabindex", "-1");
        }
        mainHeading.focus({ preventScroll: true });
      } else {
        const mainLandmark = document.querySelector<HTMLElement>("main, [role='main']");
        if (mainLandmark) {
          if (!mainLandmark.hasAttribute("tabindex")) {
            mainLandmark.setAttribute("tabindex", "-1");
          }
          mainLandmark.focus({ preventScroll: true });
        }
      }
    });
  }, [currentPage]);

  // Navigate handler from Header or links
  const handleNavigate = (page: TrungPageKey, params: CatalogFilterParams = {}) => {
    // Conversations belong to an account: ask for sign-in first.
    if (page === "messages" && !getAccessToken()) {
      showToast("Vui lòng đăng nhập để nhắn tin.");
      setAuthModal("login");
      return;
    }
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
    if (page === "detail" && params.serviceId) setSelectedServiceId(params.serviceId);
    if (page === "messages") {
      const { chat } = params;
      setChatConversationId(chat ? messageApi.openConversation(chat, chat.context) : "");
    }
    scrollToTopInstant();
  };

  // Navigation event listener for programmatic / test triggering
  useEffect(() => {
    const onTestNav = (e: Event) => {
      const customEvent = e as CustomEvent<{ page: string; params?: CatalogFilterParams }>;
      if (customEvent.detail?.page) {
        handleNavigate(customEvent.detail.page as TrungPageKey, customEvent.detail.params);
      }
    };
    window.addEventListener("workgo-navigate", onTestNav);
    return () => window.removeEventListener("workgo-navigate", onTestNav);
  });

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
    scrollToTopInstant();
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
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleSelectService = (service: ServiceSelection) => {
    setPreviousPage(currentPage);
    setSelectedServiceId(service.serviceId);
    setCurrentPage("detail");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleOpenCreateForm = () => {
    setServiceFormMode("create");
    setEditServiceId(null);
    setPreviousPage(currentPage);
    setCurrentPage("service-form");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleOpenEditForm = (serviceId: string) => {
    setServiceFormMode("edit");
    setEditServiceId(serviceId);
    setPreviousPage(currentPage);
    setCurrentPage("service-form");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const handleServiceFormSuccess = (savedService: SavedService, isEdit: boolean) => {
    showToast(
      isEdit
        ? `Đã cập nhật dịch vụ "${savedService.title}"!`
        : `Đã tạo thành công dịch vụ mới "${savedService.title}"!`
    );
    setCurrentPage("my-services");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  return (
    <div className={`${styles.appRoot} ${styles["webapp-scope"]}`}>
      {/* S4: offline banner — local data keeps working, user must know why */}
      {!isOnline && (
        <div className={styles.offlineBanner} role="status">
          <span>Bạn đang ngoại tuyến — cần kết nối mạng để tải và lưu dữ liệu.</span>
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
          onContactSeller={(chat: ChatTarget) => handleNavigate("messages", { chat })}
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
        <OrderDashboardPage
          onGoHome={() => handleNavigate("home")}
          onShowToast={showToast}
          onOpenChat={(chat: ChatTarget) => handleNavigate("messages", { chat })}
        />
      )}

      {currentPage === "my-services" && (
        /* Provider My Services Page */
        <MyServicesPage
          onSelectService={handleSelectService}
          onGoHome={() => handleNavigate("home")}
          onShowToast={showToast}
          onOpenCreateForm={handleOpenCreateForm}
          onOpenEditForm={handleOpenEditForm}
          onOpenAvailability={() => handleNavigate("availability")}
          onOpenProviderOnboarding={() => handleNavigate("provider-onboarding")}
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
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
          }}
          onSaveSuccess={handleServiceFormSuccess}
          onShowToast={showToast}
        />
      )}

      {/* Trung pages sit under the fixed header; this wrapper reserves its height. */}
      {TRUNG_PAGE_KEYS.has(currentPage) && (
      <div className={styles.trungPage}>
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

      {isPublicInfoPageKey(currentPage) && (
        <PublicInfoPage
          pageKey={currentPage}
          onNavigate={handleNavigate}
          onShowToast={showToast}
        />
      )}

      {currentPage === "messages" && (
        <MessagesPage
          key={chatConversationId}
          onNavigate={handleNavigate}
          onShowToast={showToast}
          conversationId={chatConversationId || undefined}
        />
      )}
      </div>
      )}

      {/* Fallback for unknown page keys */}
      {!KNOWN_PAGE_KEYS.has(currentPage) && (
        <div className={styles.trungPage}>
          <NotFoundPage requestedKey={currentPage} onNavigate={handleNavigate} />
        </div>
      )}

      {/* Footer (hidden on service-form wizard for clean focus) */}
      {/* Messages is a full-height app view, so it drops the footer too. */}
      {currentPage !== "service-form" && currentPage !== "messages" && <Footer onNavigate={handleNavigate} />}

      {/* Authentication Modal */}
      {authModal && (
        <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} />
      )}
    </div>
  );
}
