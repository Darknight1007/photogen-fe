"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
/* ═══════════════════════════════════════════════
   PARTICLE CANVAS — interactive constellation
═══════════════════════════════════════════════ */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -999, y: -999 });
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let raf: number;
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number; max: number };
    const make = (): P => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.55 + 0.1,
      life: 0, max: 200 + Math.random() * 250,
    });
    const pts: P[] = Array.from({ length: 130 }, make);
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      // mouse glow
      const g = ctx.createRadialGradient(mouse.current.x, mouse.current.y, 0, mouse.current.x, mouse.current.y, 300);
      g.addColorStop(0, "rgba(212,175,55,0.08)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // edges + dots
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(212,175,55,${0.13 * (1 - d / 120)})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
        const p = pts[i];
        p.life++;
        p.x += p.vx; p.y += p.vy;
        const mdx = mouse.current.x - p.x, mdy = mouse.current.y - p.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 220) { p.vx += mdx * 0.00005; p.vy += mdy * 0.00005; }
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > 0.7) { p.vx *= 0.7 / spd; p.vy *= 0.7 / spd; }
        const fade = p.life < 40 ? p.life / 40 : p.life > p.max - 40 ? (p.max - p.life) / 40 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.a * fade})`;
        ctx.fill();
        if (p.life >= p.max || p.x < 0 || p.x > W || p.y < 0 || p.y > H) pts[i] = make();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); window.removeEventListener("mousemove", onMove); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}
/* ═══════════════════════════════════════════════
   CUSTOM CURSOR
═══════════════════════════════════════════════ */
function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", move);
    let raf: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const loop = () => {
      ringPos.current.x = lerp(ringPos.current.x, pos.current.x, 0.1);
      ringPos.current.y = lerp(ringPos.current.y, pos.current.y, 0.1);
      if (dot.current) {
        dot.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate(${ringPos.current.x - 16}px, ${ringPos.current.y - 16}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    const over = () => { if (ring.current) ring.current.style.transform += " scale(1.8)"; };
    const out = () => { };
    document.querySelectorAll("a,button").forEach(el => { el.addEventListener("mouseenter", over); el.addEventListener("mouseleave", out); });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", move); };
  }, []);
  return (
    <>
      <div ref={dot} style={{ position: "fixed", top: 0, left: 0, width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", pointerEvents: "none", zIndex: 9999, mixBlendMode: "screen" }} />
      <div ref={ring} style={{ position: "fixed", top: 0, left: 0, width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.6)", pointerEvents: "none", zIndex: 9998, transition: "transform 0.12s cubic-bezier(.23,1,.32,1)", mixBlendMode: "screen" }} />
    </>
  );
}
/* ═══════════════════════════════════════════════
   APP MOCKUP — animated RushCam UI
═══════════════════════════════════════════════ */
// Minimal person SVG for a photo tile
function PersonSVG({ seed, highlight }: { seed: number; highlight: boolean }) {
  const hx = 20 + (seed % 3) * 8;
  const hy = 10 + (seed % 2) * 6;
  const bg = highlight ? "#1a1405" : "#0d0b04";
  const accent = highlight ? "rgba(212,175,55,0.5)" : "rgba(212,175,55,0.1)";
  return (
    <svg viewBox="0 0 80 90" style={{ display: "block", width: "100%", height: "100%" }}>
      <rect width="80" height="90" fill={bg} />
      {/* subtle bg shapes for depth */}
      <rect x="0" y="55" width="80" height="35" fill={highlight ? "rgba(212,175,55,0.04)" : "rgba(255,255,255,0.01)"} />
      {/* head */}
      <ellipse cx={hx + 20} cy={hy + 18} rx="14" ry="15" fill={highlight ? "#2a1e06" : "#181408"} stroke={accent} strokeWidth="0.6" />
      {/* body */}
      <ellipse cx={hx + 20} cy={hy + 58} rx="22" ry="20" fill={highlight ? "#221a05" : "#131009"} />
      {/* eye dots only on highlight */}
      {highlight && (
        <>
          <circle cx={hx + 14} cy={hy + 15} r="1.5" fill="#D4AF37" fillOpacity="0.8" />
          <circle cx={hx + 26} cy={hy + 15} r="1.5" fill="#D4AF37" fillOpacity="0.8" />
          <circle cx={hx + 20} cy={hy + 22} r="1" fill="#D4AF37" fillOpacity="0.5" />
        </>
      )}
    </svg>
  );
}
function AppMockup() {
  const CYCLE = 6000; // ms for full loop
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [revealedMatches, setRevealedMatches] = useState<Set<number>>(new Set());
  // which tiles are matches (fixed)
  const MATCHES = [1, 3, 5, 7];
  const TILES = Array.from({ length: 9 }, (_, i) => i);
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;
    const run = () => {
      // reset
      setPhase("idle");
      setProgress(0);
      setMatchCount(0);
      setRevealedMatches(new Set());
      t1 = setTimeout(() => {
        setPhase("scanning");
        // animate progress
        let p = 0;
        interval = setInterval(() => {
          p += 1.4;
          setProgress(Math.min(p, 100));
          if (p >= 100) clearInterval(interval);
        }, 28);
        // reveal matches staggered
        MATCHES.forEach((idx, i) => {
          t2 = setTimeout(() => {
            setRevealedMatches(prev => new Set([...prev, idx]));
            setMatchCount(c => c + 1);
          }, 400 + i * 520);
        });
      }, 800);
      t3 = setTimeout(() => {
        setPhase("done");
      }, 800 + 2800);
    };
    run();
    const loop = setInterval(run, CYCLE);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearInterval(interval); clearInterval(loop); };
  }, []);
  const mono: React.CSSProperties = { fontFamily: "var(--font-mono)", letterSpacing: "0.08em" };
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 520 }}>
      <style>{`
        @keyframes app-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes match-pop  { 0%{transform:scale(0.88);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
        @keyframes pulse-gold { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.4),0 0 20px rgba(212,175,55,0.15)} 50%{box-shadow:0 0 0 5px rgba(212,175,55,0),0 0 30px rgba(212,175,55,0.3)} }
        @keyframes scan-h     { 0%{top:0%;opacity:0} 8%{opacity:1} 88%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes face-scan  { 0%{stroke-dashoffset:220} 100%{stroke-dashoffset:0} }
        @keyframes count-in   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes badge-rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes corner-draw{ from{stroke-dashoffset:40} to{stroke-dashoffset:0} }
      `}</style>
      {/* Ambient glow behind card */}
      <div style={{ position: "absolute", inset: -40, background: "radial-gradient(ellipse at 55% 50%, rgba(212,175,55,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
      {/* ── Main app window ── */}
      <div style={{
        animation: "app-float 7s ease-in-out infinite",
        background: "#080600",
        border: "1px solid rgba(212,175,55,0.28)",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.06)",
        position: "relative",
      }}>
        {/* Window chrome */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(212,175,55,0.12)", background: "rgba(212,175,55,0.03)" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>
          {/* URL bar */}
          <div style={{ flex: 1, margin: "0 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            <span style={{ ...mono, fontSize: 9, color: "rgba(212,175,55,0.4)" }}>rushcam.app/event/RAJ-2024</span>
          </div>
          <div style={{ ...mono, fontSize: 9, color: "rgba(212,175,55,0.3)" }}>●●●</div>
        </div>
        {/* App nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "var(--cream)", fontWeight: 600 }}>RushCam</span>
          </div>
          <div style={{ ...mono, fontSize: 9, color: "rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 4, padding: "3px 8px" }}>
            Raj's Wedding · 847 photos
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", minHeight: 300 }}>
          {/* ── Left: face input panel ── */}
          <div style={{ borderRight: "1px solid rgba(212,175,55,0.1)", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 12, background: "rgba(212,175,55,0.02)" }}>
            <div style={{ ...mono, fontSize: 8, color: "rgba(212,175,55,0.4)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Your face</div>
            {/* Face scan circle */}
            <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto" }}>
              {/* Rotating ring */}
              <svg viewBox="0 0 90 90" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", animation: phase === "scanning" ? "app-float 2s linear infinite" : "none" }}>
                <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="1.5" />
                <circle cx="45" cy="45" r="40" fill="none" stroke="#D4AF37" strokeWidth="1.5"
                  strokeDasharray="251" strokeLinecap="round"
                  style={{
                    strokeDashoffset: phase === "idle" ? 251 : phase === "scanning" ? 80 : 0,
                    transformOrigin: "45px 45px",
                    transform: "rotate(-90deg)",
                    transition: "stroke-dashoffset 2s cubic-bezier(.22,1,.36,1)",
                  }} />
              </svg>
              {/* Face silhouette inside */}
              <div style={{ position: "absolute", inset: 8, borderRadius: "50%", overflow: "hidden", background: "#0d0b04" }}>
                <svg viewBox="0 0 74 74" style={{ width: "100%", height: "100%" }}>
                  <ellipse cx="37" cy="26" rx="15" ry="16" fill="#1e1608" stroke="rgba(212,175,55,0.35)" strokeWidth="0.8" />
                  <ellipse cx="37" cy="62" rx="24" ry="20" fill="#1a1408" />
                  {/* facial dots */}
                  {[[29, 21], [45, 21], [37, 30], [32, 36], [42, 36]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="1.4" fill="#D4AF37"
                      style={{ opacity: phase === "idle" ? 0.3 : 0.9, transition: `opacity 0.4s ${i * 0.1}s` }} />
                  ))}
                  {/* mesh lines */}
                  {phase !== "idle" && (
                    <>
                      <line x1="29" y1="21" x2="45" y2="21" stroke="rgba(212,175,55,0.25)" strokeWidth="0.5" />
                      <line x1="29" y1="21" x2="37" y2="30" stroke="rgba(212,175,55,0.2)" strokeWidth="0.5" />
                      <line x1="45" y1="21" x2="37" y2="30" stroke="rgba(212,175,55,0.2)" strokeWidth="0.5" />
                      <line x1="37" y1="30" x2="32" y2="36" stroke="rgba(212,175,55,0.15)" strokeWidth="0.5" />
                      <line x1="37" y1="30" x2="42" y2="36" stroke="rgba(212,175,55,0.15)" strokeWidth="0.5" />
                    </>
                  )}
                </svg>
              </div>
              {/* Corner brackets */}
              {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
                <svg key={i} viewBox="0 0 12 12" style={{
                  position: "absolute", width: 14, height: 14,
                  top: sy < 0 ? -2 : "auto", bottom: sy > 0 ? -2 : "auto",
                  left: sx < 0 ? -2 : "auto", right: sx > 0 ? -2 : "auto"
                }}>
                  <polyline points={sx < 0 ? (sy < 0 ? "10,2 2,2 2,10" : "10,10 2,10 2,2") : (sy < 0 ? "2,2 10,2 10,10" : "2,10 10,10 10,2")}
                    fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"
                    strokeDasharray="40"
                    style={{ strokeDashoffset: phase === "idle" ? 40 : 0, transition: `stroke-dashoffset 0.5s ${0.1 + i * 0.08}s` }} />
                </svg>
              ))}
            </div>
            {/* Status */}
            <div style={{ textAlign: "center" }}>
              <div style={{ ...mono, fontSize: 8, color: phase === "done" ? "#4ade80" : "rgba(212,175,55,0.6)", transition: "color 0.4s" }}>
                {phase === "idle" ? "READY" : phase === "scanning" ? "● SCANNING" : "✓ MATCHED"}
              </div>
            </div>
            {/* Divider */}
            <div style={{ height: 1, background: "rgba(212,175,55,0.08)" }} />
            {/* Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["Photos", "847"], ["Scanned", phase === "idle" ? "0" : "847"], ["Found", String(matchCount * 3)]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ ...mono, fontSize: 8, color: "rgba(212,175,55,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
                  <span style={{ ...mono, fontSize: 9, color: "rgba(212,175,55,0.8)", fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          {/* ── Right: photo gallery ── */}
          <div style={{ padding: 12, position: "relative", overflow: "hidden" }}>
            {/* Scan sweep line */}
            {phase === "scanning" && (
              <div style={{
                position: "absolute", left: 12, right: 12, height: 1,
                background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
                boxShadow: "0 0 8px rgba(212,175,55,0.6)",
                animation: "scan-h 1.8s ease-in-out 1.4",
                top: 0, zIndex: 10,
              }} />
            )}
            {/* Progress bar */}
            <div style={{ marginBottom: 10, height: 2, background: "rgba(212,175,55,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #8B6914, #D4AF37, #f5e070)", borderRadius: 2, width: `${progress}%`, transition: "width 0.1s linear", boxShadow: progress > 0 ? "0 0 8px rgba(212,175,55,0.5)" : "none" }} />
            </div>
            {/* Photo grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {TILES.map(i => {
                const isMatch = MATCHES.includes(i);
                const revealed = revealedMatches.has(i);
                return (
                  <div key={i} style={{
                    borderRadius: 8, overflow: "hidden",
                    border: revealed ? "1.5px solid rgba(212,175,55,0.7)" : "1px solid rgba(212,175,55,0.08)",
                    aspectRatio: "4/3",
                    position: "relative",
                    boxShadow: revealed ? "0 0 16px rgba(212,175,55,0.2), inset 0 0 12px rgba(212,175,55,0.05)" : "none",
                    animation: revealed ? "match-pop 0.5s cubic-bezier(.22,1,.36,1) both, pulse-gold 2.5s ease-in-out infinite" : "none",
                    transition: "border-color 0.3s, box-shadow 0.3s",
                  }}>
                    <PersonSVG seed={i * 7 + 3} highlight={revealed} />
                    {/* Match badge */}
                    {revealed && (
                      <div style={{
                        position: "absolute", top: 3, right: 3,
                        background: "rgba(212,175,55,0.9)", borderRadius: 3,
                        padding: "1px 5px",
                        animation: "count-in 0.3s cubic-bezier(.22,1,.36,1) both",
                      }}>
                        <span style={{ ...mono, fontSize: 7, color: "#0a0800", fontWeight: 700 }}>✓</span>
                      </div>
                    )}
                    {/* Corner detection lines on matched */}
                    {revealed && (
                      <svg viewBox="0 0 80 60" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                        {[[4, 4], [76, 4], [76, 56], [4, 56]].map(([x, y], ci) => {
                          const sx = x < 40 ? 1 : -1, sy = y < 30 ? 1 : -1;
                          return <g key={ci} stroke="rgba(212,175,55,0.6)" strokeWidth="1.2" strokeLinecap="round">
                            <line x1={x} y1={y} x2={x + sx * 8} y2={y} />
                            <line x1={x} y1={y} x2={x} y2={y + sy * 8} />
                          </g>;
                        })}
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* ── Bottom bar ── */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(212,175,55,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: phase === "done" ? "#4ade80" : phase === "scanning" ? "#D4AF37" : "rgba(212,175,55,0.3)",
              boxShadow: phase === "done" ? "0 0 8px #4ade80" : phase === "scanning" ? "0 0 8px #D4AF37" : "none",
              transition: "all 0.4s",
            }} />
            <span style={{ ...mono, fontSize: 9, color: "rgba(212,175,55,0.5)" }}>
              {phase === "idle" ? "Waiting for scan…" : phase === "scanning" ? `Scanning ${Math.round(progress * 8.47)} of 847 photos…` : `${matchCount * 3} photos found in 0.3s`}
            </span>
          </div>
          {phase === "done" && (
            <div style={{ ...mono, fontSize: 9, color: "#D4AF37", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 4, padding: "3px 10px", animation: "badge-rise 0.4s cubic-bezier(.22,1,.36,1) both" }}>
              Download all ↓
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════
   MAGNETIC BUTTON
═══════════════════════════════════════════════ */
function MagBtn({ children, className, href, style, onClick }: { children: React.ReactNode; className?: string; href?: string; style?: React.CSSProperties; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onM = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    ref.current.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
  };
  const onL = () => { if (ref.current) ref.current.style.transform = ""; };
  const inner = (
    <div ref={ref} onMouseMove={onM} onMouseLeave={onL} style={{ transition: "transform 0.3s cubic-bezier(.23,1,.32,1)", display: "inline-block" }}>
      <button className={className} style={style} onClick={onClick}>{children}</button>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
/* ═══════════════════════════════════════════════
   COUNTER HOOK
═══════════════════════════════════════════════ */
function useCounter(end: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setVal(Math.round(ease * end));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return { val, ref };
}
function StatCount({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { val, ref } = useCounter(end);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,4vw,52px)", fontWeight: 600, background: "linear-gradient(135deg,#8B6914,#D4AF37,#f5e070,#D4AF37)", backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmer 3s linear infinite" }}>
        {val}{suffix}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)", marginTop: 6 }}>{label}</div>
    </div>
  );
}
/* ═══════════════════════════════════════════════
   FEATURE CARD — 3D tilt
═══════════════════════════════════════════════ */
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onM = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(600px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(8px)`;
    ref.current.style.boxShadow = `${-x * 20}px ${-y * 20}px 40px rgba(0,0,0,0.4), 0 0 40px rgba(212,175,55,0.12)`;
  };
  const onL = () => {
    if (!ref.current) return;
    ref.current.style.transform = "";
    ref.current.style.boxShadow = "";
  };
  return (
    <div ref={ref} onMouseMove={onM} onMouseLeave={onL} style={{
      background: "rgba(13,11,4,0.8)", border: "1px solid rgba(212,175,55,0.15)",
      borderRadius: 16, padding: "36px 30px",
      transition: "transform 0.25s cubic-bezier(.23,1,.32,1), box-shadow 0.25s, border-color 0.3s",
      cursor: "default", position: "relative", overflow: "hidden",
      height: "100%", display: "flex", flexDirection: "column"
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.4)"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)", opacity: 0 }}
        className="card-top-line" />
      <div style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid rgba(212,175,55,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 20, background: "rgba(212,175,55,0.05)" }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, color: "var(--cream)", marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--muted)", lineHeight: 1.8 }}>{desc}</p>
    </div>
  );
}
/* ═══════════════════════════════════════════════
   SCROLL REVEAL HOOK
═══════════════════════════════════════════════ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}
function Reveal({ children, delay = 0, stretch = false }: { children: React.ReactNode; delay?: number; stretch?: boolean }) {
  const ref = useReveal();
  return (
    <div ref={ref} style={{ opacity: 0, transform: "translateY(28px)", transition: `opacity 0.75s ${delay}s cubic-bezier(.22,1,.36,1), transform 0.75s ${delay}s cubic-bezier(.22,1,.36,1)`, height: stretch ? "100%" : undefined, display: stretch ? "flex" : undefined, flexDirection: stretch ? "column" : undefined }}>
      {children}
    </div>
  );
}
/* ═══════════════════════════════════════════════
   MARQUEE
═══════════════════════════════════════════════ */
function Marquee() {
  const items = ["AI Face Recognition", "Bulk Upload", "Private Events", "One-Tap Access", "Instant Matching", "Secure Sharing", "Zero Manual Tagging", "Real-Time Processing"];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "14px 0", background: "rgba(212,175,55,0.02)" }}>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ display: "flex", gap: 0, animation: "marquee 24s linear infinite", width: "max-content" }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--dim)", padding: "0 32px", whiteSpace: "nowrap" }}>
            ✦ {item}
          </span>
        ))}
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --gold:  #D4AF37;
          --gold2: #f5e070;
          --gold3: #8B6914;
          --bg:    #050400;
          --bg2:   #0a0800;
          --bg3:   #0f0c03;
          --border: rgba(212,175,55,0.18);
          --muted: rgba(212,175,55,0.5);
          --dim:   rgba(212,175,55,0.3);
          --cream: #f0e8cc;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body:    'DM Sans', system-ui, sans-serif;
          --font-mono:    'DM Mono', 'Courier New', monospace;
        }
        html { cursor: none; }
        body { background: var(--bg); color: var(--cream); font-family: var(--font-body); overflow-x: hidden; }
        a { text-decoration: none; }
        button { cursor: none; border: none; outline: none; font-family: var(--font-body); }
        @keyframes shimmer {
          0%  { background-position: 200% center }
          100% { background-position: -200% center }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nav-in {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Nav */
        .phl-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 500;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 52px; height: 68px;
          border-bottom: 1px solid var(--border);
          background: rgba(5,4,0,0.75);
          backdrop-filter: blur(22px) saturate(1.4);
          animation: nav-in 0.6s cubic-bezier(.22,1,.36,1) both;
        }
        .nav-logo  { display:flex; align-items:center; gap:11px; }
        .nav-mark  {
          width:34px; height:34px; border-radius:9px;
          border:1px solid rgba(212,175,55,0.3);
          display:flex; align-items:center; justify-content:center;
          background:rgba(212,175,55,0.07);
          box-shadow:0 0 20px rgba(212,175,55,0.1);
        }
        .nav-logo-text {
          font-family:var(--font-display); font-size:18px; font-weight:600; color:var(--cream); letter-spacing:0.03em;
        }
        .nav-actions { display:flex; gap:12px; align-items:center; }
        /* Buttons */
        .btn-gold {
          display:inline-flex; align-items:center; gap:8px;
          background:linear-gradient(135deg,#8B6914,#D4AF37,#f5e070,#D4AF37,#8B6914);
          background-size:300%;
          color:#0d0b04; font-weight:500; font-size:12px;
          padding:11px 24px; border-radius:8px; border:none;
          letter-spacing:0.04em; transition:background-position 0.4s, transform 0.2s;
          background-position:100% center;
        }
        .btn-gold:hover { background-position:0% center; }
        .btn-outline {
          display:inline-flex; align-items:center; gap:8px;
          background:transparent; color:var(--muted);
          border:1px solid var(--border); border-radius:8px;
          font-size:12px; padding:10px 22px; letter-spacing:0.06em;
          font-family:var(--font-mono); text-transform:uppercase;
          transition:all 0.25s;
        }
        .btn-outline:hover { color:var(--gold); border-color:rgba(212,175,55,0.5); background:rgba(212,175,55,0.05); }
        .btn-pill {
          font-family:var(--font-mono); font-size:10px; letter-spacing:0.12em;
          text-transform:uppercase; color:var(--dim); background:none;
          border:none; transition:color 0.2s;
        }
        .btn-pill:hover { color:var(--gold); }
        /* Section label */
        .sec-label {
          display:inline-flex; align-items:center; gap:8px;
          font-family:var(--font-mono); font-size:9px; letter-spacing:0.2em;
          text-transform:uppercase; color:var(--gold3);
          background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.15);
          border-radius:20px; padding:5px 14px; margin-bottom:20px;
        }
        .sec-label::before {
          content:''; width:5px; height:5px; border-radius:50%;
          background:var(--gold); animation:dot-pulse 1.5s ease-in-out infinite;
        }
        @keyframes dot-pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        .gold-text {
          background:linear-gradient(90deg,#8B6914 0%,#D4AF37 30%,#f5e070 50%,#D4AF37 70%,#8B6914 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
          animation:shimmer 15.5s linear infinite;
        }
        /* Grain */
        body::after {
          content:'';
          position:fixed; inset:-50%; width:200%; height:200%;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events:none; opacity:0.5; z-index:9990;
          animation:grain 1s steps(1) infinite;
        }
        @keyframes grain {
          0%,100%{transform:translate(0,0)} 20%{transform:translate(-1%,1%)}
          40%{transform:translate(1%,-1%)} 60%{transform:translate(-1%,-1%)}
          80%{transform:translate(1%,1%)}
        }
        /* Divider */
        .gold-divider {
          height:1px;
          background:linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent);
          border:none; margin:0;
        }
      `}</style>
      <CustomCursor />
      <ParticleCanvas />
      {/* ── NAV ── */}
      <nav className="phl-nav">
        <div className="nav-logo">
          <div className="nav-mark">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          <span className="nav-logo-text">RushCam</span>
        </div>
        <div className="nav-actions">
          <Link href="/user/login"><button className="btn-pill">Find Photos</button></Link>
          <MagBtn href="/photographer/login" className="btn-gold" style={{ padding: "9px 20px", fontSize: 11 }}>
            Get Started
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </MagBtn>
        </div>
      </nav>
      <main style={{ paddingTop: 68, position: "relative", zIndex: 1 }}>
        {/* ── HERO ── */}
        <section style={{ minHeight: "calc(100vh - 68px)", display: "flex", alignItems: "center", padding: "80px 52px 60px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", width: "100%", maxWidth: 1280, margin: "0 auto" }}>
            {/* Left copy */}
            <div style={{ animation: "fade-up 0.8s 0.1s cubic-bezier(.22,1,.36,1) both" }}>
              <div className="sec-label">AI-Powered Photo Discovery</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px,5.5vw,72px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.05, color: "var(--cream)", letterSpacing: "-0.01em", marginBottom: 22 }}>
                Every angle.<br />
                Every moment.<br />
                <span style={{ fontStyle: "normal", fontWeight: 600 }} className="gold-text">Found instantly.</span>
              </h1>
              <p style={{ fontSize: 15, fontWeight: 300, color: "var(--muted)", lineHeight: 1.8, maxWidth: 420, marginBottom: 40 }}>
                Upload event photos, share a code with your guests, and let our AI face recognition surface every moment — automatically, privately, in under a second.
              </p>
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <MagBtn href="/photographer/login" className="btn-gold" style={{ padding: "14px 30px", fontSize: 13 }}>
                  Start as Photographer
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </MagBtn>
                <MagBtn href="/user/login" className="btn-outline">
                  Start As User
                </MagBtn>
              </div>
              {/* Trust badges */}
              <div style={{ marginTop: 48, display: "flex", gap: 28, flexWrap: "wrap" }}>
                {["Face recognition", "Bulk upload", "Private & secure"].map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", opacity: 0.6 }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Right visual */}
            <div style={{ display: "flex", justifyContent: "center", animation: "fade-up 0.8s 0.3s cubic-bezier(.22,1,.36,1) both" }}>
              <AppMockup />
            </div>
          </div>
        </section>
        {/* ── MARQUEE ── */}
        <Marquee />
        {/* ── FEATURES ── */}
        <section style={{ padding: "100px 52px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 60 }}>
                <div className="sec-label" style={{ display: "inline-flex" }}>How It Works</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,52px)", fontWeight: 300, fontStyle: "italic", color: "var(--cream)", lineHeight: 1.1 }}>
                  Effortless for<br />
                  <span className="gold-text" style={{ fontStyle: "normal", fontWeight: 600 }}>Photographers & Guests.</span>
                </h2>
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "stretch" }}>
              {[
                { icon: "⚡", title: "AI Face Recognition", desc: "Our neural engine scans every uploaded photo, maps every face, and creates instant connections — no manual tagging, no delays, no compromise on accuracy." },
                { icon: "📸", title: "Bulk Upload", desc: "Drag and drop thousands of photos at once. Our pipeline processes them in parallel while you focus on your next shot." },
                { icon: "🔒", title: "Private by Design", desc: "Events are protected by unique access codes. Only invited guests see their photos. Your clients' moments stay theirs alone." },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 0.12} stretch>
                  <FeatureCard {...f} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        {/* ── CTA ── */}
        <section style={{ padding: "100px 52px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent)" }} />
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
              <div className="sec-label" style={{ display: "inline-flex" }}>Get Started Today</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,54px)", fontWeight: 300, fontStyle: "italic", color: "var(--cream)", lineHeight: 1.1, marginBottom: 20 }}>
                Every moment<br />
                <span className="gold-text" style={{ fontStyle: "normal", fontWeight: 600 }}>Deserves to be found.</span>
              </h2>
              <p style={{ fontSize: 14, fontWeight: 300, color: "var(--muted)", lineHeight: 1.8, marginBottom: 40 }}>
                Join hundreds of photographers delivering a world-class experience to their clients — with zero extra effort.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <MagBtn href="/photographer/login" className="btn-gold" style={{ padding: "15px 36px", fontSize: 13 }}>
                  Start as Photographer
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </MagBtn>
                <MagBtn href="/user/login" className="btn-outline" style={{ padding: "14px 28px" }}>
                  Find my photos
                </MagBtn>
              </div>
            </div>
          </Reveal>
        </section>
        {/* ── FOOTER ── */}
        <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(212,175,55,0.25)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(212,175,55,0.05)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--muted)" }}>RushCam</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--dim)" }}>
            © {new Date().getFullYear()} · AI-Powered Photo Discovery
          </div>
        </footer>
      </main>
    </>
  );
}
