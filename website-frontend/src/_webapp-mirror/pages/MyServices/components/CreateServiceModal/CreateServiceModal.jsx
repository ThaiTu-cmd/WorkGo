import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import styles from './CreateServiceModal.module.css';

export default function CreateServiceModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    title: '',
    categorySlug: 'lap-trinh-cong-nghe',
    categoryName: 'Lập trình & Công nghệ',
    executionType: 'DIGITAL',
    basePrice: 1500000,
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    description: '',
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const categories = [
    { slug: 'lap-trinh-cong-nghe', name: 'Lập trình & Công nghệ' },
    { slug: 'thiet-ke-do-hoa', name: 'Thiết kế & Đồ họa' },
    { slug: 'sua-chua-dien-nuoc', name: 'Sửa chữa Điện nước' },
    { slug: 've-sinh-don-dep', name: 'Vệ sinh & Dọn dẹp' },
    { slug: 'van-chuyen-giao-nhan', name: 'Vận chuyển & Giao nhận' },
  ];

  const handleCategoryChange = (slug) => {
    const selected = categories.find((c) => c.slug === slug);
    setFormData((prev) => ({
      ...prev,
      categorySlug: slug,
      categoryName: selected ? selected.name : prev.categoryName,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tên dịch vụ!');
      return;
    }
    if (!formData.basePrice || Number(formData.basePrice) <= 0) {
      setError('Vui lòng nhập mức giá cơ bản hợp lệ!');
      return;
    }

    const newService = {
      serviceId: `svc-${Date.now()}`,
      title: formData.title.trim(),
      slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      categorySlug: formData.categorySlug,
      categoryName: formData.categoryName,
      executionType: formData.executionType,
      coverImage: formData.coverImage,
      status: 'ACTIVE',
      basePrice: Number(formData.basePrice),
      priceRange: `${new Intl.NumberFormat('vi-VN').format(Number(formData.basePrice))} ₫ – ${new Intl.NumberFormat('vi-VN').format(Number(formData.basePrice) * 3)} ₫`,
      packagesCount: 3,
      impressions: 1,
      clicks: 0,
      ordersCount: 0,
      avgRating: 5.0,
      reviewCount: 0,
      updatedAt: new Date().toISOString(),
    };

    onCreate(newService);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.titleWrap}>
            <Sparkles size={20} className={styles.sparkleIcon} />
            <h3 className={styles.modalTitle}>Tạo Dịch vụ Mới cho Chuyên gia</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && (
            <div className={styles.errorNotice}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Tên dịch vụ <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Thiết kế website chuẩn SEO bằng React / Next.js..."
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setError('');
              }}
              className={styles.input}
              required
            />
            <span className={styles.helpText}>Tiêu đề ngắn gọn, nêu rõ giải pháp cụ thể giúp khách hàng dễ tìm kiếm.</span>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Danh mục dịch vụ</label>
              <select
                value={formData.categorySlug}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={styles.select}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Hình thức thực hiện</label>
              <select
                value={formData.executionType}
                onChange={(e) => setFormData({ ...formData, executionType: e.target.value })}
                className={styles.select}
              >
                <option value="DIGITAL">Dịch vụ Số (Online 100%)</option>
                <option value="ONSITE">Tận nơi (Onsite tại nhà)</option>
                <option value="DELIVERY">Giao nhận vận chuyển</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Giá khởi điểm gói Cơ bản (VND) <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              step="50000"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>URL Ảnh bìa đại diện</label>
            <input
              type="url"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className={styles.submitBtn}>
              Lưu & Xuất bản Dịch vụ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
