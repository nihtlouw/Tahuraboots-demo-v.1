"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** Penghitung kunci scroll agar modal bertumpuk tidak saling membuka kunci. */
let scrollLocks = 0;
let savedOverflow = "";

function lockScroll() {
  if (scrollLocks === 0) savedOverflow = document.body.style.overflow;
  scrollLocks += 1;
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.style.overflow = savedOverflow;
}

/**
 * Primitif UI bersama untuk CRM.
 *
 * Sebelumnya setiap manager punya salinan modal, banner error, dan toast
 * sendiri-sendiri: tidak ada tombol Escape, halaman di belakang modal tetap
 * ikut discroll, fokus keyboard tertinggal di balik overlay, dan `window.confirm`
 * memblokir seluruh halaman. Semua itu disatukan di sini.
 */

export type ToastTone = "success" | "error";

export type ToastState = { id: number; message: string; tone: ToastTone } | null;

/** State + pengatur toast dengan durasi tampil otomatis. */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, show, dismiss };
}

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => onDismiss(), 5000);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const success = toast.tone === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-[0.76rem] ${
        success
          ? "border-[#cbd8bf] bg-[#eef3e6] text-[#4c6034]"
          : "border-[#dfc0bb] bg-[#f1dedb] text-[#88423a]"
      }`}
    >
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="shrink-0 rounded px-1 font-semibold opacity-70 transition-opacity hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

export function Banner({
  tone = "error",
  children,
  onDismiss,
}: {
  tone?: "error" | "info";
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const error = tone === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-2.5 text-[0.76rem] ${
        error
          ? "border-[#dfc0bb] bg-[#f1dedb] text-[#88423a]"
          : "border-[#d8c9ae] bg-[#faf6ee] text-[#7a6244]"
      }`}
    >
      <span className="min-w-0">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 font-semibold opacity-70 transition-opacity hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * Modal aksesibel: tutup dengan Escape, kunci scroll halaman, jebak fokus di
 * dalam dialog, dan kembalikan fokus ke elemen pemicu saat ditutup.
 */
export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  width = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  width?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Efek ini boleh dijalankan ulang setiap render (listener & scroll lock),
  // selama fokus tidak ikut di-reset — itu ditangani efek terpisah di bawah.
  // Kunci scroll dipisah supaya hanya berjalan sekali per buka/tutup. Kalau
  // digabung dengan listener keyboard (yang berubah tiap render), nilai
  // "overflow sebelumnya" bisa tersimpan sebagai "hidden" dan halaman
  // kehilangan scroll setelah modal ditutup. Penghitung dipakai karena dua
  // modal bisa terbuka bertumpuk (kartu lead + dialog konfirmasi).
  useEffect(() => {
    if (!open) return;
    lockScroll();
    return () => unlockScroll();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  // Fokus hanya dipindahkan saat modal benar-benar dibuka/ditutup.
  useEffect(() => {
    if (!open) return;

    const trigger = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(
        "[data-autofocus], input:not([type=hidden]), select, textarea, button",
      );
      (target ?? panelRef.current)?.focus();
    }, 30);

    return () => {
      window.clearTimeout(focusTimer);
      trigger?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/55 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`w-full ${width} my-auto rounded-xl border border-crm-line bg-white shadow-xl outline-none`}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  eyebrow,
  title,
  onClose,
  id,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  id: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-crm-line px-5 py-4">
      <div>
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#a8865a]">
          {eyebrow}
        </p>
        <h2 id={id} className="mt-1 font-display text-xl text-[#221b15]">
          {title}
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialog"
        className="rounded-md p-1 text-[#a19683] transition-colors hover:bg-[#f4eee2] hover:text-[#221b15]"
      >
        ✕
      </button>
    </div>
  );
}

/** Dialog konfirmasi untuk aksi merusak (ganti `window.confirm`). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} width="max-w-md" labelledBy="confirm-title">
      <div className="px-5 py-5">
        <h2 id="confirm-title" className="font-display text-lg text-[#221b15]">
          {title}
        </h2>
        <div className="mt-2 text-[0.78rem] leading-relaxed text-[#7a7062]">{message}</div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-crm-line px-5 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-crm-line px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#7a7062] transition-colors hover:border-[#c6b699]"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`rounded-lg px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors disabled:opacity-60 ${
            tone === "danger"
              ? "bg-[#8a3a30] hover:bg-[#6f2c24]"
              : "bg-ink hover:bg-ink-3"
          }`}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
