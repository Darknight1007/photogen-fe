"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-pattern flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl animate-fade-in">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Photo<span className="gradient-text">Gen</span>
          </h1>
          <p className="text-muted text-lg">
            AI-powered photo sharing for events. Find your photos instantly.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 max-w-sm mx-auto">
          <Link href="/photographer/login" className="block">
            <button className="btn btn-primary w-full">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
              </svg>
              I&apos;m a Photographer
            </button>
          </Link>

          <Link href="/user/login" className="block">
            <button className="btn btn-secondary w-full">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              I&apos;m Looking for Photos
            </button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="text-primary text-3xl font-bold mb-2">⚡</div>
            <p className="text-sm text-muted">Instant face recognition</p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="text-accent text-3xl font-bold mb-2">📸</div>
            <p className="text-sm text-muted">Bulk photo upload</p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="text-success text-3xl font-bold mb-2">🔒</div>
            <p className="text-sm text-muted">Secure & private</p>
          </div>
        </div>
      </div>
    </main>
  );
}
