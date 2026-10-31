import React from "react";
import { Search, MessageSquare, CreditCard, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import styles from "./HowItWorks.module.css";

export default function HowItWorks() {
  const steps = [
    {
      stepNumber: "01",
      icon: Search,
      title: "Tìm kiếm hoặc Đăng việc",
      desc: "Chọn dịch vụ có sẵn hoặc đăng việc để nhận báo giá từ nhiều chuyên gia.",
    },
    {
      stepNumber: "02",
      icon: MessageSquare,
      title: "Trao đổi & Chọn gói",
      desc: "Nhắn tin trực tiếp với Chuyên gia để thống nhất yêu cầu và so sánh các gói.",
    },
    {
      stepNumber: "03",
      icon: CreditCard,
      title: "Xác nhận & Ký quỹ an toàn",
      desc: "Thanh toán được giữ an toàn trong WorkGo Escrow, không rủi ro.",
    },
    {
      stepNumber: "04",
      icon: CheckCircle2,
      title: "Nghiệm thu & Giải ngân",
      desc: "Hài lòng 100% mới bấm giải ngân thanh toán và để lại đánh giá uy tín.",
    },
  ];

  return (
    <section className={styles.section} id="how-it-works">
      <div className="container">
        {/* Header */}
        <div className={`${styles.header} reveal`}>
          <span className={styles.tagline}>DỄ DÀNG & AN TÂM</span>
          <h2 className={styles.title}>Cách thức hoạt động trên WorkGo</h2>
          <p className={styles.subtitle}>4 bước đơn giản, minh bạch và an toàn tuyệt đối cho mọi giao dịch</p>
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

        {/* Bottom Assurance Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.assuranceLeft}>
            <div className={styles.assuranceIcon}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h4 className={styles.assuranceTitle}>Bảo chứng an toàn tuyệt đối với WorkGo Escrow</h4>
              <p className={styles.assuranceDesc}>
                Số tiền thanh toán được tạm giữ an toàn trong hệ thống ký quỹ và chỉ giải ngân khi bạn đã hoàn toàn nghiệm thu công việc.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.detailLink}
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("workgo-navigate", { detail: { page: "how-it-works" } }));
              }
            }}
          >
            <span>Xem cẩm nang quy trình chi tiết</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
