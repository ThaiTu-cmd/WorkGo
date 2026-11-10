import React from 'react';
import tableStyles from '../../../pages/MyServices/components/ServicesTable/ServicesTable.module.css';
import styles from './SkeletonTable.module.css';

// Loading placeholder for the MyServices table. Reuses the real
// `.tableWrapper`/`.dataTable` classes (same border, min-width:800px,
// cell padding) so the skeleton occupies exactly the table's footprint.
export default function SkeletonTable({ rows = 5 }) {
  const items = Array.from({ length: rows }, (_, i) => i);
  return (
    <div className={tableStyles.tableWrapper} aria-hidden="true">
      <table className={tableStyles.dataTable}>
        <thead>
          <tr>
            <th className={tableStyles.thCheck}>
              <div className={`${styles.skBlock} ${styles.skCheck}`} />
            </th>
            <th className={tableStyles.thService}>
              <div className={`${styles.skBlock} ${styles.skHead}`} />
            </th>
            <th className={tableStyles.thPrice}>
              <div className={`${styles.skBlock} ${styles.skHead}`} />
            </th>
            <th className={tableStyles.thStats}>
              <div className={`${styles.skBlock} ${styles.skHead}`} />
            </th>
            <th className={tableStyles.thStatus}>
              <div className={`${styles.skBlock} ${styles.skHeadSm}`} />
            </th>
            <th className={tableStyles.thToggle}>
              <div className={`${styles.skBlock} ${styles.skHeadSm}`} />
            </th>
            <th className={tableStyles.thActions}>
              <div className={`${styles.skBlock} ${styles.skHeadSm}`} />
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i} className={tableStyles.row}>
              <td className={tableStyles.tdCheck}>
                <div className={`${styles.skBlock} ${styles.skCheck}`} />
              </td>
              <td>
                <div className={styles.skServiceCell}>
                  <div className={`${styles.skBlock} ${styles.skThumb}`} />
                  <div className={styles.skServiceMeta}>
                    <div className={`${styles.skBlock} ${styles.skTitle}`} />
                    <div className={`${styles.skBlock} ${styles.skPill}`} />
                  </div>
                </div>
              </td>
              <td>
                <div className={`${styles.skBlock} ${styles.skPrice}`} />
              </td>
              <td>
                <div className={`${styles.skBlock} ${styles.skStats}`} />
              </td>
              <td>
                <div className={`${styles.skBlock} ${styles.skStatus}`} />
              </td>
              <td>
                <div className={`${styles.skBlock} ${styles.skSwitch}`} />
              </td>
              <td>
                <div className={styles.skActions}>
                  <div className={`${styles.skBlock} ${styles.skIconBtn}`} />
                  <div className={`${styles.skBlock} ${styles.skIconBtn}`} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
