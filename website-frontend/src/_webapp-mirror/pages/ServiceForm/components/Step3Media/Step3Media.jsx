import { useTranslations } from "next-intl";
import React, { useState } from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { isHttpUrl } from '../../formValidation';
import styles from './Step3Media.module.css';
export default function Step3Media({
  formData,
  onChange,
  errors = {}
}) {
  const tr = useTranslations("misc");
  const gallery = formData.gallery || [];
  const [newImageUrl, setNewImageUrl] = useState('');
  const [galleryError, setGalleryError] = useState('');

  // catalog rejects a second media with the same URL on one service (MEDIA_EXISTED).
  const addImage = () => {
    const url = newImageUrl.trim();
    if (!isHttpUrl(url)) {
      setGalleryError(tr("m1096"));
      return;
    }
    if (url === formData.coverImage?.trim() || gallery.some(g => g.url === url)) {
      setGalleryError(tr("m1097"));
      return;
    }
    onChange('gallery', [...gallery, {
      url
    }]);
    setNewImageUrl('');
  };
  const removeImage = idx => onChange('gallery', gallery.filter((_, i) => i !== idx));
  const coverUrl = formData.coverImage || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80';
  const basePrice = formData.packages?.basic?.price || 2500000;
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(basePrice) + ' ₫';
  return <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.heading}>{tr("m1104")}</h2>
        <p className={styles.desc}>{tr("m1105")}</p>
      </div>

      <div className={styles.layoutGrid}>
        {/* Left: Media inputs */}
        <div>
          {/* Cover Image URL */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="coverUrlInput">{tr("m1106")}<span className={styles.required}>*</span>
            </label>
            <input type="url" id="coverUrlInput" className={styles.input} placeholder="https://images.unsplash.com/photo-..." value={formData.coverImage || ''} onChange={e => onChange('coverImage', e.target.value)} />
            {errors.coverImage && <p style={{
            color: '#ef4444',
            fontSize: '0.75rem',
            marginTop: '0.375rem'
          }}>{errors.coverImage}</p>}

            <div className={styles.coverPreviewBox}>
              <img src={coverUrl} alt={tr("m1098")} className={styles.coverImg} />
              <span className={styles.coverBadge}>{tr("m1107")}</span>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{tr("m1108")}</label>
            <p style={{
            fontSize: '0.75rem',
            color: '#64748b',
            marginBottom: '0.5rem'
          }}>{tr("m1109")}</p>
            {gallery.length > 0 && <div className={styles.galleryGrid}>
                {gallery.map((item, idx) => <div key={item.id || item.url} className={styles.gallerySlot}>
                    <img src={item.url} alt={tr("m1099", {
                p0: idx + 1
              })} />
                    <button type="button" className={styles.galleryRemove} onClick={() => removeImage(idx)} aria-label={tr("m1100", {
                p0: idx + 1
              })}>
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>)}
              </div>}
            <div className={styles.galleryAddRow}>
              <input type="url" className={styles.input} placeholder={tr("m1101")} aria-label={tr("m1102")} value={newImageUrl} onChange={e => {
              setNewImageUrl(e.target.value);
              setGalleryError('');
            }} onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addImage();
              }
            }} />
              <button type="button" className={styles.galleryAddBtn} onClick={addImage}>
                <Plus size={16} aria-hidden="true" />{tr("m1110")}</button>
            </div>
            {galleryError && <p style={{
            color: '#ef4444',
            fontSize: '0.75rem',
            marginTop: '0.375rem'
          }}>{galleryError}</p>}
          </div>

          {/* Video URL */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="videoUrlInput">{tr("m1111")}</label>
            <input type="url" id="videoUrlInput" className={styles.input} placeholder="https://youtube.com/watch?v=..." value={formData.videoUrl || ''} onChange={e => onChange('videoUrl', e.target.value)} />
            {errors.videoUrl && <p style={{
            color: '#ef4444',
            fontSize: '0.75rem',
            marginTop: '0.375rem'
          }}>{errors.videoUrl}</p>}
          </div>
        </div>

        {/* Right: Live Marketplace Card Preview */}
        <div>
          <div className={styles.livePreviewBox}>
            <div className={styles.previewHeader}>
              <span className={styles.liveBadge}>
                <Sparkles size={12} />{tr("m1112")}</span>
              <span style={{
              fontSize: '0.75rem',
              color: '#64748b'
            }}>{tr("m1113")}</span>
            </div>

            <div className={styles.mockCard}>
              <img src={coverUrl} alt="Thumbnail" className={styles.mockCardImg} />
              <div className={styles.mockCardBody}>
                <div className={styles.mockProvider}>
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar" className={styles.mockAvatar} />
                  <span className={styles.mockPname}>Trần Minh Quang (Top Rated)</span>
                </div>
                <h4 className={styles.mockTitle}>
                  {formData.title || tr("m1103")}
                </h4>
                <div className={styles.mockRating}>{tr("m1115")}</div>
                <div className={styles.mockFooter}>
                  <span className={styles.mockPriceLabel}>{tr("m1116")}</span>
                  <span className={styles.mockPriceVal}>{formattedPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}