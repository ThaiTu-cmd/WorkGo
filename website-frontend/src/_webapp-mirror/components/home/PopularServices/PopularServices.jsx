import React, { useMemo, useState } from "react";
import { useServiceList } from "../../../hooks/useServiceList";
import ServiceCard from "../../common/ServiceCard/ServiceCard";
import { ChevronLeft, ChevronRight, Flame, Globe, House, Truck } from "lucide-react";
import styles from "./PopularServices.module.css";

const POPULAR_LIMIT = 8;

export default function PopularServices({ onSelectService }) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [startIndex, setStartIndex] = useState(0);
  const { services, status } = useServiceList();
  // Most-ordered PUBLISHED services first.
  const popular = useMemo(
    () => [...services].sort((a, b) => b.orderCount - a.orderCount).slice(0, POPULAR_LIMIT),
    [services]
  );

  const filterTabs = [
    { key: "ALL", label: "Tất cả" },
    { key: "DIGITAL", icon: Globe, label: "Online" },
    { key: "ONSITE", icon: House, label: "Tại nhà" },
    { key: "DELIVERY", icon: Truck, label: "Giao nhận" },
  ];

  const filteredServices =
    activeTab === "ALL"
      ? popular
      : popular.filter((s) => s.executionType === activeTab);

  const visibleCount = 4;
  const maxStart = Math.max(0, filteredServices.length - visibleCount);

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(maxStart, prev + 1));
  };

  return (
    <section className={styles.section} id="popular-services">
      <div className="container">
        {/* Section Header */}
        <div className={`${styles.headerRow} reveal`}>
          <div>
            <div className={styles.badgeRow}>
              <Flame size={18} className={styles.flameIcon} />
              <span className={styles.badgeText}>Thịnh hành</span>
            </div>
            <h2 className={styles.title}>Dịch vụ được yêu thích</h2>
            <p className={styles.subtitle}>
              Từ các Chuyên gia được đánh giá cao
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className={styles.arrowControls}>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={handlePrev}
              disabled={startIndex === 0}
              aria-label="Previous services"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={handleNext}
              disabled={startIndex >= maxStart}
              aria-label="Next services"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`${styles.tabList} reveal reveal-delay-1`}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabActive : ""}`}
              onClick={() => {
                setActiveTab(tab.key);
                setStartIndex(0);
              }}
            >
              {tab.icon && <tab.icon size={15} aria-hidden="true" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Services Grid/Carousel View */}
        {filteredServices.length === 0 && (
          <p className={styles.subtitle}>
            {status === "loading"
              ? "Đang tải dịch vụ..."
              : status === "needs-login"
                ? "Đăng nhập để xem các dịch vụ trên WorkGo."
                : status === "error"
                  ? "Không tải được dịch vụ từ máy chủ."
                  : "Chưa có dịch vụ nào ở mục này."}
          </p>
        )}
        <div className={styles.servicesGrid}>
          {filteredServices.map((service, idx) => (
            <div
              key={service.serviceId}
              className={`${styles.cardCol} reveal reveal-delay-${(idx % 4) + 1}`}
              onClick={() => onSelectService && onSelectService(service)}
            >
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
