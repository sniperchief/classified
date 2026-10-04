import type { CSSProperties } from "react";

/* The table: playing cards scattered at angles behind the content (CAH signature).
 * Purely decorative; content is spy-dossier flavoured. */

type C = { x: string; y: string; w: number; r: number; face: string; ring?: string; text: string; sub?: string; hideSm?: boolean };

const HERO: C[] = [
  { x: "-3%", y: "6%", w: 170, r: -14, face: "bg-white text-black", ring: "ring-in-red", text: "TOP SECRET", sub: "EYES ONLY", hideSm: true },
  { x: "80%", y: "4%", w: 150, r: 11, face: "bg-lavender text-black", ring: "ring-in-violet", text: "🔒", sub: "SHIELDED" },
  { x: "88%", y: "52%", w: 160, r: -8, face: "bg-lemon text-black", text: "ZEC", sub: "MISSION FUNDS", hideSm: true },
  { x: "62%", y: "78%", w: 140, r: 17, face: "bg-white text-black", ring: "ring-in-gold", text: "██ ███ █", sub: "REDACTED", hideSm: true },
  { x: "-4%", y: "70%", w: 150, r: 9, face: "bg-mint text-black", text: "AGENT", sub: "NIGHTJAR", hideSm: true },
  { x: "38%", y: "-6%", w: 120, r: -20, face: "bg-sky text-black", text: "💾", sub: "USB-07", hideSm: true },
  { x: "30%", y: "88%", w: 130, r: -11, face: "bg-bubblegum text-black", text: "0x5EC", sub: "DOSSIER", hideSm: true },
  { x: "92%", y: "28%", w: 110, r: 24, face: "bg-tangerine text-black", text: "!", sub: "ALERT" },
];

const AMBIENT: C[] = [
  { x: "-6%", y: "18%", w: 130, r: -16, face: "bg-white text-black", ring: "ring-in-red", text: "TOP SECRET", hideSm: true },
  { x: "93%", y: "34%", w: 120, r: 13, face: "bg-lavender text-black", ring: "ring-in-violet", text: "🔒", hideSm: true },
  { x: "-5%", y: "72%", w: 110, r: 10, face: "bg-lemon text-black", text: "ZEC", hideSm: true },
  { x: "94%", y: "80%", w: 120, r: -12, face: "bg-white text-black", ring: "ring-in-gold", text: "██ ██", hideSm: true },
];

export function CardScatter({ variant = "ambient" }: { variant?: "hero" | "ambient" }) {
  const cards = variant === "hero" ? HERO : AMBIENT;
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${variant === "ambient" ? "opacity-[0.22]" : ""}`}>
      {cards.map((c, i) => (
        <div
          key={i}
          className={`absolute animate-deal ${c.hideSm ? "hidden md:block" : ""}`}
          style={{ left: c.x, top: c.y, "--tilt": `${c.r}deg`, animationDelay: `${120 + i * 90}ms` } as CSSProperties}
        >
          <div
            className={`flex aspect-[5/7] flex-col justify-between rounded-[14px] p-4 ${c.face} ${c.ring ?? ""} ${variant === "hero" ? "animate-float" : ""}`}
            style={{ width: c.w, "--tilt": "0deg", animationDelay: `${i * 0.7}s` } as CSSProperties}
          >
            <span className="font-display text-xl font-black leading-none">{c.text}</span>
            {c.sub && <span className="font-mono text-[9px] font-bold tracking-[0.16em] opacity-60">{c.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
