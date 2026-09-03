interface HeroIllustrationProps {
  className?: string;
}

const OLIVE_LEAVES = [
  { x: 22, y: 76, a: -62, s: 1 },
  { x: 44, y: 56, a: -40, s: 1 },
  { x: 66, y: 34, a: -18, s: 1 },
  { x: 86, y: 16, a: 8, s: 1 },
  { x: 104, y: 6, a: 28, s: 0.9 },
  { x: 12, y: 90, a: -80, s: 0.8 },
];

const OLIVE_FRUIT = [
  { cx: 90, cy: 32, r: 5.5, hx: 87, hy: 29, hr: 1.6 },
  { cx: 104, cy: 26, r: 4.5, hx: 101.5, hy: 23.5, hr: 1.3 },
];

export function HeroIllustration({ className = "" }: HeroIllustrationProps) {
  return (
    <svg
      viewBox="0 0 500 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <filter id="sb" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5E7C6" />
          <stop offset="100%" stopColor="#FBF7ED" />
        </linearGradient>
        <linearGradient id="gPaper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1EAD7" />
        </linearGradient>
        <linearGradient id="gBox" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B6B60" />
          <stop offset="100%" stopColor="#0A3B35" />
        </linearGradient>
        <linearGradient id="gBoxSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#072E29" />
          <stop offset="100%" stopColor="#0E4A42" />
        </linearGradient>
        <radialGradient id="gSeal" cx="0.35" cy="0.3" r="1">
          <stop offset="0%" stopColor="#9C2F40" />
          <stop offset="100%" stopColor="#6B1C28" />
        </radialGradient>
        <radialGradient id="gGlass" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D7E8E1" />
        </radialGradient>
        <radialGradient id="gGlow" cx="0.5" cy="0.42" r="0.6">
          <stop offset="0%" stopColor="#FFFDF6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFDF6" stopOpacity="0" />
        </radialGradient>
        <clipPath id="archClip">
          <path d="M112 400 V224 A140 140 0 0 1 388 224 V400 Z" />
        </clipPath>
      </defs>

      {/* Warm ambient glow */}
      <circle cx="250" cy="205" r="240" fill="url(#gGlow)" />

      {/* Heritage arch backdrop */}
      <g clipPath="url(#archClip)">
        <rect x="112" y="84" width="276" height="316" fill="url(#gSky)" />
        <g fill="#0F4C45" opacity="0.09">
          <rect x="152" y="334" width="18" height="66" />
          <rect x="174" y="344" width="13" height="56" />
          <rect x="342" y="338" width="20" height="62" />
          <rect x="366" y="346" width="13" height="54" />
          <path d="M112 400 V342 Q180 308 240 332 Q300 354 388 328 V400 Z" />
          <path d="M240 332 V310 A13 13 0 0 1 266 310 V332 Z" />
          <rect x="234" y="332" width="38" height="5" />
          <path d="M283 338 V302 h5 V338 Z M285.5 302 l-4.5 -7 9 0 Z" />
          <path d="M300 338 V314 h4 V338 Z M302 314 l-3 -5 6 0 Z" />
        </g>
      </g>
      <path
        d="M112 400 V224 A140 140 0 0 1 388 224 V400 Z"
        stroke="#0F4C45"
        strokeOpacity="0.12"
        strokeWidth="2.5"
        fill="none"
      />

      {/* Olive branch */}
      <g>
        <path
          d="M4 84 C30 74 62 52 86 22 C94 12 102 6 110 4"
          stroke="#0F4C45"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {OLIVE_LEAVES.map((l, i) => (
          <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.a}) scale(${l.s})`}>
            <path
              d="M0 0 C5 2 6 8 0 16 C-6 8 -5 2 0 0 Z"
              fill="#C6A15B"
              fillOpacity="0.92"
              stroke="#A9853F"
              strokeWidth="0.6"
            />
            <path d="M0 4 V12" stroke="#0F4C45" strokeOpacity="0.35" strokeWidth="0.8" />
          </g>
        ))}
        {OLIVE_FRUIT.map((o, i) => (
          <g key={i}>
            <circle cx={o.cx} cy={o.cy} r={o.r} fill="#8FA06B" />
            <circle cx={o.cx} cy={o.cy} r={o.r} fill="url(#gGlass)" opacity="0.35" />
            <circle cx={o.hx} cy={o.hy} r={o.hr} fill="#F8F4EC" opacity="0.9" />
          </g>
        ))}
      </g>

      {/* Floor surface */}
      <rect x="0" y="366" width="500" height="34" fill="#F1EAD6" fillOpacity="0.85" />
      <line x1="0" y1="366" x2="500" y2="366" stroke="#E6DCC2" strokeWidth="1.5" />

      {/* Open archive box */}
      <ellipse cx="344" cy="372" rx="132" ry="12" fill="#072F2B" opacity="0.12" filter="url(#sb)" />
      <polygon points="218,268 238,252 238,352 218,368" fill="url(#gBoxSide)" />
      <polygon points="450,268 470,252 470,352 450,368" fill="#0B4039" />
      <polygon points="218,268 450,268 470,252 238,252" fill="#09332D" />

      {/* Document stack inside box */}
      <g>
        <rect x="246" y="250" width="190" height="20" rx="2" fill="#F5EFE0" stroke="#DDD3BC" strokeWidth="1" transform="rotate(-1.5 341 260)" />
        <rect x="252" y="254" width="184" height="18" rx="2" fill="#F8F3E6" stroke="#E2D9C4" strokeWidth="1" transform="rotate(1 344 263)" />
        <rect x="258" y="248" width="178" height="24" rx="2" fill="#FFFFFF" stroke="#E6DEC9" strokeWidth="1" transform="rotate(-0.8 347 260)" />
        <rect x="272" y="256" width="92" height="4" rx="2" fill="#D8CEB6" transform="rotate(-0.8 347 260)" />
        <rect x="272" y="264" width="70" height="4" rx="2" fill="#D8CEB6" transform="rotate(-0.8 347 260)" />
      </g>

      <rect x="218" y="268" width="232" height="100" rx="6" fill="url(#gBox)" stroke="#0C3F38" strokeWidth="1" />
      <polygon points="238,252 470,252 484,230 252,230" fill="#0E4941" />
      <line x1="252" y1="230" x2="484" y2="230" stroke="#1B6B60" strokeWidth="2" />
      <rect x="218" y="306" width="232" height="8" fill="#C6A15B" fillOpacity="0.92" />
      <rect x="330" y="326" width="64" height="20" rx="3" fill="#F6F0DF" fillOpacity="0.95" stroke="#C6A15B" strokeOpacity="0.4" />
      <text x="362" y="339" fontSize="9.5" fontFamily="Amiri, serif" fontWeight="700" fill="#0F4C45" textAnchor="middle">
        أرشيفنا
      </text>

      {/* Held document */}
      <g>
        <polygon points="258,154 368,144 388,328 278,338" fill="#072F2B" opacity="0.08" filter="url(#sb)" />
        <polygon points="252,148 362,138 382,322 272,332" fill="url(#gPaper)" stroke="#D9CFB7" strokeWidth="1.2" strokeLinejoin="round" />
        <rect x="270" y="162" width="88" height="9" rx="2" fill="#C6A15B" fillOpacity="0.85" />
        <rect x="270" y="176" width="58" height="4.5" rx="1.5" fill="#C9BFA4" />
        <rect x="270" y="188" width="72" height="4" rx="2" fill="#D8CEB6" />
        <rect x="270" y="197" width="62" height="4" rx="2" fill="#D8CEB6" />
        <rect x="270" y="206" width="68" height="4" rx="2" fill="#D8CEB6" />
        {/* Photo with skyline */}
        <rect x="296" y="226" width="54" height="44" rx="2" fill="#FFFFFF" stroke="#E0D6BE" strokeWidth="1.5" />
        <rect x="298.5" y="228.5" width="49" height="21" fill="url(#gSky)" />
        <path d="M298.5 246 Q310 238 322 246 Q334 252 347.5 246 V249.5 H298.5 Z" fill="#0F4C45" fillOpacity="0.45" />
        <path d="M326 249.5 V245.5 A4.5 4.5 0 0 1 335 245.5 V249.5 Z" fill="#0F4C45" fillOpacity="0.55" />
        <rect x="298.5" y="249.5" width="49" height="21" fill="#EDE4D1" />
        {/* Wax seal */}
        <circle cx="272" cy="300" r="13" fill="url(#gSeal)" stroke="#5E1620" strokeWidth="1" />
        <circle cx="272" cy="300" r="6.5" fill="none" stroke="#C6A15B" strokeOpacity="0.6" strokeWidth="1.5" />
        <circle cx="272" cy="300" r="2" fill="#C6A15B" fillOpacity="0.8" />
        <ellipse cx="267" cy="295" rx="4" ry="2.4" fill="#FFFFFF" opacity="0.25" transform="rotate(-30 267 295)" />
        {/* Paperclip */}
        <path d="M330 141 v24 c0 7 -7 7 -7 0 v-22" stroke="#C6A15B" strokeWidth="2.6" fill="none" />
        {/* Scan line */}
        <rect x="270" y="216" width="100" height="2" fill="#C6A15B" fillOpacity="0.65" />
        <path d="M370 217 l-6 -3 v6 Z" fill="#C6A15B" fillOpacity="0.65" />
      </g>

      {/* Front document */}
      <polygon points="196,274 254,266 264,356 206,364" fill="#F5EFE0" stroke="#D9CFB7" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="214" y="290" width="36" height="4" rx="2" fill="#D8CEB6" />
      <rect x="214" y="302" width="28" height="4" rx="2" fill="#D8CEB6" />
      <rect x="214" y="314" width="32" height="4" rx="2" fill="#D8CEB6" />
      <path d="M254 266 L264 266 L254 276 Z" fill="#C6A15B" fillOpacity="0.6" />

      {/* Magnifying glass */}
      <g>
        <circle cx="324" cy="250" r="38" fill="none" stroke="#8FA09A" strokeWidth="4" />
        <circle cx="324" cy="250" r="36" fill="url(#gGlass)" fillOpacity="0.55" />
        <circle cx="324" cy="250" r="34" fill="none" stroke="#C7D5CF" strokeWidth="1.5" />
        <ellipse cx="311" cy="237" rx="11" ry="5" fill="#FFFFFF" opacity="0.55" transform="rotate(-28 311 237)" />
        <circle cx="352" cy="276" r="5.5" fill="#8A6B2F" />
        <path d="M354 278 L378 304" stroke="#A9853F" strokeWidth="9" strokeLinecap="round" />
        <path d="M355 280 L376 302" stroke="#C6A15B" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Floating metadata / digitization pixels */}
      <rect x="374" y="130" width="7" height="7" rx="1.5" fill="#C6A15B" fillOpacity="0.7" />
      <rect x="384" y="144" width="5" height="5" rx="1.2" fill="#C6A15B" fillOpacity="0.45" />
      <rect x="370" y="156" width="6" height="6" rx="1.4" fill="#0F4C45" fillOpacity="0.35" />
      <rect x="476" y="290" width="14" height="4" rx="2" fill="#C6A15B" fillOpacity="0.5" />
      <rect x="470" y="302" width="20" height="3" rx="1.5" fill="#0F4C45" fillOpacity="0.3" />
      <rect x="474" y="312" width="10" height="3" rx="1.5" fill="#C6A15B" fillOpacity="0.4" />
    </svg>
  );
}
