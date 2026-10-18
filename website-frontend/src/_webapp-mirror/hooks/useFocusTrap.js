import { useEffect } from 'react';

// F3: pure Tab-cycle core (no DOM needed) — testable in node:test.
export function getTrapCandidates(ids, activeId, shiftKey) {
  if (!ids.length) return null;
  const idx = ids.indexOf(activeId);
  if (shiftKey) {
    return idx <= 0 ? ids[ids.length - 1] : ids[idx - 1];
  }
  return idx === -1 || idx === ids.length - 1 ? ids[0] : ids[idx + 1];
}

const FOCUSABLE_SELECTOR =
  'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

function isVisible(el) {
  return !el.disabled && el.getClientRects().length > 0;
}

// F3: lock Tab/Shift+Tab cycling inside containerRef while active.
// Reduced-motion safe (focus is not animation). Cleanup on unmount/deactivate.
export function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isVisible);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // E6: only Tab is handled here; Escape lives with each overlay's own listener.
    container.addEventListener('keydown', onKeyDown);
    return () => container.removeEventListener('keydown', onKeyDown);
  }, [containerRef, active]);
}
