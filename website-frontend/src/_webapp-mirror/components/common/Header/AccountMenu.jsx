import { useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, BriefcaseBusiness, Calendar, ChevronDown, ClipboardCheck, Contact, CreditCard, FilePlus2, Landmark, LogOut, MapPin, MessageSquare, Package, ShieldAlert, ShieldCheck, UserCog, UserRound, Wallet } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import { useAuthToken } from '../../../hooks/useAuthToken';
import { useMessages } from '../../../hooks/useMessages';
import { totalUnread } from '../../../api/messageApi';
import { hasRole } from '../../../utils/jwt';
import styles from './AccountMenu.module.css';
import { useMyDisplayName } from '../../../hooks/useMyDisplayName';

// Signed-in destinations that used to live in the Trung sub-nav. Pages that
// need an id (submit-proposal, review-form) are opened from their parent page.
// Labels/titles are localized via the passed translator (misc namespace).
export const buildAccountGroups = tr => [{
  title: tr("m46"),
  items: [{
    key: 'profile-settings',
    icon: UserCog,
    label: tr("m47")
  }, {
    key: 'address-book',
    icon: MapPin,
    label: tr("m48")
  }, {
    key: 'orders',
    icon: Package,
    label: tr("m49")
  }, {
    key: 'messages',
    icon: MessageSquare,
    label: tr("m50")
  }]
}, {
  title: tr("m51"),
  items: [{
    key: 'wallet',
    icon: Wallet,
    label: tr("m52")
  }, {
    key: 'payment-gateway',
    icon: CreditCard,
    label: tr("m53")
  }, {
    key: 'payout-settings',
    icon: Landmark,
    label: tr("m54")
  }]
}, {
  title: tr("m55"),
  items: [{
    key: 'job-list',
    icon: BriefcaseBusiness,
    label: tr("m56")
  }, {
    key: 'job-post',
    icon: FilePlus2,
    label: tr("m57")
  }, {
    key: 'proposal-review',
    icon: ClipboardCheck,
    label: tr("m58")
  }, {
    key: 'dispute-center',
    icon: ShieldAlert,
    label: tr("m59")
  }]
}, {
  title: tr("m60"),
  items: [{
    key: 'provider-onboarding',
    icon: BadgeCheck,
    label: tr("m61")
  }, {
    key: 'provider-profile',
    icon: Contact,
    label: tr("m62")
  }, {
    key: 'booking-slots',
    icon: Calendar,
    label: tr("m63")
  }, {
    key: 'verification-center',
    icon: ShieldCheck,
    label: tr("m64")
  }]
}];

// Admin area is its own route (/[locale]/admin), not a shell page key, so it is
// opened with a full navigation instead of onNavigate.
export const buildAdminGroup = tr => ({
  title: tr("m65"),
  items: [{
    key: 'admin-console',
    icon: ShieldCheck,
    label: tr("m65")
  }, {
    key: 'admin',
    icon: ShieldCheck,
    label: tr("m65"),
    href: 'admin'
  }]
});

// Groups visible to the signed-in token (admin group only for ROLE_ADMIN).
export const accountGroupsFor = (token, tr) => hasRole(token, 'ADMIN') ? [...buildAccountGroups(tr), buildAdminGroup(tr)] : buildAccountGroups(tr);

// Shell page keys go through onNavigate; items with `href` are separate routes.
// The three wallet destinations open the Finance hub on the matching tab (Ví /
// Nạp tiền / Rút tiền) instead of the standalone pages.
const FINANCE_ITEM_TABS = {
  'wallet': 'wallet',
  'payment-gateway': 'deposit',
  'payout-settings': 'payout'
};
export const openAccountItem = (item, onNavigate) => {
  if (item.href) {
    const locale = window.location.pathname.split('/')[1] || 'vi';
    window.location.href = `/${locale}/${item.href}`;
    return;
  }
  const financeTab = FINANCE_ITEM_TABS[item.key];
  if (financeTab && onNavigate) {
    onNavigate('finance', {
      tab: financeTab
    });
    return;
  }
  if (onNavigate) onNavigate(item.key);
};
export default function AccountMenu({
  onNavigate,
  activePage
}) {
  const tr = useTranslations("misc");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const token = useAuthToken();
  const groups = accountGroupsFor(token, tr);
  const unread = totalUnread(useMessages());
  // Trigger shows who is signed in: "Nguyễn Văn A" (myInfo) with the login id
  // as fallback while the profile is unavailable.
  const displayName = useMyDisplayName();

  // Close on outside click or Escape (focus returns to the trigger).
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = e => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = e => {
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
  const go = item => {
    setOpen(false);
    openAccountItem(item, onNavigate);
  };
  return <div className={styles.root} ref={rootRef}>
      <button type="button" ref={triggerRef} className={styles.trigger} aria-haspopup="menu" aria-expanded={open} aria-label={unread > 0 ? tr("m67", {
      p0: unread
    }) : undefined} onClick={() => setOpen(v => !v)}>
        <span className={styles.triggerIcon}>
          <UserRound size={18} />
          {unread > 0 && <span className={styles.dot} aria-hidden="true" />}
        </span>
        <span className={styles.triggerLabel} title={displayName || undefined}>
          {displayName || tr("m46")}
        </span>
        <ChevronDown size={16} className={open ? styles.chevronOpen : styles.chevron} />
      </button>

      {open && <div className={styles.panel} role="menu" aria-label={tr("m68")}>
          {groups.map(group => <div key={group.title} className={styles.group} role="group" aria-label={group.title}>
              <p className={styles.groupTitle}>{group.title}</p>
              {group.items.map(item => <button key={item.key} type="button" role="menuitem" className={item.key === activePage ? `${styles.item} ${styles.itemActive}` : styles.item} aria-current={item.key === activePage ? 'page' : undefined} onClick={() => go(item)}>
                  <item.icon size={16} className={styles.itemIcon} aria-hidden="true" />
                  {item.label}
                  {item.key === 'messages' && unread > 0 && <span className={styles.count} aria-label={tr("m69", {
            p0: unread
          })}>
                      {unread > 9 ? '9+' : unread}
                    </span>}
                </button>)}
            </div>)}
          <button type="button" role="menuitem" className={`${styles.item} ${styles.logout}`} onClick={() => {
        setOpen(false);
        authApi.logout();
      }}>
            <LogOut size={16} />{tr("m71")}</button>
        </div>}
    </div>;
}