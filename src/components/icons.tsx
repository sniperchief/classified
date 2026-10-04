// Minimal line icons used in the cinematics. stroke = currentColor.
type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const UsbIcon = ({ className }: P) => (
  <svg viewBox="0 0 48 48" className={className} {...base}>
    <rect x="15" y="16" width="18" height="26" rx="2" />
    <rect x="18" y="6" width="12" height="10" />
    <path d="M21 10h2M25 10h2M20 24h8M20 29h8M20 34h5" />
  </svg>
);
export const CaseIcon = ({ className }: P) => (
  <svg viewBox="0 0 48 48" className={className} {...base}>
    <rect x="6" y="14" width="36" height="26" rx="2" />
    <path d="M18 14v-4h12v4M6 25h36M22 25v4h4v-4" />
  </svg>
);
export const LockIcon = ({ className }: P) => (
  <svg viewBox="0 0 48 48" className={className} {...base}>
    <rect x="10" y="21" width="28" height="21" rx="2" />
    <path d="M16 21v-6a8 8 0 0 1 16 0v6M24 29v6" />
  </svg>
);
export const HouseIcon = ({ className }: P) => (
  <svg viewBox="0 0 48 48" className={className} {...base}>
    <path d="M8 22 24 9l16 13M12 19v21h24V19" />
    <rect x="20" y="28" width="8" height="12" />
  </svg>
);
export const AgentIcon = ({ className }: P) => (
  <svg viewBox="0 0 48 48" className={className} {...base}>
    <path d="M14 18h20l-2-8H16z M10 18h28" />
    <circle cx="19" cy="23" r="3" />
    <circle cx="29" cy="23" r="3" />
    <path d="M22 23h4M12 42c1-8 6-12 12-12s11 4 12 12" />
  </svg>
);
export const EyeIcon = ({ className }: P) => (
  <svg viewBox="0 0 48 48" className={className} {...base}>
    <path d="M4 24s7-12 20-12 20 12 20 12-7 12-20 12S4 24 4 24z" />
    <circle cx="24" cy="24" r="6" />
  </svg>
);
export const ShieldIcon = ({ className }: P) => (
  <svg viewBox="0 0 48 48" className={className} {...base}>
    <path d="M24 5 8 11v11c0 10 7 18 16 21 9-3 16-11 16-21V11z" />
    <path d="m17 24 5 5 9-10" />
  </svg>
);
