import { useTranslations } from "next-intl";
import React, { useState } from 'react';
import { Info, Laptop, MapPin, X } from 'lucide-react';
import styles from './Step1Info.module.css';
import { useCatalogCategories } from '../../../../hooks/useCatalogCategories';
import { TITLE_MAX } from '../../formValidation';
export default function Step1Info({
  formData,
  onChange,
  errors = {}
}) {
  const tr = useTranslations("misc");
  const [tagInput, setTagInput] = useState('');

  // catalog-service root categories + their direct children, flattened for the select.
  const {
    categories: roots,
    status: categoriesStatus
  } = useCatalogCategories();
  const categories = roots.flatMap(root => [{
    categoryId: root.categoryId,
    slug: root.slug,
    name: root.name
  }, ...[...(root.children || [])].map(child => ({
    categoryId: child.categoryId,
    slug: child.slug,
    name: `${root.name} › ${child.name}`
  }))]);

  // F1: soft-cap past TITLE_MAX even for programmatic/state pastes (maxLength only guards typing).
  const handleTitleChange = e => {
    onChange('title', e.target.value.slice(0, TITLE_MAX));
  };
  const handleCategoryChange = e => {
    const categoryId = e.target.value;
    const cat = categories.find(c => c.categoryId === categoryId);
    onChange('categoryId', categoryId);
    onChange('categorySlug', cat ? cat.slug : '');
    onChange('categoryName', cat ? cat.name : '');
  };
  const handleExecTypeChange = type => {
    onChange('executionType', type);
  };
  const handleAddTag = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '').replace(/[<>"']/g, '');
      const currentTags = formData.tags || [];
      if (val && !currentTags.includes(val) && currentTags.length < 5) {
        onChange('tags', [...currentTags, val]);
        setTagInput('');
      }
    }
  };
  const handleRemoveTag = indexToRemove => {
    const currentTags = formData.tags || [];
    onChange('tags', currentTags.filter((_, idx) => idx !== indexToRemove));
  };
  const titleLength = (formData.title || '').length;
  return <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.heading}>{tr("m1025")}</h2>
        <p className={styles.desc}>{tr("m1026")}</p>
      </div>

      {/* Service Title */}
      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="serviceTitleInput">{tr("m1027")}<span className={styles.required}>*</span>
          </label>
          <span className={`${styles.charCounter} ${titleLength > 85 ? styles.warning : ''}`}>
            {titleLength}{tr("m1552")}</span>
        </div>
        <input type="text" id="serviceTitleInput" className={`${styles.input} ${errors.title ? styles.error : ''}`} placeholder={tr("m1553")} value={formData.title || ''} onChange={handleTitleChange} maxLength={100} />
        {errors.title && <p className={styles.errorText}>{errors.title}</p>}
        <div className={styles.tipBox}>
          <Info size={16} />
          <span>{tr("m1029")}</span>
        </div>
      </div>

      {/* Category */}
      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="categorySelect">{tr("m1030")}<span className={styles.required}>*</span>
          </label>
        </div>
        <select id="categorySelect" className={styles.select} value={formData.categoryId || ''} onChange={handleCategoryChange}>
          <option value="" disabled>
            {categoriesStatus === 'loading' ? tr("m103") : categories.length === 0 ? tr("m1554") : tr("m1555")}
          </option>
          {categories.map(c => <option key={c.categoryId} value={c.categoryId}>
              {c.name}
            </option>)}
        </select>
        {errors.categoryId && <p className={styles.errorText}>{errors.categoryId}</p>}
      </div>

      {/* Execution Type Cards */}
      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label}>{tr("m1032")}<span className={styles.required}>*</span>
          </label>
        </div>
        <div className={styles.execGrid}>
          {/* DIGITAL */}
          <label className={`${styles.execCard} ${formData.executionType === 'DIGITAL' ? styles.selected : ''}`} onClick={() => handleExecTypeChange('DIGITAL')}>
            <input type="radio" name="execTypeRadio" checked={formData.executionType === 'DIGITAL'} onChange={() => handleExecTypeChange('DIGITAL')} />
            <div className={styles.execHeader}>
              <div className={`${styles.execIcon} ${styles.execDigital}`}>
                <Laptop size={18} />
              </div>
              <span className={styles.execTitle}>{tr("m1033")}</span>
            </div>
            <p className={styles.execDesc}>{tr("m1034")}</p>
          </label>

          {/* ONSITE */}
          <label className={`${styles.execCard} ${formData.executionType === 'ONSITE' ? styles.selected : ''}`} onClick={() => handleExecTypeChange('ONSITE')}>
            <input type="radio" name="execTypeRadio" checked={formData.executionType === 'ONSITE'} onChange={() => handleExecTypeChange('ONSITE')} />
            <div className={styles.execHeader}>
              <div className={`${styles.execIcon} ${styles.execOnsite}`}>
                <MapPin size={18} />
              </div>
              <span className={styles.execTitle}>{tr("m984")}</span>
            </div>
            <p className={styles.execDesc}>{tr("m1035")}</p>
          </label>
        </div>
      </div>

      {/* Description */}
      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="descriptionTextarea">{tr("m1036")}<span className={styles.required}>*</span>
          </label>
        </div>
        <textarea id="descriptionTextarea" rows={6} className={`${styles.textarea} ${errors.description ? styles.error : ''}`} placeholder={tr("m1556")} value={formData.description || ''} onChange={e => onChange('description', e.target.value)} />
        {errors.description && <p className={styles.errorText}>{errors.description}</p>}
      </div>

      {/* Search Tags */}
      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label}>{tr("m1037")}</label>
          <span className={styles.charCounter}>{tr("m1038")}</span>
        </div>
        <div className={styles.tagsContainer}>
          {(formData.tags || []).map((tag, idx) => <span key={idx} className={styles.tagChip}>
              #{tag}
              <button type="button" className={styles.tagRemove} onClick={() => handleRemoveTag(idx)} aria-label={tr("m1458", {
            p0: tag
          })}>
                <X size={14} />
              </button>
            </span>)}
          <input type="text" className={styles.tagInput} placeholder={tr("m1557")} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} />
        </div>
      </div>
    </div>;
}