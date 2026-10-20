// Mock orders shaped like order-service OrderResponse. `counterpartName` is
// mock-only: the real response carries ids, not the other party's name.
const FEE_RATE = 0.1;
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();
const at = (offsetMs) => new Date(now + offsetMs).toISOString();

const buildStatusHistory = (status, timeline) => {
  const history = [
    { status: 'CREATED', timestamp: timeline.createdAt || at(-10 * DAY), note: 'Đơn hàng được khởi tạo thành công' },
  ];
  if (timeline.confirmedAt) {
    history.push({ status: 'CONFIRMED', timestamp: timeline.confirmedAt, note: 'Chuyên gia đã xác nhận nhận việc' });
  }
  if (timeline.startedAt) {
    history.push({ status: 'IN_PROGRESS', timestamp: timeline.startedAt, note: 'Bắt đầu triển khai dịch vụ' });
  }
  if (timeline.deliveredAt) {
    history.push({ status: 'DELIVERED', timestamp: timeline.deliveredAt, note: 'Chuyên gia đã bàn giao sản phẩm nghiệm thu' });
  }
  if (timeline.completedAt) {
    history.push({ status: 'COMPLETED', timestamp: timeline.completedAt, note: 'Khách hàng hoàn tất nghiệm thu và đánh giá' });
  }
  if (timeline.cancelledAt) {
    history.push({ status: 'CANCELLED', timestamp: timeline.cancelledAt, note: 'Đơn hàng đã được hủy' });
  }
  return history;
};

const order = ({ id, number, title, executionType, subtotal, status, counterpartName, timeline }) => {
  const platformFee = Math.round(subtotal * FEE_RATE);
  const paid = status !== 'PENDING_PAYMENT' && status !== 'CANCELLED';
  const t = timeline || {};
  return {
    orderId: id,
    orderNumber: number,
    sourceType: 'SERVICE',
    title,
    executionType,
    subtotal,
    platformFee,
    totalAmount: subtotal + platformFee,
    providerNetAmount: subtotal - platformFee,
    currency: 'VND',
    orderStatus: status,
    paymentStatus: paid ? 'SUCCEEDED' : 'PENDING',
    counterpartName,
    placedAt: null,
    confirmedAt: null,
    startedAt: null,
    deliveredAt: null,
    completedAt: null,
    cancelledAt: null,
    autoCompleteAt: null,
    statusHistory: buildStatusHistory(status, t),
    ...t,
  };
};

export const mockClientOrders = [
  order({
    id: 'mock-c-1',
    number: 'WG-20261015-4821',
    title: 'Thiết kế website doanh nghiệp chuẩn SEO bằng Next.js',
    executionType: 'DIGITAL',
    subtotal: 5500000,
    status: 'DELIVERED',
    counterpartName: 'Trần Minh Quang',
    timeline: {
      createdAt: at(-9 * DAY),
      confirmedAt: at(-9 * DAY),
      startedAt: at(-8 * DAY),
      deliveredAt: at(-1 * DAY),
      autoCompleteAt: at(2 * DAY),
    },
  }),
  order({
    id: 'mock-c-2',
    number: 'WG-20261012-1093',
    title: 'Thiết kế trọn bộ nhận diện thương hiệu & Logo',
    executionType: 'DIGITAL',
    subtotal: 3000000,
    status: 'IN_PROGRESS',
    counterpartName: 'Lê Hoàng Anh',
    timeline: { createdAt: at(-5 * DAY), confirmedAt: at(-5 * DAY), startedAt: at(-4 * DAY) },
  }),
  order({
    id: 'mock-c-3',
    number: 'WG-20261014-7740',
    title: 'Sửa chữa điện nước, xử lý rò rỉ đường ống tại nhà',
    executionType: 'ONSITE',
    subtotal: 800000,
    status: 'IN_PROGRESS',
    counterpartName: 'Nguyễn Văn Tuấn',
    timeline: { createdAt: at(-3 * DAY), confirmedAt: at(-3 * DAY), startedAt: at(-2 * HOUR) },
  }),
  order({
    id: 'mock-c-4',
    number: 'WG-20261016-2214',
    title: 'Viết 10 bài chuẩn SEO cho Website & Blog',
    executionType: 'DIGITAL',
    subtotal: 1500000,
    status: 'CONFIRMED',
    counterpartName: 'Phạm Thu Hà',
    timeline: { createdAt: at(-1 * DAY), confirmedAt: at(-1 * DAY) },
  }),
  order({
    id: 'mock-c-5',
    number: 'WG-20261017-0042',
    title: 'Gia sư kèm 1-1 luyện thi IELTS cấp tốc',
    executionType: 'APPOINTMENT',
    subtotal: 600000,
    status: 'PENDING_PAYMENT',
    counterpartName: 'ThS. Mai Phương',
    timeline: { createdAt: at(-2 * HOUR) },
  }),
  order({
    id: 'mock-c-6',
    number: 'WG-20261002-5518',
    title: 'Vệ sinh, bơm gas và bảo trì máy lạnh tận nơi',
    executionType: 'ONSITE',
    subtotal: 350000,
    status: 'COMPLETED',
    counterpartName: 'Đỗ Quốc Bảo',
    timeline: { createdAt: at(-15 * DAY), completedAt: at(-12 * DAY) },
  }),
  order({
    id: 'mock-c-7',
    number: 'WG-20260928-3307',
    title: 'Giao hàng hỏa tốc nội thành trong 2 giờ',
    executionType: 'DELIVERY',
    subtotal: 150000,
    status: 'CANCELLED',
    counterpartName: 'Hoàng Nam Express',
    timeline: { createdAt: at(-19 * DAY), cancelledAt: at(-19 * DAY) },
  }),
];

