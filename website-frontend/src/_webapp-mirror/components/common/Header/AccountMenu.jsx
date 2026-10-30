import React, { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardCheck,
  Contact,
  CreditCard,
  FilePlus2,
  Landmark,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  UserRound,
  Wallet,
} from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { useAuthToken } from '../../../hooks/useAuthToken';
import { useMessages } from '../../../hooks/useMessages';
import { totalUnread } from '../../../api/messageApi';
import { hasRole } from '../../../utils/jwt';
import styles from './AccountMenu.module.css';

// Signed-in destinations that used to live in the Trung sub-nav. Pages that
// need an id (submit-proposal, review-form) are opened from their parent page.
export const ACCOUNT_GROUPS = [
  {
    title: 'Tài khoản',
    items: [
      { key: 'profile-settings', icon: UserCog, label: 'Hồ sơ' },
      { key: 'address-book', icon: MapPin, label: 'Sổ địa chỉ' },
      { key: 'orders', icon: Package, label: 'Đơn hàng' },
      { key: 'messages', icon: MessageSquare, label: 'Tin nhắn' },
    ],
  },
  {
    title: 'Tài chính',
    items: [
      { key: 'wallet', icon: Wallet, label: 'Ví' },
      { key: 'payment-gateway', icon: CreditCard, label: 'Nạp tiền' },
      { key: 'payout-settings', icon: Landmark, label: 'Rút tiền' },
    ],
  },
  {
    title: 'Việc làm',
    items: [
      { key: 'job-list', icon: BriefcaseBusiness, label: 'Tìm việc' },
      { key: 'job-post', icon: FilePlus2, label: 'Đăng việc' },
      { key: 'proposal-review', icon: ClipboardCheck, label: 'Duyệt đề xuất' },
      { key: 'dispute-center', icon: ShieldAlert, label: 'Tranh chấp' },
    ],
  },
  {
    title: 'Chuyên gia',
    items: [
      { key: 'provider-onboarding', icon: BadgeCheck, label: 'Làm Provider' },
      { key: 'provider-profile', icon: Contact, label: 'Hồ sơ Provider' },
    ],
  },
];

// Admin area is its own route (/[locale]/admin), not a shell page key, so it is
// opened with a full navigation instead of onNavigate.
const ADMIN_GROUP = {
  title: 'Quản trị',
  items: [{ key: 'admin', icon: ShieldCheck, label: 'Trang Admin', href: 'admin' }],
};

// Groups visible to the signed-in token (admin group only for ROLE_ADMIN).
export const accountGroupsFor = (token) =>
  hasRole(token, 'ADMIN') ? [...ACCOUNT_GROUPS, ADMIN_GROUP] : ACCOUNT_GROUPS;

// Shell page keys go through onNavigate; items with `href` are separate routes.
export const openAccountItem = (item, onNavigate) => {
  if (item.href) {
    const locale = window.location.pathname.split('/')[1] || 'vi';
    window.location.href = `/${locale}/${item.href}`;
    return;
  }
  if (onNavigate) onNavigate(item.key);
};

export default function AccountMenu({ onNavigate, activePage }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const token = useAuthToken();
  const groups = accountGroupsFor(token);
  const unread = totalUnread(useMessages());

  // Close on outside click or Escape (focus returns to the trigger).
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (item) => {
    setOpen(false);
    openAccountItem(item, onNavigate);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread > 0 ? `Tài khoản, ${unread} tin nhắn chưa đọc` : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.triggerIcon}>
          <UserRound size={18} />
          {unread > 0 && <span className={styles.dot} aria-hidden="true" />}
        </span>
        <span className={styles.triggerLabel}>Tài khoản</span>
        <ChevronDown size={16} className={open ? styles.chevronOpen : styles.chevron} />
      </button>

      {open && (
        <div className={styles.panel} role="menu" aria-label="Menu tài khoản">
          {groups.map((group) => (
            <div key={group.title} className={styles.group} role="group" aria-label={group.title}>
              <p className={styles.groupTitle}>{group.title}</p>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className={item.key === activePage ? `${styles.item} ${styles.itemActive}` : styles.item}
                  aria-current={item.key === activePage ? 'page' : undefined}
                  onClick={() => go(item)}
                >
                  <item.icon size={16} className={styles.itemIcon} aria-hidden="true" />
                  {item.label}
                  {item.key === 'messages' && unread > 0 && (
                    <span className={styles.count} aria-label={`${unread} chưa đọc`}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
          <button
            type="button"
            role="menuitem"
            className={`${styles.item} ${styles.logout}`}
            onClick={() => {
              setOpen(false);
              authApi.logout();
            }}
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
