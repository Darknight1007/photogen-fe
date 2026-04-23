"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { eventsApi } from "@/lib/api";

export default function JoinEventPage() {
  const router = useRouter(); const params = useParams(); const code = params.code as string;
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { localStorage.setItem("pendingJoin", code); router.push("/user/login"); return; }
    (async () => {
      try { const { error: err } = await eventsApi.join(code); if (err) { setError(err); return; } router.push("/user/dashboard"); }
      catch (e: any) { setError(e.message || "Failed to join"); }
    })();
  }, [code, router]);

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#080807", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="empty fade-up" style={{ maxWidth: 400, width: "100%" }}>
        <div className="empty-grid" />
        <div className="empty-icon">😕</div>
        <h3 className="empty-title">Couldn&apos;t join</h3>
        <p className="empty-sub">{error}</p>
        <button className="btn-gold" style={{ margin: "0 auto" }} onClick={() => router.push("/user/dashboard")}>Go to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080807", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dim)" }}>Joining event…</p>
    </div>
  );
}
