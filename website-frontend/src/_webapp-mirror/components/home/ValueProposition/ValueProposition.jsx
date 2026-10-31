import React from "react";
import { ShieldCheck, PackageCheck, Repeat, Headphones } from "lucide-react";
import styles from "./ValueProposition.module.css";

export default function ValueProposition() {
  const values = [
    {
      icon: ShieldCheck,
      color: "#10b981",
      badge: "Bảo đảm 100%",
      title: "Ký quỹ Escrow",
      desc: "Tiền thanh toán được giữ an toàn trong quỹ trung gian, chỉ giải ngân khi bạn đã hài lòng với kết quả.",
    },
    {
      icon: PackageCheck,
      color: "#3b82f6",
      badge: "3 gói chuẩn",
      title: "Gói minh bạch",
      desc: "3 cấp độ giá Basic, Standard, Premium rõ ràng cam kết số ngày hoàn thành, số lần sửa — không phí ẩn.",
    },
    {
      icon: Repeat,
      color: "#8b5cf6",
      badge: "Linh hoạt 2 chiều",
      title: "Giao dịch 2 chiều",
      desc: "Đặt mua dịch vụ có sẵn tức thì hoặc đăng tin tuyển dụng việc để nhận hàng loạt báo giá từ chuyên gia.",
    },
    {
      icon: Headphones,
      color: "#f59e0b",
      badge: "Phản hồi < 15p",
      title: "Hỗ trợ 24/7",
      desc: "Đội ngũ chuyên viên túc trực giải quyết tranh chấp nhanh chóng và bảo vệ quyền lợi tối đa cho cả hai bên.",
    },
  ];

  return (
    <section className={styles.section} id="why-workgo">
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.tagline}>GIÁ TRỊ CỐT LÕI</span>
          <h2 className={styles.title}>Xây dựng trên sự tin tưởng</h2>
          <p className={styles.subtitle}>
            Tiêu chuẩn bảo vệ quyền lợi toàn diện cho cả khách hàng và chuyên gia cung ứng dịch vụ
          </p>
        </div>

        {/* Grid cards */}
        <div className={styles.grid}>
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div key={idx} className={styles.card}>
                <div className={styles.cardTop}>
                  <div
                    className={styles.iconBox}
                    style={{
                      backgroundColor: `${val.color}15`,
                      color: val.color,
                    }}
                  >
                    <Icon size={28} />
                  </div>
                  <span
                    className={styles.valueBadge}
                    style={{
                      backgroundColor: `${val.color}15`,
                      color: val.color,
                      borderColor: `${val.color}30`,
                    }}
                  >
                    {val.badge}
                  </span>
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
