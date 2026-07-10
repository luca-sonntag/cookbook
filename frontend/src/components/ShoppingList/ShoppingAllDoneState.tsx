import { useI18n } from '../../context/I18nContext';

export default function ShoppingAllDoneState() {
  const { t } = useI18n();

  return (
    <div className="text-center py-12 px-4 flex flex-col items-center justify-center animate-fade-in-up relative overflow-hidden">
      {/* Self-contained CSS animations for the elegant cloche illustration */}
      <style>{`
        @keyframes cloche-mount {
          0% { transform: translateY(12px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes steam-rise {
          0% { stroke-dashoffset: 20; opacity: 0; transform: translateY(2px); }
          50% { opacity: 0.4; }
          100% { stroke-dashoffset: 0; opacity: 0; transform: translateY(-6px); }
        }
        @keyframes check-draw {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes badge-pop {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }

        .anim-cloche-container {
          animation: cloche-mount 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-steam {
          stroke-dasharray: 20;
          animation: steam-rise 3s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .anim-steam-delay-1 {
          animation-delay: 0.8s;
        }
        .anim-steam-delay-2 {
          animation-delay: 1.6s;
        }
        .anim-check-draw {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: check-draw 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards 1s;
        }
        .anim-badge-pop {
          animation: badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.6s;
          transform-origin: 120px 105px;
          opacity: 0;
        }
      `}</style>

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sleek, geometric Cloche visual */}
      <div className="relative w-40 h-40 mb-6 select-none anim-cloche-container">
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Defs for gradients & shadows */}
          <defs>
            <linearGradient id="emeraldGrad" x1="40" y1="40" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="thinLineGrad" x1="25" y1="50" x2="135" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d1d5db" />
              <stop offset="50%" stopColor="#9ca3af" />
              <stop offset="100%" stopColor="#6b7280" />
            </linearGradient>
            <linearGradient id="thinLineDarkGrad" x1="25" y1="50" x2="135" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4b5563" />
              <stop offset="50%" stopColor="#374151" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
            <filter id="badgeShadow" x="95" y="80" width="50" height="50" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#047857" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Steam / Aroma rising from the dish */}
          <g>
            {/* Left steam line */}
            <path
              d="M 68 40 Q 64 30 70 20 T 66 5"
              stroke="url(#emeraldGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="anim-steam opacity-0"
            />
            {/* Center steam line */}
            <path
              d="M 80 38 Q 84 27 78 16 T 82 2"
              stroke="url(#emeraldGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="anim-steam anim-steam-delay-1 opacity-0"
            />
            {/* Right steam line */}
            <path
              d="M 92 40 Q 88 30 94 20 T 90 5"
              stroke="url(#emeraldGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="anim-steam anim-steam-delay-2 opacity-0"
            />
          </g>

          {/* THE CLOCHE (Serving Lid) */}
          <g>
            {/* Plate base platter */}
            {/* Top surface line */}
            <path
              d="M 25 110 H 135"
              stroke="url(#thinLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="block dark:hidden"
            />
            <path
              d="M 25 110 H 135"
              stroke="url(#thinLineDarkGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="hidden dark:block"
            />

            {/* Bottom curved lip of plate */}
            <path
              d="M 32 110 C 32 120, 128 120, 128 110"
              stroke="url(#thinLineGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              className="block dark:hidden"
            />
            <path
              d="M 32 110 C 32 120, 128 120, 128 110"
              stroke="url(#thinLineDarkGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              className="hidden dark:block"
            />

            {/* Cloche Dome Cover */}
            <path
              d="M 40 109 C 40 62, 120 62, 120 109"
              stroke="url(#thinLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="block dark:hidden"
            />
            <path
              d="M 40 109 C 40 62, 120 62, 120 109"
              stroke="url(#thinLineDarkGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="hidden dark:block"
            />

            {/* Handle Knob on top */}
            {/* Small neck base */}
            <path
              d="M 75 62 C 75 59, 85 59, 85 62"
              stroke="url(#thinLineGrad)"
              strokeWidth="2"
              className="block dark:hidden"
            />
            <path
              d="M 75 62 C 75 59, 85 59, 85 62"
              stroke="url(#thinLineDarkGrad)"
              strokeWidth="2"
              className="hidden dark:block"
            />

            {/* Round handle knob */}
            <circle
              cx="80"
              cy="53"
              r="5"
              stroke="url(#thinLineGrad)"
              strokeWidth="2"
              className="block dark:hidden"
            />
            <circle
              cx="80"
              cy="53"
              r="5"
              stroke="url(#thinLineDarkGrad)"
              strokeWidth="2"
              className="hidden dark:block"
            />
          </g>

          {/* ELEGANT CHECKMARK BADGE OVERLAY (Bottom-right aligned) */}
          <g className="anim-badge-pop" filter="url(#badgeShadow)">
            {/* Outer White/Dark Ring */}
            <circle
              cx="120"
              cy="105"
              r="17"
              fill="#ffffff"
              className="dark:fill-[#1b1d24]"
            />
            {/* Inner Emerald Badge */}
            <circle
              cx="120"
              cy="105"
              r="14"
              className="fill-emerald-500 dark:fill-emerald-600"
            />
            {/* Checkmark Line */}
            <path
              d="M 114 105 L 118 109 L 126 100"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="anim-check-draw"
            />
          </g>
        </svg>
      </div>

      {/* Typography and copy */}
      <h4 className="text-base font-bold text-gray-950 dark:text-white tracking-tight Outfit">
        {t('shopping.allDoneTitle')}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-[240px] leading-relaxed">
        {t('shopping.allDoneDesc')}
      </p>
    </div>
  );
}
