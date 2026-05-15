"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

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
    
    const attach = () => {
      document.querySelectorAll("a,button,input").forEach(el => { 
        el.addEventListener("mouseenter", over); 
        el.addEventListener("mouseleave", out); 
      });
    };
    attach();
    
    // re-attach occasionally in case DOM changes
    const int = setInterval(attach, 1000);

    return () => { cancelAnimationFrame(raf); clearInterval(int); window.removeEventListener("mousemove", move); };
  }, []);

  return (
    <>
      <style>{`
        html, body, a, button, input { cursor: none !important; }
      `}</style>
      <div ref={dot} style={{ position: "fixed", top: 0, left: 0, width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", pointerEvents: "none", zIndex: 9999, mixBlendMode: "screen" }} />
      <div ref={ring} style={{ position: "fixed", top: 0, left: 0, width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.6)", pointerEvents: "none", zIndex: 9998, transition: "transform 0.12s cubic-bezier(.23,1,.32,1)", mixBlendMode: "screen" }} />
    </>
  );
}
