import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Menu,
  X,
  Search,
  Sparkles,
  LayoutGrid,
  Package,
  Wallet,
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
import AccountMenu, { accountGroupsFor, openAccountItem } from './AccountMenu';
import ThemeToggle from '@/components/common/ThemeToggle';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export default function Header({ onOpenAuth, onNavigate, activePage = 'home' }) {
  const t = useTranslations('header');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [miniSearchQuery, setMiniSearchQuery] = useState('');
  const drawerRef = useRef(null);
  const token = useAuthToken();
  const isLoggedIn = Boolean(token);
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

  const handleLogoClick = (e) => {
    e.preventDefault();
    // Signed-in users land on the catalog; guests see the marketing landing.
    if (onNavigate) onNavigate(isLoggedIn ? 'catalog' : 'home');
  };

  return (
    <header className={`${styles.header} ${isScrolled || activePage !== 'home' ? styles.headerScrolled : ''}`}>
      <div className={`container ${styles.headerContainer}`}>
        {/* Left: Brand Logo */}
        <div className={styles.leftSection}>
          <a
            href="#"
            className={styles.logo}
            onClick={handleLogoClick}
          >
            <span className={styles.logoText}>
              <span className={styles.logoWork}>Work</span>
              <span className={styles.logoGo}>Go</span>
            </span>
          </a>

          {/* Compact search in navbar — always present on wide screens so the
              bar never reflows when the scroll state changes. */}
          <form onSubmit={handleMiniSearchSubmit} className={styles.navSearch}>
              <Search size={16} className={styles.navSearchIcon} />
              <input
                type="text"
                value={miniSearchQuery}
                onChange={(e) => setMiniSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className={styles.navSearchInput}
              />
              <button className={styles.navSearchBtn} type="submit" aria-label={t('searchAria')}>
                <Search size={15} />
              </button>
            </form>
          </div>

        {/* Center/Right Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <button
            type="button"
            className={`${styles.navLink} ${activePage === 'catalog' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('catalog')}
          >
            <LayoutGrid size={18} aria-hidden="true" />
            {t('navCatalog')}
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${activePage === 'orders' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('orders')}
          >
            <Package size={18} aria-hidden="true" />
            {t('navOrders')}
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${activePage === 'finance' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('finance')}
          >
            <Wallet size={18} aria-hidden="true" />
            {t('navFinance')}
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${activePage === 'my-services' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('my-services')}
          >
            <Sparkles size={18} aria-hidden="true" />
            Provider
          </button>
        </nav>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <LanguageSwitcher variant="pill" className={styles.headerLangSwitcher} />
          <ThemeToggle className={styles.headerThemeToggle} />
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
                {t('signIn')}
              </button>
              <button
                type="button"
                className={styles.joinBtn}
                onClick={() => onOpenAuth && onOpenAuth('register')}
              >
                <UserPlus size={18} aria-hidden="true" />
                {t('signUp')}
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
            <div className={styles.mobileDrawerControls}>
              <LanguageSwitcher variant="pill" />
              <ThemeToggle showLabel />
            </div>
            {[
              { key: 'catalog', icon: LayoutGrid, label: t('mobileCatalog') },
              { key: 'home', icon: House, label: t('mobileHome') },
              { key: 'finance', icon: Wallet, label: t('mobileFinance') },
              { key: 'orders', icon: Package, label: t('mobileOrders') },
              { key: 'availability', icon: CalendarClock, label: t('mobileAvailability') },
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
              href="#cta"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles size={18} aria-hidden="true" />
              {t('becomeProvider')}
            </a>

            {isLoggedIn ? (
              <>
                {accountGroupsFor(token).map((group) => (
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
                          openAccountItem(item, onNavigate);
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
                    {t('logout')}
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
                  {t('signIn')}
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
                  {t('registerFree')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
