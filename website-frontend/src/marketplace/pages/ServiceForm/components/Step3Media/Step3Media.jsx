import { useTranslations } from "next-intl";
import React, { useState } from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { isHttpUrl } from '../../formValidation';
import { initialAvatar, placeholderCover } from '../../../../api/adapters';
import { catalogMediaUrl, isStoredCatalogMedia } from '../../../../api/catalogApi';
import { useMyDisplayName } from '../../../../hooks/useMyDisplayName';
import styles from './Step3Media.module.css';
export default function Step3Media({
  formData,
  onChange,
  errors = {}
}) {
  const tr = useTranslations("misc");
  const mediaTr = useTranslations("catalogUpload");
  // The preview shows the signed-in provider, not a sample person.
  const providerName = useMyDisplayName() || tr("m86");
  const gallery = formData.gallery || [];
  const [newImageUrl, setNewImageUrl] = useState('');
  const [galleryError, setGalleryError] = useState('');
  const [fileError, setFileError] = useState('');
  const selectFile = (event, maxMb, save) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.size || file.size > maxMb * 1024 * 1024) {
      setFileError(mediaTr('fileSize', { p0: maxMb }));
      return;
    }
    setFileError('');
    save(file);
  };

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
  const coverUrl = catalogMediaUrl(formData.coverImage) || placeholderCover(formData.title);
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
            <input type="url" id="coverUrlInput" className={styles.input} placeholder="https://images.unsplash.com/photo-..." value={isStoredCatalogMedia(formData.coverImage) ? '' : formData.coverImage || ''} onChange={e => { onChange('coverFile', null); onChange('coverImage', e.target.value); }} />
            <label className={styles.label} htmlFor="catalog-cover-file">{mediaTr('cover')}</label>
            <input id="catalog-cover-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => selectFile(e, 5, file => onChange('coverFile', file))} />
            {formData.coverFile && <p>{formData.coverFile.name}</p>}
            {errors.coverImage && <p className={styles.errorMsg}>{errors.coverImage}</p>}

            <div className={styles.coverPreviewBox}>
              <img src={coverUrl} alt={tr("m1098")} className={styles.coverImg} />
              <span className={styles.coverBadge}>{tr("m1107")}</span>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{tr("m1108")}</label>
            <p className={styles.desc} style={{
            fontSize: '0.78rem',
            marginBottom: '0.5rem'
          }}>{tr("m1109")}</p>
            {gallery.length > 0 && <div className={styles.galleryGrid}>
                {gallery.map((item, idx) => <div key={item.id || item.url || idx} className={styles.gallerySlot}>
                    {item.url ? <img src={catalogMediaUrl(item.url)} alt={tr("m1099", {
                p0: idx + 1
              })} /> : <span>{item.file?.name}</span>}
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
            <label className={styles.label} htmlFor="catalog-gallery-file">{mediaTr('gallery')}</label>
            <input id="catalog-gallery-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => selectFile(e, 5, file => onChange('gallery', [...gallery, { file }]))} />
            {galleryError && <p className={styles.errorMsg}>{galleryError}</p>}
          </div>

          {/* Video URL */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="videoUrlInput">{tr("m1111")}</label>
            <input type="url" id="videoUrlInput" className={styles.input} placeholder="https://youtube.com/watch?v=..." value={isStoredCatalogMedia(formData.videoUrl) ? '' : formData.videoUrl || ''} onChange={e => { onChange('videoFile', null); onChange('videoUrl', e.target.value); }} />
            <label className={styles.label} htmlFor="catalog-video-file">{mediaTr('video')}</label>
            <input id="catalog-video-file" type="file" accept="video/mp4" onChange={e => selectFile(e, 50, file => onChange('videoFile', file))} />
            {formData.videoFile && <p>{formData.videoFile.name}</p>}
            {isStoredCatalogMedia(formData.videoUrl) && <a href={catalogMediaUrl(formData.videoUrl)} target="_blank" rel="noopener noreferrer">{mediaTr('openVideo')}</a>}
            {(formData.videoFile || isStoredCatalogMedia(formData.videoUrl)) && <button type="button" onClick={() => { onChange('videoFile', null); onChange('videoUrl', ''); }}>{mediaTr('removeVideo')}</button>}
            {errors.videoUrl && <p className={styles.errorMsg}>{errors.videoUrl}</p>}
          </div>
          {fileError && <p role="alert">{fileError}</p>}
        </div>

        {/* Right: Live Marketplace Card Preview */}
        <div>
          <div className={styles.livePreviewBox}>
            <div className={styles.previewHeader}>
              <span className={styles.liveBadge}>
                <Sparkles size={12} />{tr("m1112")}</span>
              <span style={{
              fontSize: '0.75rem',
              color: 'var(--wg-text-muted)'
            }}>{tr("m1113")}</span>
            </div>

            <div className={styles.mockCard}>
              <img src={coverUrl} alt="Thumbnail" className={styles.mockCardImg} />
              <div className={styles.mockCardBody}>
                <div className={styles.mockProvider}>
                  <img src={initialAvatar(providerName)} alt="" className={styles.mockAvatar} />
                  <span className={styles.mockPname}>{providerName}</span>
                </div>
                <h4 className={styles.mockTitle}>
                  {formData.title || tr("m1763")}
                </h4>
                <div className={styles.mockRating}>{tr("m1762")}</div>
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
