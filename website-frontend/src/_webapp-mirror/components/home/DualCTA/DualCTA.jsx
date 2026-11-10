import React from "react";
import { ArrowRight, UserCheck, Briefcase } from "lucide-react";
import styles from "./DualCTA.module.css";

export default function DualCTA({ onOpenAuth }) {
  return (
    <section className={styles.section} id="cta">
      <div className="container">
        <div className={styles.ctaGrid}>
          {/* Client Card */}
          <div className={`${styles.ctaCard} ${styles.clientCard} reveal reveal-delay-1`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconCircle}>
                <Briefcase size={26} />
              </div>
              <span className={styles.roleTag}>KHÁCH HÀNG</span>
            </div>

            <h3 className={styles.cardTitle}>
              Cần hoàn thành việc nhanh?
            </h3>
            <p className={styles.cardDesc}>
              Đăng việc miễn phí, nhận báo giá chỉ sau ít phút.
            </p>

            <button
              type="button"
              className={styles.clientBtn}
              onClick={() => onOpenAuth && onOpenAuth("register")}
            >
              <span>Đăng yêu cầu công việc</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Provider Card */}
          <div className={`${styles.ctaCard} ${styles.providerCard} reveal reveal-delay-2`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconCircle}>
                <UserCheck size={26} />
              </div>
              <span className={styles.roleTag}>CHUYÊN GIA</span>
            </div>

            <h3 className={styles.cardTitle}>
              Bạn có kỹ năng chuyên môn?
            </h3>
            <p className={styles.cardDesc}>
              Đăng bán dịch vụ, tiếp cận hàng nghìn khách hàng.
            </p>

            <button
              type="button"
              className={styles.providerBtn}
              onClick={() => onOpenAuth && onOpenAuth("register")}
            >
              <span>Trở thành Provider</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
