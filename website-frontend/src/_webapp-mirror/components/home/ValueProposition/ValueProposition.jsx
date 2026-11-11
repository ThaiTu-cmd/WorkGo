import React from "react";
import { ShieldCheck, PackageCheck, Repeat, Headphones } from "lucide-react";
import styles from "./ValueProposition.module.css";

export default function ValueProposition() {
  const values = [
    {
      icon: ShieldCheck,
      color: "#10b981",
      title: "Ký quỹ Escrow",
      desc: "Tiền được giữ an toàn, chỉ giải ngân khi bạn nghiệm thu.",
    },
    {
      icon: PackageCheck,
      color: "#3b82f6",
      title: "Gói minh bạch",
      desc: "Gói Basic, Standard, Premium rõ ràng — không phí ẩn.",
    },
    {
      icon: Repeat,
      color: "#8b5cf6",
      title: "Giao dịch 2 chiều",
      desc: "Mua dịch vụ có sẵn hoặc đăng việc để nhận báo giá.",
    },
    {
      icon: Headphones,
      color: "#f59e0b",
      title: "Hỗ trợ 24/7",
      desc: "Đánh giá thực tế và hỗ trợ giải quyết tranh chấp nhanh chóng.",
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
            Bảo vệ quyền lợi cho cả khách hàng và chuyên gia.
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
