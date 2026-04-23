"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps { length?: number; value: string; onChange: (value: string) => void; disabled?: boolean; }

export default function OtpInput({ length = 6, value, onChange, disabled = false }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    const newValue = value.split(""); newValue[index] = digit.slice(-1);
    const result = newValue.join("").slice(0, length); onChange(result);
    if (digit && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pastedData);
    const lastIndex = Math.min(pastedData.length, length) - 1;
    if (lastIndex >= 0) inputRefs.current[lastIndex]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(-1)}
          disabled={disabled}
          className="otp-input"
          style={{
            borderColor: focusedIndex === index ? "rgba(201,168,76,0.5)" : value[index] ? "rgba(201,168,76,0.3)" : undefined,
            background: focusedIndex === index ? "rgba(201,168,76,0.03)" : undefined,
            boxShadow: focusedIndex === index ? "0 0 0 2px rgba(201,168,76,0.1)" : undefined,
          }}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
