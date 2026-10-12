"use client";

import * as React from "react";
import { TrendingUp, History } from "lucide-react";

export interface FiverrSearchSuggestionsProps {
  id: string;
  items: string[];
  recents?: string[];
  open: boolean;
  activeIndex: number;
  onSelect: (value: string) => void;
  onClose?: () => void;
  label: string;
  recentLabel?: string;
  clearHistoryLabel?: string;
  onClearHistory?: () => void;
}

export function FiverrSearchSuggestions({
  id,
  items,
  recents = [],
  open,
  activeIndex,
  onSelect,
  label,
  recentLabel = "Tìm kiếm gần đây",
  clearHistoryLabel = "Xóa lịch sử",
  onClearHistory,
}: FiverrSearchSuggestionsProps) {
  const hasRecents = recents.length > 0;
  const hasTrending = items.length > 0;

  if (!open || (!hasRecents && !hasTrending)) {
    return null;
  }

  return (
    <div
      id={id}
      role="listbox"
      aria-label={label}
      className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-[#DADBDD] bg-white py-1 shadow-lg"
    >
      {/* Recent Searches Group */}
      {hasRecents && (
        <div role="group" aria-label={recentLabel} className="border-b border-[#E4E5E7] pb-1 mb-1">
          <div className="flex items-center justify-between px-3.5 py-1.5 text-xs font-semibold text-[#62646A]">
            <div className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-[#62646A]" aria-hidden="true" />
              <span>{recentLabel}</span>
            </div>
            {onClearHistory && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onClearHistory();
                }}
                className="text-[11px] text-[#62646A] hover:text-[#222325] hover:underline cursor-pointer"
              >
                {clearHistoryLabel}
              </button>
            )}
          </div>
          {recents.map((item, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={`recent-${item}-${i}`}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={isActive}
                data-active={isActive}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(item);
                }}
                className={`flex cursor-pointer items-center justify-between px-3.5 py-2 text-sm text-[#222325] transition-colors duration-100 hover:bg-black/5 ${
                  isActive ? "bg-black/5 font-semibold text-[#1dbf73]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-[#95979D]" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trending Searches Group */}
      {hasTrending && (
        <div role="group" aria-label={label}>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#62646A]">
            <TrendingUp className="h-3.5 w-3.5 text-[#1dbf73]" aria-hidden="true" />
            <span>{label}</span>
          </div>
          {items.map((item, i) => {
            const flatIndex = recents.length + i;
            const isActive = flatIndex === activeIndex;
            return (
              <div
                key={`trending-${item}-${i}`}
                id={`${id}-opt-${flatIndex}`}
                role="option"
                aria-selected={isActive}
                data-active={isActive}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(item);
                }}
                className={`flex cursor-pointer items-center justify-between px-3.5 py-2 text-sm text-[#222325] transition-colors duration-100 hover:bg-black/5 ${
                  isActive ? "bg-black/5 font-semibold text-[#1dbf73]" : ""
                }`}
              >
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FiverrSearchSuggestions;
