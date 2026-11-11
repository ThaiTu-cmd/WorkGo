import { useTranslations } from "next-intl";
import React from 'react';
import styles from './CheckoutPage.module.css';
import { PAYMENT_OPTIONS } from '../../api/paymentApi';

// Gateway radio list shared by Checkout and the order payment page.
// `value` / `onChange` work with PAYMENT_OPTIONS ids.
export default function PaymentOptionPicker({
  value,
  onChange,
  disabled = false
}) {
  const tr = useTranslations("misc");
  return <section className={styles.card}>
      <h2 className={styles.cardTitle}>{tr("m488")}</h2>
      <p className={styles.cardSub}>{tr("m489")}</p>
      <div className={styles.gatewayList} role="radiogroup" aria-label={tr("m461")}>
        {PAYMENT_OPTIONS.map(option => <label key={option.id} className={`${styles.gatewayCard} ${value === option.id ? styles.gatewaySelected : ''}`}>
            <input type="radio" name="gateway" value={option.id} checked={value === option.id} disabled={disabled} onChange={() => onChange(option.id)} className={styles.gatewayInput} />
            <span className={`${styles.gwLogo} ${styles[option.logoClass]}`} aria-hidden="true">
              {option.logo}
            </span>
            <span className={styles.gwText}>
              <strong>{tr(option.name)}</strong>
              <small>{tr(option.desc)}</small>
            </span>
            <span className={styles.gwFee}>{tr("m490")}</span>
          </label>)}
      </div>
    </section>;
}