export const mockProviderOrders = [
  order({
    id: 'mock-p-1',
    number: 'WG-20261016-6602',
    title: 'Lập trình Landing Page bán hàng chuẩn SEO',
    executionType: 'DIGITAL',
    subtotal: 2500000,
    status: 'CONFIRMED',
    counterpartName: 'Công ty TNHH Minh An',
    timeline: { createdAt: at(-1 * DAY), confirmedAt: at(-20 * HOUR) },
  }),
  order({
    id: 'mock-p-2',
    number: 'WG-20261013-3381',
    title: 'Thiết kế website doanh nghiệp chuẩn SEO bằng Next.js',
    executionType: 'DIGITAL',
    subtotal: 5500000,
    status: 'IN_PROGRESS',
    counterpartName: 'Nguyễn Thị Lan',
    timeline: { createdAt: at(-4 * DAY), confirmedAt: at(-4 * DAY), startedAt: at(-3 * DAY) },
  }),
  order({
    id: 'mock-p-3',
    number: 'WG-20261009-9015',
    title: 'Tối ưu tốc độ website WordPress',
    executionType: 'DIGITAL',
    subtotal: 1200000,
    status: 'DELIVERED',
    counterpartName: 'Shop Hoa Sen',
    timeline: {
      createdAt: at(-8 * DAY),
      startedAt: at(-7 * DAY),
      deliveredAt: at(-2 * DAY),
      autoCompleteAt: at(1 * DAY),
    },
  }),
  order({
    id: 'mock-p-4',
    number: 'WG-20261017-1170',
    title: 'Lập trình Landing Page bán hàng chuẩn SEO',
    executionType: 'DIGITAL',
    subtotal: 2500000,
    status: 'PENDING_PAYMENT',
    counterpartName: 'Trần Văn Khoa',
    timeline: { createdAt: at(-3 * HOUR) },
  }),
  order({
    id: 'mock-p-5',
    number: 'WG-20261001-2840',
    title: 'Thiết kế website doanh nghiệp chuẩn SEO bằng Next.js',
    executionType: 'DIGITAL',
    subtotal: 8000000,
    status: 'COMPLETED',
    counterpartName: 'Công ty CP Sao Việt',
    timeline: { createdAt: at(-16 * DAY), completedAt: at(-6 * DAY) },
  }),
];

export const getMockOrders = (roleName) =>
  structuredClone(roleName === 'PROVIDER' ? mockProviderOrders : mockClientOrders);
