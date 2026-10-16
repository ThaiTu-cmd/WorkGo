"use client";

import { MessageCircle, Star } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { mockProviders } from "../_mocks/mockProviders";
import styles from "./ProviderProfilePage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  providerId?: string;
};

export default function ProviderProfilePage({ onShowToast, providerId }: TrungPageProps) {
  const provider = mockProviders.find((p) => p.providerId === providerId) ?? mockProviders[0];

  return (
    <main className={styles.wrap}>
      <section className={styles.hero} aria-label={`Hồ sơ của ${provider.name}`}>
        <div className={styles.idRow}>
          <span className={styles.avatar} aria-hidden="true">
            {provider.name.charAt(0)}
          </span>
          <div className={styles.idText}>
            <h1 className={styles.name}>{provider.name}</h1>
            <p className={styles.meta}>
              <Star size={16} className={styles.star} aria-hidden="true" />
              <span>
                {provider.rating.toFixed(1)} ({provider.reviewCount} đánh giá) • {provider.ordersInQueue} đơn đang
                chờ
              </span>
            </p>
          </div>
        </div>
        <p className={styles.bio}>{provider.bio}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onShowToast("Đã gửi tin nhắn cho provider (bản mock)!")}
          >
            <MessageCircle size={18} aria-hidden="true" />
            Nhắn tin
          </button>
        </div>
      </section>

      <section aria-label="Dịch vụ của provider">
        <h2 className={styles.sectionTitle}>Dịch vụ đang cung cấp</h2>
        <ul className={styles.grid}>
          {provider.services.map((s) => (
            <li key={s.serviceId} className={styles.service}>
              <p className={styles.serviceTitle}>{s.title}</p>
              <p className={styles.serviceId}>{s.serviceId}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
