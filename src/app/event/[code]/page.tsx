"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { eventsApi } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";

export default function PublicEventPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const [event, setEvent] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await eventsApi.getByCode(code);
      if (!data) return;
      setEvent(data.event);
      const { data: img } = await eventsApi.getJoinedEventImages(data.event.id, { limit: 100 });
      if (img) setImages(img.images);
      setLoading(false);
    })();
  }, [code]);

  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000); };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080807", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  if (!event) return null;

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => router.push("/user/dashboard")} style={{ background: "none", border: "1px solid var(--border)", color: "var(--dim)", cursor: "pointer", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <Link href="/" className="logo">
              <div className="logo-mark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </div>
              <span className="logo-text">PhotoGen</span>
            </Link>
          </div>
          <span className="tag-green">{event.isActive ? "● Live" : "Ended"}</span>
        </div>
      </nav>

      <main style={{ padding: "56px 48px 80px" }}>
        {/* Header & QR Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center", border: "1px solid var(--border)", background: "var(--bg2)", padding: 40, borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" }} className="fade-up d1">
          <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: `repeating-linear-gradient(45deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 20px)` }} />
          
          {/* Info */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>Public Event</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, color: "var(--cream)", marginBottom: 16 }}>
              {event.name}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dim)", marginBottom: 32 }}>
              {event.location && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21s-7-7.5-7-11a7 7 0 1114 0c0 3.5-7 11-7 11z"/><circle cx="12" cy="10" r="3"/></svg> {event.location}</span>}
              {event.eventDate && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> {new Date(event.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg> {images.length} photos</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg> {event.participantCount} guests</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "16px 24px", background: "rgba(8,8,7,0.4)", borderRadius: 12, border: "1px solid var(--border)", width: "fit-content" }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)", marginBottom: 8 }}>Access Code</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <code style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 400, color: "var(--cream)", letterSpacing: "0.08em" }}>{event.code}</code>
                  <button className="icon-btn" onClick={() => copy(event.code, "code")} title="Copy code">
                    {copied === "code" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: "var(--border)" }} />
              <div>
                <button className="btn-outline" onClick={() => copy(`${window.location.origin}/join/${event.code}`, "link")}>
                  {copied === "link" ? "✓ Link Copied" : "Copy Share Link"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Large QR */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 160, height: 160, background: "#fff", padding: 12, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px var(--gold-dim)" }}>
              <QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${event.code}`} size={136} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)" }}>Scan to join</div>
          </div>
        </div>

        {/* Photos */}
        <div className="fade-up d3">
          <div className="section-heading" style={{ marginTop: 0 }}>
            <span className="section-heading-text">Photos</span>
            {images.length > 0 && <span className="section-heading-count">{images.length}</span>}
            <div className="section-heading-line" />
          </div>

          {images.length === 0 ? (
            <div className="empty">
              <div className="empty-grid" />
              <div className="empty-icon">📸</div>
              <h3 className="empty-title">No photos yet</h3>
              <p className="empty-sub">Check back after the photographer uploads event photos.</p>
            </div>
          ) : (
            <div className="photo-grid">
              {images.map((img) => (
                <div key={img.id} className="photo-cell" onClick={() => setLightbox(img)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.2s" }} onClick={() => setLightbox(null)}>
          <button style={{ position: "absolute", top: 20, right: 20, background: "none", border: "1px solid var(--border)", color: "var(--dim)", cursor: "pointer", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.url} alt="" style={{ maxWidth: "90%", maxHeight: "90vh", objectFit: "contain" }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}