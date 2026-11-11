import { useTranslations } from "next-intl";
import React, { useState, useEffect } from 'react';
import { catalogApi } from '../../api/catalogApi';
import { NOT_PROVIDER_MESSAGE } from '../../api/axiosClient';
import { pageItems, toPackages } from '../../api/adapters';
import { addonsToForm, applyMediaOp, attachGalleryIds, defaultPackages, mediasToForm, planAddonChanges, planMediaChanges, toAddonBody, toPackageBody } from './serviceFormSync';
const TIER_KEYS = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium'
};
const toSlug = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
import FormStepper from './components/FormStepper/FormStepper';
import Step1Info from './components/Step1Info/Step1Info';
import Step2Pricing from './components/Step2Pricing/Step2Pricing';
import Step3Media from './components/Step3Media/Step3Media';
import { ArrowLeft, Check, FilePlus2, PencilLine, Save } from 'lucide-react';
import styles from './ServiceFormPage.module.css';
import { validateTitle, validateDescription, validatePackagePrices, validateAddons, sanitizeText, clampPrice, isHttpUrl } from './formValidation';
export default function ServiceFormPage({
  mode = 'create',
  serviceId = null,
  onCancel,
  onSaveSuccess,
  onShowToast
}) {
  const tr = useTranslations("misc");
  const isEdit = mode === 'edit' && serviceId;
  const defaultFormData = {
    title: '',
    categoryId: '',
    categorySlug: '',
    categoryName: '',
    executionType: 'DIGITAL',
    description: '',
    tags: [],
    packages: defaultPackages(tr),
    // Add-ons: { id (server addOnId, absent until saved), name, desc, price }.
    addons: [],
    coverImage: '',
    // Extra images: { id (server serviceMediaId, absent until saved), url }.
    gallery: [],
    videoUrl: ''
  };
  const [formData, setFormData] = useState(defaultFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  // PackageResponse ids by tier, so an edit updates the existing packages.
  const [packageIds, setPackageIds] = useState({});
  // catalog ServiceStatus of the service being edited (kept on save).
  const [existingStatus, setExistingStatus] = useState(null);
  // What the server had when editing started, so a save can create/update/delete
  // only the add-ons and media that changed.
  const [originalAddonIds, setOriginalAddonIds] = useState([]);
  const [originalMedia, setOriginalMedia] = useState(null);
  // Create mode: id of the service a save already created. If a later step of
  // that save failed, the next save continues on this service instead of
  // creating a second one.
  const [createdServiceId, setCreatedServiceId] = useState(null);
  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [serviceRes, packagesRes, mediasRes, addonsRes] = await Promise.all([catalogApi.getService(serviceId), catalogApi.getPackages(serviceId).catch(() => null), catalogApi.getMedias(serviceId, 0, 50).catch(() => null), catalogApi.getAddons(serviceId, 0, 50).catch(() => null)]);
        const existing = serviceRes?.result;
        if (cancelled || !existing) return;
        const pkgs = toPackages(pageItems(packagesRes));
        const byTier = Object.fromEntries(pkgs.map(p => [TIER_KEYS[p.tier], p]));
        const media = mediasToForm(pageItems(mediasRes));
        const addons = addonsToForm(pageItems(addonsRes));
        const fromPkg = key => {
          const p = byTier[key];
          if (!p) return defaultFormData.packages[key];
          return {
            title: p.name,
            desc: p.description,
            days: p.deliveryDays || defaultFormData.packages[key].days,
            minutes: p.durationMinute || defaultFormData.packages[key].minutes,
            rev: p.revisionLimit ? `${p.revisionLimit} lần` : tr("m1045"),
            price: p.price
          };
        };
        setPackageIds(Object.fromEntries(Object.entries(byTier).map(([k, p]) => [k, p.id])));
        setExistingStatus(existing.status || null);
        setOriginalAddonIds(addons.map(a => a.id));
        setOriginalMedia(media);
        setFormData({
          ...defaultFormData,
          title: existing.title || '',
          categoryId: existing.categoryId || '',
          executionType: existing.executionType || 'DIGITAL',
          description: existing.description || '',
          packages: {
            basic: fromPkg('basic'),
            standard: fromPkg('standard'),
            premium: fromPkg('premium')
          },
          addons,
          coverImage: media.cover?.url || '',
          gallery: media.gallery,
          videoUrl: media.video?.url || ''
        });
      } catch (err) {
        if (!cancelled && onShowToast) onShowToast(tr("m1117", {
          p0: err?.message || tr("m1558")
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // defaultFormData is rebuilt every render; only the target service matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, serviceId]);
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // F1: boundary checks via pure helpers (sanitize-then-measure, per-field VI messages).
  const validateStep = step => {
    const errs = {};
    if (step === 1) {
      const titleErr = validateTitle(formData.title);
      if (titleErr) errs.title = titleErr;
      const descErr = validateDescription(formData.description);
      if (descErr) errs.description = descErr;
      if (!formData.categoryId) errs.categoryId = tr("m1118");
    }
    if (step === 2) {
      const priceErr = validatePackagePrices(formData.packages);
      if (priceErr) errs.price = priceErr;
      const addonErr = validateAddons(formData.addons);
      if (addonErr) errs.addons = addonErr;
    }
    if (step === 3) {
      if (!formData.coverImage || !formData.coverImage.trim()) {
        errs.coverImage = tr("m1119");
      } else if (!isHttpUrl(formData.coverImage)) {
        errs.coverImage = tr("m1120");
      }
      if (formData.videoUrl?.trim() && !isHttpUrl(formData.videoUrl)) {
        errs.videoUrl = tr("m1121");
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      if (onShowToast) onShowToast(tr("m1122"));
    }
  };
  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // targetStatus: 'DRAFT' | 'PUBLISHED' when creating; on edit the current status
  // is kept. New services are always created as DRAFT, so publishing is a
  // follow-up status update. Only PUBLISHED services can be ordered.
  const handleSave = async (targetStatus = 'PUBLISHED') => {
    if (saving) return;
    if (!validateStep(1) || !validateStep(currentStep)) {
      if (onShowToast) onShowToast(tr("m1123"));
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
      basePrice: clampPrice(formData.packages.basic.price)
    };
    setSaving(true);

    // What the server holds as this save advances. On failure it is written
    // back to state, so the next save updates what was already created instead
    // of creating the service, packages, add-ons or media a second time.
    let id = isEdit ? serviceId : createdServiceId;
    const pkgIds = {
      ...packageIds
    };
    let addons = formData.addons;
    let addonIdsOnServer = id ? originalAddonIds : [];
    let media = id ? originalMedia : null;
    try {
      if (id) {
        // The update mapper writes nulls too: always send the status back
        // (a service created by an earlier, failed save is still DRAFT).
        await catalogApi.updateService(id, {
          ...serviceBody,
          status: existingStatus || 'DRAFT'
        });
      } else {
        const res = await catalogApi.createService(serviceBody);
        id = res?.result?.serviceId;
        if (!id) throw new Error(tr("m1124"));
        setCreatedServiceId(id);
      }
      for (const key of ['basic', 'standard', 'premium']) {
        const body = toPackageBody(formData.packages[key], formData.executionType, key);
        if (pkgIds[key]) {
          await catalogApi.updatePackage(pkgIds[key], body);
        } else {
          const res = await catalogApi.createPackage(id, body);
          pkgIds[key] = res?.result?.packageId;
        }
      }
      const removedAddonIds = planAddonChanges(addonIdsOnServer, addons).remove;
      for (const [i, row] of addons.entries()) {
        if (row.id) {
          await catalogApi.updateAddon(row.id, toAddonBody(row));
        } else {
          const res = await catalogApi.createAddon(id, toAddonBody(row));
          const newId = res?.result?.addOnId;
          if (newId) {
            addons = addons.map((a, j) => j === i ? {
              ...a,
              id: newId
            } : a);
            addonIdsOnServer = [...addonIdsOnServer, newId];
          }
        }
      }
      for (const addonId of removedAddonIds) {
        await catalogApi.deleteAddon(addonId);
        addonIdsOnServer = addonIdsOnServer.filter(x => x !== addonId);
      }
      for (const step of planMediaChanges(media, formData)) {
        let newId = null;
        if (step.op === 'create') newId = (await catalogApi.createMedia(id, step.body))?.result?.serviceMediaId ?? null;else if (step.op === 'update') await catalogApi.updateMedia(step.id, step.body);else await catalogApi.deleteMedia(step.id);
        media = applyMediaOp(media, step, newId);
      }
      if (!isEdit && targetStatus === 'PUBLISHED') {
        await catalogApi.setServiceStatus(id, 'PUBLISHED');
      }
      if (onSaveSuccess) onSaveSuccess({
        serviceId: id,
        title: cleanTitle
      }, isEdit);
    } catch (err) {
      if (id) {
        setPackageIds(pkgIds);
        setOriginalAddonIds(addonIdsOnServer);
        setOriginalMedia(media);
        // Only add the new server ids: keep whatever was typed while saving.
        setFormData(prev => ({
          ...prev,
          addons: prev.addons.map((a, i) => a.id || !addons[i]?.id ? a : {
            ...a,
            id: addons[i].id
          }),
          gallery: attachGalleryIds(prev.gallery, media)
        }));
      }
      if (onShowToast) {
        if (err?.status === 403) onShowToast(NOT_PROVIDER_MESSAGE);else {
          onShowToast(tr("m1459", {
            p0: err?.message || tr("m1303")
          }));
          if (!isEdit && id) onShowToast(tr("m1570"));
        }
      }
    } finally {
      setSaving(false);
    }
  };
  return <div className={styles.pageContainer}>
      {/* Top Header Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarContainer}>
          <div className={styles.topBarLeft}>
            <button type="button" className={styles.backBtn} onClick={onCancel} title={tr("m465")}>
              <ArrowLeft size={16} />{tr("m465")}</button>
            <h1 className={styles.topBarTitle}>
              {isEdit ? <PencilLine size={20} className={styles.titleIcon} aria-hidden="true" /> : <FilePlus2 size={20} className={styles.titleIcon} aria-hidden="true" />}
              {isEdit ? tr("m1126") : tr("m1127")}
            </h1>
          </div>
          <div className={styles.modeBadge}>
            {isEdit ? tr("m1128", {
            p0: serviceId
          }) : tr("m1129")}
          </div>
        </div>
      </div>

      {/* Stepper Indicator */}
      <FormStepper currentStep={currentStep} onSelectStep={s => {
      if (s < currentStep || validateStep(currentStep)) {
        setCurrentStep(s);
      }
    }} />

      {/* Main Step Panels */}
      <main className={styles.contentContainer}>
        {currentStep === 1 && <Step1Info formData={formData} onChange={handleFieldChange} errors={errors} />}

        {currentStep === 2 && <Step2Pricing formData={formData} onChange={handleFieldChange} errors={errors} />}

        {currentStep === 3 && <Step3Media formData={formData} onChange={handleFieldChange} errors={errors} />}
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className={styles.stickyBottomBar}>
        <div className={styles.actionBarContainer}>
          <div>
            <button type="button" className={styles.btnPrev} onClick={handlePrev} disabled={currentStep === 1}>{tr("m1136")}</button>
          </div>

          <div className={styles.actionRight}>
            {!isEdit && <button type="button" className={styles.btnSaveDraft} onClick={() => handleSave('DRAFT')} disabled={saving}>
                <Save size={16} />{tr("m1137")}</button>}

            {currentStep < 3 ? <button type="button" className={styles.btnNext} onClick={handleNext}>{tr("m1138")}</button> : <button type="button" className={styles.btnPublish} onClick={() => handleSave('PUBLISHED')} disabled={saving}>
                <Check size={18} strokeWidth={2.5} />
                {saving ? tr("m1130") : isEdit ? tr("m1131") : tr("m1132")}
              </button>}
          </div>
        </div>
      </footer>
    </div>;
}