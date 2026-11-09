import { useTranslations } from "next-intl";
import React from "react";
import { ArrowRight, UserCheck, Briefcase } from "lucide-react";
import styles from "./DualCTA.module.css";
export default function DualCTA({
  onOpenAuth
}) {
  const tr = useTranslations("misc");
  return <section className={styles.section} id="cta">
      <div className="container">
        <div className={styles.ctaGrid}>
          {/* Client Card */}
          <div className={`${styles.ctaCard} ${styles.clientCard} reveal reveal-delay-1`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconCircle}>
                <Briefcase size={26} />
              </div>
              <span className={styles.roleTag}>{tr("m94")}</span>
            </div>

            <h3 className={styles.cardTitle}>{tr("m95")}</h3>
            <p className={styles.cardDesc}>{tr("m96")}</p>

            <button type="button" className={styles.clientBtn} onClick={() => onOpenAuth && onOpenAuth("register")}>
              <span>{tr("m97")}</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Provider Card */}
          <div className={`${styles.ctaCard} ${styles.providerCard} reveal reveal-delay-2`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconCircle}>
                <UserCheck size={26} />
              </div>
              <span className={styles.roleTag}>{tr("m98")}</span>
            </div>

            <h3 className={styles.cardTitle}>{tr("m99")}</h3>
            <p className={styles.cardDesc}>{tr("m100")}</p>

            <button type="button" className={styles.providerBtn} onClick={() => onOpenAuth && onOpenAuth("register")}>
              <span>{tr("m101")}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>;
}