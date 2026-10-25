import React from "react";
import { Search, MessageSquare, CreditCard, CheckCircle2 } from "lucide-react";
import styles from "./HowItWorks.module.css";

export default function HowItWorks() {
  const steps = [
    {
      stepNumber: "01",
      icon: Search,
      title: "Tìm kiếm hoặc Đăng việc",
      desc: "Chọn dịch vụ có sẵn hoặc đăng việc để nhận báo giá.",
    },
    {
      stepNumber: "02",
      icon: MessageSquare,
      title: "Trao đổi & Chọn gói",
      desc: "Nhắn tin với Chuyên gia và so sánh các gói.",
    },
    {
      stepNumber: "03",
      icon: CreditCard,
      title: "Xác nhận & Ký quỹ an toàn",
      desc: "Thanh toán được giữ an toàn trong Escrow.",
    },
    {
      stepNumber: "04",
      icon: CheckCircle2,
      title: "Nghiệm thu & Giải ngân",
      desc: "Hài lòng mới giải ngân và để lại đánh giá.",
    },
  ];

  return (
    <section className={styles.section} id="how-it-works">
      <div className="container">
        {/* Header */}
        <div className={`${styles.header} reveal`}>
          <span className={styles.tagline}>DỄ DÀNG & AN TÂM</span>
          <h2 className={styles.title}>Cách thức hoạt động trên WorkGo</h2>
          <p className={styles.subtitle}>4 bước đơn giản, an toàn</p>
        </div>

        {/* 4 Steps Row */}
        <div className={styles.stepsGrid}>
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div key={idx} className={`${styles.stepCard} reveal reveal-delay-${idx + 1}`}>
                <div className={styles.stepTop}>
                  <span className={styles.stepNum}>{st.stepNumber}</span>
                  <div className={styles.stepIconBox}>
                    <Icon size={24} />
                  </div>
                </div>
                <h3 className={styles.stepTitle}>{st.title}</h3>
                <p className={styles.stepDesc}>{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
