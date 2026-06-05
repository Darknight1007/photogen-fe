"use client";

import { useEffect, useState } from "react";

let globalAlertQueue: { message: string; id: number }[] = [];
let notifyAlerts: (() => void) | null = null;
let alertIdCounter = 0;

export const showAlert = (message: string | any) => {
  const text = typeof message === "string" ? message : (message?.message || String(message));
  globalAlertQueue.push({ message: text, id: ++alertIdCounter });
  if (notifyAlerts) notifyAlerts();
};

export default function AlertContainer() {
  const [alerts, setAlerts] = useState<{ message: string; id: number }[]>([]);

  useEffect(() => {
    const update = () => setAlerts([...globalAlertQueue]);
    notifyAlerts = update;
    return () => { notifyAlerts = null; };
  }, []);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[0];

  const handleClose = () => {
    globalAlertQueue = globalAlertQueue.filter(a => a.id !== currentAlert.id);
    setAlerts([...globalAlertQueue]);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
      <div style={{ position: "relative", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, padding: "40px 48px", maxWidth: 420, width: "90%", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.1), inset 0 0 40px rgba(212,175,55,0.03)", animation: "popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)", overflow: "hidden" }}>
        {/* Subtle dynamic background gradient inside the modal */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(212,175,55,0.12) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,175,55,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.05) 1px, transparent 1px)", backgroundSize: "20px 20px", opacity: 0.5, pointerEvents: "none" }} />

        <style>{`
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0.9) translateY(15px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--gold)", boxShadow: "0 0 20px rgba(212,175,55,0.15)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, fontStyle: "italic", color: "var(--cream)", marginBottom: 14 }}>Notice</h3>
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.7, marginBottom: 32, fontFamily: "var(--font-body)" }}>
            {currentAlert.message}
          </p>
          <button className="btn-gold" onClick={handleClose} style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: 14 }}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
