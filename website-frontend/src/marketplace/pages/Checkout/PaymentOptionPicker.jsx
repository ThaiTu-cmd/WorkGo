import { useTranslations } from "next-intl";
import React from 'react';
import styles from './CheckoutPage.module.css';
export default function PaymentOptionPicker({
  value,
  onChange,
  isOnsite,
  disabled = false
}) {
  const tr = useTranslations("orderWallet");
  const methods = isOnsite ? ['WALLET', 'CASH'] : ['WALLET'];
  return <section className={styles.card}>
      <h2 className={styles.cardTitle}>{tr("method")}</h2>
      <div className={styles.gatewayList} role="radiogroup" aria-label={tr("method")}>
        {methods.map(method => <label key={method} className={`${styles.gatewayCard} ${value === method ? styles.gatewaySelected : ''}`}>
            <input type="radio" name="paymentMethod" value={method} checked={value === method} disabled={disabled} onChange={() => onChange(method)} className={styles.gatewayInput} />
            <span className={styles.gwText}>
              <strong>{tr(method)}</strong>
              <small>{tr(`${method}Detail`)}</small>
            </span>
          </label>)}
      </div>
    </section>;
}
