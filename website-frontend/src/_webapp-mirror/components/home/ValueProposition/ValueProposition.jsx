import React from "react";
import { ShieldCheck, PackageCheck, Repeat, Headphones } from "lucide-react";
import styles from "./ValueProposition.module.css";

export default function ValueProposition() {
  const values = [
    {
      icon: ShieldCheck,
      color: "#10b981",
      title: "Bảo chứng Ký quỹ (Escrow)",
      desc: "Khoản thanh toán được giữ an toàn tại tài khoản bảo chứng. Chỉ giải ngân cho Chuyên gia khi bạn đã kiểm tra và xác nhận nghiệm thu đạt yêu cầu.",
    },
    {
      icon: PackageCheck,
      color: "#3b82f6",
      title: "Minh bạch Gói dịch vụ (Packages)",
      desc: "Mọi dịch vụ phân chia rõ ràng các gói Basic, Standard, Premium và tiện ích Add-on. Không lo phát sinh chi phí ngầm ngoài thỏa thuận.",
    },
    {
      icon: Repeat,
      color: "#8b5cf6",
      title: "Linh hoạt 2 chiều giao dịch",
      desc: "Tự do chọn mua dịch vụ niêm yết sẵn có từ Chuyên gia hoặc Đăng yêu cầu công việc để nhận nhiều Proposal báo giá cạnh tranh.",
    },
    {
      icon: Headphones,
      color: "#f59e0b",
      title: "Hỗ trợ & Trọng tài công tâm",
      desc: "Hệ thống đánh giá Review thực tế sau mỗi đơn hàng, tin nhắn trao đổi bảo mật và đội ngũ hỗ trợ giải quyết tranh chấp nhanh chóng 24/7.",
    },
  ];

  return (
    <section className={styles.section} id="why-workgo">
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.tagline}>GIÁ TRỊ CỐT LÕI TẠI WORKGO</span>
          <h2 className={styles.title}>
            Một sàn dịch vụ được xây dựng vì sự tin tưởng
          </h2>
          <p className={styles.subtitle}>
            Chúng tôi loại bỏ rủi ro khi thuê freelancer và thợ dịch vụ bằng
            công nghệ và quy trình bảo vệ quyền lợi tối đa cho cả hai bên.
          </p>
        </div>

        {/* Grid cards */}
        <div className={styles.grid}>
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div key={idx} className={styles.card}>
                <div
                  className={styles.iconBox}
                  style={{
                    backgroundColor: `${val.color}15`,
                    color: val.color,
                  }}
                >
                  <Icon size={30} />
                </div>
                <h3 className={styles.cardTitle}>{val.title}</h3>
                <p className={styles.cardDesc}>{val.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
