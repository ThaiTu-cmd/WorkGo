import React, { useState } from 'react';
import { Info, Laptop, MapPin, Truck, X } from 'lucide-react';
import styles from './Step1Info.module.css';

export default function Step1Info({ formData, onChange, errors = {} }) {
  const [tagInput, setTagInput] = useState('');

  const categories = [
    { slug: 'lap-trinh-cong-nghe', name: 'Lập trình & Công nghệ (Web, Mobile, DevOps)' },
    { slug: 'thiet-ke-do-hoa', name: 'Thiết kế & Đồ họa (UI/UX, Logo, Branding)' },
    { slug: 'sua-chua-dien-nuoc', name: 'Sửa chữa Điện nước & Thiết bị gia đình' },
    { slug: 've-sinh-don-dep', name: 'Vệ sinh & Dọn dẹp (Nhà ở, Chung cư, Sofa)' },
    { slug: 'van-chuyen-giao-nhan', name: 'Vận chuyển & Giao nhận hàng hóa' },
  ];

  const handleTitleChange = (e) => {
    onChange('title', e.target.value);
  };

  const handleCategoryChange = (e) => {
    const slug = e.target.value;
    const cat = categories.find((c) => c.slug === slug);
    onChange('categorySlug', slug);
    onChange('categoryName', cat ? cat.name : '');
  };

  const handleExecTypeChange = (type) => {
    onChange('executionType', type);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      const currentTags = formData.tags || [];
      if (val && !currentTags.includes(val) && currentTags.length < 5) {
        onChange('tags', [...currentTags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    const currentTags = formData.tags || [];
    onChange('tags', currentTags.filter((_, idx) => idx !== indexToRemove));
  };

  const titleLength = (formData.title || '').length;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.heading}>Thông tin tổng quan dịch vụ</h2>
        <p className={styles.desc}>
          Thiết lập tiêu đề hấp dẫn, phân loại ngành nghề và hình thức thực hiện để tiếp cận đúng khách hàng tiềm năng.
        </p>
      </div>

      {/* Service Title */}
      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="serviceTitleInput">
            Tiêu đề dịch vụ niêm yết <span className={styles.required}>*</span>
          </label>
          <span className={`${styles.charCounter} ${titleLength > 85 ? styles.warning : ''}`}>
            {titleLength} / 100 ký tự
          </span>
        </div>
        <input
          type="text"
          id="serviceTitleInput"
          className={`${styles.input} ${errors.title ? styles.error : ''}`}
          placeholder="VD: Tôi sẽ thiết kế website doanh nghiệp chuẩn SEO & Responsive bằng React"
          value={formData.title || ''}
          onChange={handleTitleChange}
          maxLength={100}
        />
        {errors.title && <p className={styles.errorText}>{errors.title}</p>}
        <div className={styles.tipBox}>
          <Info size={16} />
          <span>
            Mẹo chuyên gia: Tiêu đề nên bắt đầu bằng "Tôi sẽ..." hoặc nêu rõ giá trị cốt lõi kèm công nghệ chuyên môn giúp tăng 40% cơ hội nhận việc.
          </span>
        </div>
      </div>

      {/* Category */}
      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="categorySelect">
            Ngành nghề & Danh mục chính <span className={styles.required}>*</span>
          </label>
        </div>
        <select
          id="categorySelect"
          className={styles.select}
          value={formData.categorySlug || 'lap-trinh-cong-nghe'}
          onChange={handleCategoryChange}
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Execution Type Cards */}
      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label}>
            Hình thức thực hiện công việc <span className={styles.required}>*</span>
          </label>
        </div>
        <div className={styles.execGrid}>
          {/* DIGITAL */}
          <label
            className={`${styles.execCard} ${formData.executionType === 'DIGITAL' ? styles.selected : ''}`}
            onClick={() => handleExecTypeChange('DIGITAL')}
          >
            <input
              type="radio"
              name="execTypeRadio"
              checked={formData.executionType === 'DIGITAL'}
              onChange={() => handleExecTypeChange('DIGITAL')}
            />
            <div className={styles.execHeader}>
              <div className={`${styles.execIcon} ${styles.execDigital}`}>
                <Laptop size={18} />
              </div>
              <span className={styles.execTitle}>Dịch vụ Số (Digital)</span>
            </div>
            <p className={styles.execDesc}>
              Bàn giao 100% online qua nền tảng: file thiết kế, source code, tài liệu số.
            </p>
          </label>

          {/* ONSITE */}
          <label
            className={`${styles.execCard} ${formData.executionType === 'ONSITE' ? styles.selected : ''}`}
            onClick={() => handleExecTypeChange('ONSITE')}
          >
            <input
              type="radio"
              name="execTypeRadio"
              checked={formData.executionType === 'ONSITE'}
              onChange={() => handleExecTypeChange('ONSITE')}
            />
            <div className={styles.execHeader}>
              <div className={`${styles.execIcon} ${styles.execOnsite}`}>
                <MapPin size={18} />
              </div>
              <span className={styles.execTitle}>Tận nơi (Onsite)</span>
            </div>
            <p className={styles.execDesc}>
              Đến trực tiếp địa chỉ khách hàng để khảo sát, sửa chữa, vệ sinh hoặc thi công.
            </p>
          </label>

          {/* DELIVERY */}
          <label
            className={`${styles.execCard} ${formData.executionType === 'DELIVERY' ? styles.selected : ''}`}
            onClick={() => handleExecTypeChange('DELIVERY')}
          >
            <input
              type="radio"
              name="execTypeRadio"
              checked={formData.executionType === 'DELIVERY'}
              onChange={() => handleExecTypeChange('DELIVERY')}
            />
            <div className={styles.execHeader}>
              <div className={`${styles.execIcon} ${styles.execDelivery}`}>
                <Truck size={18} />
              </div>
              <span className={styles.execTitle}>Giao nhận (Delivery)</span>
            </div>
            <p className={styles.execDesc}>
              Sản xuất và đóng gói vận chuyển ấn phẩm vật lý đến tận tay người mua.
            </p>
          </label>
        </div>
      </div>

      {/* Description */}
      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="descriptionTextarea">
            Mô tả chi tiết năng lực & Quy trình <span className={styles.required}>*</span>
          </label>
        </div>
        <textarea
          id="descriptionTextarea"
          rows={6}
          className={`${styles.textarea} ${errors.description ? styles.error : ''}`}
          placeholder="Mô tả chi tiết những gì khách hàng sẽ nhận được, các điểm mạnh nổi bật, thời gian phản hồi và cam kết an toàn bảo chứng Escrow..."
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
        />
        {errors.description && <p className={styles.errorText}>{errors.description}</p>}
      </div>

      {/* Search Tags */}
      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label}>Từ khóa tìm kiếm (Search Tags)</label>
          <span className={styles.charCounter}>Tối đa 5 thẻ</span>
        </div>
        <div className={styles.tagsContainer}>
          {(formData.tags || []).map((tag, idx) => (
            <span key={idx} className={styles.tagChip}>
              #{tag}
              <button
                type="button"
                className={styles.tagRemove}
                onClick={() => handleRemoveTag(idx)}
                aria-label={`Xóa thẻ ${tag}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          <input
            type="text"
            className={styles.tagInput}
            placeholder="Gõ từ khóa rồi nhấn Enter..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
          />
        </div>
      </div>
    </div>
  );
}

