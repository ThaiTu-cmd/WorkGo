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
              <span className={styles.roleTag}>DÀNH CHO KHÁCH HÀNG</span>
            </div>

            <h3 className={styles.cardTitle}>
              Cần hoàn thành công việc nhanh chóng?
            </h3>
            <p className={styles.cardDesc}>
              Đăng tin tuyển chọn chuyên gia hoàn toàn miễn phí. Nhận nhiều báo
              giá cạnh tranh chỉ sau ít phút và chủ động chọn người phù hợp
              nhất.
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
              <span className={styles.roleTag}>
                DÀNH CHO CHUYÊN GIA / FREELANCER
              </span>
            </div>

            <h3 className={styles.cardTitle}>
              Bạn có kỹ năng chuyên môn xuất sắc?
            </h3>
            <p className={styles.cardDesc}>
              Gia nhập cộng đồng Chuyên gia WorkGo. Đăng bán dịch vụ, tiếp cận
              hàng nghìn khách hàng tiềm năng và gia tăng thu nhập với cơ chế
              bảo chứng thanh toán.
            </p>

            <button
              type="button"
              className={styles.providerBtn}
              onClick={() => onOpenAuth && onOpenAuth("register")}
            >
              <span>Trở thành Chuyên gia WorkGo</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
