import { EvidenceUploadButton } from '@/features/orders/EvidenceUploadSheet';
import { OrderDetailScreen } from '@/features/orders/OrderDetailScreen';
import { canAddEvidence } from '@/features/orders/orderStatus';

export default function OrderDetailRoute() {
  return (
    <OrderDetailScreen
      evidenceFooter={({ orderId, role, detail }) =>
        detail.order.data && canAddEvidence(detail.order.data, detail.execution.data ?? null, role) ? (
          <EvidenceUploadButton orderId={orderId} />
        ) : null
      }
    />
  );
}
