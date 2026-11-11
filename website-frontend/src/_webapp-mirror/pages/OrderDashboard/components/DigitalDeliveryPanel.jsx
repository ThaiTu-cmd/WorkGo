import { useTranslations } from "next-intl";
import React from 'react';
import { Link2, Paperclip, PackageCheck, RefreshCw } from 'lucide-react';
import { useDigitalDelivery } from '../../../hooks/useDigitalDelivery';
import evidenceStyles from './WorkEvidence.module.css';
import styles from './OrderFlow.module.css';
// Keys of the "misc" dictionary, translated with tr() at render.
const PACKAGE_STATUS = {
  SUBMITTED: 'm1597',
  ACCEPTED: 'm1602',
  REVISION_REQUESTED: 'm1603'
};
const REVISION_STATUS = {
  OPEN: 'm1604',
  RESOLVED: 'm1605'
};
const formatDateTime = iso => iso ? new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short'
}).format(new Date(iso)) : '—';

// Delivery versions the provider submitted for a DIGITAL order, each with the
// revision request the client raised against it.
export default function DigitalDeliveryPanel({
  orderId,
  role
}) {
  const tr = useTranslations("misc");
  const {
    status,
    deliveries,
    revisions,
    reload
  } = useDigitalDelivery(orderId);
  const revisionsOf = packageId => revisions.filter(r => r.deliveryPackageId === packageId);
  return <section className={styles.panel} aria-label={tr("m679")}>
      <strong className={styles.panelTitle}>
        <PackageCheck size={16} aria-hidden="true" />{tr("m679")}{status === 'ready' && <span className={evidenceStyles.count}>{deliveries.length}</span>}
      </strong>

      {status === 'loading' && <p className={styles.note}>{tr("m683")}</p>}
      {status === 'error' && <p className={styles.note}>{tr("m1507")}{' '}
          <button type="button" className={evidenceStyles.linkBtn} onClick={reload}>
            <RefreshCw size={14} aria-hidden="true" />{tr("m604")}</button>
        </p>}
      {status === 'ready' && deliveries.length === 0 && <p className={styles.note}>
          {role === 'PROVIDER' ? tr("m680") : tr("m681")}
        </p>}

      {deliveries.map(d => <article key={d.deliveryPackageId} className={styles.version}>
          <div className={styles.versionHead}>
            <span>
              <strong>Lần {d.versionNo}</strong> · {formatDateTime(d.deliveredAt)}
            </span>
            <span className={`${styles.chip} ${styles[`chip_${d.status}`] || ''}`}>
              {PACKAGE_STATUS[d.status] ? tr(PACKAGE_STATUS[d.status]) : d.status}
            </span>
          </div>
          {d.message && <p className={styles.quote}>{d.message}</p>}
          <ul className={styles.fileList}>
            {(d.files || []).map(f => {
          const isData = f.fileUrl?.startsWith('data:');
          // Uploaded files are downloaded, never opened; only http(s) links open in a tab.
          const linkProps = isData ? {
            href: f.fileUrl,
            download: f.fileName || 'file'
          } : /^https?:\/\//i.test(f.fileUrl || '') ? {
            href: f.fileUrl,
            target: '_blank',
            rel: 'noopener noreferrer'
          } : null;
          return <li key={f.deliveryFileId} className={styles.fileRow}>
                  {isData ? <Paperclip size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}
                  {linkProps ? <a className={`${styles.fileName} ${styles.fileLink}`} {...linkProps}>
                      {f.fileName || f.fileUrl}
                    </a> : <span className={styles.fileName}>{f.fileName || f.fileUrl}</span>}
                </li>;
        })}
          </ul>
          {revisionsOf(d.deliveryPackageId).map(r => <div key={r.revisionRequestId}>
              <div className={styles.versionHead}>
                <span>{tr("m1508")}{formatDateTime(r.createdAt)}</span>
                <span className={`${styles.chip} ${styles[`chip_${r.status}`] || ''}`}>
                  {REVISION_STATUS[r.status] ? tr(REVISION_STATUS[r.status]) : r.status}
                </span>
              </div>
              <p className={styles.quote}>{r.reason}</p>
            </div>)}
        </article>)}
    </section>;
}