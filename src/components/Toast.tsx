"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastVariant = "success" | "error";

export type ToastState = {
  message: string;
  variant: ToastVariant;
} | null;

const TOAST_DURATION_MS = 3200;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const show = useCallback((message: string, variant: ToastVariant) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, variant });
    timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { toast, show, dismiss };
}

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  const isSuccess = toast.variant === "success";

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 22px",
          borderRadius: 12,
          background: "rgba(10, 8, 0, 0.96)",
          border: `1px solid ${isSuccess ? "rgba(212, 175, 55, 0.45)" : "rgba(224, 85, 85, 0.45)"}`,
          boxShadow: isSuccess
            ? "0 12px 40px rgba(0,0,0,0.55), 0 0 24px rgba(212,175,55,0.12)"
            : "0 12px 40px rgba(0,0,0,0.55), 0 0 20px rgba(224,85,85,0.1)",
          backdropFilter: "blur(12px)",
          animation: "toastIn 0.35s ease both",
          maxWidth: "min(90vw, 420px)",
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isSuccess ? "rgba(212, 175, 55, 0.15)" : "rgba(224, 85, 85, 0.15)",
            color: isSuccess ? "#D4AF37" : "#e05555",
          }}
        >
          {isSuccess ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', 'Courier New', monospace",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: isSuccess ? "#f0e8cc" : "#f5c4c4",
            lineHeight: 1.4,
          }}
        >
          {toast.message}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            marginLeft: 4,
            background: "none",
            border: "none",
            color: "rgba(212, 175, 55, 0.4)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </>
  );
}
