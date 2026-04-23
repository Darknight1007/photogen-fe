"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { eventsApi, Event } from "@/lib/api";

/* ─── Global Styles ──────────────────────────────────────────────────────── */
const Styles = () => (
  <style>{`
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
      <div style={{ minHeight: "100vh", background: "#080807", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    </>
  );

  return (
    <>
      <Styles />

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <span className="logo-text">PhotoGen</span>
            <span className="logo-badge">Studio</span>
          </div>
          <div className="nav-right">
            <div className="avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
            <button className="btn-pill" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </nav>

      {/* MAIN — full bleed, generous side padding */}
      <main style={{ padding: "56px 48px 80px" }}>

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
        <div className="stats-grid fade-up d2">
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
                <div className="empty-inline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--dim)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span>No active events — <button className="link-btn" onClick={() => setShowCreate(true)}>create one</button></span>
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
                  <div className="empty-inline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--dim)" }}>
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
  const cardClass = `ev-card fade-up${isArchived ? " archived" : ""}`;

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
                        alert(res.error);
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
              <div className="field-row">
                <input
                  type="date"
                  value={eventDate.split("T")[0] || ""}
                  onChange={(e) => setEventDate(`${e.target.value}${eventDate.includes("T") ? eventDate.slice(10) : "T00:00"}`)}
                />
                <input
                  type="time"
                  value={eventDate.split("T")[1] || ""}
                  onChange={(e) => setEventDate(`${eventDate.split("T")[0] || ""}T${e.target.value}`)}
                />
              </div>
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