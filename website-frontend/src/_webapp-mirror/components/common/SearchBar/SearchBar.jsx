import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  ChevronDown,
  Check,
  LayoutGrid,
  Globe,
  Home,
  Truck,
  CalendarDays,
} from 'lucide-react';
import styles from './SearchBar.module.css';

const EXECUTION_TYPES = [
  { value: 'ALL', label: 'Tất cả hình thức', Icon: LayoutGrid },
  { value: 'DIGITAL', label: 'Dịch vụ Online', Icon: Globe },
  { value: 'ONSITE', label: 'Dịch vụ Tại nhà', Icon: Home },
  { value: 'DELIVERY', label: 'Giao nhận', Icon: Truck },
  { value: 'APPOINTMENT', label: 'Đặt lịch hẹn', Icon: CalendarDays },
];

export default function SearchBar({ onSearch }) {
  const [keyword, setKeyword] = useState('');
  const [executionType, setExecutionType] = useState('ALL');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const filterRef = useRef(null);

  const selected = EXECUTION_TYPES.find((t) => t.value === executionType) || EXECUTION_TYPES[0];

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  const openMenu = () => {
    setActiveIndex(EXECUTION_TYPES.findIndex((t) => t.value === executionType));
    setMenuOpen(true);
  };

  const choose = (value) => {
    setExecutionType(value);
    setMenuOpen(false);
  };

  const handleTriggerKeyDown = (e) => {
    if (!menuOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setMenuOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % EXECUTION_TYPES.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + EXECUTION_TYPES.length) % EXECUTION_TYPES.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(EXECUTION_TYPES[activeIndex].value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ keyword, executionType });
    }
  };

  return (
    <form className={styles.searchBarContainer} onSubmit={handleSubmit}>
      {/* Dropdown execution type filter */}
      <div className={styles.filterWrapper} ref={filterRef}>
        <button
          type="button"
          className={styles.filterTrigger}
          onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          aria-label="Chọn hình thức thực hiện"
        >
          <selected.Icon size={16} className={styles.triggerIcon} />
          <span className={styles.triggerLabel}>{selected.label}</span>
          <ChevronDown
            size={16}
            className={`${styles.chevronIcon} ${menuOpen ? styles.chevronOpen : ''}`}
          />
        </button>

        {menuOpen && (
          <ul className={styles.filterMenu} role="listbox" aria-label="Hình thức thực hiện">
            {EXECUTION_TYPES.map(({ value, label, Icon }, i) => {
              const isSelected = value === executionType;
              return (
                <li
                  key={value}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.filterOption} ${isSelected ? styles.optionSelected : ''} ${
                    i === activeIndex ? styles.optionActive : ''
                  }`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(value)}
                >
                  <span className={styles.optionIcon}>
                    <Icon size={16} />
                  </span>
                  <span className={styles.optionLabel}>{label}</span>
                  {isSelected && <Check size={16} className={styles.optionCheck} />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={styles.divider} />

      {/* Main search text input */}
      <div className={styles.inputWrapper}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Bạn đang cần dịch vụ gì? (VD: Thiết kế logo, Lập trình website, Sửa điện nước...)"
          className={styles.searchInput}
        />
      </div>

      {/* Action submit button */}
      <button type="submit" className={styles.submitBtn}>
        <span>Tìm kiếm</span>
        <Search size={18} className={styles.btnIcon} />
      </button>
    </form>
  );
}
