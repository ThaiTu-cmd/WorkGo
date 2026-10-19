"use client";

import React, { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollEnhancements() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          const currentScroll = window.scrollY;

          if (totalHeight > 0) {
            const progress = Math.min(
              100,
              Math.max(0, (currentScroll / totalHeight) * 100)
            );
            setScrollProgress(progress);
          } else {
            setScrollProgress(0);
          }

          setShowBackToTop(currentScroll > 320);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver to auto-reveal elements with .reveal class as they scroll into view
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    const observeAll = () => {
      const elements = document.querySelectorAll(
        ".reveal:not(.reveal-visible)"
      );
      elements.forEach((el) => observer.observe(el));
    };

    observeAll();

    // Re-check when page content updates (e.g., tabs change or dynamic render)
    const mutationObserver = new MutationObserver(() => {
      observeAll();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Scroll Progress Bar at very top */}
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tiến trình cuộn trang"
      />

      {/* Floating Back to Top Button */}
      <button
        type="button"
        className={`back-to-top-fab ${showBackToTop ? "is-visible" : ""}`}
        onClick={handleScrollToTop}
        aria-label="Cuộn lên đầu trang"
        title="Cuộn lên đầu trang"
      >
        <ChevronUp size={22} />
      </button>
    </>
  );
}
