"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { eventsApi, Event } from "@/lib/api";

import CustomCursor from "@/components/CustomCursor";
import EventDateTimePicker from "@/components/EventDateTimePicker";
import { showAlert } from "@/components/AlertModal";

/* ─── Global Styles ──────────────────────────────────────────────────────── */
const Styles = () => (
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

        body { 
          background-color: var(--bg); 
          background-image: 
            radial-gradient(circle at top left, rgba(212,175,55,0.15) 0%, transparent 40%),
            radial-gradient(circle at bottom right, rgba(139,105,20,0.15) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(245,224,112,0.03) 0%, transparent 70%);
          background-attachment: fixed;
          color: var(--cream); font-family: var(--font-body); margin: 0; padding: 0; 
        }
        
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: -1;
          background: radial-gradient(circle at 30% 40%, rgba(212,175,55,0.12) 0%, transparent 50%);
          animation: pulseGlow 10s ease-in-out infinite alternate;
        }
        @keyframes pulseGlow {
          0% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          100% { transform: scale(1.4) translate(5%, 5%); opacity: 1; }
        }
        
        .phl-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 500;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 52px; height: 68px;
          border-bottom: 1px solid var(--border);
          background: rgba(5,4,0,0.75);
          backdrop-filter: blur(22px) saturate(1.4);
        }
        .nav-logo { display:flex; align-items:center; gap:11px; text-decoration: none; }
        .nav-mark {
          width:34px; height:34px; border-radius:9px;
          border:1px solid rgba(212,175,55,0.3);
          display:flex; align-items:center; justify-content:center;
          background:rgba(212,175,55,0.07);
          box-shadow:0 0 20px rgba(212,175,55,0.1);
        }
        .nav-logo-text { font-family:var(--font-display); font-size:18px; font-weight:600; color:var(--cream); letter-spacing:0.03em; }

        .btn-gold {
          display:inline-flex; align-items:center; justify-content: center; gap:8px;
          background:linear-gradient(135deg,#8B6914,#D4AF37,#f5e070,#D4AF37,#8B6914);
          background-size:300%;
          color:#0d0b04; font-weight:500; font-size:13px;
          padding:12px 24px; border-radius:8px; border:none;
          letter-spacing:0.04em; transition:background-position 0.4s, transform 0.2s;
          background-position:100% center; cursor: pointer;
        }
        .btn-gold:hover { background-position:0% center; }
        .btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }

        body::after {
          content:'';
          position:fixed; inset:-50%; width:200%; height:200%;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events:none; opacity:0.6; z-index:9990;
          animation:grain 1s steps(1) infinite;
        }
        @keyframes grain {
          0%,100%{transform:translate(0,0)} 20%{transform:translate(-1%,1%)}
          40%{transform:translate(1%,-1%)} 60%{transform:translate(-1%,-1%)}
          80%{transform:translate(1%,1%)}
        }
  `}</style>
);

interface User { id: string; phone: string; name: string; email: string; role: string; avatar: string | null; }

export default function PhotographerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchEvents = useCallback(async () => {
    const { data } = await eventsApi.getAll({ limit: 50 });
    if (data) setEvents(data.events);
    setLoading(false);
  }, []);

  const [eventCode, setEventCode] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!eventCode.trim() || joining) return;
    setJoining(true);
    const { error } = await eventsApi.join(eventCode.trim());
    if (error) { showAlert(error); setJoining(false); return; }
    router.push(`/event/${eventCode.trim().toUpperCase()}`);
    setJoining(false);
  };

  useEffect(() => {
    const s = localStorage.getItem("user");
    const t = localStorage.getItem("token");
    if (!t || !s) { router.push("/photographer/login"); return; }
    const p = JSON.parse(s);
    if (p.role !== "PHOTOGRAPHER") { router.push("/photographer/login"); return; }
    setUser(p);
    fetchEvents();
  }, [router, fetchEvents]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const totalPhotos = events.reduce((s, e) => s + e.imageCount, 0);
  const totalGuests = events.reduce((s, e) => s + e.participantCount, 0);
  const activeEvents = events.filter(e => e.isActive);
  const archivedEvents = events.filter(e => !e.isActive);

  if (!user) return (
    <>
      <Styles />
      <div style={{ minHeight: "100vh", background: "#050400", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ borderTopColor: "#D4AF37", width: 32, height: 32, borderWidth: 3 }} />
      </div>
    </>
  );

  return (
    <>
      <Styles />

      {/* NAV */}
      <nav className="phl-nav">
        <Link href="/" className="nav-logo">
          <div className="nav-mark">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          <span className="nav-logo-text">PhotoGen</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold3)", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 20, padding: "2px 8px", marginLeft: 8 }}>Studio</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500, color: "var(--gold)" }}>
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <button className="btn-gold" style={{ padding: "10px 20px", fontSize: 12 }} onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      {/* MAIN — full bleed, generous side padding */}
      <main style={{ padding: "56px 48px 80px", marginTop: 68 }}>

        {/* HERO */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 52, flexWrap: "wrap", gap: 20 }} className="fade-up d1">
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--dim)", marginBottom: 14 }}>
              Studio Dashboard
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, color: "var(--cream)", letterSpacing: "-0.01em" }}>
              Welcome back,<br />
              <span style={{ fontStyle: "normal", fontWeight: 600, color: "var(--gold2)" }}>{user.name}</span>
            </h1>
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--muted)", marginTop: 12, letterSpacing: "0.02em" }}>
              Your studio. Your vision. Every frame counted.
            </p>
          </div>
          <button className="btn-gold" onClick={() => setShowCreate(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
            New Event
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid fade-up d2" style={{ marginBottom: 64 }}>
          <div className="stat">
            <div className="stat-label">Total Events</div>
            <div className="stat-value">{events.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Photos Taken</div>
            <div className="stat-value"><span>{totalPhotos.toLocaleString()}</span></div>
          </div>
          <div className="stat">
            <div className="stat-label">Guests Served</div>
            <div className="stat-value">{totalGuests.toLocaleString()}</div>
          </div>
        </div>

        {/* JOIN EVENT */}
        <div style={{ position: "relative", border: "1px solid var(--border)", background: "var(--bg2)", padding: "40px", borderRadius: "16px", marginBottom: 64, overflow: "hidden" }} className="fade-up d3">
          <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: `repeating-linear-gradient(45deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 20px)` }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)" }}>
                Have an access code?
              </div>
            </div>
            <p style={{ fontSize: 14, fontWeight: 300, color: "var(--muted)", maxWidth: 500, marginBottom: 24, lineHeight: 1.6 }}>
              Enter a secret code to instantly unlock and view an event gallery.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <input
                className="pg-input"
                type="text"
                placeholder="e.g. WEDDING2026"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.15em", textTransform: "uppercase", width: "100%", maxWidth: 320, padding: "14px 18px", borderRadius: "8px" }}
              />
              <button className="btn-gold" onClick={handleJoin} disabled={joining || !eventCode.trim()} style={{ flexShrink: 0, padding: "14px 28px", borderRadius: "8px" }}>
                {joining ? <span className="spinner" style={{ borderTopColor: "#1a1508", borderColor: "rgba(26,21,8,0.2)", width: 14, height: 14 }} /> : "Unlock Gallery"}
              </button>
            </div>
          </div>
        </div>

        {/* EVENTS */}
        <div className="fade-up d3">
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 16px" }} />
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)" }}>Loading events</p>
            </div>

          ) : events.length === 0 ? (
            <div className="empty">
              <div className="empty-grid" />
              <div className="empty-icon">📷</div>
              <h3 className="empty-title">No events yet</h3>
              <p className="empty-sub">Create your first event to start uploading photos and letting AI find your guests instantly.</p>
              <button className="btn-gold" style={{ margin: "0 auto" }} onClick={() => setShowCreate(true)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
                Create Event
              </button>
            </div>

          ) : (
            <>
              {/* ACTIVE */}
              <div className="section-heading">
                <span className="section-heading-text">Active</span>
                {activeEvents.length > 0 && <span className="section-heading-count">{activeEvents.length}</span>}
                <div className="section-heading-line" />
              </div>

              {activeEvents.length === 0 ? (
                <div className="empty-inline" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 24px", background: "var(--bg2)", border: "1px dashed var(--border2)", borderRadius: "12px", color: "var(--dim)", fontFamily: "var(--font-mono)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>No active events — <button className="link-btn" onClick={() => setShowCreate(true)} style={{ background: "none", border: "none", padding: 0, color: "var(--gold)", font: "inherit", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "4px" }}>create one</button></span>
                </div>
              ) : (
                <div className="events-grid">
                  {activeEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} onUpdate={fetchEvents} index={i} />
                  ))}
                </div>
              )}

              {/* ARCHIVED — always visible */}
              <div className="archived-section">
                <div className="section-heading">
                  <span className="section-heading-text">Archived</span>
                  {archivedEvents.length > 0 && <span className="section-heading-count">{archivedEvents.length}</span>}
                  <div className="section-heading-line" />
                </div>

                {archivedEvents.length === 0 ? (
                  <div className="empty-inline" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 24px", background: "var(--bg2)", border: "1px dashed var(--border2)", borderRadius: "12px", color: "var(--dim)", fontFamily: "var(--font-mono)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span>No archived albums yet — archive an event from its menu to store it here</span>
                  </div>
                ) : (
                  <div className="archived-grid-wrap">
                    <div className="events-grid">
                      {archivedEvents.map((event, i) => (
                        <EventCard key={event.id} event={event} onUpdate={fetchEvents} index={i} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchEvents(); }}
        />
      )}
    </>
  );
}

/* ─── EVENT CARD ─────────────────────────────────────────────────────────── */
function EventCard({ event, onUpdate, index }: { event: Event; onUpdate: () => void; index: number }) {
  const [menu, setMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Classify state
  const isArchived = !event.isActive;
  const cardClass = `ev-card fade-up${isArchived ? " archived" : ""}${menu ? " has-menu" : ""}`;

  const dateStr = new Date(event.eventDate || event.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div
      className={cardClass}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {/* THUMBNAIL */}
      <div className="ev-thumb">
        {event.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.coverImage} alt={event.name} />
        )}
        <div className="ev-thumb-grid" />
        <div className="ev-thumb-fade" />
      </div>

      {/* Top bar: status + menu */}
      <div className="ev-thumb-top">
          {/* Status badge */}
          {event.isActive ? (
            <span className="badge badge-live">Live</span>
          ) : (
            <span className="badge badge-archived">Archived</span>
          )}

          {/* Context menu */}
          <div className="dropdown-wrap">
            <button
              className="icon-btn"
              style={{ background: "rgba(8,8,7,0.6)", backdropFilter: "blur(8px)" }}
              onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="1.2" fill="currentColor" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                <circle cx="12" cy="19" r="1.2" fill="currentColor" />
              </svg>
            </button>

            {menu && (
              <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/photographer/events/${event.id}`}
                  className="dropdown-item"
                  onClick={() => setMenu(false)}
                >
                  View event
                </Link>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    eventsApi.update(event.id, { isActive: !event.isActive }).then(onUpdate);
                    setMenu(false);
                  }}
                >
                  {event.isActive ? "Archive" : "Restore"}
                </button>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item danger"
                  disabled={deleting}
                  onClick={async () => {
                    if (window.confirm("Permanently delete this event and all its photos?")) {
                      setDeleting(true);
                      const res = await eventsApi.delete(event.id);
                      if (res.error) {
                        showAlert(res.error);
                        setDeleting(false);
                      } else {
                        onUpdate();
                      }
                    }
                  }}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>

      {/* BODY */}
      <div className="ev-body">
        {/* Name */}
        <div>
          <h4 className="ev-name">
            <Link href={`/photographer/events/${event.id}`}>{event.name}</Link>
          </h4>
          <div className="ev-meta" style={{ marginTop: 5 }}>
            {event.location && (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
                <span className="ev-meta-dot" />
              </>
            )}
            {dateStr}
          </div>
        </div>

        {/* Mini stats */}
        <div className="ev-mini-stats">
          <div className="ev-mini">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <strong>{event.imageCount}</strong> photos
          </div>
          <div className="ev-mini">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
            <strong>{event.participantCount}</strong> guests
          </div>
        </div>

        {/* Footer */}
        <div className="ev-footer">
          <code className="tag-gold">{event.code}</code>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              className="icon-btn"
              title="Copy code"
              onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(event.code); }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <Link href={`/photographer/events/${event.id}`}>
              <button className="icon-btn" title="Open event">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CREATE MODAL ───────────────────────────────────────────────────────── */
function CreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Event name is required."); return; }
    setLoading(true); setError("");
    const { error: err } = await eventsApi.create({
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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">New Event</h2>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--dim)", marginTop: 4 }}>Set up your album in seconds</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error">⚠ {error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label className="field-label">Event name</label>
              <input type="text" placeholder="Wedding, Birthday, Conference…" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label className="field-label">Description <em>(optional)</em></label>
              <textarea placeholder="A short description…" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="field">
              <label className="field-label">Location <em>(optional)</em></label>
              <input type="text" placeholder="Venue or city…" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Date &amp; time <em>(optional)</em></label>
              <EventDateTimePicker value={eventDate} onChange={setEventDate} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={loading || !name.trim()}>
                {loading
                  ? <span className="spinner" style={{ borderTopColor: "#1a1508", borderColor: "rgba(26,21,8,0.2)" }} />
                  : "Create Event"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}