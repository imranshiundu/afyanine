"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Bottom sheet overlay pinned to the phone shell (not the scroll).
 * Closes on backdrop tap, Escape, or the ✕ button.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  label,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  label: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-layer">
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <section className="sheet-panel" role="dialog" aria-modal="true" aria-label={label}>
        <span className="grabber" aria-hidden="true" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={17} strokeWidth={2.2} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
