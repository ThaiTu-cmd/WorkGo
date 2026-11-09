import { useTranslations } from "next-intl";
import React from 'react';
import { ClipboardList, Link2 } from 'lucide-react';
import { useOrderDetail } from '../../../hooks/useOrderDetail';
import styles from './OrderFlow.module.css';
const ITEM_TYPE = {
  PACKAGE: "Package",
  ADDON: 'Add-on',
  PLATFORM_FEE: "Fee"
};

// order-service names the fee item without diacritics ("Phi nen tang").
const itemName = item => item.itemType === 'PLATFORM_FEE' ? "Platform fees" : item.name;
const formatPrice = num => new Intl.NumberFormat('vi-VN').format(Number(num) || 0) + ' ₫';
const isHttpUrl = value => /^https?:\/\//i.test(String(value || ''));

// RequirementsDialog sends { description, references }; any other key (e.g. from
// another client) is shown as a plain "key: value" line.
function Requirements({
  values
}) {
  const tr = useTranslations("misc");
  const {
    description,
    references,
    ...rest
  } = values;
  const links = Array.isArray(references) ? references : [];
  return <>
      {description && <p className={styles.quote}>{description}</p>}
      {links.length > 0 && <ul className={styles.fileList}>
          {links.map(url => <li key={url} className={styles.fileRow}>
              <Link2 size={14} aria-hidden="true" />
              {isHttpUrl(url) ? <a className={`${styles.fileName} ${styles.fileLink}`} href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a> : <span className={styles.fileName}>{url}</span>}
            </li>)}
        </ul>}
      {Object.entries(rest).map(([key, value]) => <p key={key} className={styles.text}>
          <strong>{key}:</strong> {typeof value === 'string' ? value : JSON.stringify(value)}
        </p>)}
    </>;
}

// What the order bought (package + add-ons) and, for DIGITAL, the client's brief
// so the provider knows what to deliver.
export default function OrderBriefPanel({
  order,
  role
}) {
  const tr = useTranslations("misc");
  const {
    status,
    items,
    snapshot
  } = useOrderDetail(order.orderId);
  const values = snapshot?.requirementValues;
  const hasRequirements = values && Object.keys(values).length > 0;
  if (status === 'loading') return null;
  if (status === 'error') {
    return <section className={styles.panel} aria-label={tr("m720")}>
        <p className={styles.note}>{tr("m719")}</p>
      </section>;
  }
  return <section className={styles.panel} aria-label={tr("m720")}>
      <strong className={styles.panelTitle}>
        <ClipboardList size={16} aria-hidden="true" />{tr("m720")}</strong>

      {items.length > 0 && <ul className={styles.fileList}>
          {items.map(item => <li key={item.orderItemId} className={styles.fileRow}>
              <span className={styles.chip}>{ITEM_TYPE[item.itemType] || item.itemType}</span>
              <span className={styles.fileName}>
                {itemName(item)}
                {item.quantity > 1 ? ` × ${item.quantity}` : ''}
              </span>
              <small>{formatPrice(item.amount ?? item.unitPrice)}</small>
            </li>)}
        </ul>}

      {order.executionType === 'DIGITAL' && <>
          <strong className={styles.panelTitle}>{tr("m721")}</strong>
          {hasRequirements ? <Requirements values={values} /> : <p className={styles.note}>
              {role === 'PROVIDER' ? tr("m1510") : tr("m1511")}
            </p>}
        </>}
    </section>;
}