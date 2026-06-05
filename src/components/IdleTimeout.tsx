"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function IdleTimeout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const logoutUser = () => {
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Redirect appropriately
        if (pathname && pathname.includes("/photographer")) {
          router.push("/photographer/login");
        } else {
          router.push("/");
        }
      }
    };

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(logoutUser, IDLE_TIMEOUT_MS);
    };

    // Initialize timeout on mount
    resetTimeout();

    // Event listeners to detect activity
    const events = ["mousemove", "keydown", "wheel", "mousedown", "touchstart", "touchmove"];
    events.forEach((event) => window.addEventListener(event, resetTimeout));

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimeout));
    };
  }, [router, pathname]);

  return null;
}
