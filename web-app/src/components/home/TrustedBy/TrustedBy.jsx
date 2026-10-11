import React from "react";
import styles from "./TrustedBy.module.css";

export default function TrustedBy() {
  const partners = [
    { name: "VNG Corporation", label: "VNG" },
    { name: "FPT Software", label: "FPT" },
    { name: "Viettel Solutions", label: "Viettel" },
    { name: "VinFast Eco", label: "VinFast" },
    { name: "Tiki Now", label: "Tiki" },
    { name: "Shopee Pro", label: "Shopee" },
  ];

  return (
    <section className={styles.trustedSection}>
      <div className={`container ${styles.trustedContainer}`}>
        <span className={styles.trustedLabel}>
          Được tin dùng bởi hơn 10.000+ cá nhân & doanh nghiệp:
        </span>
        <div className={styles.partnerList}>
          {partners.map((partner, index) => (
            <div
              key={index}
              className={styles.partnerItem}
              title={partner.name}
            >
              <span className={styles.partnerLogoText}>{partner.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
