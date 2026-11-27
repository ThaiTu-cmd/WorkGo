import { useTranslations } from "next-intl";
import React from "react";
import { Search, MessageSquare, CreditCard, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import styles from "./HowItWorks.module.css";
export default function HowItWorks() {
  const tr = useTranslations("misc");
  const steps = [{
    stepNumber: "01",
    icon: Search,
    title: tr("m128"),
    desc: tr("m129")
  }, {
    stepNumber: "02",
    icon: MessageSquare,
    title: tr("m130"),
    desc: tr("m131")
  }, {
    stepNumber: "03",
    icon: CreditCard,
    title: tr("m132"),
    desc: tr("m133")
  }, {
    stepNumber: "04",
    icon: CheckCircle2,
    title: tr("m134"),
    desc: tr("m135")
  }];
  return <section className={styles.section} id="how-it-works">
      <div className="container">
        {/* Header */}
        <div className={`${styles.header} reveal`}>
          <span className={styles.tagline}>{tr("m136")}</span>
          <h2 className={styles.title}>{tr("m137")}</h2>
          <p className={styles.subtitle}>{tr("m138")}</p>
        </div>

        {/* 4 Steps Row */}
        <div className={styles.stepsGrid}>
          {steps.map((st, idx) => {
          const Icon = st.icon;
          return <div key={idx} className={`${styles.stepCard} reveal reveal-delay-${idx + 1}`}>
                <div className={styles.stepTop}>
                  <span className={styles.stepNum}>{st.stepNumber}</span>
                  <div className={styles.stepIconBox}>
                    <Icon size={24} />
                  </div>
                </div>
                <h3 className={styles.stepTitle}>{st.title}</h3>
                <p className={styles.stepDesc}>{st.desc}</p>
              </div>;
        })}
        </div>

        {/* Bottom Assurance Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.assuranceLeft}>
            <div className={styles.assuranceIcon}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h4 className={styles.assuranceTitle}>{tr("m139")}</h4>
              <p className={styles.assuranceDesc}>{tr("m140")}</p>
            </div>
          </div>
          <button type="button" className={styles.detailLink} onClick={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("workgo-navigate", {
              detail: {
                page: "how-it-works"
              }
            }));
          }
        }}>
            <span>{tr("m141")}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>;
}