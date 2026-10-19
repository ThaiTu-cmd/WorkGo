import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Search,
  Sparkles,
  LayoutGrid,
  Package,
  Workflow,
  LogIn,
  UserPlus,
  House,
  CalendarClock,
  LogOut,
} from 'lucide-react';
import styles from './Header.module.css';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { useAuthToken } from '../../../hooks/useAuthToken';
import { authApi } from '../../../api/authApi';
import AccountMenu, { ACCOUNT_GROUPS } from './AccountMenu';

export default function Header({ onOpenAuth, onNavigate, activePage = 'home' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [miniSearchQuery, setMiniSearchQuery] = useState('');
  const drawerRef = useRef(null);
  const isLoggedIn = Boolean(useAuthToken());
  // F3: keep Tab cycling inside the drawer while open.
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

  // R3: Escape closes the mobile drawer; focus moves into it on open.
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

  // The drawer is mobile-only: close it once the viewport widens to the
  // desktop nav breakpoint (matches the 900px media query in the CSS).
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const mq = window.matchMedia('(min-width: 900px)');
    if (mq.matches) {
      setMobileMenuOpen(false);
      return undefined;
    }
    const onChange = (e) => {
      if (e.matches) setMobileMenuOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mobileMenuOpen]);

  const handleMiniSearchSubmit = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('catalog', { query: miniSearchQuery });
    }
  };

  return (
    <header className={`${styles.header} ${isScrolled || activePage !== 'home' ? styles.headerScrolled : ''}`}>
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

        {/* Center/Right Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <button
            type="button"
            className={`${styles.navLink} ${activePage === 'catalog' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('catalog')}
          >
            <LayoutGrid size={18} aria-hidden="true" />
            Danh mục
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${activePage === 'orders' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('orders')}
          >
            <Package size={18} aria-hidden="true" />
            Đơn hàng
          </button>
          <a
            href="#how-it-works"
            className={styles.navLink}
            onClick={(e) => {
              if (activePage !== 'home') {
                e.preventDefault();
                onNavigate && onNavigate('home');
              }
            }}
          >
            <Workflow size={18} aria-hidden="true" />
            Quy trình
          </a>
          <button
            type="button"
            className={`${styles.navLink} ${styles.highlightLink} ${activePage === 'my-services' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('my-services')}
          >
            <Sparkles size={18} className={styles.highlightIcon} aria-hidden="true" />
            Provider
          </button>
        </nav>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {isLoggedIn ? (
            <AccountMenu onNavigate={onNavigate} activePage={activePage} />
          ) : (
            <>
              <button
                type="button"
                className={styles.signInBtn}
                onClick={() => onOpenAuth && onOpenAuth('login')}
              >
                <LogIn size={18} aria-hidden="true" />
                Đăng nhập
              </button>
              <button
                type="button"
                className={styles.joinBtn}
                onClick={() => onOpenAuth && onOpenAuth('register')}
              >
                <UserPlus size={18} aria-hidden="true" />
                Đăng ký
              </button>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className={styles.mobileDrawer} ref={drawerRef}>
          <div className={styles.mobileDrawerContent}>
            {[
              { key: 'catalog', icon: LayoutGrid, label: 'Danh mục' },
              { key: 'home', icon: House, label: 'Trang chủ' },
              { key: 'availability', icon: CalendarClock, label: 'Lịch rảnh' },
              { key: 'orders', icon: Package, label: 'Đơn hàng' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                className={styles.mobileNavLink}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate && onNavigate(key);
                }}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </button>
            ))}
            <a
              href="#how-it-works"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Workflow size={18} aria-hidden="true" />
              Quy trình
            </a>
            <a
              href="#cta"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles size={18} aria-hidden="true" />
              Trở thành Provider
            </a>

            {isLoggedIn ? (
              <>
                {ACCOUNT_GROUPS.map((group) => (
                  <div key={group.title} className={styles.mobileGroup}>
                    <p className={styles.mobileGroupTitle}>{group.title}</p>
                    {/* "Đơn hàng của tôi" is already listed above in the drawer. */}
                    {group.items.filter((item) => item.key !== 'orders').map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={styles.mobileNavLink}
                        aria-current={item.key === activePage ? 'page' : undefined}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onNavigate && onNavigate(item.key);
                        }}
                      >
                        <item.icon size={18} aria-hidden="true" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
                <div className={styles.mobileActions}>
                  <button
                    type="button"
                    className={styles.mobileSignInBtn}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      authApi.logout();
                    }}
                  >
                    <LogOut size={18} aria-hidden="true" />
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.mobileActions}>
                <button
                  type="button"
                  className={styles.mobileSignInBtn}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth && onOpenAuth('login');
                  }}
                >
                  <LogIn size={18} aria-hidden="true" />
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className={styles.mobileJoinBtn}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth && onOpenAuth('register');
                  }}
                >
                  <UserPlus size={18} aria-hidden="true" />
                  Đăng ký miễn phí
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
