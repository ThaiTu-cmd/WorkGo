import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FaqAccordion.module.css';

export default function FaqAccordion({ faqs = [] }) {
  const [openIndices, setOpenIndices] = useState([0]); // First item open by default

  if (!faqs || faqs.length === 0) return null;

  const toggleIndex = (index) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section className={styles.faqSection}>
      <h2 className={styles.sectionTitle}>Câu hỏi thường gặp (FAQ)</h2>
      <div className={styles.accordionList}>
        {faqs.map((faq, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div
              key={idx}
              className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
            >
              <button
                type="button"
                className={styles.faqQuestionBtn}
                onClick={() => toggleIndex(idx)}
                aria-expanded={isOpen}
              >
                <span className={styles.questionText}>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`${styles.chevronIcon} ${isOpen ? styles.chevronRotated : ''}`}
                />
              </button>
              {isOpen && (
                <div className={styles.faqAnswer}>
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
