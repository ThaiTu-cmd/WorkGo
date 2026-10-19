import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Sparkles, Layers, Briefcase, PlusCircle, Package } from 'lucide-react';
import styles from './Header.module.css';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

const MENU_ID = 'workgo-header-menu';

/**
 * Cycle 4 — one consolidated dropdown instead of a row of buttons.
 *
 * The panel is ALWAYS mounted (`display: none` while closed) so scripted and
 * keyboard users can always reach every entry, and so the two host apps
 * (web-app/src and website-frontend/src/_webapp-mirror) can keep this file
 * byte-identical: everything host-specific arrives through props.
 *
 *   currentUser  {name,email}|null → account group shows Đăng nhập/Đăng ký or the session
 *   onLogout     () => void        → called by the Đăng xuất entry
 *   extraLinks   [{key,label}]     → website-only rows (web-app passes [])
 */
export default function Header({
  onOpenAuth,
  onNavigate,
  activePage = 'home',
  currentUser = /** @type {{ name: string, email: string } | null} */ (null),
  onLogout,
  extraLinks = /** @type {Array<{ key: string, label: string }>} */ ([]),
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [miniSearchQuery, setMiniSearchQuery] = useState('');
  const drawerRef = useRef(null);
  const headerRef = useRef(null);
  // F3: keep Tab cycling inside the dropdown while open.
  useFocusTrap(drawerRef, mobileMenuOpen);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50 || activePage !== 'home') {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activePage]);

  // R3: Escape closes the dropdown; focus moves into it on open.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    if (drawerRef.current) {
      const first = drawerRef.current.querySelector('button, a');
      if (first) first.focus();
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  // Cycle 4: the panel is always in the DOM, so the outside-click listener is
  // only attached while it is actually open.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onPointerDown = (e) => {
      const header = headerRef.current;
      if (header && e.target instanceof Node && !header.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [mobileMenuOpen]);

  const handleMiniSearchSubmit = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('catalog', { query: miniSearchQuery });
    }
  };

  // Every panel row goes through here: close first, then navigate.
  const go = (page, params) => {
    setMobileMenuOpen(false);
    if (onNavigate) onNavigate(page, params);
  };

  const closeAndOpenAuth = (mode) => {
    setMobileMenuOpen(false);
    if (onOpenAuth) onOpenAuth(mode);
  };

  const handleLogoutClick = () => {
    setMobileMenuOpen(false);
    if (onLogout) onLogout();
  };

  const handleQuickDemoAdminLogin = () => {
    const adminUser = { name: 'admin', email: 'admin@workgo.vn' };
    try {
      localStorage.setItem('accessToken', `mock-token-${Date.now()}`);
      localStorage.setItem('workgo_auth_user', JSON.stringify(adminUser));
    } catch {
      // storage blocked
    }
    window.dispatchEvent(new Event('workgo-auth-changed'));
    setMobileMenuOpen(false);
    if (onNavigate) onNavigate('catalog');
  };

  const panelClassName = `${styles.mobileDrawer} ${styles.menuPanel}${
    mobileMenuOpen ? ` ${styles.menuPanelOpen}` : ''
  }`;

  return (
    <header
      ref={headerRef}
      className={`${styles.header} ${isScrolled || activePage !== 'home' ? styles.headerScrolled : ''}`}
    >
      <div className={`container ${styles.headerContainer}`}>
        {/* Left: Brand Logo */}
        <div className={styles.leftSection}>
          <a
            href="#"
            className={styles.logo}
            onClick={(e) => {
              e.preventDefault();
              onNavigate && onNavigate('home');
            }}
          >
            <span className={styles.logoText}>
              <span className={styles.logoWork}>Work</span>
              <span className={styles.logoGo}>Go</span>
            </span>
          </a>

          {/* Compact search in navbar */}
          {(isScrolled || activePage !== 'home') && (
            <form onSubmit={handleMiniSearchSubmit} className={styles.navSearch}>
              <Search size={16} className={styles.navSearchIcon} />
              <input
                type="text"
                value={miniSearchQuery}
                onChange={(e) => setMiniSearchQuery(e.target.value)}
                placeholder="Bạn muốn tìm dịch vụ gì?"
                className={styles.navSearchInput}
              />
              <button className={styles.navSearchBtn} type="submit" aria-label="Tìm kiếm">
                <Search size={15} />
              </button>
            </form>
          )}
        </div>

        {/* Center/Right Desktop Navigation — rectangular frames for each function */}
        <nav className={styles.desktopNav} aria-label="Điều hướng chính WorkGo">
          <button
            type="button"
            className={`${styles.navLink} ${styles.navIconButton} ${activePage === 'catalog' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('catalog')}
            aria-label="Danh mục dịch vụ"
          >
            <Layers size={17} className={styles.navIcon} />
            <span className={styles.navLabel}>Danh mục</span>
            <span className={styles.navTooltip}>Danh mục dịch vụ</span>
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${styles.navIconButton} ${activePage === 'job-list' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('job-list')}
            aria-label="Tìm việc"
          >
            <Briefcase size={17} className={styles.navIcon} />
            <span className={styles.navLabel}>Tìm việc</span>
            <span className={styles.navTooltip}>Tìm việc</span>
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${styles.navIconButton} ${activePage === 'job-post' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('job-post')}
            aria-label="Đăng việc"
          >
            <PlusCircle size={17} className={styles.navIcon} />
            <span className={styles.navLabel}>Đăng việc</span>
            <span className={styles.navTooltip}>Đăng việc</span>
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${styles.navIconButton} ${activePage === 'my-services' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('my-services')}
            aria-label="Quản lý Dịch vụ"
          >
            <Package size={17} className={styles.navIcon} />
            <span className={styles.navLabel}>Dịch vụ</span>
            <span className={styles.navTooltip}>Quản lý Dịch vụ</span>
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${styles.navIconButton} ${styles.highlightLink} ${activePage === 'provider-onboarding' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('provider-onboarding')}
            aria-label="Làm Provider"
          >
            <Sparkles size={17} className={styles.highlightIcon} />
            <span className={styles.navLabel}>Provider</span>
            <span className={styles.navTooltip}>Làm Provider</span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {currentUser ? (
            <>
              <div className={styles.userBadge} title={currentUser.email}>
                <span className={styles.userDot} />
                <span className={styles.userName}>{currentUser.name}</span>
              </div>
              <button
                type="button"
                className={styles.signInBtn}
                onClick={handleLogoutClick}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.signInBtn}
                onClick={() => closeAndOpenAuth('login')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={styles.joinBtn}
                onClick={() => closeAndOpenAuth('register')}
              >
                Đăng ký
              </button>
            </>
          )}

          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls={MENU_ID}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
          <button
            type="button"
            className={styles.menuTrigger}
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls={MENU_ID}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* Consolidated dropdown — always mounted, hidden with display:none when closed */}
      <div
        id={MENU_ID}
        ref={drawerRef}
        className={panelClassName}
        aria-label="Menu chức năng WorkGo"
      >
        <div className={`${styles.mobileDrawerContent} ${styles.menuPanelContent}`}>
          {/* Mobile-only primary nav links so mobile users retain access */}
          <div className={styles.mobileNavLinksOnly}>
            <p className={styles.menuGroupLabel}>Khám phá</p>
            <button type="button" className={styles.menuItem} onClick={() => go('catalog')}>
              Danh mục dịch vụ
            </button>
            <button type="button" className={styles.menuItem} onClick={() => go('job-list')}>
              Tìm việc
            </button>
            <button type="button" className={styles.menuItem} onClick={() => go('job-post')}>
              Đăng việc
            </button>
            <button type="button" className={styles.menuItem} onClick={() => go('my-services')}>
              Quản lý Dịch vụ
            </button>
            <button type="button" className={styles.menuItem} onClick={() => go('provider-onboarding')}>
              <Sparkles size={16} className={styles.highlightIcon} />
              Làm Provider
            </button>
          </div>

          {/* 15 pages in dropdown with distinct state before and after login */}
          {!currentUser ? (
            <>
              {/* Demo Account Box for easy testing */}
              <div className={styles.demoCard}>
                <p className={styles.demoTitle}>Tài khoản Demo WorkGo</p>
                <p className={styles.demoText}>
                  Tài khoản: <strong>admin</strong> | Mật khẩu: <strong>123456</strong>
                </p>
                <button
                  type="button"
                  className={styles.demoQuickBtn}
                  onClick={handleQuickDemoAdminLogin}
                >
                  ⚡ Đăng nhập nhanh Admin
                </button>
              </div>

              <p className={styles.menuGroupLabel}>Tài khoản</p>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => closeAndOpenAuth('login')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => closeAndOpenAuth('register')}
              >
                Đăng ký
              </button>

              <p className={styles.menuGroupLabel}>Việc làm & Chuyên gia</p>
              <button type="button" className={styles.menuItem} onClick={() => go('job-list')}>
                Tìm việc
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('provider-profile')}>
                Provider
              </button>

              <p className={styles.menuGroupLabel}>Tính năng thành viên (Demo)</p>
              <button type="button" className={styles.menuItem} onClick={() => go('profile-settings')}>
                Hồ sơ
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('address-book')}>
                Địa chỉ
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('provider-onboarding')}>
                Làm Provider
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('job-post')}>
                Đăng việc
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('submit-proposal')}>
                Gửi đề xuất
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('proposal-review')}>
                Duyệt đề xuất
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('payment-gateway')}>
                Nạp tiền
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('wallet')}>
                Ví
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('payout-settings')}>
                Rút tiền
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('review-form')}>
                Đánh giá
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('dispute-center')}>
                Tranh chấp
              </button>
            </>
          ) : (
            <>
              {/* Authenticated user header */}
              <div className={styles.menuAccount}>
                <span className={styles.menuAccountName}>{currentUser.name} (Đã đăng nhập)</span>
                <span className={styles.menuAccountEmail}>{currentUser.email}</span>
              </div>

              <p className={styles.menuGroupLabel}>Tài khoản cá nhân</p>
              <button type="button" className={styles.menuItem} onClick={() => go('profile-settings')}>
                Hồ sơ
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('address-book')}>
                Địa chỉ
              </button>

              <p className={styles.menuGroupLabel}>Chuyên gia & Việc làm</p>
              <button type="button" className={styles.menuItem} onClick={() => go('provider-onboarding')}>
                Làm Provider
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('provider-profile')}>
                Provider
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('job-list')}>
                Tìm việc
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('job-post')}>
                Đăng việc
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('submit-proposal')}>
                Gửi đề xuất
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('proposal-review')}>
                Duyệt đề xuất
              </button>

              <p className={styles.menuGroupLabel}>Tài chính & Ví</p>
              <button type="button" className={styles.menuItem} onClick={() => go('payment-gateway')}>
                Nạp tiền
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('wallet')}>
                Ví
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('payout-settings')}>
                Rút tiền
              </button>

              <p className={styles.menuGroupLabel}>Tin cậy & Hỗ trợ</p>
              <button type="button" className={styles.menuItem} onClick={() => go('review-form')}>
                Đánh giá
              </button>
              <button type="button" className={styles.menuItem} onClick={() => go('dispute-center')}>
                Tranh chấp
              </button>

              <button
                type="button"
                className={`${styles.menuItem} ${styles.menuLogout}`}
                onClick={handleLogoutClick}
              >
                Đăng xuất
              </button>
            </>
          )}

          {extraLinks && extraLinks.length > 0 && (
            <>
              <p className={styles.menuGroupLabel}>Mở rộng</p>
              {extraLinks.map((link) => (
                <button
                  key={link.key}
                  type="button"
                  className={styles.menuItem}
                  onClick={() => go(link.key)}
                >
                  {link.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
