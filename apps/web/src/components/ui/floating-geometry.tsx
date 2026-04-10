import { memo } from 'react';

export const FloatingGeometry = memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Animated gradient orbs - theme colors */}
      <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] rounded-full opacity-[0.01] bg-primary blur-[40px] animate-orb-float-1 z-0" />
      <div className="absolute top-[60%] right-[-15%] w-[40vw] h-[40vw] rounded-full opacity-[0.01] bg-secondary-accent blur-[100px] animate-orb-float-2" />
      <div className="absolute bottom-[-10%] left-[30%] w-[30vw] h-[30vw] rounded-full opacity-[0.01] bg-primary blur-[60px] animate-orb-float-3" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1.5px, transparent 1.5px),
            linear-gradient(to bottom, currentColor 1.5px, transparent 1.5px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* ═══ TOP SECTION - Wide spread ═══ */}

      {/* Top-left: Dotted Circle */}
      <div
        className="absolute top-[8%] left-[5%] opacity-[0.3] animate-spin-slow"
        style={{ animationDuration: '15s' }}
      >
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" className="text-blue-400">
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            fill="none"
          />
          <circle cx="16" cy="16" r="5" fill="currentColor" opacity="0.2" />
        </svg>
      </div>

      {/* Top-mid-left: Neon Cross */}
      <div className="absolute top-[15%] left-[12%] opacity-[0.4] animate-bounce-vertical">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
          <line
            x1="12"
            y1="4"
            x2="12"
            y2="20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="12"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Top-right: Rotated Diamond */}
      <div className="absolute top-[6%] right-[8%] opacity-[0.3] animate-float-slow">
        <svg width="30" height="30" viewBox="0 0 28 28" fill="none" className="text-purple-400">
          <rect
            x="14"
            y="2"
            width="16"
            height="16"
            rx="2"
            transform="rotate(45 14 2)"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="currentColor"
            fillOpacity="0.1"
          />
        </svg>
      </div>

      {/* Top-mid-right: Triangle */}
      <div className="absolute top-[18%] right-[4%] opacity-[0.35] animate-drift-medium">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="text-emerald-400">
          <polygon
            points="14,3 26,25 2,25"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.08"
          />
        </svg>
      </div>

      {/* ═══ PROMPT / HEADING FOCUS SECTION - Dense Cluster ═══ */}

      {/* Cluster Left 1: Zigzag */}
      <div className="absolute top-[40%] left-[8%] opacity-[0.4] animate-drift-reversed">
        <svg width="48" height="19" viewBox="0 0 44 18" fill="none" className="text-orange-400">
          <polyline
            points="2,14 11,4 20,14 29,4 38,14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Cluster Left 2: Spiral */}
      <div className="absolute top-[45%] left-[18%] opacity-[0.35] animate-spin-slow">
        <svg width="30" height="30" viewBox="0 0 34 34" fill="none" className="text-blue-400">
          <path
            d="M17 17C17 14.5 15 13 13 13C10 13 8 15.5 8 18C8 22 11 25 15 25C20.5 25 24 21 24 16C24 9.5 19 5 13 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Cluster Left 3: Small Dotted Circle */}
      <div className="absolute top-[35%] left-[25%] opacity-[0.4] animate-scale-pulse">
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" className="text-orange-400">
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            fill="none"
          />
          <circle cx="16" cy="16" r="5" fill="currentColor" opacity="0.2" />
        </svg>
      </div>

      {/* Cluster Right 1: Dotted Circle */}
      <div className="absolute top-[45%] right-[10%] opacity-[0.3] animate-float-fast">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-purple-400">
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            fill="none"
          />
          <circle cx="16" cy="16" r="5" fill="currentColor" opacity="0.2" />
        </svg>
      </div>

      {/* Cluster Right 2: Cross */}
      <div
        className="absolute top-[35%] right-[18%] opacity-[0.4] animate-bounce-vertical"
        style={{ animationDelay: '0.5s' }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
          <line
            x1="12"
            y1="4"
            x2="12"
            y2="20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="12"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Cluster Right 3: Triangle */}
      <div
        className="absolute top-[50%] right-[22%] opacity-[0.35] animate-spin-slow"
        style={{ animationDuration: '20s', animationDirection: 'reverse' }}
      >
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="text-purple-400">
          <polygon
            points="14,3 26,25 2,25"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.08"
          />
        </svg>
      </div>

      {/* Cluster Right 4: Small Spiral */}
      <div className="absolute top-[58%] right-[14%] opacity-[0.3] animate-drift-medium">
        <svg width="24" height="24" viewBox="0 0 34 34" fill="none" className="text-purple-400">
          <path
            d="M17 17C17 14.5 15 13 13 13C10 13 8 15.5 8 18C8 22 11 25 15 25C20.5 25 24 21 24 16C24 9.5 19 5 13 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Inner Cluster Left: Tiny cross near text */}
      <div
        className="absolute top-[52%] left-[30%] opacity-[0.5] animate-scale-pulse"
        style={{ animationDelay: '1.2s' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-400">
          <line
            x1="12"
            y1="4"
            x2="12"
            y2="20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="12"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Inner Cluster Right: Tiny rotated diamond near text */}
      <div
        className="absolute top-[42%] right-[28%] opacity-[0.4] animate-float-slow"
        style={{ animationDelay: '0.8s' }}
      >
        <svg width="14" height="14" viewBox="0 0 28 28" fill="none" className="text-emerald-400">
          <rect
            x="14"
            y="2"
            width="16"
            height="16"
            rx="2"
            transform="rotate(45 14 2)"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="currentColor"
            fillOpacity="0.1"
          />
        </svg>
      </div>

      {/* ═══ BOTTOM SECTION ═══ */}

      {/* Bottom-left: Rotated Diamond */}
      <div className="absolute bottom-[20%] left-[10%] opacity-[0.3] animate-drift-slow">
        <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="text-blue-400">
          <rect
            x="14"
            y="2"
            width="16"
            height="16"
            rx="2"
            transform="rotate(45 14 2)"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="currentColor"
            fillOpacity="0.1"
          />
        </svg>
      </div>

      {/* Bottom-mid-left: Triangle */}
      <div
        className="absolute bottom-[15%] left-[22%] opacity-[0.35] animate-bounce-vertical"
        style={{ animationDelay: '1s' }}
      >
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="text-orange-400">
          <polygon
            points="14,3 26,25 2,25"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.08"
          />
        </svg>
      </div>

      {/* Bottom-mid-right: Zigzag */}
      <div className="absolute bottom-[12%] right-[25%] opacity-[0.4] animate-float-fast">
        <svg width="38" height="15" viewBox="0 0 44 18" fill="none" className="text-yellow-400">
          <polyline
            points="2,14 11,4 20,14 29,4 38,14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Bottom-right: Spiral */}
      <div className="absolute bottom-[25%] right-[12%] opacity-[0.3] animate-spin-slow">
        <svg width="36" height="36" viewBox="0 0 34 34" fill="none" className="text-purple-400">
          <path
            d="M17 17C17 14.5 15 13 13 13C10 13 8 15.5 8 18C8 22 11 25 15 25C20.5 25 24 21 24 16C24 9.5 19 5 13 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Deep-Bottom-Left: Small Cross */}
      <div
        className="absolute bottom-[8%] left-[30%] opacity-[0.4] animate-scale-pulse"
        style={{ animationDelay: '2s' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
          <line
            x1="12"
            y1="4"
            x2="12"
            y2="20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="12"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ═══ EXTRA DENSITY SECTION - Filling Gaps ═══ */}

      {/* Extra: Far Left Spiral */}
      <div
        className="absolute top-[25%] left-[2%] opacity-[0.3] animate-spin-slow"
        style={{ animationDirection: 'reverse' }}
      >
        <svg width="28" height="28" viewBox="0 0 34 34" fill="none" className="text-emerald-400">
          <path
            d="M17 17C17 14.5 15 13 13 13C10 13 8 15.5 8 18C8 22 11 25 15 25C20.5 25 24 21 24 16C24 9.5 19 5 13 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Extra: Far Right Zigzag */}
      <div
        className="absolute top-[22%] right-[5%] opacity-[0.35] animate-drift-medium"
        style={{ animationDelay: '1.2s' }}
      >
        <svg width="32" height="12" viewBox="0 0 44 18" fill="none" className="text-blue-400">
          <polyline
            points="2,14 11,4 20,14 29,4 38,14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Extra: Center Top Diamond */}
      <div className="absolute top-[12%] left-[45%] opacity-[0.25] animate-float-slow">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="text-yellow-400">
          <rect
            x="14"
            y="2"
            width="16"
            height="16"
            rx="2"
            transform="rotate(45 14 2)"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="currentColor"
            fillOpacity="0.1"
          />
        </svg>
      </div>

      {/* Extra: Center Bottom Cross */}
      <div
        className="absolute bottom-[28%] left-[45%] opacity-[0.3] animate-scale-pulse"
        style={{ animationDelay: '1.5s' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-purple-400">
          <line
            x1="12"
            y1="4"
            x2="12"
            y2="20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="12"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Extra: Bottom Far Right Triangle */}
      <div
        className="absolute bottom-[8%] right-[5%] opacity-[0.4] animate-bounce-vertical"
        style={{ animationDelay: '0.3s' }}
      >
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="text-orange-400">
          <polygon
            points="14,3 26,25 2,25"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.08"
          />
        </svg>
      </div>

      {/* Extra: Bottom Far Left Dotted Circle */}
      <div
        className="absolute bottom-[10%] left-[4%] opacity-[0.25] animate-spin-slow"
        style={{ animationDuration: '18s' }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-emerald-400">
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            fill="none"
          />
          <circle cx="16" cy="16" r="5" fill="currentColor" opacity="0.2" />
        </svg>
      </div>

      {/* Extra: Mid Right High Cross */}
      <div
        className="absolute top-[28%] right-[25%] opacity-[0.35] animate-drift-reversed"
        style={{ animationDelay: '0.8s' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-orange-400">
          <line
            x1="12"
            y1="4"
            x2="12"
            y2="20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="12"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Extra: Mid Left Low Zigzag */}
      <div
        className="absolute bottom-[35%] left-[15%] opacity-[0.3] animate-float-fast"
        style={{ animationDelay: '0.7s' }}
      >
        <svg width="34" height="14" viewBox="0 0 44 18" fill="none" className="text-purple-400">
          <polyline
            points="2,14 11,4 20,14 29,4 38,14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Extra: Mid Right Low Diamond */}
      <div
        className="absolute bottom-[40%] right-[8%] opacity-[0.4] animate-scale-pulse"
        style={{ animationDelay: '2.2s' }}
      >
        <svg width="18" height="18" viewBox="0 0 28 28" fill="none" className="text-blue-400">
          <rect
            x="14"
            y="2"
            width="16"
            height="16"
            rx="2"
            transform="rotate(45 14 2)"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="currentColor"
            fillOpacity="0.1"
          />
        </svg>
      </div>

      {/* Extra: Deep Center Top Spiral */}
      <div
        className="absolute top-[25%] left-[40%] opacity-[0.25] animate-drift-medium"
        style={{ animationDelay: '1s' }}
      >
        <svg width="22" height="22" viewBox="0 0 34 34" fill="none" className="text-emerald-400">
          <path
            d="M17 17C17 14.5 15 13 13 13C10 13 8 15.5 8 18C8 22 11 25 15 25C20.5 25 24 21 24 16C24 9.5 19 5 13 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
});

FloatingGeometry.displayName = 'FloatingGeometry';
