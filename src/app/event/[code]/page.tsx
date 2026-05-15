"use client";

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { eventsApi } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";

/* ─── Memoized photo card – prevents grid re-renders on tab/search state ─── */
const PhotoCard = memo(function PhotoCard({
  img,
  isMatched,
  onClick,
}: {
  img: any;
  isMatched: boolean;
  onClick: (img: any) => void;
}) {
  return (
    <div className="sc-card" onClick={() => onClick(img)}>
      {isMatched && (
        <div className="sc-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.url}
        className="sc-img"
        alt=""
        loading="lazy"
        decoding="async"
      />
    </div>
  );
});

export default function PublicEventPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [event, setEvent] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searching, setSearching] = useState(false);
  const [foundImages, setFoundImages] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "matches">("all");

  /* ── Data fetch ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await eventsApi.getByCode(code);
      if (!data || cancelled) return;
      setEvent(data.event);
      const { data: img } = await eventsApi.getJoinedEventImages(data.event.id, { limit: 100 });
      if (img && !cancelled) setImages(img.images);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [code]);

  /* ── Selfie / face search ── */
  const handleSelfieUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSearching(true);
    setHasSearched(true);
    setActiveTab("matches");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const pythonRes = await fetch("http://localhost:8000/process-selfie", { method: "POST", body: formData });
      if (!pythonRes.ok) throw new Error("Python Brain error");

      const pythonData = await pythonRes.json();
      if (!pythonData.faces?.length) {
        alert("No face detected. Try a clearer photo!");
        setSearching(false);
        return;
      }

      const response = await fetch("http://localhost:5001/images/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ selfieEmbedding: pythonData.faces[0].embedding, eventId: event.id }),
      });

      if (!response.ok) throw new Error("Node Backend error");
      const searchData = await response.json();
      setFoundImages(searchData.results || []);
    } catch (err) {
      console.error(err);
      alert("Search failed. Check if servers are running.");
    } finally {
      setSearching(false);
    }
  }, [event?.id]);

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const openLightbox = useCallback((img: any) => setLightbox(img), []);

  /* ── Derived ── */
  const displayImages = activeTab === "matches" && hasSearched ? foundImages : images;
  const matchSet = new Set(foundImages.map((f: any) => f.id));
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${event?.code}` : `/join/${event?.code ?? ""}`;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#050400", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ borderTopColor: "#D4AF37", width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );
  if (!event) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap');

        :root {
          --gold:  #D4AF37;
          --gold2: #f5e070;
          --gold3: #8B6914;
          --bg:    #050400;
          --bg2:   #0a0800;
          --border: rgba(212,175,55,0.18);
          --muted: rgba(212,175,55,0.5);
          --dim:   rgba(212,175,55,0.3);
          --cream: #f0e8cc;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body:    'DM Sans', system-ui, sans-serif;
          --font-mono:    'DM Mono', 'Courier New', monospace;
        }

        *, *::before, *::after { box-sizing: border-box; }

        body {
          background-color: var(--bg);
          color: var(--cream); font-family: var(--font-body); margin: 0; padding: 0;
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
        .nav-logo { display:flex; align-items:center; gap:11px; text-decoration: none; }
        .nav-mark {
          width:34px; height:34px; border-radius:9px;
          border:1px solid rgba(212,175,55,0.3);
          display:flex; align-items:center; justify-content:center;
          background:rgba(212,175,55,0.07);
          box-shadow:0 0 20px rgba(212,175,55,0.1);
        }

        /* ── Animations ── */
        @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes scanLine { 0% { top:0; } 100% { top:100%; } }
        @keyframes pulse   { 0%,100% { opacity:0.4; } 50% { opacity:1; } }

        .fade-up { animation: fadeUp 0.55s ease both; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.12s; }
        .d3 { animation-delay: 0.20s; }
        .d4 { animation-delay: 0.28s; }

        /* ── Stats ── */
        .stats-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1px; border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden;
          margin-bottom: 48px; background: var(--border);
        }
        .stat { padding: 32px 36px; background: var(--bg2); position: relative; overflow: hidden; }
        .stat::before {
          content: ''; position: absolute; inset: 0; opacity: 0;
          background: radial-gradient(circle at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 70%);
          transition: opacity 0.3s;
        }
        .stat:hover::before { opacity: 1; }
        .stat-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold3); margin-bottom: 12px; }
        .stat-value { font-family: var(--font-display); font-size: 48px; font-weight: 300; line-height: 1; color: var(--gold); }
        .stat-value span { font-style: italic; }

        /* ── Layout ── */
        .scanner-layout {
          display: flex; gap: 40px;
          min-height: calc(100vh - 280px);
          padding: 0 52px 60px;
        }
        .scanner-sidebar {
          width: 280px; flex-shrink: 0;
          display: flex; flex-direction: column; gap: 36px;
          border-right: 1px solid var(--border);
          padding-right: 40px;
        }
        .scanner-main { flex: 1; display: flex; flex-direction: column; gap: 20px; }

        .side-label {
          font-family: var(--font-mono); font-size: 9px;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold3);
          margin-bottom: 16px;
        }

        /* ── Face scan box ── */
        .face-scan-box {
          position: relative; width: 100%; aspect-ratio: 1;
          border: 1px solid rgba(212,175,55,0.1); border-radius: 4px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: rgba(10,8,0,0.4); overflow: hidden;
          transition: border-color 0.3s;
        }
        .face-scan-box.clickable { cursor: pointer; }
        .face-scan-box.clickable:hover { border-color: rgba(212,175,55,0.25); }

        /* Corner brackets */
        .face-scan-box::before { content:''; position:absolute; top:14px; left:14px; width:20px; height:20px; border-top:1.5px solid var(--gold); border-left:1.5px solid var(--gold); }
        .face-scan-box::after  { content:''; position:absolute; top:14px; right:14px; width:20px; height:20px; border-top:1.5px solid var(--gold); border-right:1.5px solid var(--gold); }
        .fsb-br { position:absolute; bottom:14px; right:14px; width:20px; height:20px; border-bottom:1.5px solid var(--gold); border-right:1.5px solid var(--gold); }
        .fsb-bl { position:absolute; bottom:14px; left:14px;  width:20px; height:20px; border-bottom:1.5px solid var(--gold); border-left:1.5px solid var(--gold); }

        /* ── Scan line ── */
        .scan-line {
          position:absolute; left:0; right:0; height:1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity:0.5; animation: scanLine 2s linear infinite;
        }

        /* ── Scan circle ── */
        .scan-circle {
          width:130px; height:130px; border-radius:50%;
          border:1px dashed var(--dim);
          display:flex; align-items:center; justify-content:center;
          position:relative;
        }
        .scan-circle.active {
          border: 1.5px solid var(--gold);
          background: rgba(212,175,55,0.06);
          box-shadow: 0 0 30px rgba(212,175,55,0.1), inset 0 0 30px rgba(212,175,55,0.05);
        }

        /* ── Stat rows ── */
        .stat-row {
          display:flex; justify-content:space-between; align-items:center;
          font-family:var(--font-mono); font-size:12px; margin-bottom:18px;
        }
        .stat-row-label { color: var(--gold3); letter-spacing:0.15em; text-transform:uppercase; }
        .stat-row-val   { color: var(--gold); }

        /* ── Tabs ── */
        .tab-btn {
          background:none; border:none;
          font-family:var(--font-mono); font-size:11px;
          letter-spacing:0.15em; text-transform:uppercase;
          color:var(--dim); cursor:pointer; padding:8px 0;
          transition:color 0.2s; position:relative;
        }
        .tab-btn.active { color:var(--gold); }
        .tab-btn.active::after {
          content:''; position:absolute; bottom:-1px; left:0; right:0;
          height:1px; background: var(--gold);
        }

        /* ── Photo grid ── */
        .sc-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));
          gap:14px;
        }
        .sc-card {
          position:relative; aspect-ratio:4/3;
          border:1px solid rgba(212,175,55,0.15);
          border-radius:8px; background:rgba(10,8,0,0.6);
          overflow:hidden; cursor:pointer;
          transition:border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          will-change: transform;
        }
        .sc-card:hover {
          border-color: var(--gold);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }
        .sc-badge {
          position:absolute; top:10px; right:10px;
          width:24px; height:24px;
          background:var(--gold); border-radius:50%;
          z-index:2; display:flex; align-items:center; justify-content:center;
          color:#000; box-shadow:0 2px 8px rgba(0,0,0,0.4);
        }
        .sc-img {
          width:100%; height:100%; object-fit:cover; display:block;
          transition:transform 0.3s;
        }
        .sc-card:hover .sc-img { transform:scale(1.04); }

        /* ── Header line ── */
        .sc-header-line {
          height:1px;
          background:linear-gradient(90deg, var(--gold) 0%, transparent 80%);
          margin-bottom:4px;
        }

        /* ── Empty ── */
        .empty-box {
          padding:80px 40px;
          border:1px dashed rgba(212,175,55,0.15);
          border-radius:16px; text-align:center;
          background:rgba(10,8,0,0.5);
        }

        /* ── Spinner ── */
        .spinner {
          display:inline-block; width:18px; height:18px; border-radius:50%;
          border:2px solid rgba(212,175,55,0.15); border-top-color:var(--gold);
          animation: spin 0.6s linear infinite;
        }

        /* ── Buttons ── */
        .btn-pill {
          background:rgba(212,175,55,0.06); border:1px solid var(--border);
          color:var(--dim); border-radius:22px; cursor:pointer;
          font-family:var(--font-mono); font-size:10px;
          letter-spacing:0.12em; text-transform:uppercase;
          padding:8px 18px; transition:all 0.2s;
        }
        .btn-pill:hover { border-color:var(--gold); color:var(--gold); }

        .btn-outline {
          background:none; border:1px solid var(--border);
          color:var(--dim); border-radius:22px; cursor:pointer;
          font-family:var(--font-mono); font-size:10px;
          letter-spacing:0.1em; text-transform:uppercase;
          padding:8px 18px; transition:all 0.2s;
        }
        .btn-outline:hover { border-color:var(--gold); color:var(--gold); }

        .icon-btn {
          background:rgba(212,175,55,0.06); border:1px solid var(--border);
          color:var(--dim); width:30px; height:30px; border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all 0.2s;
        }
        .icon-btn:hover { border-color:var(--gold); color:var(--gold); }

        .tag-dim {
          font-family:var(--font-mono); font-size:9px;
          letter-spacing:0.15em; text-transform:uppercase;
          color:var(--gold3); padding:4px 10px;
          border:1px solid var(--border); border-radius:20px;
        }

        /* ── Share panel ── */
        .share-panel {
          display:grid; grid-template-columns:1fr auto; gap:40px;
          align-items:center; border:1px solid var(--border);
          background:var(--bg2); padding:40px; border-radius:16px;
          margin-bottom:24px; position:relative; overflow:hidden;
        }
        .share-hatch {
          position:absolute; inset:0; opacity:0.03; pointer-events:none;
          background-image:repeating-linear-gradient(45deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 20px);
        }

        @media (max-width: 768px) {
          .phl-nav { padding: 0 20px; }
          .scanner-layout { flex-direction:column; padding:0 20px 40px; gap:24px; }
          .scanner-sidebar { width:100%; border-right:none; border-bottom:1px solid var(--border); padding-right:0; padding-bottom:32px; flex-direction:row; flex-wrap:wrap; }
          .stats-grid { grid-template-columns:repeat(3,1fr); }
          .share-panel { grid-template-columns:1fr; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className="phl-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => router.push("/user/dashboard")}
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
            <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--cream)", letterSpacing: "0.03em" }}>
              PhotoGen
            </span>
          </Link>
        </div>
      </nav>

      {/* ── Header ── */}
      <main style={{ padding: "40px 52px 24px", marginTop: 68 }}>
        <div className="fade-up d1" style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(36px,4vw,52px)",
              fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, color: "var(--cream)", margin: 0
            }}>
              {event.name}
            </h1>
            {!event.isActive && <span className="tag-dim">Archived</span>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)" }}>
            {event.location && <span>✦ {event.location}</span>}
            {event.eventDate && <span>✦ {new Date(event.eventDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid fade-up d2">
          <div className="stat"><div className="stat-label">Photos</div><div className="stat-value"><span>{images.length}</span></div></div>
          <div className="stat"><div className="stat-label">Guests</div><div className="stat-value">{event.participantCount || 1}</div></div>
          <div className="stat">
            <div className="stat-label">Status</div>
            <div className="stat-value" style={{ fontSize: 28 }}>{event.isActive ? "Active" : "Ended"}</div>
          </div>
        </div>

        {/* Share panel */}
        <div className="share-panel fade-up d3">
          <div className="share-hatch" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold3)", marginBottom: 20 }}>
              ✦ Share with guests
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 28px", background: "rgba(8,8,7,0.5)", borderRadius: 14, border: "1px solid var(--border)", width: "fit-content" }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold3)", marginBottom: 8 }}>Event Code</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <code style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 400, color: "var(--cream)", letterSpacing: "0.1em" }}>{event.code}</code>
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
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 168, height: 168, background: "#fff", padding: 14, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.25)" }}>
              <QRCodeSVG value={shareUrl} size={140} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--dim)" }}>Scan to join</div>
          </div>
        </div>
      </main>

      {/* ── Scanner layout ── */}
      <div className="scanner-layout">
        {/* LEFT SIDEBAR */}
        <div className="scanner-sidebar fade-up d1">
          <div>
            <div className="side-label">Your Face</div>
            {hasSearched ? (
              <div className="face-scan-box">
                <div className="fsb-bl" /><div className="fsb-br" />
                {searching && <div className="scan-line" />}
                <div className={`scan-circle ${!searching ? "active" : ""}`}>
                  {searching
                    ? <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                    : (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 22v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                      </svg>
                    )
                  }
                </div>
                <div style={{
                  color: searching ? "var(--gold)" : "#4ade80",
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  letterSpacing: "0.18em", marginTop: 28,
                  animation: searching ? "pulse 1.5s ease infinite" : "none"
                }}>
                  {searching ? "SCANNING..." : "✓ MATCHED"}
                </div>
              </div>
            ) : (
              <div className="face-scan-box clickable" onClick={() => fileInputRef.current?.click()}>
                <div className="fsb-bl" /><div className="fsb-br" />
                <div className="scan-circle">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold3)" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div style={{ color: "var(--gold3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", marginTop: 28 }}>
                  UPLOAD SELFIE
                </div>
              </div>
            )}
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleSelfieUpload} />
          </div>

          {/* Stats */}
          <div style={{ paddingBottom: 28, borderBottom: "1px solid var(--border)" }}>
            <div className="stat-row"><span className="stat-row-label">Photos</span><span className="stat-row-val">{images.length}</span></div>
            <div className="stat-row"><span className="stat-row-label">Scanned</span><span className="stat-row-val">{searching ? "..." : (hasSearched ? images.length : 0)}</span></div>
            <div className="stat-row" style={{ marginBottom: 0 }}><span className="stat-row-label">Matched</span><span className="stat-row-val">{hasSearched ? foundImages.length : "—"}</span></div>
          </div>

          {hasSearched && !searching && (
            <button
              className="tab-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: "block", textAlign: "left", color: "var(--dim)", fontSize: 11 }}
            >
              ↺ Scan again
            </button>
          )}
        </div>

        {/* MAIN AREA */}
        <div className="scanner-main fade-up d2">
          <div className="sc-header-line" />

          {/* Tabs */}
          <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
            <button className={`tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
              All Photos
            </button>
            {hasSearched && (
              <button className={`tab-btn ${activeTab === "matches" ? "active" : ""}`} onClick={() => setActiveTab("matches")}>
                Matched ({foundImages.length})
              </button>
            )}
          </div>

          {/* Grid */}
          {searching ? (
            <div style={{ padding: "80px", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto 20px", width: 32, height: 32, borderWidth: 3 }} />
              <p style={{ color: "var(--gold3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", animation: "pulse 1.5s ease infinite" }}>
                Analyzing facial topography...
              </p>
            </div>
          ) : displayImages.length === 0 ? (
            <div className="empty-box">
              <p style={{ color: "var(--dim)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
                {activeTab === "matches"
                  ? "No matches found — try another selfie."
                  : "No photos in this event yet."
                }
              </p>
            </div>
          ) : (
            <div className="sc-grid">
              {displayImages.map((img: any) => (
                <PhotoCard
                  key={img.id}
                  img={img}
                  isMatched={matchSet.has(img.id)}
                  onClick={openLightbox}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(5,4,0,0.94)", backdropFilter: "blur(20px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.2s" }}
          onClick={() => setLightbox(null)}
        >
          <button
            style={{ position: "absolute", top: 20, right: 20, background: "none", border: "1px solid var(--border)", color: "var(--gold)", cursor: "pointer", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setLightbox(null)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url} alt=""
            style={{ maxWidth: "90%", maxHeight: "90vh", objectFit: "contain", borderRadius: 6, border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}