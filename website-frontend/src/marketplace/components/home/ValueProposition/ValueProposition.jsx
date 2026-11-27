import { useTranslations } from "next-intl";
import React from "react";
import { ShieldCheck, PackageCheck, Repeat, Headphones } from "lucide-react";
import styles from "./ValueProposition.module.css";
export default function ValueProposition() {
  const tr = useTranslations("misc");
  const values = [{
    icon: ShieldCheck,
    badge: tr("m152"),
    title: tr("m122"),
    desc: tr("m153")
  }, {
    icon: PackageCheck,
    badge: tr("m154"),
    title: tr("m155"),
    desc: tr("m156")
  }, {
    icon: Repeat,
    badge: tr("m157"),
    title: tr("m158"),
    desc: tr("m159")
  }, {
    icon: Headphones,
    badge: tr("m160"),
    title: tr("m161"),
    desc: tr("m162")
  }];
  return <section className={styles.section} id="why-workgo">
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.tagline}>{tr("m163")}</span>
          <h2 className={styles.title}>{tr("m164")}</h2>
          <p className={styles.subtitle}>{tr("m165")}</p>
        </div>

        {/* Grid cards */}
        <div className={styles.grid}>
          {values.map((val, idx) => {
          const Icon = val.icon;
          return <div key={idx} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.iconBox}>
                    <Icon size={24} />
                  </div>
                  <span className={styles.valueBadge}>
                    {val.badge}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{val.title}</h3>
                <p className={styles.cardDesc}>{val.desc}</p>
              </div>;
        })}
        </div>
      </div>
    </section>;
}