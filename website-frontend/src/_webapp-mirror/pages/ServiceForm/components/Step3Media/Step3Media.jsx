import React, { useState } from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { isHttpUrl } from '../../formValidation';
import styles from './Step3Media.module.css';

export default function Step3Media({ formData, onChange, errors = {} }) {
  const gallery = formData.gallery || [];
  const [newImageUrl, setNewImageUrl] = useState('');
  const [galleryError, setGalleryError] = useState('');

  // catalog rejects a second media with the same URL on one service (MEDIA_EXISTED).
  const addImage = () => {
    const url = newImageUrl.trim();
    if (!isHttpUrl(url)) {
      setGalleryError('URL ảnh phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    if (url === formData.coverImage?.trim() || gallery.some((g) => g.url === url)) {
      setGalleryError('Ảnh này đã có trong dịch vụ.');
      return;
    }
    onChange('gallery', [...gallery, { url }]);
    setNewImageUrl('');
  };

  const removeImage = (idx) => onChange('gallery', gallery.filter((_, i) => i !== idx));

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
            {gallery.length > 0 && (
              <div className={styles.galleryGrid}>
                {gallery.map((item, idx) => (
                  <div key={item.id || item.url} className={styles.gallerySlot}>
                    <img src={item.url} alt={`Ảnh dự án ${idx + 1}`} />
                    <button
                      type="button"
                      className={styles.galleryRemove}
                      onClick={() => removeImage(idx)}
                      aria-label={`Xóa ảnh ${idx + 1}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.galleryAddRow}>
              <input
                type="url"
                className={styles.input}
                placeholder="Dán URL ảnh (https://...)"
                aria-label="URL ảnh dự án"
                value={newImageUrl}
                onChange={(e) => {
                  setNewImageUrl(e.target.value);
                  setGalleryError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <button type="button" className={styles.galleryAddBtn} onClick={addImage}>
                <Plus size={16} aria-hidden="true" /> Thêm ảnh
              </button>
            </div>
            {galleryError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.375rem' }}>{galleryError}</p>}
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
            {errors.videoUrl && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.375rem' }}>{errors.videoUrl}</p>}
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

