import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";
import { useServiceList } from "../../../hooks/useServiceList";
import ServiceCard from "../../common/ServiceCard/ServiceCard";
import { ChevronLeft, ChevronRight, Flame, Globe, House, Truck } from "lucide-react";
import styles from "./PopularServices.module.css";
const POPULAR_LIMIT = 8;
export default function PopularServices({
  onSelectService
}) {
  const tr = useTranslations("misc");
  const [activeTab, setActiveTab] = useState("ALL");
  const [startIndex, setStartIndex] = useState(0);
  const {
    services,
    status
  } = useServiceList();
  const filterTabs = [{
    key: "ALL",
    label: tr("m142")
  }, {
    key: "DIGITAL",
    icon: Globe,
    label: "Online"
  }, {
    key: "ONSITE",
    icon: House,
    label: tr("m82")
  }, {
    key: "DELIVERY",
    icon: Truck,
    label: tr("m76")
  }];

  // Filter first by selected tab, then sort by highest orderCount
  const filteredServices = useMemo(() => {
    let list = services;
    if (activeTab === "DIGITAL") {
      list = services.filter(s => s.executionType === "DIGITAL");
    } else if (activeTab === "ONSITE") {
      list = services.filter(s => s.executionType === "ONSITE");
    } else if (activeTab === "DELIVERY") {
      list = services.filter(s => s.executionType === "DELIVERY" || s.categorySlug === "van-chuyen-giao-hang");
    }
    return [...list].sort((a, b) => b.orderCount - a.orderCount).slice(0, POPULAR_LIMIT);
  }, [services, activeTab]);
  const visibleCount = 4;
  const maxStart = Math.max(0, filteredServices.length - visibleCount);
  const handlePrev = () => {
    setStartIndex(prev => Math.max(0, prev - 1));
  };
  const handleNext = () => {
    setStartIndex(prev => Math.min(maxStart, prev + 1));
  };
  return <section className={styles.section} id="popular-services">
      <div className="container">
        {/* Section Header */}
        <div className={`${styles.headerRow} reveal`}>
          <div>
            <div className={styles.badgeRow}>
              <Flame size={18} className={styles.flameIcon} />
              <span className={styles.badgeText}>{tr("m147")}</span>
            </div>
            <h2 className={styles.title}>{tr("m148")}</h2>
            <p className={styles.subtitle}>{tr("m149")}</p>
          </div>

          {/* Carousel Arrows */}
          <div className={styles.arrowControls}>
            <button type="button" className={styles.arrowBtn} onClick={handlePrev} disabled={startIndex === 0} aria-label="Previous services">
              <ChevronLeft size={20} />
            </button>
            <button type="button" className={styles.arrowBtn} onClick={handleNext} disabled={startIndex >= maxStart} aria-label="Next services">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`${styles.tabList} reveal reveal-delay-1`}>
          {filterTabs.map(tab => <button key={tab.key} type="button" className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabActive : ""}`} onClick={() => {
          setActiveTab(tab.key);
          setStartIndex(0);
        }}>
              {tab.icon && <tab.icon size={15} aria-hidden="true" />}
              {tab.label}
            </button>)}
        </div>

        {/* Services Grid/Carousel View */}
        {filteredServices.length === 0 && <p className={styles.subtitle}>
            {status === "loading" ? tr("m143") : status === "needs-login" ? tr("m144") : status === "error" ? tr("m145") : tr("m146")}
          </p>}
        <div className={styles.servicesGrid}>
          {filteredServices.map((service, idx) => <div key={service.serviceId} className={`${styles.cardCol} reveal reveal-delay-${idx % 4 + 1}`} onClick={() => onSelectService && onSelectService(service)}>
              <ServiceCard service={service} />
            </div>)}
        </div>
      </div>
    </section>;
}