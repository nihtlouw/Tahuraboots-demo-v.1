export function Crest({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 56"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M24 2 44 8v22c0 11.5-8.2 19.6-20 24C12.2 49.6 4 41.5 4 30V8L24 2Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M24 6.5 40 11v19c0 9.4-6.6 16.2-16 20-9.4-3.8-16-10.6-16-20V11l16-4.5Z" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
      <path d="M15 18h18M15 38h18" stroke="currentColor" strokeWidth="1.2" />
      <path d="M19.5 18v20M24 14.5V42M28.5 18v20" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function BrandMark({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Crest className="h-8 w-auto text-brass" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.35rem] tracking-[0.16em] text-paper">
          TAHURA
        </span>
        {!compact && (
          <span className="mt-1 text-[0.5rem] font-medium uppercase tracking-[0.34em] text-mute">
            Boots Company
          </span>
        )}
      </span>
    </span>
  );
}

export function Stamp({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <path
          id="stampCircle"
          d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
        />
      </defs>
      <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <text
        fill="currentColor"
        fontSize="8.4"
        letterSpacing="3.2"
        fontFamily="var(--font-inter), sans-serif"
      >
        <textPath href="#stampCircle" startOffset="0%">
          HAND-WELTED · BANDUNG · SINCE 2013 ·
        </textPath>
      </text>
      <g stroke="currentColor" strokeWidth="1.1">
        <path d="M60 42v36M49 48v24M71 48v24M44 52v16M76 52v16" opacity="0.85" />
        <path d="M44 40h32" opacity="0.5" />
      </g>
    </svg>
  );
}
