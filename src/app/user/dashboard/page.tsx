"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { eventsApi } from "@/lib/api";

interface User { id: string; phone: string; name: string; email: string; role: string; avatar: string | null; }

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [eventCode, setEventCode] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("user"); const t = localStorage.getItem("token");
    if (!t || !s) { router.push("/user/login"); return; }
    const p = JSON.parse(s);
    if (p.role !== "USER") { router.push("/user/login"); return; }
    setUser(p);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    (async () => { const { data } = await eventsApi.getMyJoinedEvents(); if (data) setEvents(data.events); setLoadingEvents(false); })();
  }, [user]);

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/"); };

  const handleJoin = async () => {
    if (!eventCode.trim() || joining) return;
    setJoining(true);
    const { error } = await eventsApi.join(eventCode.trim());
    if (error) { alert(error); setJoining(false); return; }
    const { data } = await eventsApi.getMyJoinedEvents();
    if (data) setEvents(data.events);
    setEventCode(""); setJoining(false);
  };

  if (!user) return (
    <div style={{ minHeight: "100vh", background: "#080807", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="logo">
            <div className="logo-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <span className="logo-text">PhotoGen</span>
          </Link>
          <div className="nav-right">
            <div className="avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
            <button className="btn-pill" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </nav>

      <main style={{ padding: "56px 48px 80px" }}>
        {/* Hero */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 56 }} className="fade-up d1">
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5vw, 52px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, color: "var(--cream)" }}>
              Hello,<br />
              <span style={{ fontStyle: "normal", fontWeight: 600, color: "var(--gold2)" }}>{user.name}</span>
            </h1>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 300, color: "var(--muted)", marginTop: 10 }}>
              Join events and discover your photos.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid fade-up d2">
          <div className="stat">
            <div className="stat-label">Your Events</div>
            <div className="stat-value"><span>{events.length}</span></div>
          </div>
          <div className="stat">
            <div className="stat-label">Photos Found</div>
            <div className="stat-value">0</div>
          </div>
          <div className="stat">
            <div className="stat-label">Status</div>
            <div className="stat-value" style={{ fontSize: 28 }}>Active</div>
          </div>
        </div>

        {/* Join Event */}
        <div style={{ border: "1px solid var(--border)", background: "var(--bg2)", padding: "32px", marginBottom: 56 }} className="fade-up d3">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)", marginBottom: 6 }}>
                Join an event
              </div>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--muted)", marginBottom: 16 }}>
                Enter the event code shared by your photographer.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <input
                  className="pg-input"
                  type="text"
                  placeholder="Enter event code"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.15em", textTransform: "uppercase", maxWidth: 280 }}
                />
                <button className="btn-gold" onClick={handleJoin} disabled={joining || !eventCode.trim()} style={{ flexShrink: 0 }}>
                  {joining ? <span className="spinner" style={{ borderTopColor: "#1a1508", borderColor: "rgba(26,21,8,0.2)", width: 14, height: 14 }} /> : "Join Event"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="fade-up d4">
          <div className="section-heading" style={{ marginTop: 0 }}>
            <span className="section-heading-text">Your Events</span>
            {events.length > 0 && <span className="section-heading-count">{events.length}</span>}
            <div className="section-heading-line" />
          </div>

          {loadingEvents ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 16px" }} />
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dim)" }}>Loading</p>
            </div>
          ) : events.length === 0 ? (
            <div className="empty">
              <div className="empty-grid" />
              <div className="empty-icon">📭</div>
              <h3 className="empty-title">No events yet</h3>
              <p className="empty-sub">Enter an event code above to join your first event and see your photos.</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((event, i) => (
                <Link key={event.id} href={`/event/${event.code}`} className="ev-card fade-up" style={{ animationDelay: `${i * 55}ms`, textDecoration: 'none' }}>
                  <div className="ev-body">
                    <div>
                      <h4 className="ev-name">{event.name}</h4>
                      <p className="ev-meta" style={{ marginTop: 5 }}>
                        {new Date(event.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="ev-footer" style={{ padding: "12px 20px" }}>
                    <code className="tag-gold">{event.code}</code>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gold)" }}>
                      View →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}