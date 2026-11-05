import React, { useState, useEffect } from 'react';
import { useServiceDetail } from '../../hooks/useServiceDetail';
import { isOrderable, NOT_ORDERABLE_MESSAGE } from '../../api/orderApi';
import { availabilityApi } from '../../api/availabilityApi';
import MediaGallery from './components/MediaGallery';
import PackageSidebar from './components/PackageSidebar';
import PackageComparisonTable from './components/PackageComparisonTable';
import ProviderCard from './components/ProviderCard';
import FaqAccordion from './components/FaqAccordion';
import ReviewsSection from './components/ReviewsSection';
import { 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  MapPin, 
  Laptop, 
  Truck, 
  ShieldCheck, 
  ArrowLeft,
  Share2,
  Heart,
  Calendar,
  Clock,
} from 'lucide-react';
import styles from './ServiceDetailPage.module.css';

export default function ServiceDetailPage({
  serviceId,
  onGoBack,
  onSelectCategory,
  onGoHome,
  onShowToast,
  onCheckout,
  onContactSeller
}) {
  const { status, service } = useServiceDetail(serviceId);

  const [pickedPackageId, setSelectedPackageId] = useState(null);
  const [pickedAddonIds, setSelectedAddonIds] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [onsiteSlots, setOnsiteSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (service?.executionType !== 'ONSITE' || !service?.serviceId) return;
    let cancelled = false;
    setLoadingSlots(true);
    availabilityApi
      .getSlots(service.serviceId)
      .then((res) => {
        if (cancelled) return;
        const pageData = res?.result;
        const list = Array.isArray(pageData) ? pageData : (pageData?.data || []);
        setOnsiteSlots(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setOnsiteSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [service?.executionType, service?.serviceId]);

  const availableOnsiteSlots = onsiteSlots.filter((s) => s.status === 'AVAILABLE');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [serviceId]);

  // Picks only count for the loaded service; otherwise default to Standard, else first package.
  const packages = service?.packages ?? [];
  const selectedPackageId = packages.some((p) => p.id === pickedPackageId)
    ? pickedPackageId
    : packages[1]?.id || packages[0]?.id || null;
  const selectedAddonIds = pickedAddonIds.filter((id) => (service?.addons ?? []).some((a) => a.id === id));

  const handleToggleAddon = (addonId) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleOrder = (pkg, addons, total) => {
    if (onCheckout) {
      onCheckout({ service, pkg, addons });
      return;
    }
    const formattedTotal = new Intl.NumberFormat('vi-VN').format(total) + ' ₫';
    if (onShowToast) {
      onShowToast(`Đã chọn "${pkg.name}" (${formattedTotal}) - Sẵn sàng nạp tiền vào Escrow an toàn!`);
    }
  };

  const handleContactSeller = () => {
    if (onContactSeller && service.providerId) {
      onContactSeller({
        participantId: service.providerId,
        participantName: service.provider.name,
        participantRole: 'PROVIDER',
        context: { type: 'service', id: service.serviceId, title: service.title },
      });
      return;
    }
    if (onShowToast) {
      onShowToast(`Đã mở kênh chat riêng với ${service.provider.name}`);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    if (onShowToast) {
      onShowToast('Đã sao chép liên kết dịch vụ vào clipboard!');
    }
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    if (onShowToast) {
      onShowToast(!isSaved ? 'Đã lưu dịch vụ vào danh sách yêu thích' : 'Đã xóa khỏi danh sách yêu thích');
    }
  };

  if (status !== 'ready' || !service) {
    const message = {
      loading: 'Đang tải thông tin dịch vụ...',
      'needs-login': 'Đăng nhập để xem chi tiết dịch vụ.',
      'not-found': 'Không tìm thấy dịch vụ này.',
      error: 'Không tải được dịch vụ. Kiểm tra kết nối tới máy chủ rồi thử lại.',
    }[status];
    return (
      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.topBar}>
            <button type="button" className={styles.backBtn} onClick={onGoBack} title="Quay lại">
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>
          <p className={styles.serviceTitle} role={status === 'error' ? 'alert' : 'status'}>
            {message}
          </p>
        </div>
      </div>
    );
  }

  const getExecutionTypeBadge = (type) => {
    switch (type) {
      case 'DIGITAL':
        return (
          <span className={`${styles.badge} ${styles.badgeDigital}`}>
            <Laptop size={14} /> Dịch vụ Số (Online 100%)
          </span>
        );
      case 'ONSITE':
        return (
          <span className={`${styles.badge} ${styles.badgeOnsite}`}>
            <MapPin size={14} /> Tận nơi (Onsite)
          </span>
        );
      case 'DELIVERY':
        return (
          <span className={`${styles.badge} ${styles.badgeDelivery}`}>
            <Truck size={14} /> Giao nhận tận tay
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Top Breadcrumb & Actions Bar */}
        <div className={styles.topBar}>
          <div className={styles.breadcrumbNav}>
            <button type="button" className={styles.backBtn} onClick={onGoBack} title="Quay lại">
              <ArrowLeft size={16} /> Quay lại
            </button>
            <span className={styles.bcSep}>/</span>
            <button type="button" className={styles.bcLink} onClick={onGoHome}>
              Trang chủ
            </button>
            <span className={styles.bcSep}>/</span>
            <button
              type="button"
              className={styles.bcLink}
              onClick={() => onSelectCategory && onSelectCategory({ slug: service.categorySlug, name: service.categoryName })}
            >
              {service.categoryName}
            </button>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcCurrent}>{service.title}</span>
          </div>

          <div className={styles.topActions}>
            <button type="button" className={styles.actionBtn} onClick={handleShare} title="Chia sẻ">
              <Share2 size={16} />
              <span>Chia sẻ</span>
            </button>
            <button 
              type="button" 
              className={`${styles.actionBtn} ${isSaved ? styles.actionSaved : ''}`} 
              onClick={handleToggleSave} 
              title="Lưu dịch vụ"
            >
              <Heart size={16} fill={isSaved ? '#ef4444' : 'none'} color={isSaved ? '#ef4444' : 'currentColor'} />
              <span>{isSaved ? 'Đã lưu' : 'Lưu lại'}</span>
            </button>
          </div>
        </div>

        {/* Service Header Info */}
        <div className={styles.serviceHeader}>
          <div className={styles.badgeRow}>
            {getExecutionTypeBadge(service.executionType)}
            <span className={styles.categoryPill}>{service.categoryName}</span>
          </div>

          <h1 className={styles.serviceTitle}>{service.title}</h1>

          {/* Provider Mini Summary */}
          <div className={styles.providerMiniBar}>
            <img
              src={service.provider.avatar}
              alt={service.provider.name}
              className={styles.miniAvatar}
            />
            <div className={styles.miniInfo}>
              <div className={styles.miniNameRow}>
                <strong className={styles.miniName}>{service.provider.name}</strong>
                {service.provider.isVerified && (
                  <CheckCircle2 size={15} className={styles.verifiedIcon} title="Đã xác thực" />
                )}
                {service.provider.level && (
                  <span className={styles.miniLevel}>{service.provider.level}</span>
                )}
              </div>
            </div>

            {service.avgRating != null && (
              <>
                <span className={styles.barDivider}>|</span>
                <div className={styles.ratingBox}>
                  <Star size={16} className={styles.starIcon} />
                  <strong className={styles.ratingScore}>{service.avgRating}</strong>
                  <span className={styles.ratingReviews}>({service.reviewCount} đánh giá)</span>
                </div>
              </>
            )}

            {service.ordersInQueue != null && (
              <>
                <span className={styles.barDivider}>|</span>
                <div className={styles.ordersQueue}>{service.ordersInQueue} đơn hàng đang xử lý</div>
              </>
            )}
          </div>
        </div>

        {/* Main 2-Column Content Layout */}
        <div className={styles.mainGrid}>
          {/* LEFT COLUMN: Media, Description, Matrix, Seller, FAQs, Reviews */}
          <div className={styles.leftColumn}>
            {/* 1. Media Gallery */}
            <MediaGallery mediaList={service.mediaList} title={service.title} />

            {/* 2. Service Description */}
            <section className={styles.descriptionSection}>
              <h2 className={styles.blockTitle}>Mô tả chi tiết dịch vụ</h2>
              <div className={styles.richText}>
                {service.description ? (
                  service.description
                    .split(/\n{2,}/)
                    .map((para, i) => <p key={i}>{para}</p>)
                ) : (
                  <p>Nhà cung cấp chưa thêm mô tả cho dịch vụ này.</p>
                )}

                <h3>Quy trình làm việc minh bạch 4 bước:</h3>
                <ol className={styles.stepsList}>
                  <li>
                    <strong>1. Tiếp nhận & Khảo sát yêu cầu:</strong> Lắng nghe mục tiêu, tư vấn gói giải pháp phù hợp nhất.
                  </li>
                  <li>
                    <strong>2. Khởi tạo & Ký quỹ Escrow an toàn:</strong> Tiền được giữ tại WorkGo, bảo vệ tuyệt đối quyền lợi của bạn.
                  </li>
                  <li>
                    <strong>3. Triển khai & Cập nhật tiến độ liên tục:</strong> Gửi bản thảo/báo cáo demo để nhận góp ý và điều chỉnh.
                  </li>
                  <li>
                    <strong>4. Bàn giao trọn gói & Nghiệm thu:</strong> Hướng dẫn sử dụng chi tiết, bảo hành và hỗ trợ kỹ thuật dài hạn.
                  </li>
                </ol>

                <div className={styles.guaranteeBox}>
                  <ShieldCheck size={24} className={styles.guaranteeIcon} />
                  <div>
                    <h4>Cam kết bảo chứng từ WorkGo</h4>
                    <p>
                      Mọi khoản thanh toán đều được phong tỏa an toàn trong tài khoản trung gian (Escrow). Chuyên gia chỉ nhận thanh toán khi bạn đã kiểm tra và bấm xác nhận nghiệm thu hài lòng 100%.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2.5 Onsite Booking Slots Available */}
            {service.executionType === 'ONSITE' && (
              <section className={styles.descriptionSection} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h2 className={styles.blockTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="#2563eb" /> Khung giờ Chuyên gia nhận việc khả dụng
                  </h2>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '12px' }}>
                    {availableOnsiteSlots.length} khung giờ còn trống
                  </span>
                </div>

                {loadingSlots ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Đang tải lịch rảnh của chuyên gia...</p>
                ) : availableOnsiteSlots.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Chuyên gia hiện chưa mở thêm slot rảnh cho dịch vụ này.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {availableOnsiteSlots.slice(0, 12).map((slot) => {
                      const sid = slot.bookingSlotId || slot.id;
                      const start = slot.startedAt ? new Date(slot.startedAt) : null;
                      const end = slot.endAt ? new Date(slot.endAt) : null;
                      const timeStr = start && end
                        ? `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Giờ linh hoạt';
                      const dateStr = start
                        ? start.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
                        : '';

                      return (
                        <div
                          key={sid}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} color="#64748b" /> {timeStr}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{dateStr}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* 3. 3-Package Side-by-Side Comparison Matrix */}
            <PackageComparisonTable
              packages={service.packages}
              matrix={service.comparisonMatrix}
              selectedPackageId={selectedPackageId}
              onSelectPackage={setSelectedPackageId}
            />

            {/* 4. Provider Bio & Profile Card */}
            <ProviderCard
              provider={service.provider}
              sellerBio={service.sellerBio}
              responseTime={service.responseTime}
              lastDelivery={service.lastDelivery}
              memberSince={service.memberSince}
              languages={service.languages}
              avgRating={service.avgRating}
              reviewCount={service.reviewCount}
              ordersInQueue={service.ordersInQueue}
              onContactSeller={handleContactSeller}
            />

            {/* 5. FAQs Accordion */}
            <FaqAccordion faqs={service.faqs} />

            {/* 6. Reviews & Rating Breakdown */}
            {service.reviews.length > 0 && (
              <ReviewsSection
                reviews={service.reviews}
                avgRating={service.avgRating}
                reviewCount={service.reviewCount}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Sticky Order Box */}
          <div className={styles.rightColumn}>
            {!isOrderable(service.executionType) && (
              <p className={styles.notOrderable} role="note">
                {NOT_ORDERABLE_MESSAGE}
              </p>
            )}
            <PackageSidebar
              packages={service.packages}
              selectedPackageId={selectedPackageId}
              onSelectPackage={setSelectedPackageId}
              addons={service.addons}
              selectedAddonIds={selectedAddonIds}
              onToggleAddon={handleToggleAddon}
              onOrder={handleOrder}
              onContactSeller={handleContactSeller}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
