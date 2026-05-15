"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { eventsApi } from "@/lib/api";
import CustomCursor from "@/components/CustomCursor";

interface User { id: string; phone: string; name: string; email: string; role: string; avatar: string | null; }

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [eventCode, setEventCode] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("user");
    const t = localStorage.getItem("token");
    if (!t || !s) { router.push("/user/login"); return; }
    const p = JSON.parse(s);
    if (p.role !== "USER") { router.push("/user/login"); return; }
    setUser(p);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await eventsApi.getMyJoinedEvents();
      if (data) setEvents(data.events);
      setLoadingEvents(false);
    })();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleJoin = async () => {
    if (!eventCode.trim() || joining) return;
    setJoining(true);
    const { error } = await eventsApi.join(eventCode.trim());
    if (error) { alert(error); setJoining(false); return; }
    const { data } = await eventsApi.getMyJoinedEvents();
    if (data) setEvents(data.events);
    setEventCode("");
    setJoining(false);
  };

  if (!user) return (
    <div style={{ minHeight: "100vh", background: "#050400", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ borderTopColor: "#D4AF37", width: 32, height: 32 }} />
    </div>
  );

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
        
        .pg-input { width: 100%; box-sizing: border-box; background: rgba(212,175,55,0.03); border: 1px solid rgba(212,175,55,0.15); color: var(--cream); font-family: var(--font-body); font-size: 14px; padding: 12px 16px; border-radius: 8px; outline: none; transition: all 0.2s; }
        .pg-input:focus { border-color: var(--gold); background: rgba(212,175,55,0.06); box-shadow: 0 0 0 3px rgba(212,175,55,0.1); }
        .pg-input::placeholder { color: var(--dim); }
      `}</style>

      <nav className="phl-nav">
        <Link href="/" className="nav-logo">
          <div className="nav-mark">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          <span className="nav-logo-text">PhotoGen</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500, color: "var(--gold)" }}>
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <button className="btn-gold" style={{ padding: "10px 20px", fontSize: 12 }} onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      <main style={{ padding: "56px 48px 80px", marginTop: 68 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 56, position: "relative" }} className="fade-up d1">
          <div style={{ position: "absolute", top: -120, left: -100, width: 400, height: 400, background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px, 6vw, 64px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, color: "var(--cream)" }}>
              Welcome back,<br />
              <span style={{ fontStyle: "normal", fontWeight: 600, color: "var(--gold2)" }}>{user.name}</span>
            </h1>
            <p style={{ marginTop: 16, fontSize: 15, color: "var(--dim)", fontWeight: 300, maxWidth: 400, lineHeight: 1.6 }}>
              Your personal gallery vault. Access your beautiful memories captured by professional photographers.
            </p>
          </div>
        </div>

        <div className="stats-grid fade-up d2" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div className="stat">
            <div className="stat-label">Your Events</div>
            <div className="stat-value"><span>{events.length}</span></div>
          </div>
          <div className="stat">
            <div className="stat-label">Status</div>
            <div className="stat-value" style={{ fontSize: 28 }}>Active</div>
          </div>
        </div>

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
              Enter the secret code provided by your photographer to instantly unlock and view your personalized event gallery.
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

        {/* Events Grid */}
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
                  <div className="ev-thumb" style={{ aspectRatio: "16/9" }}>
                    {event.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.coverImage} alt={event.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                    ) : (
                      <div className="ev-thumb-grid" />
                    )}
                    <div className="ev-thumb-fade" />
                    {!event.coverImage && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.1 }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="ev-body" style={{ padding: "20px 24px" }}>
                    <div>
                      <h4 className="ev-name">{event.name}</h4>
                      <p className="ev-meta" style={{ marginTop: 8 }}>
                        {new Date(event.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="ev-footer" style={{ padding: "14px 24px" }}>
                    <code className="tag-dim">{event.code}</code>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)" }}>
                      Open Gallery →
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