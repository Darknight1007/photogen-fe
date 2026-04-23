"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { eventsApi, imagesApi, Event, Image } from "@/lib/api";
import BulkUploader from "@/components/BulkUploader";
import { QRCodeSVG } from "qrcode.react";

export default function EventDetailPage() {
  const router = useRouter(); const params = useParams(); const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null); const [images, setImages] = useState<Image[]>([]); const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false); const [showUploader, setShowUploader] = useState(false); const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set()); const [deleting, setDeleting] = useState(false);

  const fetchEvent = useCallback(async () => { const { data } = await eventsApi.getById(eventId); if (data) setEvent(data.event); else router.push("/photographer/dashboard"); setLoading(false); }, [eventId, router]);
  const fetchImages = useCallback(async () => { const { data } = await imagesApi.getEventImages(eventId, { limit: 100 }); if (data) setImages(data.images); }, [eventId]);
  useEffect(() => { if (!localStorage.getItem("token")) { router.push("/photographer/login"); return; } fetchEvent(); fetchImages(); }, [router, fetchEvent, fetchImages]);

  const copy = (t: string, k: string) => { navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(null), 2000); };
  const toggle = (id: string) => setSelected(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const selAll = () => selected.size === images.length ? setSelected(new Set()) : setSelected(new Set(images.map(i => i.id)));
  const delSel = async () => { if (!selected.size || !confirm(`Delete ${selected.size} photos?`)) return; setDeleting(true); await imagesApi.bulkDelete(Array.from(selected)); setSelected(new Set()); fetchEvent(); fetchImages(); setDeleting(false); };

  if (loading) return <div style={{ minHeight: "100vh", background: "#080807", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  if (!event) return null;

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link href="/photographer/dashboard" style={{ background: "none", border: "1px solid var(--border)", color: "var(--dim)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div className="logo">
              <div className="logo-mark"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg></div>
              <span className="logo-text">PhotoGen</span>
              <span className="logo-badge">Studio</span>
            </div>
          </div>
          <div className="nav-right">
            <button className="btn-pill" onClick={() => setShowEdit(true)}>Edit</button>
            <button className="btn-pill" onClick={() => eventsApi.update(event.id, { isActive: !event.isActive }).then(fetchEvent)}>
              {event.isActive ? "Archive" : "Restore"}
            </button>
          </div>
        </div>
      </nav>

      <main style={{ padding: "56px 48px 80px" }}>
        {/* Header */}
        <div className="fade-up d1" style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, color: "var(--cream)" }}>
              {event.name}
            </h1>
            {!event.isActive && <span className="tag-dim">Archived</span>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dim)" }}>
            {event.location && <span>✦ {event.location}</span>}
            {event.eventDate && <span>✦ {new Date(event.eventDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid fade-up d2">
          <div className="stat"><div className="stat-label">Photos</div><div className="stat-value"><span>{event.imageCount}</span></div></div>
          <div className="stat"><div className="stat-label">Guests</div><div className="stat-value">{event.participantCount}</div></div>
          <div className="stat"><div className="stat-label">Status</div><div className="stat-value" style={{ fontSize: 28 }}>{event.isActive ? "Active" : "Archived"}</div></div>
        </div>

        {/* Share */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center", border: "1px solid var(--border)", background: "var(--bg2)", padding: 40, borderRadius: 16, marginBottom: 48, position: "relative", overflow: "hidden" }} className="fade-up d3">
          <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: `repeating-linear-gradient(45deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 20px)` }} />
          
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)", marginBottom: 16 }}>Share with guests</div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "16px 24px", background: "rgba(8,8,7,0.4)", borderRadius: 12, border: "1px solid var(--border)", width: "fit-content" }}>
              <div>
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
          
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 160, height: 160, background: "#fff", padding: 12, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px var(--gold-dim)" }}>
              <QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${event.code}`} size={136} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)" }}>Scan to join</div>
          </div>
        </div>

        {/* Photos */}
        <div className="fade-up d4">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <div className="section-heading" style={{ marginTop: 0, flex: 1 }}>
              <span className="section-heading-text">Photos</span>
              {images.length > 0 && <span className="section-heading-count">{images.length}</span>}
              {selected.size > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>· {selected.size} selected</span>}
              <div className="section-heading-line" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {images.length > 0 && (
                <>
                  <button className="btn-pill" onClick={selAll}>{selected.size === images.length ? "Deselect" : "Select all"}</button>
                  {selected.size > 0 && <button className="btn-danger-outline" style={{ fontSize: 10, padding: "6px 14px", borderRadius: 20 }} onClick={delSel} disabled={deleting}>{deleting ? "..." : "Delete"}</button>}
                </>
              )}
              <button className="btn-gold" onClick={() => setShowUploader(true)} style={{ padding: "8px 16px", fontSize: 10 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload
              </button>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="empty">
              <div className="empty-grid" />
              <div className="empty-icon">📸</div>
              <h3 className="empty-title">No photos yet</h3>
              <p className="empty-sub">Upload your event photos and let AI find faces automatically.</p>
              <button className="btn-gold" style={{ margin: "0 auto" }} onClick={() => setShowUploader(true)}>Upload Photos</button>
            </div>
          ) : (
            <div className="photo-grid">
              {images.map(img => (
                <div key={img.id} className="photo-cell" onClick={() => toggle(img.id)} style={{ outline: selected.has(img.id) ? "2px solid var(--gold)" : "none", outlineOffset: -2 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" />
                  <div style={{ position: "absolute", top: 8, left: 8, width: 20, height: 20, border: `2px solid ${selected.has(img.id) ? "var(--gold)" : "rgba(255,255,255,0.3)"}`, background: selected.has(img.id) ? "var(--gold)" : "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: selected.has(img.id) ? 1 : 0, transition: "opacity 0.2s" }}
                    onMouseEnter={(e) => { if (!selected.has(img.id)) e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { if (!selected.has(img.id)) e.currentTarget.style.opacity = "0"; }}>
                    {selected.has(img.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a1508" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  {img.faceCount > 0 && <div style={{ position: "absolute", bottom: 6, right: 6, fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em", padding: "2px 6px", background: "rgba(0,0,0,0.6)", color: "var(--cream)", textTransform: "uppercase" }}>{img.faceCount} faces</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid var(--border)" }} className="fade-up d5">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--red)", marginBottom: 4 }}>Danger Zone</div>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--dim)" }}>Permanently removes all photos and data.</p>
            </div>
            <button className="btn-danger-outline" onClick={async () => {
              if (window.confirm("Delete permanently?")) {
                const res = await eventsApi.delete(event.id);
                if (res.error) {
                  alert(res.error);
                } else {
                  router.push("/photographer/dashboard");
                }
              }
            }}>Delete Event</button>
          </div>
        </div>
      </main>

      {showEdit && <EditModal event={event} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); fetchEvent(); }} />}
      {showUploader && <BulkUploader eventId={eventId} onUploadComplete={() => { fetchEvent(); fetchImages(); }} onClose={() => setShowUploader(false)} />}
    </>
  );
}

function EditModal({ event, onClose, onSuccess }: { event: Event; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(event.name); const [description, setDescription] = useState(event.description || ""); const [location, setLocation] = useState(event.location || "");
  const [eventDate, setEventDate] = useState(event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : ""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) { setError("Name required"); return; } setLoading(true); setError(""); const { error: err } = await eventsApi.update(event.id, { name: name.trim(), description: description.trim() || undefined, location: location.trim() || undefined, eventDate: eventDate || undefined }); if (err) { setError(err); setLoading(false); return; } onSuccess(); };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h2 className="modal-title">Edit Event</h2><button className="modal-close" onClick={onClose}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="field"><label className="field-label">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
            <div className="field"><label className="field-label">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
            <div className="field"><label className="field-label">Location</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
            <div className="field"><label className="field-label">Date</label><input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></div>
            <div className="modal-footer"><button type="button" className="btn-cancel" onClick={onClose}>Cancel</button><button type="submit" className="btn-submit" disabled={loading || !name.trim()}>{loading ? <span className="spinner" style={{ borderTopColor: "#1a1508", borderColor: "rgba(26,21,8,0.2)" }} /> : "Save"}</button></div>
          </form>
        </div>
      </div>
    </div>
  );
}
