import React from 'react';
import { useTranslations } from 'next-intl';
import { Shield } from 'lucide-react';
import { FOOTER_COLUMNS } from './footerLinks.js';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import styles from './Footer.module.css';
export default function Footer({
  onNavigate
}) {
  const tr = useTranslations("misc");
  const tf = useTranslations('footer');
  const th = useTranslations('header');
  const go = (page, params = {}) => {
    if (typeof onNavigate !== 'function') return;
    onNavigate(page, params);
  };
  return <footer className={styles.footer}>
      <div className="container">
        <div className={styles.topGrid}>
          {/* Brand column */}
          <div className={styles.brandCol}>
            <button type="button" className={styles.footerLogo} aria-label={tr("m45")} onClick={() => go('home')}>
              WorkGo
            </button>
            <p className={styles.brandDesc}>
              {th('brandDesc')}
            </p>
            <span className={styles.escrowBadge}>
              <Shield size={15} />
              {th('escrowProtected')}
            </span>
            <span className={styles.shortcutHint}>
              {th('keyboardHint')}
            </span>
          </div>

          {FOOTER_COLUMNS.map(col => <div key={col.title} className={styles.col}>
              <h4 className={styles.colTitle}>{tf(col.titleKey)}</h4>
              <ul className={styles.linkList}>
                {col.links.map(link => <li key={link.labelKey}>
                    <button type="button" className={styles.footerLink} onClick={() => go(link.page, link.params)}>
                      {tf(link.labelKey)}
                    </button>
                  </li>)}
              </ul>
            </div>)}
        </div>

        <div className={styles.bottomBar}>
          <span className={styles.copyright}>
            {th('copyright')}
          </span>
          <div className={styles.rightBottom}>
            <LanguageSwitcher variant="footer" />
            <span className={styles.localeItemStatic}>
              <span>₫ VND</span>
            </span>
          </div>
        </div>
      </div>
    </footer>;
}