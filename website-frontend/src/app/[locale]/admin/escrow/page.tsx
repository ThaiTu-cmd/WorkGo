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
          Payment đã có dữ liệu ký quỹ theo Order dành cho các bên tham gia. Màn giám sát quản trị đang chờ API đọc
          có phân quyền riêng; hiện chưa hỗ trợ xem toàn bộ ký quỹ hoặc thực hiện giải ngân từ trang này.
        </p>
      </div>
    </>
  );
}
