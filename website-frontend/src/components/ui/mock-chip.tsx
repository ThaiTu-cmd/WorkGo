"use client";

// Khi chuyển sang kiến trúc Live API & Persistent Store,
// ẩn hoàn toàn MockChip để trang web không còn bất kỳ dấu hiệu "Dữ liệu mẫu" nào.
export function MockChip(props?: { className?: string }) {
  void props;
  return null;
}
