"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { FIVERR_COLOR } from "@/lib/landing/fiverr-tokens";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import {
  loadRecentSearches,
  recordRecentSearch,
  clearRecentSearches,
} from "@/lib/landing/recent-searches";
import { FiverrSearchSuggestions } from "./fiverr-search-suggestions";

export const SEARCH_MAX_LENGTH = 100;

export function sanitizeSearchQuery(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX_LENGTH);
}

export interface FiverrSearchFormProps {
  locale: string;
  id: string;
  placeholder: string;
  searchLabel: string;
  submitLabel: string;
  emptyHint: string;
  variant: "header" | "hero" | "mobile";
  className?: string;
  role?: string;
  clearLabel?: string;
  suggestionsLabel?: string;
  recentLabel?: string;
  clearHistoryLabel?: string;
}

export function FiverrSearchForm({
  locale,
  id,
  placeholder,
  searchLabel,
  submitLabel,
  emptyHint,
  variant,
  className,
  role = "search",
  clearLabel,
  suggestionsLabel,
  recentLabel,
  clearHistoryLabel,
}: FiverrSearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const [recents, setRecents] = React.useState<string[]>([]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const blurTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecents(loadRecentSearches());
  }, [suggestOpen]);

  const resolvedClearLabel = clearLabel ?? (locale === "vi" ? "Xóa từ khóa" : "Clear search");
  const resolvedSuggestionsLabel =
    suggestionsLabel ?? (locale === "vi" ? "Từ khóa thịnh hành" : "Trending searches");
  const resolvedRecentLabel = recentLabel ?? (locale === "vi" ? "Tìm kiếm gần đây" : "Recent searches");
  const resolvedClearHistoryLabel =
    clearHistoryLabel ?? (locale === "vi" ? "Xóa lịch sử" : "Clear history");
  const resultsCountTemplate = locale === "vi" ? "Tìm thấy {n} gợi ý" : "{n} suggestions found";

  const { filteredRecents, filteredTrending, flatList } = React.useMemo(() => {
    const allTrending = getFiverrContent(locale).trending.items.slice(0, 6);
    const nq = query.trim().toLowerCase();
    const r = nq
      ? recents.filter((s) => s.toLowerCase().includes(nq)).slice(0, 5)
      : recents.slice(0, 5);
    let t = nq ? allTrending.filter((s) => s.toLowerCase().includes(nq)) : allTrending;
    if (nq && t.length === 0) t = allTrending;
    const trendingSlice = t.slice(0, 6);
    return {
      filteredRecents: r,
      filteredTrending: trendingSlice,
      flatList: [...r, ...trendingSlice],
    };
  }, [query, locale, recents]);

  const onSelectSuggestion = (val: string) => {
    const q = sanitizeSearchQuery(val);
    setQuery(q);
    setError(null);
    setSuggestOpen(false);
    setActiveIdx(-1);
    if (q) {
      setRecents(recordRecentSearch(q));
      router.push(`/${locale}/posts?q=${encodeURIComponent(q)}`);
    }
  };

  const submitSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const q = sanitizeSearchQuery(query);
    if (!q) {
      setError(emptyHint);
      inputRef.current?.focus();
      if (formRef.current) {
        formRef.current.classList.remove("search-shake");
        void formRef.current.offsetWidth;
        formRef.current.classList.add("search-shake");
        window.setTimeout(() => {
          formRef.current?.classList.remove("search-shake");
        }, 350);
      }
      return;
    }
    setError(null);
    setSuggestOpen(false);
    setRecents(recordRecentSearch(q));
    router.push(`/${locale}/posts?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestOpen && flatList.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((prev) => (prev + 1) % flatList.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((prev) => (prev <= 0 ? flatList.length - 1 : prev - 1));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSuggestOpen(false);
        setActiveIdx(-1);
        return;
      }
      if (e.key === "Enter" && activeIdx >= 0 && activeIdx < flatList.length) {
        e.preventDefault();
        onSelectSuggestion(flatList[activeIdx]);
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submitSearch(e);
    }
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setSuggestOpen(true);
    setActiveIdx(-1);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setSuggestOpen(false);
      setActiveIdx(-1);
    }, 150);
  };

  const handleClear = () => {
    setQuery("");
    setError(null);
    inputRef.current?.focus();
  };

  const handleClearHistory = () => {
    clearRecentSearches();
    setRecents([]);
    inputRef.current?.focus();
  };

  if (variant === "header") {
    return (
      <div className="relative hidden xl:block">
        <form
          ref={formRef}
          onSubmit={submitSearch}
          role={role}
          noValidate
          className={
            className || "relative flex h-[42px] w-[423px] items-center bg-white"
          }
          aria-describedby={error ? `${id}-hint` : undefined}
        >
          <label className="sr-only" htmlFor={id}>
            {searchLabel}
          </label>
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={suggestOpen}
            aria-controls={`${id}-suggestions`}
            aria-autocomplete="list"
            aria-activedescendant={
              suggestOpen && activeIdx >= 0 ? `${id}-suggestions-opt-${activeIdx}` : undefined
            }
            maxLength={SEARCH_MAX_LENGTH}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error && e.target.value.trim()) setError(null);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            enterKeyHint="search"
            inputMode="search"
            type="search"
            aria-invalid={!!error}
            className="h-full min-w-0 flex-1 rounded-l border border-r-0 px-4 text-base outline-none transition-[border-color] duration-150 ease-in-out focus:border-[#222325]"
            style={{ borderColor: FIVERR_COLOR.fieldBorder, color: FIVERR_COLOR.ink500 }}
          />
          {query !== "" && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={resolvedClearLabel}
              title={resolvedClearLabel}
              className="pressable absolute right-[56px] flex h-8 w-8 items-center justify-center rounded-full text-[#62646A] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          )}
          <button
            type="submit"
            aria-label={submitLabel}
            title={submitLabel}
            className="pressable flex h-full w-[50px] items-center justify-center rounded-r text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
            style={{ backgroundColor: FIVERR_COLOR.btnSearch }}
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        </form>
        <p aria-live="polite" role="status" className="sr-only">
          {suggestOpen ? resultsCountTemplate.replace("{n}", String(flatList.length)) : ""}
        </p>
        <FiverrSearchSuggestions
          id={`${id}-suggestions`}
          items={filteredTrending}
          recents={filteredRecents}
          recentLabel={resolvedRecentLabel}
          clearHistoryLabel={resolvedClearHistoryLabel}
          onClearHistory={handleClearHistory}
          open={suggestOpen}
          activeIndex={activeIdx}
          onSelect={onSelectSuggestion}
          onClose={() => setSuggestOpen(false)}
          label={resolvedSuggestionsLabel}
        />
        {error && (
          <p
            id={`${id}-hint`}
            role="alert"
            aria-live="polite"
            className="absolute left-0 top-[46px] z-20 rounded bg-white px-2 py-1 text-xs font-medium text-[#FF7640] shadow-md border border-[#FF7640]/30"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className="relative min-w-0 flex-1 max-w-[200px]">
        <form
          ref={formRef}
          onSubmit={submitSearch}
          role={role}
          noValidate
          className={className || "relative flex items-center"}
          aria-describedby={error ? `${id}-hint` : undefined}
        >
          <label className="sr-only" htmlFor={id}>
            {searchLabel}
          </label>
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={suggestOpen}
            aria-controls={`${id}-suggestions`}
            aria-autocomplete="list"
            aria-activedescendant={
              suggestOpen && activeIdx >= 0 ? `${id}-suggestions-opt-${activeIdx}` : undefined
            }
            maxLength={SEARCH_MAX_LENGTH}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error && e.target.value.trim()) setError(null);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            enterKeyHint="search"
            inputMode="search"
            type="search"
            aria-invalid={!!error}
            className="h-9 min-w-0 w-full rounded-lg border bg-white px-3 pr-7 text-sm outline-none transition-[border-color] duration-150 focus:border-[#222325]"
            style={{ borderColor: FIVERR_COLOR.fieldBorder, color: FIVERR_COLOR.ink500 }}
          />
          {query !== "" && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={resolvedClearLabel}
              title={resolvedClearLabel}
              className="pressable absolute right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[#62646A] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
            >
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </button>
          )}
        </form>
        <p aria-live="polite" role="status" className="sr-only">
          {suggestOpen ? resultsCountTemplate.replace("{n}", String(flatList.length)) : ""}
        </p>
        <FiverrSearchSuggestions
          id={`${id}-suggestions`}
          items={filteredTrending}
          recents={filteredRecents}
          recentLabel={resolvedRecentLabel}
          clearHistoryLabel={resolvedClearHistoryLabel}
          onClearHistory={handleClearHistory}
          open={suggestOpen}
          activeIndex={activeIdx}
          onSelect={onSelectSuggestion}
          onClose={() => setSuggestOpen(false)}
          label={resolvedSuggestionsLabel}
        />
        {error && (
          <p
            id={`${id}-hint`}
            role="alert"
            aria-live="polite"
            className="absolute left-0 top-[38px] z-20 w-max max-w-[240px] rounded bg-white px-2 py-1 text-xs font-medium text-[#FF7640] shadow-md border border-[#FF7640]/30"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <form
        ref={formRef}
        onSubmit={submitSearch}
        role={role}
        noValidate
        className={
          className ||
          "relative flex h-[52px] w-full items-center rounded-xl border bg-white md:h-[60px] focus-within:border-[#1677FF] focus-within:shadow-[0_0_24px_rgba(22,119,255,0.22)] transition-shadow duration-200"
        }
        style={{ borderColor: "#C5C6C9" }}
        aria-describedby={error ? `${id}-hint` : undefined}
      >
        <label className="sr-only" htmlFor={id}>
          {searchLabel}
        </label>
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={suggestOpen}
          aria-controls={`${id}-suggestions`}
          aria-autocomplete="list"
          aria-activedescendant={
            suggestOpen && activeIdx >= 0 ? `${id}-suggestions-opt-${activeIdx}` : undefined
          }
          maxLength={SEARCH_MAX_LENGTH}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (error && e.target.value.trim()) setError(null);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          inputMode="search"
          type="search"
          aria-invalid={!!error}
          className="min-w-0 flex-1 rounded-l-xl px-4 text-base outline-none md:px-6"
          style={{ color: "#404145" }}
        />
        {query !== "" && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={resolvedClearLabel}
            title={resolvedClearLabel}
            className="pressable absolute right-[56px] flex h-8 w-8 items-center justify-center rounded-full text-[#62646A] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222325]"
          >
            <X className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          aria-label={submitLabel}
          title={submitLabel}
          className="pressable fiverr-press m-[4px] flex h-[44px] w-[52px] shrink-0 items-center justify-center rounded-lg bg-[#222325] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:h-[52px]"
        >
          <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
        </button>
      </form>
      <p aria-live="polite" role="status" className="sr-only">
        {suggestOpen ? resultsCountTemplate.replace("{n}", String(flatList.length)) : ""}
      </p>
      <FiverrSearchSuggestions
        id={`${id}-suggestions`}
        items={filteredTrending}
        recents={filteredRecents}
        recentLabel={resolvedRecentLabel}
        clearHistoryLabel={resolvedClearHistoryLabel}
        onClearHistory={handleClearHistory}
        open={suggestOpen}
        activeIndex={activeIdx}
        onSelect={onSelectSuggestion}
        onClose={() => setSuggestOpen(false)}
        label={resolvedSuggestionsLabel}
      />
      {error && (
        <p
          id={`${id}-hint`}
          role="alert"
          aria-live="polite"
          className="mt-2 text-sm font-medium text-[#FF7640] md:text-white/90 drop-shadow"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default FiverrSearchForm;
