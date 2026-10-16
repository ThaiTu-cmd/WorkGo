import React, { useState, useEffect } from 'react';
import { mockProviderServices } from '../../data/mockProviderServices';
import FormStepper from './components/FormStepper/FormStepper';
import Step1Info from './components/Step1Info/Step1Info';
import Step2Pricing from './components/Step2Pricing/Step2Pricing';
import Step3Media from './components/Step3Media/Step3Media';
import { ArrowLeft, Check, Save } from 'lucide-react';
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
    categorySlug: 'lap-trinh-cong-nghe',
    categoryName: 'Lập trình & Công nghệ (Web, Mobile, DevOps)',
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
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    videoUrl: '',
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const existing = mockProviderServices.find((s) => s.serviceId === serviceId);
      if (existing) {
        setFormData({
          title: existing.title || '',
          categorySlug: existing.categorySlug || 'lap-trinh-cong-nghe',
          categoryName: existing.categoryName || 'Lập trình & Công nghệ',
          executionType: existing.executionType || 'DIGITAL',
          description: existing.description || 'Dịch vụ chuyên nghiệp chất lượng cao, cam kết bàn giao đúng tiến độ và bảo chứng Escrow an toàn.',
          tags: ['React', 'CleanCode', 'Responsive'],
          packages: {
            basic: {
              title: 'Gói Starter',
              desc: 'Landing Page 1 trang chuẩn di động',
              days: 3,
              rev: '2 lần',
              price: existing.basePrice || 2500000,
            },
            standard: {
              title: 'Gói Business Pro',
              desc: 'Website đa trang (đến 5 trang) kèm CMS',
              days: 5,
              rev: '5 lần',
              price: (existing.basePrice || 2500000) * 2,
            },
            premium: {
              title: 'Gói Enterprise VIP',
              desc: 'Trọn gói webapp hoàn chỉnh & thanh toán',
              days: 10,
              rev: 'Không giới hạn',
              price: (existing.basePrice || 2500000) * 3,
            },
          },
          coverImage: existing.coverImage || defaultFormData.coverImage,
          videoUrl: '',
        });
      }
    }
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

  const handleSave = (status = 'ACTIVE') => {
    if (!validateStep(1) || !validateStep(currentStep)) {
      if (onShowToast) onShowToast('Vui lòng kiểm tra lại thông tin các bước!');
      return;
    }

    // F1: save sanitized values only (slug from the sanitized title).
    const cleanTitle = sanitizeText(formData.title);
    const cleanDescription = sanitizeText(formData.description);
    const savedService = {
      serviceId: isEdit ? serviceId : `svc-${Date.now()}`,
      title: cleanTitle,
      slug: cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      categorySlug: formData.categorySlug,
      categoryName: formData.categoryName,
      executionType: formData.executionType,
      coverImage: formData.coverImage,
      status: status,
      basePrice: clampPrice(formData.packages.basic.price),
      priceRange: `${new Intl.NumberFormat('vi-VN').format(clampPrice(formData.packages.basic.price))} ₫ – ${new Intl.NumberFormat('vi-VN').format(clampPrice(formData.packages.premium.price))} ₫`,
      packagesCount: 3,
      impressions: isEdit ? 4820 : 1,
      ordersCount: isEdit ? 42 : 0,
      avgRating: isEdit ? 4.98 : 0,
      reviewCount: isEdit ? 38 : 0,
      description: cleanDescription,
      createdAt: isEdit ? '2026-02-15' : new Date().toISOString(),
    };

    if (onSaveSuccess) {
      onSaveSuccess(savedService, isEdit);
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
            <button
              type="button"
              className={styles.btnSaveDraft}
              onClick={() => handleSave('DRAFT')}
            >
              <Save size={16} /> Lưu bản nháp
            </button>

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
                onClick={() => handleSave('ACTIVE')}
              >
                <Check size={18} strokeWidth={2.5} />
                {isEdit ? 'Cập nhật thay đổi' : 'Đăng dịch vụ ngay'}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

