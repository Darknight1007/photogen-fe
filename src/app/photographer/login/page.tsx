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
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: apiError } = await authApi.sendOtp(phone);

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    setIsNewUser(data?.isNewUser ?? false);
    setStep("otp");
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    if (isNewUser) {
      setStep("signup");
      setLoading(false);
      return;
    }

    // Login existing user
    const { data, error: apiError } = await authApi.login(phone, otp);

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    if (data?.user.role !== "PHOTOGRAPHER") {
      setError("This account is not registered as a photographer");
      setLoading(false);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    router.push("/photographer/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);

    const { data, error: apiError } = await authApi.photographerSignup({
      phone,
      otp,
      name: name.trim(),
      email: email.trim() || undefined,
    });

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    localStorage.setItem("token", data!.token);
    localStorage.setItem("user", JSON.stringify(data!.user));
    router.push("/photographer/dashboard");
  };

  return (
    <main className="min-h-screen bg-pattern flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div className="card animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-hover mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {step === "signup" ? "Create Account" : "Photographer Login"}
            </h1>
            <p className="text-muted">
              {step === "phone" && "Enter your mobile number to continue"}
              {step === "otp" && "Enter the OTP sent to your phone"}
              {step === "signup" && "Complete your profile to get started"}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3 mb-6 text-error text-sm text-center">
              {error}
            </div>
          )}

          {/* Phone Step */}
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading || !phone}>
                {loading ? (
                  <span className="animate-pulse">Sending OTP...</span>
                ) : (
                  <>
                    Continue
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-4 text-center">
                  Enter 6-digit OTP
                </label>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <span className="animate-pulse">Verifying...</span>
                ) : (
                  "Verify OTP"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtp("");
                    setStep("phone");
                  }}
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Change phone number
                </button>
              </div>
            </form>
          )}

          {/* Signup Step */}
          {step === "signup" && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email (optional)</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
                {loading ? (
                  <span className="animate-pulse">Creating Account...</span>
                ) : (
                  "Create Photographer Account"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-muted text-sm mt-6">
          Looking for your photos?{" "}
          <Link href="/user/login" className="text-primary hover:underline">
            Login as User
          </Link>
        </p>
      </div>
    </main>
  );
}
