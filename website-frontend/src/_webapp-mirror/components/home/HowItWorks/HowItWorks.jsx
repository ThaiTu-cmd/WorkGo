import React from "react";
import { Search, MessageSquare, CreditCard, CheckCircle2 } from "lucide-react";
import styles from "./HowItWorks.module.css";

export default function HowItWorks() {
  const steps = [
    {
      stepNumber: "01",
      icon: Search,
      title: "Tìm kiếm hoặc Đăng việc",
      desc: "Khám phá hàng nghìn dịch vụ có sẵn hoặc đăng mô tả công việc của bạn lên hệ thống để nhận báo giá từ nhiều chuyên gia.",
    },
    {
      stepNumber: "02",
      icon: MessageSquare,
      title: "Trao đổi & Chọn gói",
      desc: "Nhắn tin trực tiếp với Chuyên gia, so sánh các gói Basic / Standard / Premium hoặc duyệt các Proposal báo giá chi tiết.",
    },
    {
      stepNumber: "03",
      icon: CreditCard,
      title: "Xác nhận & Ký quỹ an toàn",
      desc: "Tạo đơn hàng và thanh toán. Số tiền của bạn được giữ an toàn trong tài khoản bảo chứng (Escrow) trong suốt quá trình thực hiện.",
    },
    {
      stepNumber: "04",
      icon: CheckCircle2,
      title: "Nghiệm thu & Giải ngân",
      desc: "Kiểm tra chất lượng dịch vụ khi hoàn thành. Chỉ khi bạn hoàn toàn ưng ý, hệ thống mới giải ngân tiền cho Chuyên gia và để lại đánh giá.",
    },
  ];

  return (
    <section className={styles.section} id="how-it-works">
      <div className="container">
        {/* Header */}
        <div className={`${styles.header} reveal`}>
          <span className={styles.tagline}>DỄ DÀNG & AN TÂM</span>
          <h2 className={styles.title}>Cách thức hoạt động trên WorkGo</h2>
          <p className={styles.subtitle}>
            Trải nghiệm mua bán dịch vụ chuyên nghiệp, an toàn và nhanh gọn chỉ
            với 4 bước
          </p>
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
