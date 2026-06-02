"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { eventsApi, imagesApi, Event, Image } from "@/lib/api";
import BulkUploader from "@/components/BulkUploader";
import { Toast, useToast } from "@/components/Toast";
import { QRCodeSVG } from "qrcode.react";

/* ─── Shared luxury CSS (mirrors user page) ─── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap');

    :root {
      --gold:     #D4AF37;
      --gold2:    #f5e070;
      --gold3:    #8B6914;
      --gold-dim: rgba(212,175,55,0.25);
      --bg:       #050400;
      --bg2:      #0a0800;
      --bg3:      #0f0c00;
      --border:   rgba(212,175,55,0.18);
      --muted:    rgba(212,175,55,0.5);
      --dim:      rgba(212,175,55,0.3);
      --cream:    #f0e8cc;
      --red:      #e05555;
      --font-display: 'Playfair Display', Georgia, serif;
      --font-body:    'DM Sans', system-ui, sans-serif;
      --font-mono:    'DM Mono', 'Courier New', monospace;
    }

    *, *::before, *::after { box-sizing: border-box; }

    body {
      background-color: var(--bg);
      color: var(--cream);
      font-family: var(--font-body);
      margin: 0; padding: 0;
    }

    body::before {
      content: '';
      position: fixed; inset: 0; pointer-events: none; z-index: -1;
      background-image:
        radial-gradient(circle at top left,    rgba(212,175,55,0.12) 0%, transparent 40%),
        radial-gradient(circle at bottom right, rgba(139,105,20,0.10) 0%, transparent 40%);
    }

    /* ── Nav ── */
    .phl-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 500;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 52px; height: 68px;
      border-bottom: 1px solid var(--border);
      background: rgba(5,4,0,0.96);
      backdrop-filter: blur(12px);
    }
    .nav-logo { display: flex; align-items: center; gap: 11px; text-decoration: none; }
    .nav-mark {
      width: 34px; height: 34px; border-radius: 9px;
      border: 1px solid rgba(212,175,55,0.3);
      display: flex; align-items: center; justify-content: center;
      background: rgba(212,175,55,0.07);
      box-shadow: 0 0 20px rgba(212,175,55,0.1);
    }
    .nav-logo-text {
      font-family: var(--font-display); font-size: 18px;
      font-weight: 600; color: var(--cream); letter-spacing: 0.03em;
    }

    /* ── Animations ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scanLine {
      0%   { top: 0; }
      100% { top: 100%; }
    }

    .fade-up { animation: fadeUp 0.55s ease both; }
    .d1 { animation-delay: 0.05s; }
    .d2 { animation-delay: 0.12s; }
    .d3 { animation-delay: 0.20s; }
    .d4 { animation-delay: 0.28s; }
    .d5 { animation-delay: 0.36s; }

    /* ── Stats grid ── */
    .stats-grid {
      display: grid; grid-template-columns: repeat(3,1fr);
      gap: 1px; border: 1px solid var(--border);
      border-radius: 16px; overflow: hidden;
      margin-bottom: 48px; background: var(--border);
    }
    .stat {
      padding: 32px 36px;
      background: var(--bg2);
      position: relative; overflow: hidden;
      transition: background 0.25s;
    }
    .stat::before {
      content: '';
      position: absolute; inset: 0; opacity: 0;
      background: radial-gradient(circle at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 70%);
      transition: opacity 0.3s;
    }
    .stat:hover::before { opacity: 1; }
    .stat-label {
      font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em;
      text-transform: uppercase; color: var(--gold3); margin-bottom: 12px;
    }
    .stat-value {
      font-family: var(--font-display); font-size: 48px;
      font-weight: 300; line-height: 1; color: var(--gold);
    }
    .stat-value span { font-style: italic; }

    /* ── Section heading ── */
    .section-heading {
      display: flex; align-items: center; gap: 14px;
      margin: 48px 0 24px;
    }
    .section-heading-text {
      font-family: var(--font-mono); font-size: 10px;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold3);
      white-space: nowrap;
    }
    .section-heading-count {
      font-family: var(--font-mono); font-size: 10px;
      color: var(--muted); padding: 2px 8px;
      border: 1px solid var(--border); border-radius: 20px;
    }
    .section-heading-line {
      flex: 1; height: 1px;
      background: linear-gradient(90deg, var(--border) 0%, transparent 100%);
    }

    /* ── Photo grid ── */
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
    .photo-cell {
      position: relative; aspect-ratio: 4/3;
      border-radius: 8px; overflow: hidden;
      cursor: pointer;
      border: 1px solid rgba(212,175,55,0.1);
      transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
      background: var(--bg3);
    }
    .photo-cell:hover {
      border-color: var(--gold);
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.2);
    }
    .photo-cell img {
      width: 100%; height: 100%; object-fit: cover;
      display: block; transition: transform 0.3s;
      will-change: transform;
    }
    .photo-cell:hover img { transform: scale(1.04); }

    /* ── Overlay / Lightbox ── */
    .overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(5,4,0,0.92); backdrop-filter: blur(20px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.2s ease;
    }

    /* ── Modal ── */
    .modal {
      background: var(--bg2); border: 1px solid var(--border);
      border-radius: 20px; width: 100%; max-width: 480px;
      box-shadow: 0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.05);
      overflow: hidden;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 28px 32px 0;
    }
    .modal-title {
      font-family: var(--font-display); font-size: 24px;
      font-weight: 300; font-style: italic; color: var(--cream);
    }
    .modal-close {
      background: none; border: 1px solid var(--border); color: var(--dim);
      width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .modal-close:hover { border-color: var(--gold); color: var(--gold); }
    .modal-body { padding: 24px 32px 32px; }
    .modal-error {
      background: rgba(224,85,85,0.1); border: 1px solid rgba(224,85,85,0.3);
      color: #e05555; padding: 10px 14px; border-radius: 8px;
      font-size: 13px; margin-bottom: 20px;
    }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;
    }

    /* ── Form fields ── */
    .field { margin-bottom: 16px; }
    .field-label {
      display: block; font-family: var(--font-mono); font-size: 9px;
      letter-spacing: 0.15em; text-transform: uppercase;
      color: var(--gold3); margin-bottom: 8px;
    }
    .field input, .field textarea {
      width: 100%; background: rgba(8,8,7,0.5);
      border: 1px solid var(--border); border-radius: 10px;
      color: var(--cream); font-family: var(--font-body); font-size: 14px;
      padding: 12px 16px; outline: none; resize: vertical;
      transition: border-color 0.2s;
    }
    .field input:focus, .field textarea:focus { border-color: var(--gold); }

    /* ── Buttons ── */
    .btn-gold {
      display: inline-flex; align-items: center; gap: 7px;
      background: var(--gold); color: #1a1508;
      border: none; border-radius: 22px; cursor: pointer;
      font-family: var(--font-mono); font-size: 11px;
      font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
      padding: 10px 20px; transition: all 0.2s; white-space: nowrap;
    }
    .btn-gold:hover { background: var(--gold2); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(212,175,55,0.3); }

    .btn-pill {
      background: rgba(212,175,55,0.06); border: 1px solid var(--border);
      color: var(--dim); border-radius: 22px; cursor: pointer;
      font-family: var(--font-mono); font-size: 10px;
      letter-spacing: 0.12em; text-transform: uppercase;
      padding: 8px 18px; transition: all 0.2s;
    }
    .btn-pill:hover { border-color: var(--gold); color: var(--gold); }

    .btn-outline {
      background: none; border: 1px solid var(--border);
      color: var(--dim); border-radius: 22px; cursor: pointer;
      font-family: var(--font-mono); font-size: 10px;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 8px 18px; transition: all 0.2s;
    }
    .btn-outline:hover { border-color: var(--gold); color: var(--gold); }

    .btn-danger-outline {
      background: none; border: 1px solid rgba(224,85,85,0.3);
      color: #e05555; border-radius: 22px; cursor: pointer;
      font-family: var(--font-mono); font-size: 10px;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 8px 18px; transition: all 0.2s;
    }
    .btn-danger-outline:hover { border-color: #e05555; background: rgba(224,85,85,0.07); }

    .btn-cancel {
      background: none; border: 1px solid var(--border);
      color: var(--dim); border-radius: 22px; cursor: pointer;
      font-family: var(--font-mono); font-size: 10px;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 10px 20px; transition: all 0.2s;
    }
    .btn-cancel:hover { border-color: var(--muted); color: var(--muted); }

    .btn-submit {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--gold); color: #1a1508;
      border: none; border-radius: 22px; cursor: pointer;
      font-family: var(--font-mono); font-size: 10px;
      font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
      padding: 10px 24px; transition: all 0.2s; min-width: 80px;
    }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-submit:not(:disabled):hover { background: var(--gold2); }

    .icon-btn {
      background: rgba(212,175,55,0.06); border: 1px solid var(--border);
      color: var(--dim); width: 30px; height: 30px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
    }
    .icon-btn:hover { border-color: var(--gold); color: var(--gold); }

    /* ── Tags ── */
    .tag-dim {
      font-family: var(--font-mono); font-size: 9px;
      letter-spacing: 0.15em; text-transform: uppercase;
      color: var(--gold3); padding: 4px 10px;
      border: 1px solid var(--border); border-radius: 20px;
    }

    /* ── Spinner ── */
    .spinner {
      width: 18px; height: 18px; border-radius: 50%;
      border: 2px solid rgba(212,175,55,0.15);
      border-top-color: var(--gold);
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }

    /* ── Empty state ── */
    .empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px;
      border: 1px dashed var(--border); border-radius: 20px;
      padding: 80px 40px; background: rgba(10,8,0,0.4);
      text-align: center; position: relative; overflow: hidden;
    }
    .empty-grid {
      position: absolute; inset: 0; opacity: 0.02;
      background-image: repeating-linear-gradient(0deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 40px),
                        repeating-linear-gradient(90deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 40px);
    }
    .empty-icon { font-size: 40px; position: relative; }
    .empty-title { font-family: var(--font-display); font-size: 24px; font-weight: 300; font-style: italic; color: var(--cream); margin: 0; position: relative; }
    .empty-sub { font-size: 13px; color: var(--dim); margin: 0; position: relative; max-width: 300px; line-height: 1.6; }

    /* ── Danger zone panel ── */
    .danger-panel {
      display: flex; align-items: center; justify-content: space-between;
      padding: 32px 40px;
      border: 1px solid rgba(224,85,85,0.15);
      border-radius: 16px; background: rgba(224,85,85,0.03);
      position: relative; overflow: hidden;
    }
    .danger-panel::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(224,85,85,0.3), transparent);
    }

    /* ── Corner bracket decoration ── */
    .bracket-box {
      position: relative; border: 1px solid rgba(212,175,55,0.08);
      border-radius: 4px; overflow: hidden;
    }
    .bracket-box::before { content: ''; position: absolute; top: 12px; left: 12px; width: 18px; height: 18px; border-top: 1.5px solid var(--gold); border-left: 1.5px solid var(--gold); z-index: 1; }
    .bracket-box::after  { content: ''; position: absolute; top: 12px; right: 12px; width: 18px; height: 18px; border-top: 1.5px solid var(--gold); border-right: 1.5px solid var(--gold); z-index: 1; }

    /* ── Hatched pattern ── */
    .hatch {
      position: absolute; inset: 0; opacity: 0.03; pointer-events: none;
      background-image: repeating-linear-gradient(45deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 20px);
    }
  `}</style>
);

/* ─── Memoized photo cell for performance ─── */
const PhotoCell = memo(function PhotoCell({
  img, selected, onToggle, onClick
}: {
  img: Image;
  selected: boolean;
  onToggle: (id: string) => void;
  onClick: (img: Image) => void;
}) {
  return (
    <div
      className="photo-cell"
      onClick={() => onClick(img)}
      style={{ outline: selected ? "2px solid var(--gold)" : "none", outlineOffset: -2 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.url} alt="" loading="lazy" decoding="async" />

      {/* Checkbox hit area */}
      <div
        style={{ position: "absolute", top: 4, left: 4, padding: 8 }}
        onClick={(e) => { e.stopPropagation(); onToggle(img.id); }}
      >
        <div style={{
          width: 20, height: 20,
          border: `2px solid ${selected ? "var(--gold)" : "rgba(255,255,255,0.45)"}`,
          background: selected ? "var(--gold)" : "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: selected ? 1 : 0,
          transition: "opacity 0.15s, border-color 0.15s",
          borderRadius: 3,
        }}
          className="cell-check"
        >
          {selected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a1508" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Face badge */}
      {img.faceCount > 0 && (
        <div style={{
          position: "absolute", bottom: 6, right: 6,
          fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em",
          padding: "3px 7px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          color: "var(--gold)", textTransform: "uppercase", borderRadius: 4,
          border: "1px solid rgba(212,175,55,0.2)"
        }}>
          {img.faceCount} ✦
        </div>
      )}

      {/* hover reveal on checkbox */}
      <style>{`.photo-cell:hover .cell-check { opacity: 1 !important; }`}</style>
    </div>
  );
});

/* ─── Main page ─── */
export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [expandedImage, setExpandedImage] = useState<Image | null>(null);
  const [settingCover, setSettingCover] = useState(false);
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const fetchEvent = useCallback(async () => {
    const { data } = await eventsApi.getById(eventId);
    if (data) setEvent(data.event);
    else router.push("/photographer/dashboard");
    setLoading(false);
  }, [eventId, router]);

  const fetchImages = useCallback(async () => {
    const { data } = await imagesApi.getEventImages(eventId, { limit: 100 });
    if (data) setImages(data.images);
  }, [eventId]);

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.push("/photographer/login"); return; }
    fetchEvent();
    fetchImages();
  }, [router, fetchEvent, fetchImages]);

  const copy = useCallback((t: string, k: string) => {
    navigator.clipboard.writeText(t);
    setCopied(k);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);

  const selAll = useCallback(() => {
    setSelected(prev => prev.size === images.length ? new Set() : new Set(images.map(i => i.id)));
  }, [images]);

  const delSel = useCallback(async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} photo${selected.size > 1 ? "s" : ""}?`)) return;
    setDeleting(true);
    await imagesApi.bulkDelete(Array.from(selected));
    setSelected(new Set());
    fetchEvent();
    fetchImages();
    setDeleting(false);
  }, [selected, fetchEvent, fetchImages]);

  const handleSetAlbumCover = useCallback(async () => {
    if (!event || !expandedImage || settingCover) return;

    const previousCover = event.coverImage;
    const isSameImage = previousCover === expandedImage.url;

    setSettingCover(true);
    const { error } = await eventsApi.update(event.id, { coverImage: expandedImage.url });
    setSettingCover(false);

    if (error) {
      showToast(error || "Failed to set album cover", "error");
      return;
    }

    await fetchEvent();

    if (isSameImage) {
      showToast("Already album cover", "success");
    } else if (previousCover) {
      showToast("Album cover updated", "success");
    } else {
      showToast("Set as album cover", "success");
    }
  }, [event, expandedImage, settingCover, fetchEvent, showToast]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#050400", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  if (!event) return null;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${event.code}` : `/join/${event.code}`;

  return (
    <>
      <GlobalStyles />
      <Toast toast={toast} onDismiss={dismissToast} />

      {/* ── Nav ── */}
      <nav className="phl-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => router.push("/photographer/dashboard")}
            className="btn-pill"
            style={{ width: 34, height: 34, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link href="/" className="nav-logo">
            <div className="nav-mark">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <span className="nav-logo-text">
              PhotoGen{" "}
              <span style={{ color: "var(--gold3)", fontWeight: 400 }}>// Studio</span>
            </span>
          </Link>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-pill" onClick={() => setShowEdit(true)}>Edit Event</button>
          <button
            className="btn-pill"
            onClick={() => eventsApi.update(event.id, { isActive: !event.isActive }).then(fetchEvent)}
          >
            {event.isActive ? "Archive" : "Restore"}
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={{ padding: "40px 52px 100px", marginTop: 68 }}>

        {/* Event header */}
        <div className="fade-up d1" style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(36px,4vw,52px)",
              fontWeight: 300, fontStyle: "italic", lineHeight: 1.1,
              color: "var(--cream)", margin: 0
            }}>
              {event.name}
            </h1>
            {!event.isActive && <span className="tag-dim">Archived</span>}
          </div>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 20,
            fontFamily: "var(--font-mono)", fontSize: 10,
            letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)"
          }}>
            {event.location && <span>✦ {event.location}</span>}
            {event.eventDate && (
              <span>✦ {new Date(event.eventDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid fade-up d2">
          <div className="stat">
            <div className="stat-label">Photos</div>
            <div className="stat-value"><span>{event.imageCount}</span></div>
          </div>
          <div className="stat">
            <div className="stat-label">Guests</div>
            <div className="stat-value">{event.participantCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Status</div>
            <div className="stat-value" style={{ fontSize: 28, letterSpacing: "0.02em" }}>
              {event.isActive ? "Active" : "Archived"}
            </div>
          </div>
        </div>

        {/* Share / QR panel */}
        <div
          className="fade-up d3 bracket-box"
          style={{
            display: "grid", gridTemplateColumns: "1fr auto", gap: 40,
            alignItems: "center", padding: 40, borderRadius: 16,
            background: "var(--bg2)", marginBottom: 48,
            position: "relative", overflow: "hidden",
          }}
        >
          <div className="hatch" />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "var(--gold3)", marginBottom: 20
            }}>
              ✦ Share with guests
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 24,
              padding: "20px 28px", background: "rgba(8,8,7,0.5)",
              borderRadius: 14, border: "1px solid var(--border)",
              width: "fit-content"
            }}>
              <div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.15em",
                  textTransform: "uppercase", color: "var(--gold3)", marginBottom: 8
                }}>Event Code</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <code style={{
                    fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 400,
                    color: "var(--cream)", letterSpacing: "0.1em"
                  }}>{event.code}</code>
                  <button className="icon-btn" onClick={() => copy(event.code, "code")}>
                    {copied === "code"
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    }
                  </button>
                </div>
              </div>

              <div style={{ width: 1, height: 48, background: "var(--border)" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold3)" }}>Share Link</div>
                <button className="btn-outline" onClick={() => copy(shareUrl, "link")}>
                  {copied === "link" ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 168, height: 168, background: "#fff", padding: 14,
              borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.25)"
            }}>
              <QRCodeSVG value={shareUrl} size={140} />
            </div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "var(--dim)"
            }}>Scan to join</div>
          </div>
        </div>

        {/* ── Photos section ── */}
        <div className="fade-up d4">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="section-heading" style={{ marginTop: 0, flex: 1 }}>
              <span className="section-heading-text">Photos</span>
              {images.length > 0 && <span className="section-heading-count">{images.length}</span>}
              {selected.size > 0 && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>
                  · {selected.size} selected
                </span>
              )}
              <div className="section-heading-line" />
            </div>

            <div style={{ display: "flex", gap: 8, marginLeft: 20 }}>
              {images.length > 0 && (
                <>
                  <button className="btn-pill" onClick={selAll}>
                    {selected.size === images.length ? "Deselect all" : "Select all"}
                  </button>
                  {selected.size > 0 && (
                    <button
                      className="btn-danger-outline"
                      style={{ fontSize: 10, padding: "6px 16px", borderRadius: 20 }}
                      onClick={delSel} disabled={deleting}
                    >
                      {deleting ? "..." : `Delete (${selected.size})`}
                    </button>
                  )}
                  <button className="btn-gold" onClick={() => setShowUploader(true)} style={{ padding: "8px 18px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload
                  </button>
                </>
              )}
            </div>
          </div>

          {images.length === 0 ? (
            <div className="empty">
              <div className="empty-grid" />
              <div className="empty-icon">📸</div>
              <h3 className="empty-title">No photos yet</h3>
              <p className="empty-sub">Upload your event photos and let AI find faces automatically.</p>
              <button className="btn-gold" style={{ margin: "0 auto" }} onClick={() => setShowUploader(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Photos
              </button>
            </div>
          ) : (
            <div className="photo-grid">
              {images.map(img => (
                <PhotoCell
                  key={img.id}
                  img={img}
                  selected={selected.has(img.id)}
                  onToggle={toggle}
                  onClick={setExpandedImage}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Danger zone ── */}
        <div className="fade-up d5" style={{ marginTop: 64 }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "rgba(224,85,85,0.5)",
            marginBottom: 16
          }}>
            ✦ Danger Zone
          </div>
          <div className="danger-panel">
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 300, fontStyle: "italic", color: "var(--cream)", marginBottom: 6 }}>
                Delete this event
              </div>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--dim)", margin: 0 }}>
                Permanently removes all photos, guest data, and event history. This cannot be undone.
              </p>
            </div>
            <button
              className="btn-danger-outline"
              style={{ padding: "10px 24px" }}
              onClick={async () => {
                if (window.confirm("Delete this event permanently?")) {
                  const res = await eventsApi.delete(event.id);
                  if (res.error) alert(res.error);
                  else router.push("/photographer/dashboard");
                }
              }}
            >
              Delete Event
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showEdit && (
        <EditModal
          event={event}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); fetchEvent(); }}
        />
      )}
      {showUploader && (
        <BulkUploader
          eventId={eventId}
          onUploadComplete={() => { fetchEvent(); fetchImages(); }}
          onClose={() => setShowUploader(false)}
        />
      )}

      {/* ── Expanded / lightbox ── */}
      {expandedImage && (
        <div className="overlay" onClick={() => setExpandedImage(null)} style={{ flexDirection: "column", padding: 24 }}>
          <button
            onClick={() => setExpandedImage(null)}
            style={{
              position: "absolute", top: 20, right: 20,
              background: "rgba(0,0,0,0.5)", border: "1px solid var(--border)",
              color: "var(--cream)", width: 40, height: 40, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", zIndex: 10
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleSetAlbumCover(); }}
            disabled={settingCover}
            style={{
              position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
              background: "var(--gold)", color: "#1a1508",
              border: "none", padding: "10px 22px", borderRadius: 22,
              fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em",
              textTransform: "uppercase", fontWeight: 600,
              cursor: settingCover ? "wait" : "pointer",
              opacity: settingCover ? 0.75 : 1,
              zIndex: 10, display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(212,175,55,0.4)"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {settingCover ? "Setting…" : "Set as Album Cover"}
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandedImage.url} alt=""
            style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.8)", border: "1px solid rgba(212,175,55,0.15)" }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

/* ─── Edit modal ─── */
function EditModal({
  event, onClose, onSuccess
}: {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description || "");
  const [location, setLocation] = useState(event.location || "");
  const [eventDate, setEventDate] = useState(event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Event name is required."); return; }
    setLoading(true); setError("");
    const { error: err } = await eventsApi.update(event.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      eventDate: eventDate || undefined,
    });
    if (err) { setError(err); setLoading(false); return; }
    onSuccess();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Event</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label className="field-label">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label className="field-label">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="field">
              <label className="field-label">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Date & Time</label>
              <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={loading || !name.trim()}>
                {loading
                  ? <span className="spinner" style={{ borderTopColor: "#1a1508", borderColor: "rgba(26,21,8,0.2)" }} />
                  : "Save Changes"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}