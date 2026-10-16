export type Address = {
  id: string;
  label: string;
  receiver: string;
  phone: string;
  detail: string;
  isDefault: boolean;
};

export const mockAddresses: Address[] = [
  {
    id: "addr-1",
    label: "Nhà riêng",
    receiver: "Trần Hữu Trung",
    phone: "0901234567",
    detail: "Căn hộ 12.04 Tòa Landmark Plus, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh",
    isDefault: true,
  },
  {
    id: "addr-2",
    label: "Văn phòng công ty",
    receiver: "Trần Hữu Trung",
    phone: "0909876543",
    detail: "Tầng 18 Tòa nhà Bitexco, 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    isDefault: false,
  },
  {
    id: "addr-3",
    label: "Chi nhánh kho hàng",
    receiver: "Nguyễn Văn An",
    phone: "0912345678",
    detail: "Số 45 Đường số 7, KDC Trung Sơn, Xã Bình Hưng, Huyện Bình Chánh, TP. Hồ Chí Minh",
    isDefault: false,
  },
];
