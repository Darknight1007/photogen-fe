"use client";

import Link from "next/link";

export default function Home() {
  return (
    <>
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
          </div>
          <div className="nav-right">
            <Link href="/user/login"><button className="btn-pill">Find Photos</button></Link>
            <Link href="/photographer/login"><button className="btn-gold" style={{ padding: "9px 18px", fontSize: 10 }}>Get Started</button></Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <main style={{ padding: "80px 48px 100px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }} className="fade-up d1">
          {/* Left - Copy */}
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px, 5.5vw, 68px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.05, color: "var(--cream)", letterSpacing: "-0.01em", marginBottom: 20 }}>
              Event photos,<br />
              <span style={{ fontStyle: "normal", fontWeight: 600, color: "var(--gold2)" }}>found instantly.</span>
            </h1>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--muted)", lineHeight: 1.7, maxWidth: 400, marginBottom: 36 }}>
              Upload event photos, share a code with your guests, and let AI face recognition find everyone&apos;s photos automatically.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Link href="/photographer/login">
                <button className="btn-gold">
                  Start as Photographer
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
              </Link>
              <Link href="/user/login">
                <button className="btn-outline">Find my photos</button>
              </Link>
            </div>
            {/* Trust line */}
            <div style={{ marginTop: 40, display: "flex", gap: 24, alignItems: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)" }}>
                ✦ Face recognition
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)" }}>
                ✦ Bulk upload
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)" }}>
                ✦ Private
              </div>
            </div>
          </div>

          {/* Right - Visual */}
          <div style={{ position: "relative" }}>
            {/* Glow behind */}
            <div style={{ position: "absolute", inset: -40, background: "radial-gradient(circle at center, rgba(201,168,76,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
            {/* Mock gallery */}
            <div style={{ border: "1px solid var(--border)", background: "var(--bg2)", padding: 2, position: "relative" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                {[...Array(9)].map((_, i) => (
                  <div key={i} style={{
                    aspectRatio: "1", background: `linear-gradient(${135 + i * 20}deg, rgba(201,168,76,${0.04 + i * 0.01}), var(--bg3))`,
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", inset: 0, opacity: 0.04,
                      backgroundImage: `repeating-linear-gradient(90deg, var(--gold) 0px, var(--gold) 0.5px, transparent 0.5px, transparent 30px),
                                        repeating-linear-gradient(0deg, var(--gold) 0px, var(--gold) 0.5px, transparent 0.5px, transparent 30px)`,
                    }} />
                    {i === 4 && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--gold)", opacity: 0.3 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Label overlay */}
              <div style={{ position: "absolute", bottom: 12, left: 12, fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)" }}>
                PhotoGen Gallery
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{ marginTop: 100 }} className="fade-up d3">
          <div className="section-heading" style={{ marginTop: 0, marginBottom: 2 }}>
            <span className="section-heading-text">Features</span>
            <div className="section-heading-line" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", marginTop: 0 }}>
            {[
              { icon: "⚡", title: "AI Face Recognition", desc: "Our AI scans every photo, finds every face, and matches guests automatically — no manual tagging needed." },
              { icon: "📸", title: "Bulk Upload", desc: "Drag and drop hundreds of photos at once. We handle the processing while you focus on what matters." },
              { icon: "🔒", title: "Private & Secure", desc: "Events are code-protected. Only invited guests can access their photos. Your clients' privacy, guaranteed." },
            ].map((f) => (
              <div key={f.title} style={{ background: "var(--bg2)", padding: "36px 32px", transition: "background 0.2s", cursor: "default", position: "relative", overflow: "hidden" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg2)")}>
                <div style={{ fontSize: 28, marginBottom: 16, opacity: 0.7 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, color: "var(--cream)", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, fontWeight: 300, color: "var(--muted)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
