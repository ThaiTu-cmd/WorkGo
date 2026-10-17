import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav className={styles.paginationNav} aria-label="Pagination">
      <button
        type="button"
        className={styles.pageBtn}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang trước"
      >
        <ChevronLeft size={16} />
        <span>Trước</span>
      </button>

      <div className={styles.pageNumbers}>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.numberBtn} ${currentPage === p ? styles.numberBtnActive : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={styles.pageBtn}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Trang sau"
      >
        <span>Sau</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
