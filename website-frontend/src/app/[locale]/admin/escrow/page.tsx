import { Construction } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import styles from "@/components/admin/admin.module.css";

export default function AdminEscrowPage() {
  return (
    <>
      <PageHeader title="Quản lý ký quỹ" sub="Theo dõi tiền giữ hộ (escrow) giữa khách hàng và provider." />
      <div className={`${styles.card} ${styles.placeholder}`}>
        <div className={styles.gateIcon}>
          <Construction size={24} />
        </div>
        <h2 className={styles.dialogTitle}>Sắp ra mắt</h2>
        <p>
          Backend chưa có API ký quỹ (payment-service mới chỉ có khung). Khi có API, trang này sẽ hiển thị các khoản
          đang giữ, giải ngân cho provider và hoàn tiền cho khách hàng.
        </p>
      </div>
    </>
  );
}
