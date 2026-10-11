import React, { useState } from 'react';
import { 
  Filter, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Star, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Grid,
  Sparkles
} from 'lucide-react';
import { mockCategories } from '../../../../data/mockCategories';
import styles from './FilterSidebar.module.css';

export default function FilterSidebar({
  selectedCategory,
  onSelectCategory,
  selectedType,
  onSelectType,
  priceRange,
  onChangePriceRange,
  deliveryTime,
  onChangeDeliveryTime,
  minRating,
  onChangeMinRating,
  onlyVerified,
  onToggleVerified,
  onResetFilters,
  hasActiveFilters
}) {
  const [catOpen, setCatOpen] = useState(true);
  const [typeOpen, setTypeOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(true);

  const [minInput, setMinInput] = useState(priceRange.min || '');
  const [maxInput, setMaxInput] = useState(priceRange.max || '');

  const executionTypes = [
    { value: 'ALL', label: 'Tất cả hình thức', badgeClass: styles.badgeAll },
    { value: 'DIGITAL', label: 'Online / Digital', badgeClass: styles.badgeDigital },
    { value: 'ONSITE', label: 'Tại nhà / Onsite', badgeClass: styles.badgeOnsite },
    { value: 'DELIVERY', label: 'Giao nhận / Logistics', badgeClass: styles.badgeDelivery },
    { value: 'APPOINTMENT', label: 'Đặt lịch hẹn', badgeClass: styles.badgeAppointment },
  ];

  const quickPricePresets = [
    { label: '< 500.000₫', min: 0, max: 500000 },
    { label: '500k - 2 triệu', min: 500000, max: 2000000 },
    { label: '2 triệu - 5 triệu', min: 2000000, max: 5000000 },
    { label: '> 5 triệu', min: 5000000, max: 50000000 },
  ];

  const handleApplyPrice = (e) => {
    e.preventDefault();
    onChangePriceRange({
      min: minInput === '' ? null : Number(minInput),
      max: maxInput === '' ? null : Number(maxInput)
    });
  };

  const handlePresetPrice = (preset) => {
    setMinInput(preset.min);
    setMaxInput(preset.max);
    onChangePriceRange({ min: preset.min, max: preset.max });
  };

  return (
    <aside className={styles.sidebar}>
      {/* Sidebar Header */}
      <div className={styles.sidebarHeader}>
        <div className={styles.headerTitleWrap}>
          <Filter size={18} className={styles.filterIcon} />
          <h2 className={styles.sidebarTitle}>Bộ lọc tìm kiếm</h2>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setMinInput('');
              setMaxInput('');
              onResetFilters();
            }}
            title="Xóa tất cả bộ lọc"
          >
            <RotateCcw size={14} />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* 1. Category Filter Section */}
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={styles.groupHeader}
          onClick={() => setCatOpen(!catOpen)}
        >
          <span className={styles.groupTitle}>
            <Grid size={16} className={styles.sectionIcon} />
            Danh mục dịch vụ
          </span>
          {catOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {catOpen && (
          <div className={styles.groupBody}>
            <button
              type="button"
              className={`${styles.catItem} ${selectedCategory === 'ALL' ? styles.catItemActive : ''}`}
              onClick={() => onSelectCategory('ALL')}
            >
              <span className={styles.catName}>Tất cả danh mục</span>
            </button>

            {mockCategories.map((cat) => (
              <button
                key={cat.categoryId}
                type="button"
                className={`${styles.catItem} ${selectedCategory === cat.slug ? styles.catItemActive : ''}`}
                onClick={() => onSelectCategory(cat.slug)}
              >
                <span className={styles.catName}>{cat.name}</span>
                <span className={styles.catCount}>{cat.serviceCount}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Execution Type Filter Section */}
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={styles.groupHeader}
          onClick={() => setTypeOpen(!typeOpen)}
        >
          <span className={styles.groupTitle}>
            <Sparkles size={16} className={styles.sectionIcon} />
            Hình thức thực hiện
          </span>
          {typeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {typeOpen && (
          <div className={styles.groupBody}>
            {executionTypes.map((type) => (
              <label key={type.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="executionType"
                  value={type.value}
                  checked={selectedType === type.value}
                  onChange={() => onSelectType(type.value)}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom}>
                  {selectedType === type.value && <span className={styles.radioDot} />}
                </span>
                <span className={styles.radioText}>{type.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 3. Price Range Filter Section */}
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={styles.groupHeader}
          onClick={() => setPriceOpen(!priceOpen)}
        >
          <span className={styles.groupTitle}>
            <DollarSign size={16} className={styles.sectionIcon} />
            Khoảng ngân sách (₫)
          </span>
          {priceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {priceOpen && (
          <div className={styles.groupBody}>
            {/* Quick Presets */}
            <div className={styles.presetWrap}>
              {quickPricePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => handlePresetPrice(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Min / Max Inputs */}
            <form onSubmit={handleApplyPrice} className={styles.priceForm}>
              <div className={styles.priceInputsRow}>
                <input
                  type="number"
                  placeholder="Từ (₫)"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  className={styles.priceInput}
                  min="0"
                />
                <span className={styles.dash}>-</span>
                <input
                  type="number"
                  placeholder="Đến (₫)"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  className={styles.priceInput}
                  min="0"
                />
              </div>
              <button type="submit" className={styles.applyPriceBtn}>
                Áp dụng giá
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 4. Delivery Time Filter Section */}
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={styles.groupHeader}
          onClick={() => setDeliveryOpen(!deliveryOpen)}
        >
          <span className={styles.groupTitle}>
            <Clock size={16} className={styles.sectionIcon} />
            Thời gian hoàn thành
          </span>
          {deliveryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {deliveryOpen && (
          <div className={styles.groupBody}>
            {[
              { val: 'ALL', label: 'Bất kỳ lúc nào' },
              { val: '1', label: '⚡ Siêu tốc trong 24 giờ' },
              { val: '3', label: 'Tối đa 3 ngày' },
              { val: '7', label: 'Tối đa 7 ngày' },
            ].map((item) => (
              <label key={item.val} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="deliveryTime"
                  value={item.val}
                  checked={deliveryTime === item.val}
                  onChange={() => onChangeDeliveryTime(item.val)}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom}>
                  {deliveryTime === item.val && <span className={styles.radioDot} />}
                </span>
                <span className={styles.radioText}>{item.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 5. Provider Rating & Verification */}
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={styles.groupHeader}
          onClick={() => setRatingOpen(!ratingOpen)}
        >
          <span className={styles.groupTitle}>
            <ShieldCheck size={16} className={styles.sectionIcon} />
            Uy tín & Đánh giá
          </span>
          {ratingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {ratingOpen && (
          <div className={styles.groupBody}>
            {/* Verified Pro Toggle */}
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => onToggleVerified(e.target.checked)}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxCustom}>
                {onlyVerified && <Check size={13} />}
              </span>
              <span className={styles.verifiedTag}>
                <ShieldCheck size={14} className={styles.shieldIcon} />
                Chuyên gia đã xác thực (Verified)
              </span>
            </label>

            {/* Rating Stars filter */}
            <div className={styles.ratingList}>
              {[
                { val: 0, label: 'Tất cả mức đánh giá' },
                { val: 4.5, label: 'Từ 4.5 sao trở lên' },
                { val: 4.9, label: 'Từ 4.9 sao trở lên' },
              ].map((r) => (
                <label key={r.val} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="minRating"
                    value={r.val}
                    checked={minRating === r.val}
                    onChange={() => onChangeMinRating(r.val)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioCustom}>
                    {minRating === r.val && <span className={styles.radioDot} />}
                  </span>
                  <span className={styles.ratingText}>
                    {r.val > 0 && <Star size={14} fill="#ffb33e" color="#ffb33e" />}
                    <span>{r.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
