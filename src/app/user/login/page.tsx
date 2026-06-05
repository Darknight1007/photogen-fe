"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OtpInput from "@/components/OtpInput";
import DemoOtpBanner from "@/components/DemoOtpBanner";
import { authApi } from "@/lib/api";
import CustomCursor from "@/components/CustomCursor";

type Step = "phone" | "otp" | "signup";

export default function UserLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const { data, error: err } = await authApi.sendOtp(phone);
    if (err) { setError(err); setLoading(false); return; }
    setIsNewUser(data?.isNewUser ?? false);
    setDemoOtp(data?.otp ?? null);
    setStep("otp");
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (otp.length !== 6) { setError("Enter a valid 6-digit code"); return; }
    setLoading(true);
    if (isNewUser) { setStep("signup"); setLoading(false); return; }
    const { data, error: err } = await authApi.login(phone, otp);
    if (err) { setError(err); setLoading(false); return; }
    if (data?.user.role !== "USER") { setError("Use photographer login for this account."); setLoading(false); return; }
    localStorage.setItem("token", data.token); localStorage.setItem("user", JSON.stringify(data.user));
    const pending = localStorage.getItem("pendingJoin");
    if (pending) { localStorage.removeItem("pendingJoin"); router.push(`/join/${pending}`); }
    else router.push("/user/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    const { data, error: err } = await authApi.userSignup({ phone, otp, name: name.trim(), email: email.trim() || undefined });
    if (err) { setError(err); setLoading(false); return; }
    localStorage.setItem("token", data!.token); localStorage.setItem("user", JSON.stringify(data!.user));
    const pending = localStorage.getItem("pendingJoin");
    if (pending) { localStorage.removeItem("pendingJoin"); router.push(`/join/${pending}`); }
    else router.push("/user/dashboard");
  };

  const steps = ["phone", "otp", "signup"] as const;
  const stepIdx = steps.indexOf(step);

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
        
        .field-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dim); margin-bottom: 8px; display: block; }
        .field input { width: 100%; box-sizing: border-box; background: rgba(212,175,55,0.03); border: 1px solid rgba(212,175,55,0.15); color: var(--cream); font-family: var(--font-body); font-size: 14px; padding: 12px 16px; border-radius: 8px; outline: none; transition: all 0.2s; }
        .field input:focus { border-color: var(--gold); background: rgba(212,175,55,0.06); box-shadow: 0 0 0 3px rgba(212,175,55,0.1); }
        .field input::placeholder { color: var(--dim); }

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

      <CustomCursor />

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
        <Link href="/photographer/login" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", textDecoration: "none", transition: "color 0.2s" }}>
          Photographer? →
        </Link>
      </nav>

      <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh", paddingTop: 68, boxSizing: "border-box" }}>
        {/* Left - Branding */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px", borderRight: "1px solid var(--border)", position: "relative", overflow: "hidden", background: "radial-gradient(ellipse at 70% 50%, rgba(212,175,55,0.08) 0%, transparent 60%)" }}>

          {/* Subtle grid pattern for texture */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "linear-gradient(rgba(212,175,55,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, color: "var(--cream)", marginBottom: 16 }}>
              Welcome<br />
              <span style={{ fontStyle: "normal", fontWeight: 600, color: "var(--gold)" }}>User.</span>
            </h1>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--muted)", lineHeight: 1.7, maxWidth: 360 }}>
              Sign in to find your event photos. AI will match your face across thousands of images instantly.
            </p>
            <div style={{ marginTop: 40, display: "flex", gap: 20 }}>
              {["Instant matching", "All your events", "One-tap access"].map(t => (
                <div key={t} style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)" }}>✦ {t}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 56px", background: "var(--bg)" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            {/* Progress */}
            <div style={{ display: "flex", gap: 6, marginBottom: 36 }}>
              {steps.map((s, i) => (
                <div key={s} style={{ flex: 1, height: 2, background: i <= stepIdx ? "var(--gold)" : "var(--border)", transition: "background 0.4s", borderRadius: 2 }} />
              ))}
            </div>

            {/* Step label */}
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)", marginBottom: 12 }}>
              Step {stepIdx + 1} of 3
            </div>

            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 300, fontStyle: "italic", color: "var(--cream)", marginBottom: 8 }}>
              {step === "phone" && "Sign in"}
              {step === "otp" && "Verify code"}
              {step === "signup" && "Create account"}
            </h2>
            <p style={{ fontSize: 14, fontWeight: 300, color: "var(--muted)", marginBottom: 36 }}>
              {step === "phone" && "Enter your phone number to continue."}
              {step === "otp" && `We sent a 6-digit code to ${phone}`}
              {step === "signup" && "Last step — tell us your name."}
            </p>

            {error && <div style={{ background: "rgba(212,102,74,0.1)", border: "1px solid rgba(212,102,74,0.3)", borderRadius: 6, padding: "12px 16px", fontSize: 13, color: "#e07a5f", marginBottom: 24 }}>{error}</div>}

            {step === "phone" && (
              <form onSubmit={handleSendOtp}>
                <div className="field" style={{ marginBottom: 24 }}>
                  <label className="field-label">Phone number</label>
                  <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus />
                </div>
                <button type="submit" className="btn-gold" style={{ width: "100%" }} disabled={loading || !phone}>
                  {loading ? "Sending..." : <>Continue <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>}
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp}>
                {demoOtp && <DemoOtpBanner code={demoOtp} />}
                <div style={{ marginBottom: 32 }}>
                  <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                </div>
                <button type="submit" className="btn-gold" style={{ width: "100%" }} disabled={loading || otp.length !== 6}>
                  {loading ? "Verifying..." : "Verify"}
                </button>
                <button type="button" onClick={() => { setOtp(""); setDemoOtp(null); setStep("phone"); }} style={{ width: "100%", textAlign: "center", marginTop: 20, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--dim)", background: "none", border: "none", cursor: "pointer" }}>
                  Use different number
                </button>
              </form>
            )}

            {step === "signup" && (
              <form onSubmit={handleSignup}>
                <div className="field" style={{ marginBottom: 20 }}>
                  <label className="field-label">Full name</label>
                  <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                </div>
                <div className="field" style={{ marginBottom: 24 }}>
                  <label className="field-label">Email <em style={{ fontStyle: "normal", color: "var(--vdim)" }}>(optional)</em></label>
                  <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="btn-gold" style={{ width: "100%" }} disabled={loading || !name.trim()}>
                  {loading ? "Creating..." : "Create account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
