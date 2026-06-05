interface DemoOtpBannerProps {
  code: string;
}

/** Shown in non-production when the API returns the OTP for demos. */
export default function DemoOtpBanner({ code }: DemoOtpBannerProps) {
  return (
    <div
      style={{
        background: "rgba(212,175,55,0.08)",
        border: "1px solid rgba(212,175,55,0.35)",
        borderRadius: 6,
        padding: "12px 16px",
        marginBottom: 24,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.06em",
        color: "var(--gold)",
      }}
    >
      <span style={{ color: "var(--dim)", textTransform: "uppercase" }}>Demo — </span>
      Your code is <strong style={{ color: "var(--cream)", letterSpacing: "0.2em" }}>{code}</strong>
    </div>
  );
}
