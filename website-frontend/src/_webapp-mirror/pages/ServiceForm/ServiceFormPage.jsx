import React, { useState, useEffect } from 'react';
import { catalogApi } from '../../api/catalogApi';
import { NOT_PROVIDER_MESSAGE } from '../../api/axiosClient';
import { pageItems, toMediaList, toPackages } from '../../api/adapters';

const TIER_KEYS = { BASIC: 'basic', STANDARD: 'standard', PREMIUM: 'premium' };

// '3 lần' → 3; 'Không giới hạn' → null (unlimited).
const parseRevisions = (rev) => {
  const n = parseInt(String(rev ?? ''), 10);
  return Number.isFinite(n) ? n : null;
};

const toSlug = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
import FormStepper from './components/FormStepper/FormStepper';
import Step1Info from './components/Step1Info/Step1Info';
import Step2Pricing from './components/Step2Pricing/Step2Pricing';
import Step3Media from './components/Step3Media/Step3Media';
import { ArrowLeft, Check, FilePlus2, PencilLine, Save } from 'lucide-react';
import styles from './ServiceFormPage.module.css';
import {
  validateTitle,
  validateDescription,
  validatePrice,
  sanitizeText,
  clampPrice,
} from './formValidation';

export default function ServiceFormPage({
  mode = 'create',
  serviceId = null,
  onCancel,
  onSaveSuccess,
  onShowToast,
}) {
  const isEdit = mode === 'edit' && serviceId;

  const defaultFormData = {
    title: '',
    categoryId: '',
    categorySlug: '',
    categoryName: '',
    executionType: 'DIGITAL',
    description: '',
    tags: ['React', 'NextJS', 'Website'],
    packages: {
      basic: {
        title: 'Gói Starter',
        desc: 'Landing Page 1 trang chuẩn di động',
        days: 3,
        rev: '2 lần',
        price: 2500000,
      },
      standard: {
        title: 'Gói Business Pro',
        desc: 'Website đa trang (đến 5 trang) kèm CMS',
        days: 5,
        rev: '5 lần',
        price: 5000000,
      },
      premium: {
        title: 'Gói Enterprise VIP',
        desc: 'Trọn gói webapp hoàn chỉnh & thanh toán',
        days: 10,
        rev: 'Không giới hạn',
        price: 8500000,
      },
    },
    coverImage: '',
    videoUrl: '',
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const [saving, setSaving] = useState(false);
  // PackageResponse ids by tier, so an edit updates the existing packages.
  const [packageIds, setPackageIds] = useState({});
  // catalog ServiceStatus of the service being edited (kept on save).
  const [existingStatus, setExistingStatus] = useState(null);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [serviceRes, packagesRes, mediasRes] = await Promise.all([
          catalogApi.getService(serviceId),
          catalogApi.getPackages(serviceId).catch(() => null),
          catalogApi.getMedias(serviceId).catch(() => null),
        ]);
        const existing = serviceRes?.result;
        if (cancelled || !existing) return;
        const pkgs = toPackages(pageItems(packagesRes));
        const byTier = Object.fromEntries(pkgs.map((p) => [TIER_KEYS[p.tier], p]));
        const cover = toMediaList(pageItems(mediasRes))[0]?.url;
        const fromPkg = (key) => {
          const p = byTier[key];
          if (!p) return defaultFormData.packages[key];
          return {
            title: p.name,
            desc: p.description,
            days: p.deliveryDays ?? defaultFormData.packages[key].days,
            rev: p.revisionLimit ? `${p.revisionLimit} lần` : 'Không giới hạn',
            price: p.price,
          };
        };
        setPackageIds(Object.fromEntries(Object.entries(byTier).map(([k, p]) => [k, p.id])));
        setExistingStatus(existing.status || null);
        setFormData({
          ...defaultFormData,
          title: existing.title || '',
          categoryId: existing.categoryId || '',
          executionType: existing.executionType || 'DIGITAL',
          description: existing.description || '',
          packages: { basic: fromPkg('basic'), standard: fromPkg('standard'), premium: fromPkg('premium') },
          coverImage: cover || '',
        });
      } catch (err) {
        if (!cancelled && onShowToast) onShowToast(`Không tải được dịch vụ: ${err?.message || 'lỗi kết nối'}`);
      }
    })();
    return () => {
      cancelled = true;
    };
    // defaultFormData is rebuilt every render; only the target service matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, serviceId]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // F1: boundary checks via pure helpers (sanitize-then-measure, per-field VI messages).
  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      const titleErr = validateTitle(formData.title);
      if (titleErr) errs.title = titleErr;
      const descErr = validateDescription(formData.description);
      if (descErr) errs.description = descErr;
      if (!formData.categoryId) errs.categoryId = 'Vui lòng chọn danh mục!';
    }
    if (step === 2) {
      const priceErr = validatePrice(formData.packages?.basic?.price);
      if (priceErr) errs.price = priceErr;
    }
    if (step === 3) {
      if (!formData.coverImage || !formData.coverImage.trim()) {
        errs.coverImage = 'Vui lòng cung cấp URL ảnh bìa chính!';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (onShowToast) onShowToast('Vui lòng hoàn thiện các trường bắt buộc!');
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // targetStatus: 'DRAFT' | 'PUBLISHED' when creating; on edit the current status
  // is kept. New services are always created as DRAFT, so publishing is a
  // follow-up status update. Only PUBLISHED services can be ordered.
  const handleSave = async (targetStatus = 'PUBLISHED') => {
    if (saving) return;
    if (!validateStep(1) || !validateStep(currentStep)) {
      if (onShowToast) onShowToast('Vui lòng kiểm tra lại thông tin các bước!');
      return;
    }

    // F1: save sanitized values only (slug from the sanitized title).
    const cleanTitle = sanitizeText(formData.title);
    const cleanDescription = sanitizeText(formData.description);
    const serviceBody = {
      categoryId: formData.categoryId,
      executionType: formData.executionType,
      title: cleanTitle,
      slug: toSlug(cleanTitle),
      description: cleanDescription,
      currency: 'VND',
      basePrice: clampPrice(formData.packages.basic.price),
    };

    setSaving(true);
    try {
      let id = serviceId;
      if (isEdit) {
        // The update mapper writes nulls too: always send the status back.
        await catalogApi.updateService(serviceId, { ...serviceBody, status: existingStatus || 'DRAFT' });
      } else {
        const res = await catalogApi.createService(serviceBody);
        id = res?.result?.serviceId;
        if (!id) throw new Error('Máy chủ không trả về mã dịch vụ');
      }

      for (const key of ['basic', 'standard', 'premium']) {
        const p = formData.packages[key];
        const body = {
          name: sanitizeText(p.title),
          description: sanitizeText(p.desc),
          price: clampPrice(p.price),
          currency: 'VND',
          deliveryDay: Number(p.days) || null,
          revisionLimit: parseRevisions(p.rev),
        };
        if (packageIds[key]) await catalogApi.updatePackage(packageIds[key], body);
        else await catalogApi.createPackage(id, body);
      }

      if (!isEdit && formData.coverImage?.trim()) {
        await catalogApi.createMedia(id, { url: formData.coverImage.trim(), mediaType: 'IMAGE', cover: true });
      }

      if (!isEdit && targetStatus === 'PUBLISHED') {
        await catalogApi.setServiceStatus(id, 'PUBLISHED');
      }

      if (onSaveSuccess) onSaveSuccess({ serviceId: id, title: cleanTitle }, isEdit);
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err?.status === 403
            ? NOT_PROVIDER_MESSAGE
            : `Không lưu được dịch vụ: ${err?.message || 'lỗi kết nối máy chủ'}`
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top Header Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarContainer}>
          <div className={styles.topBarLeft}>
            <button type="button" className={styles.backBtn} onClick={onCancel} title="Quay lại">
              <ArrowLeft size={16} /> Quay lại
            </button>
            <h1 className={styles.topBarTitle}>
              {isEdit
                ? <PencilLine size={20} className={styles.titleIcon} aria-hidden="true" />
                : <FilePlus2 size={20} className={styles.titleIcon} aria-hidden="true" />}
              {isEdit ? 'Chỉnh sửa Dịch vụ' : 'Tạo Dịch vụ Mới'}
            </h1>
          </div>
          <div className={styles.modeBadge}>
            {isEdit ? `Mã: ${serviceId}` : 'Biểu mẫu chuẩn 3 bước'}
          </div>
        </div>
      </div>

      {/* Stepper Indicator */}
      <FormStepper
        currentStep={currentStep}
        onSelectStep={(s) => {
          if (s < currentStep || validateStep(currentStep)) {
            setCurrentStep(s);
          }
        }}
      />

      {/* Main Step Panels */}
      <main className={styles.contentContainer}>
        {currentStep === 1 && (
          <Step1Info
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}

        {currentStep === 2 && (
          <Step2Pricing
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}

        {currentStep === 3 && (
          <Step3Media
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className={styles.stickyBottomBar}>
        <div className={styles.actionBarContainer}>
          <div>
            <button
              type="button"
              className={styles.btnPrev}
              onClick={handlePrev}
              disabled={currentStep === 1}
            >
              ← Quay lại
            </button>
          </div>

          <div className={styles.actionRight}>
            {!isEdit && (
              <button
                type="button"
                className={styles.btnSaveDraft}
                onClick={() => handleSave('DRAFT')}
                disabled={saving}
              >
                <Save size={16} /> Lưu bản nháp
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                className={styles.btnNext}
                onClick={handleNext}
              >
                Tiếp tục bước kế tiếp →
              </button>
            ) : (
              <button
                type="button"
                className={styles.btnPublish}
                onClick={() => handleSave('PUBLISHED')}
                disabled={saving}
              >
                <Check size={18} strokeWidth={2.5} />
                {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật thay đổi' : 'Đăng dịch vụ ngay'}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

