"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BadgeCheck, FileCheck, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { providerApi, verificationApi, toProvider, useAuthToken } from "../../webapp-bridge/backend";
import styles from "./ProviderOnboardingPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

type Provider = ReturnType<typeof toProvider>;
type LoadState = "loading" | "needs-login" | "none" | "has-profile" | "error";

type VerificationRecord = {
  providerVerificationId?: string;
  id?: string;
  verificationType?: string;
  documentType?: string;
  verificationStatus?: string;
  status?: string;
  submittedAt?: string;
  verifiedAt?: string;
  createdAt?: string;
};

// Keys of the "misc" dictionary, translated with tr() at render.
const STATUS_TEXT: Record<string, string> = {
  PENDING: "m1686",
  VERIFIED: "m1687",
  REJECTED: "m1688",
  SUSPENDED: "m1689"
};

export default function ProviderOnboardingPage({
  onNavigate,
  onShowToast
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [result, setResult] = useState<{
    token: string;
    state: LoadState;
    provider: Provider | null;
  } | null>(null);

  const state: LoadState = !token ? "needs-login" : result?.token === token ? result.state : "loading";
  const provider = result?.token === token ? result.provider : null;

  // Onboarding profile inputs
  const [providerType, setProviderType] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [agreed, setAgreed] = useState(false);

  // KYC CCCD inputs
  const [documentType, setDocumentType] = useState<"CCCD" | "PASSPORT">("CCCD");
  const [cccdNumber, setCccdNumber] = useState("");
  const [frontImage, setFrontImage] = useState("");
  const [backImage, setBackImage] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  // Verifications list from verificationApi
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [verifSubmitting, setVerifSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    businessName?: string;
    bio?: string;
    agreed?: string;
    cccdNumber?: string;
    form?: string;
  }>({});

  const loadVerifications = async () => {
    try {
      const res = (await verificationApi.getMy(0, 20)) as {
        result?: { data?: VerificationRecord[] } | VerificationRecord[];
      };
      const list = (res?.result && "data" in res.result ? res.result.data : res?.result) || [];
      setVerifications(Array.isArray(list) ? list : []);
    } catch {
      setVerifications([]);
    }
  };

  // An existing profile (any status) replaces the form with its status and loads verifications.
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    providerApi.getMyProfile().then((res: { result?: unknown }) => {
      if (cancelled) return;
      if (res?.result) {
        setResult({
          token,
          state: "has-profile",
          provider: toProvider(res.result)
        });
        loadVerifications();
      } else {
        setResult({
          token,
          state: "none",
          provider: null
        });
      }
    }).catch((err: { status?: number }) => {
      if (cancelled) return;
      // 404 / 400 = PROVIDER_PROFILE_NOT_EXISTED → show the form.
      const next: LoadState = err?.status === 401 ? "needs-login" : err?.status === 404 || err?.status === 400 ? "none" : "error";
      setResult({
        token,
        state: next,
        provider: null
      });
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onShowToast("Dung lượng ảnh giấy tờ tối đa là 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (isFront) setFrontImage(reader.result);
        else setBackImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const cleanBusiness = sanitizeText(businessName);
    const cleanBio = sanitizeText(bio);
    const cleanCccd = sanitizeText(cccdNumber);

    const next: typeof errors = {};
    if (cleanBusiness.length < 5 || cleanBusiness.length > 100) {
      next.businessName = tr("m1348");
    }
    if (cleanBio.length < 20) {
      next.bio = tr("m1349");
    }
    if (cleanCccd && !/^\d{9,12}$/.test(cleanCccd)) {
      next.cccdNumber = "Số CCCD phải gồm 9 đến 12 chữ số!";
    }
    if (!agreed) {
      next.agreed = tr("m1350");
    }
    setErrors(next);
    if (next.businessName ?? next.bio ?? next.agreed ?? next.cccdNumber) return;

    setSubmitting(true);
    try {
      const res = await providerApi.createProfile({
        providerType,
        businessName: cleanBusiness,
        bio: cleanBio
      });

      // Submit KYC CCCD verification if provided
      if (cleanCccd || frontImage || documentUrl) {
        try {
          const docTypeStr = cleanCccd ? `${documentType}: ${cleanCccd}` : documentType;
          await verificationApi.submit({
            verificationType: "IDENTITY_CARD",
            documentType: docTypeStr
          });
        } catch {
          // Profile created; verification can be submitted directly next
        }
      }

      setResult({
        token,
        state: "has-profile",
        provider: res?.result ? toProvider(res.result) : null
      });
      await loadVerifications();
      onShowToast(tr("m1351"));
    } catch (err) {
      setErrors({
        form: tr("m1464", {
          p0: (err as Error)?.message || tr("m1303")
        })
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit KYC CCCD standalone verification for existing profile
  const submitKycVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCccd = sanitizeText(cccdNumber);
    if (!cleanCccd || !/^\d{9,12}$/.test(cleanCccd)) {
      setErrors({ cccdNumber: "Vui lòng nhập số CCCD hợp lệ (9 đến 12 chữ số)!" });
      return;
    }
    setErrors({});
    setVerifSubmitting(true);
    try {
      const docTypeStr = `${documentType}: ${cleanCccd}`;
      await verificationApi.submit({
        verificationType: "IDENTITY_CARD",
        documentType: docTypeStr
      });
      setCccdNumber("");
      setFrontImage("");
      setBackImage("");
      setDocumentUrl("");
      await loadVerifications();
      onShowToast("Đã gửi hồ sơ xác minh CCCD thành công!");
    } catch (err) {
      onShowToast((err as Error)?.message || "Không thể gửi hồ sơ xác minh CCCD");
    } finally {
      setVerifSubmitting(false);
    }
  };

  // Withdraw / Remove pending verification
  const handleWithdrawVerification = async (id: string) => {
    setActionLoadingId(id);
    try {
      await verificationApi.remove(id);
      setVerifications(prev => prev.filter(v => (v.providerVerificationId || v.id) !== id));
      await loadVerifications();
      onShowToast("Đã rút hồ sơ xác minh.");
    } catch (err) {
      onShowToast((err as Error)?.message || "Không thể rút hồ sơ xác minh.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const hasPendingVerification = verifications.some(
    v => (v.verificationStatus || v.status) === "PENDING"
  );
  const isVerifiedProvider = provider?.verificationStatus === "VERIFIED" || verifications.some(
    v => (v.verificationStatus || v.status) === "VERIFIED"
  );

  if (state !== "none") {
    return (
      <main className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            <BadgeCheck size={24} className={styles.titleIcon} aria-hidden="true" />
            {tr("m1357")}
          </h1>
          {state === "loading" ? <p className={styles.sub}>{tr("m1358")}</p> : null}
          {state === "needs-login" ? (
            <>
              <p className={styles.sub}>{tr("m1359")}</p>
              <button type="button" className={styles.submit} onClick={() => onNavigate("login")}>
                {tr("m32")}
              </button>
            </>
          ) : null}
          {state === "error" ? (
            <p className={styles.error} role="alert">
              {tr("m1360")}
            </p>
          ) : null}

          {state === "has-profile" ? (
            <>
              <p className={styles.sub}>
                {tr("m47")}
                <strong>{provider?.name}</strong>
                {tr("m1361")}
                <strong>{provider?.verificationStatus ?? "PENDING"}</strong>
              </p>
              <p className={styles.sub}>
                {tr(STATUS_TEXT[provider?.verificationStatus ?? "PENDING"] ?? STATUS_TEXT.PENDING)}
              </p>

              {/* KYC CCCD Section */}
              <div className={styles.kycSection}>
                <div className={styles.kycTitle}>
                  <FileCheck size={20} color="var(--wg-primary)" />
                  <span>Xác minh danh tính chuyên gia (KYC CCCD)</span>
                </div>

                {hasPendingVerification && (
                  <div style={{ padding: "10px", background: "#fef3c7", borderRadius: "8px", color: "#92400e", fontSize: "0.88rem" }}>
                    ⚠️ Hồ sơ xác minh CCCD của bạn đang trong hàng đợi phê duyệt bởi Quản trị viên.
                  </div>
                )}

                {isVerifiedProvider && (
                  <div style={{ padding: "10px", background: "#dcfce7", borderRadius: "8px", color: "#166534", fontSize: "0.88rem" }}>
                    ✓ Tài khoản Chuyên gia đã được xác thực CCCD thành công!
                  </div>
                )}

                {/* Danh sách hồ sơ đã gửi */}
                {verifications.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--wg-text)" }}>
                      Lịch sử gửi giấy tờ xác minh:
                    </span>
                    {verifications.map((v) => {
                      const id = v.providerVerificationId || v.id || "";
                      const vStatus = v.verificationStatus || v.status || "PENDING";
                      const dateStr = v.submittedAt || v.createdAt;
                      return (
                        <div key={id} className={styles.verifCard}>
                          <div className={styles.verifHeader}>
                            <strong>{v.documentType || "Căn cước công dân (CCCD)"}</strong>
                            <span
                              className={
                                vStatus === "VERIFIED"
                                  ? styles.statusVerified
                                  : vStatus === "REJECTED"
                                  ? styles.statusRejected
                                  : styles.statusPending
                              }
                            >
                              {vStatus === "VERIFIED" ? "ĐÃ DUYỆT" : vStatus === "REJECTED" ? "BỊ TỪ CHỐI" : "CHỜ DUYỆT"}
                            </span>
                          </div>
                          {dateStr && (
                            <span style={{ fontSize: "0.78rem", color: "var(--wg-text-secondary)" }}>
                              Ngày gửi: {new Date(dateStr).toLocaleString("vi-VN")}
                            </span>
                          )}
                          {vStatus === "PENDING" && (
                            <button
                              type="button"
                              className={styles.withdrawBtn}
                              disabled={actionLoadingId === id}
                              onClick={() => handleWithdrawVerification(id)}
                            >
                              {actionLoadingId === id ? "Đang rút..." : "Rút hồ sơ để nộp lại"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Form nộp CCCD nếu chưa có hồ sơ PENDING hoặc bị từ chối */}
                {!hasPendingVerification && !isVerifiedProvider && (
                  <form onSubmit={submitKycVerification} className={styles.form} style={{ marginTop: "8px" }}>
                    <label className={styles.field}>
                      <span>Loại giấy tờ</span>
                      <select value={documentType} onChange={(e) => setDocumentType(e.target.value as "CCCD" | "PASSPORT")}>
                        <option value="CCCD">Căn cước công dân gắn chip (CCCD)</option>
                        <option value="PASSPORT">Hộ chiếu (Passport)</option>
                      </select>
                    </label>

                    <label className={styles.field}>
                      <span>Số CCCD / Hộ chiếu *</span>
                      <input
                        type="text"
                        placeholder="Nhập 12 chữ số trên thẻ CCCD"
                        value={cccdNumber}
                        onChange={(e) => setCccdNumber(e.target.value)}
                        aria-invalid={errors.cccdNumber ? true : undefined}
                      />
                      {errors.cccdNumber ? <em className={styles.error}>{errors.cccdNumber}</em> : null}
                    </label>

                    <div className={styles.uploadGrid}>
                      <div className={styles.uploadBox}>
                        <span>Ảnh CCCD Mặt trước</span>
                        {frontImage ? (
                          <div className={styles.previewContainer}>
                            <Image src={frontImage} alt="Mặt trước CCCD" width={240} height={110} unoptimized className={styles.previewImg} />
                            <button type="button" className={styles.removeImgBtn} onClick={() => setFrontImage("")}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <input type="file" accept="image/*" className={styles.uploadInput} onChange={(e) => handleImageFile(e, true)} />
                        )}
                      </div>

                      <div className={styles.uploadBox}>
                        <span>Ảnh CCCD Mặt sau</span>
                        {backImage ? (
                          <div className={styles.previewContainer}>
                            <Image src={backImage} alt="Mặt sau CCCD" width={240} height={110} unoptimized className={styles.previewImg} />
                            <button type="button" className={styles.removeImgBtn} onClick={() => setBackImage("")}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <input type="file" accept="image/*" className={styles.uploadInput} onChange={(e) => handleImageFile(e, false)} />
                        )}
                      </div>
                    </div>

                    <button type="submit" className={styles.submit} disabled={verifSubmitting}>
                      {verifSubmitting ? "Đang gửi hồ sơ..." : "Nộp hồ sơ xác minh CCCD"}
                    </button>
                  </form>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                <button type="button" className={styles.submit} style={{ flex: 1 }} onClick={() => onNavigate("provider-profile")}>
                  Xem trang hồ sơ Provider
                </button>
                {provider?.verificationStatus === "VERIFIED" ? (
                  <button type="button" className={styles.submit} style={{ flex: 1 }} onClick={() => onNavigate("my-services")}>
                    {tr("m176")}
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <BadgeCheck size={24} className={styles.titleIcon} aria-hidden="true" />
          {tr("m1357")}
        </h1>
        <p className={styles.sub}>{tr("m1566")}</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m272")}</span>
            <select value={providerType} onChange={(e) => setProviderType(e.target.value as "INDIVIDUAL" | "COMPANY")}>
              <option value="INDIVIDUAL">{tr("m226")}</option>
              <option value="COMPANY">{tr("m225")}</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>{tr("m1363")}</span>
            <input
              type="text"
              autoFocus
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={tr("m1353")}
              aria-invalid={errors.businessName ? true : undefined}
            />
            {errors.businessName ? <em className={styles.error}>{errors.businessName}</em> : null}
          </label>
          <label className={styles.field}>
            <span>{tr("m1364")}</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={tr("m1354")}
              rows={4}
              aria-invalid={errors.bio ? true : undefined}
            />
            {errors.bio ? <em className={styles.error}>{errors.bio}</em> : null}
          </label>

          {/* KYC CCCD Upload Section */}
          <div className={styles.kycSection}>
            <div className={styles.kycTitle}>
              <UploadCloud size={20} color="var(--wg-primary)" />
              <span>Xác minh CCCD & Định danh (KYC)</span>
            </div>

            <label className={styles.field}>
              <span>Loại giấy tờ</span>
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value as "CCCD" | "PASSPORT")}>
                <option value="CCCD">Căn cước công dân gắn chip (CCCD)</option>
                <option value="PASSPORT">Hộ chiếu (Passport)</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Số CCCD / Hộ chiếu</span>
              <input
                type="text"
                placeholder="Nhập 12 chữ số CCCD"
                value={cccdNumber}
                onChange={(e) => setCccdNumber(e.target.value)}
                aria-invalid={errors.cccdNumber ? true : undefined}
              />
              {errors.cccdNumber ? <em className={styles.error}>{errors.cccdNumber}</em> : null}
            </label>

            <div className={styles.uploadGrid}>
              <div className={styles.uploadBox}>
                <span>Ảnh mặt trước CCCD</span>
                {frontImage ? (
                  <div className={styles.previewContainer}>
                    <Image src={frontImage} alt="Mặt trước CCCD" width={240} height={110} unoptimized className={styles.previewImg} />
                    <button type="button" className={styles.removeImgBtn} onClick={() => setFrontImage("")}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <input type="file" accept="image/*" className={styles.uploadInput} onChange={(e) => handleImageFile(e, true)} />
                )}
              </div>

              <div className={styles.uploadBox}>
                <span>Ảnh mặt sau CCCD</span>
                {backImage ? (
                  <div className={styles.previewContainer}>
                    <Image src={backImage} alt="Mặt sau CCCD" width={240} height={110} unoptimized className={styles.previewImg} />
                    <button type="button" className={styles.removeImgBtn} onClick={() => setBackImage("")}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <input type="file" accept="image/*" className={styles.uploadInput} onChange={(e) => handleImageFile(e, false)} />
                )}
              </div>
            </div>
          </div>

          <label className={styles.check}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            {tr("m1365")}
          </label>
          {errors.agreed ? <em className={styles.error}>{errors.agreed}</em> : null}
          {errors.form ? (
            <em className={styles.error} role="alert">
              {errors.form}
            </em>
          ) : null}
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? tr("m699") : tr("m635")}
          </button>
        </form>
      </div>
    </main>
  );
}
