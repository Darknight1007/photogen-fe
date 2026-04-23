"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OtpInput from "@/components/OtpInput";
import { authApi } from "@/lib/api";

type Step = "phone" | "otp" | "signup";

export default function PhotographerLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const { data, error: err } = await authApi.sendOtp(phone);
    if (err) { setError(err); setLoading(false); return; }
    setIsNewUser(data?.isNewUser ?? false); setStep("otp"); setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (otp.length !== 6) { setError("Enter a valid 6-digit code"); return; }
    setLoading(true);
    if (isNewUser) { setStep("signup"); setLoading(false); return; }
    const { data, error: err } = await authApi.login(phone, otp);
    if (err) { setError(err); setLoading(false); return; }
    if (data?.user.role !== "PHOTOGRAPHER") { setError("This account is not a photographer."); setLoading(false); return; }
    localStorage.setItem("token", data.token); localStorage.setItem("user", JSON.stringify(data.user));
    router.push("/photographer/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    const { data, error: err } = await authApi.photographerSignup({ phone, otp, name: name.trim(), email: email.trim() || undefined });
    if (err) { setError(err); setLoading(false); return; }
    localStorage.setItem("token", data!.token); localStorage.setItem("user", JSON.stringify(data!.user));
    router.push("/photographer/dashboard");
  };

  const steps = ["phone", "otp", "signup"] as const;
  const stepIdx = steps.indexOf(step);

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
          <Link href="/user/login" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", textDecoration: "none" }}>
            Find photos? →
          </Link>
        </div>
      </nav>

      <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 60px)" }}>
        {/* Left - Branding */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 56px", borderRight: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: `repeating-linear-gradient(90deg, var(--gold) 0px, var(--gold) 0.5px, transparent 0.5px, transparent 60px), repeating-linear-gradient(0deg, var(--gold) 0px, var(--gold) 0.5px, transparent 0.5px, transparent 60px)` }} />
          <div style={{ position: "relative", zIndex: 1 }} className="fade-up d1">
            <div className="logo-badge" style={{ marginBottom: 24, width: "fit-content" }}>Studio</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.1, color: "var(--cream)", marginBottom: 16 }}>
              Photographer<br />
              <span style={{ fontStyle: "normal", fontWeight: 600, color: "var(--gold2)" }}>Studio.</span>
            </h1>
            <p style={{ fontSize: 14, fontWeight: 300, color: "var(--muted)", lineHeight: 1.7, maxWidth: 360 }}>
              Sign in to manage your events, upload photos in bulk, and let AI face recognition do the rest.
            </p>
            <div style={{ marginTop: 40, display: "flex", gap: 20 }}>
              {["Bulk upload", "AI matching", "Event codes"].map(t => (
                <div key={t} style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)" }}>✦ {t}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 56px" }}>
          <div style={{ width: "100%", maxWidth: 380 }} className="fade-up d2">
            <div style={{ display: "flex", gap: 4, marginBottom: 36 }}>
              {steps.map((s, i) => (
                <div key={s} style={{ flex: 1, height: 2, background: i <= stepIdx ? "var(--gold)" : "var(--border)", transition: "background 0.4s" }} />
              ))}
            </div>

            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)", marginBottom: 12 }}>
              Step {stepIdx + 1} of 3
            </div>

            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 300, fontStyle: "italic", color: "var(--cream)", marginBottom: 8 }}>
              {step === "phone" && "Sign in"}
              {step === "otp" && "Verify code"}
              {step === "signup" && "Create your studio"}
            </h2>
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--muted)", marginBottom: 32 }}>
              {step === "phone" && "Enter your phone number to continue."}
              {step === "otp" && `We sent a 6-digit code to ${phone}`}
              {step === "signup" && "Set up your photographer profile."}
            </p>

            {error && <div className="modal-error" style={{ marginBottom: 20 }}>{error}</div>}

            {step === "phone" && (
              <form onSubmit={handleSendOtp}>
                <div className="field">
                  <label className="field-label">Phone number</label>
                  <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus />
                </div>
                <button type="submit" className="btn-gold" style={{ width: "100%" }} disabled={loading || !phone}>
                  {loading ? <span className="spinner" style={{ borderTopColor: "#1a1508", borderColor: "rgba(26,21,8,0.2)" }} /> : <>Continue <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>}
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: 28 }}>
                  <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                </div>
                <button type="submit" className="btn-gold" style={{ width: "100%" }} disabled={loading || otp.length !== 6}>
                  {loading ? <span className="spinner" style={{ borderTopColor: "#1a1508", borderColor: "rgba(26,21,8,0.2)" }} /> : "Verify"}
                </button>
                <button type="button" onClick={() => { setOtp(""); setStep("phone"); }} style={{ width: "100%", textAlign: "center", marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--dim)", background: "none", border: "none", cursor: "pointer" }}>
                  Use different number
                </button>
              </form>
            )}

            {step === "signup" && (
              <form onSubmit={handleSignup}>
                <div className="field">
                  <label className="field-label">Full name</label>
                  <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                </div>
                <div className="field">
                  <label className="field-label">Email <em>(optional)</em></label>
                  <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="btn-gold" style={{ width: "100%" }} disabled={loading || !name.trim()}>
                  {loading ? <span className="spinner" style={{ borderTopColor: "#1a1508", borderColor: "rgba(26,21,8,0.2)" }} /> : "Create account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
