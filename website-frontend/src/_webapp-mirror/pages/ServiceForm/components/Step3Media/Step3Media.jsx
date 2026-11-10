import React from 'react';
import { Sparkles, Plus, Image as ImageIcon } from 'lucide-react';
import styles from './Step3Media.module.css';

export default function Step3Media({ formData, onChange, errors = {} }) {
  const coverUrl = formData.coverImage || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80';
  const basePrice = formData.packages?.basic?.price || 2500000;

  const formattedPrice = new Intl.NumberFormat('vi-VN').format(basePrice) + ' ₫';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.heading}>Thư viện Hình ảnh & Xuất bản Dịch vụ</h2>
        <p className={styles.desc}>
          Ảnh bìa chất lượng cao tạo ấn tượng ban đầu quyết định khách hàng có bấm vào xem dịch vụ của bạn hay không.
        </p>
      </div>

      <div className={styles.layoutGrid}>
        {/* Left: Media inputs */}
        <div>
          {/* Cover Image URL */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="coverUrlInput">
              URL Ảnh bìa chính (Cover Image) <span className={styles.required}>*</span>
            </label>
            <input
              type="url"
              id="coverUrlInput"
              className={styles.input}
              placeholder="https://images.unsplash.com/photo-..."
              value={formData.coverImage || ''}
              onChange={(e) => onChange('coverImage', e.target.value)}
            />
            {errors.coverImage && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.375rem' }}>{errors.coverImage}</p>}

            <div className={styles.coverPreviewBox}>
              <img src={coverUrl} alt="Xem trước ảnh bìa" className={styles.coverImg} />
              <span className={styles.coverBadge}>Ảnh bìa chính (16:9)</span>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Bộ sưu tập dự án thực tế (Gallery)</label>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Bổ sung hình ảnh sản phẩm đã hoàn thành để nâng cao độ tin cậy.
            </p>
            <div className={styles.galleryGrid}>
              {(formData.mediaUrls || [
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&auto=format&fit=crop&q=80',
              ]).map((url, idx) => (
                <div key={idx} className={styles.gallerySlot}>
                  <img src={url} alt={`Gallery ${idx + 1}`} />
                </div>
              ))}
              <div className={styles.gallerySlot} title="Thêm ảnh minh họa">
                <Plus size={20} />
                <span>+ Thêm ảnh</span>
              </div>
            </div>
          </div>

          {/* Video URL */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="videoUrlInput">
              Liên kết Video demo / Giới thiệu (Tùy chọn)
            </label>
            <input
              type="url"
              id="videoUrlInput"
              className={styles.input}
              placeholder="https://youtube.com/watch?v=..."
              value={formData.videoUrl || ''}
              onChange={(e) => onChange('videoUrl', e.target.value)}
            />
          </div>
        </div>

        {/* Right: Live Marketplace Card Preview */}
        <div>
          <div className={styles.livePreviewBox}>
            <div className={styles.previewHeader}>
              <span className={styles.liveBadge}>
                <Sparkles size={12} />
                Xem trước Card Marketplace
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hiển thị thời gian thực</span>
            </div>

            <div className={styles.mockCard}>
              <img src={coverUrl} alt="Thumbnail" className={styles.mockCardImg} />
              <div className={styles.mockCardBody}>
                <div className={styles.mockProvider}>
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Avatar"
                    className={styles.mockAvatar}
                  />
                  <span className={styles.mockPname}>Trần Minh Quang (Top Rated)</span>
                </div>
                <h4 className={styles.mockTitle}>
                  {formData.title || 'Tôi sẽ thiết kế website doanh nghiệp chuẩn SEO & Responsive bằng React'}
                </h4>
                <div className={styles.mockRating}>★ 5.0 (0 đánh giá) • Mới ra mắt</div>
                <div className={styles.mockFooter}>
                  <span className={styles.mockPriceLabel}>Khởi điểm từ</span>
                  <span className={styles.mockPriceVal}>{formattedPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

