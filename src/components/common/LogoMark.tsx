// The Legalia mark: a serif "L" (a column) with a gold dot for the next hearing date.
// Same artwork as /public/favicon.svg and /brand.
interface LogoMarkProps { size?: number; className?: string; title?: string }

export function LogoMark({ size = 36, className = '', title = 'Legalia' }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="legalia-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22314f" />
          <stop offset="1" stopColor="#111a2b" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#legalia-mark-bg)" />
      <g transform="translate(256 252) scale(1.1) translate(-273 -252)" fill="#d0ad72">
        <path d="M170 112h92v26h-20v214h118l22-30h14v70H150v-26h20V138h-20v-26z" />
        <circle cx="352" cy="214" r="33" />
      </g>
    </svg>
  );
}

export default LogoMark;
