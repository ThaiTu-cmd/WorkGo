import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Sparkles } from 'lucide-react';
import styles from './Header.module.css';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

export default function Header({ onOpenAuth, onNavigate, activePage = 'home' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [miniSearchQuery, setMiniSearchQuery] = useState('');
  const drawerRef = useRef(null);
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
            <div className={styles.logoIcon}>
              <span>W</span>
            </div>
            <span className={styles.logoText}>WorkGo</span>
            <span className={styles.logoDot}>.</span>
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
            Danh mục dịch vụ
          </button>
          <button
            type="button"
            className={`${styles.navLink} ${activePage === 'my-services' ? styles.navLinkActive : ''}`}
            onClick={() => onNavigate && onNavigate('my-services')}
          >
            Quản lý Dịch vụ
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
            Quy trình
          </a>
          <a
            href="#why-workgo"
            className={styles.navLink}
            onClick={(e) => {
              if (activePage !== 'home') {
                e.preventDefault();
                onNavigate && onNavigate('home');
              }
            }}
          >
            Tại sao chọn WorkGo
          </a>
          <button
            type="button"
            className={`${styles.navLink} ${styles.highlightLink}`}
            onClick={() => onNavigate && onNavigate('my-services')}
          >
            <Sparkles size={16} className={styles.highlightIcon} />
            Kênh Chuyên gia
          </button>
        </nav>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.signInBtn}
            onClick={() => onOpenAuth && onOpenAuth('login')}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={styles.joinBtn}
            onClick={() => onOpenAuth && onOpenAuth('register')}
          >
            Đăng ký
          </button>

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
            <button
              type="button"
              className={styles.mobileNavLink}
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate && onNavigate('catalog');
              }}
            >
              🔍 Khám phá danh mục dịch vụ
            </button>
            <button
              type="button"
              className={styles.mobileNavLink}
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate && onNavigate('home');
              }}
            >
              🏠 Về Trang chủ
            </button>
            <a
              href="#how-it-works"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Cách thức hoạt động
            </a>
            <a
              href="#why-workgo"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Bảo chứng Ký quỹ (Escrow)
            </a>
            <a
              href="#cta"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Đăng ký bán dịch vụ (Provider)
            </a>

            <div className={styles.mobileActions}>
              <button
                type="button"
                className={styles.mobileSignInBtn}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth && onOpenAuth('login');
                }}
              >
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
                Tạo tài khoản miễn phí
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
