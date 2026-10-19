import React, { useState } from "react";
import ServiceCard from "../../common/ServiceCard/ServiceCard";
import { mockServices } from "../../../data/mockServices";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import styles from "./PopularServices.module.css";

export default function PopularServices({ onSelectService }) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [startIndex, setStartIndex] = useState(0);

  const filterTabs = [
    { key: "ALL", label: "Tất cả dịch vụ" },
    { key: "DIGITAL", label: "🌐 Online / Digital" },
    { key: "ONSITE", label: "🏠 Tại nhà / Onsite" },
    { key: "DELIVERY", label: "🚚 Giao nhận" },
  ];

  const filteredServices =
    activeTab === "ALL"
      ? mockServices
      : mockServices.filter((s) => s.executionType === activeTab);

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
              <span className={styles.badgeText}>Thịnh hành trên WorkGo</span>
            </div>
            <h2 className={styles.title}>
              Dịch vụ chuyên nghiệp được yêu thích
            </h2>
            <p className={styles.subtitle}>
              Lựa chọn từ các Chuyên gia có điểm đánh giá cao và hoàn thành hàng
              trăm đơn hàng
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Services Grid/Carousel View */}
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
