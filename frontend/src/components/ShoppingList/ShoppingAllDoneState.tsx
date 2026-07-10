import { useI18n } from '../../context/I18nContext';

export default function ShoppingAllDoneState() {
  const { t } = useI18n();

  return (
    <div className="text-center py-12 px-4 flex flex-col items-center justify-center animate-fade-in-up relative overflow-hidden">
      {/* Self-contained CSS animations for the clean geometric illustration */}
      <style>{`
        @keyframes ring-draw {
          from { stroke-dashoffset: 252; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes check-draw {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes rotate-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotate-counter-clockwise {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes fade-in-scale {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50% { opacity: 0.22; transform: scale(1.04); }
        }

        .anim-container {
          animation: fade-in-scale 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-ring-draw {
          stroke-dasharray: 252;
          stroke-dashoffset: 252;
          animation: ring-draw 1s cubic-bezier(0.22, 1, 0.36, 1) forwards 0.2s;
        }
        .anim-check-draw {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: check-draw 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards 1.1s;
        }
        .anim-rotate-slow {
          animation: rotate-clockwise 45s linear infinite;
          transform-origin: 80px 80px;
        }
        .anim-rotate-reverse-slow {
          animation: rotate-counter-clockwise 60s linear infinite;
          transform-origin: 80px 80px;
        }
        .anim-glow-pulse {
          animation: glow-pulse 5s ease-in-out infinite;
          transform-origin: 80px 80px;
        }
      `}</style>

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sleek, geometric success visual */}
      <div className="relative w-40 h-40 mb-6 select-none anim-container">
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="emeraldGrad" x1="40" y1="40" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <radialGradient id="innerGlow" cx="80" cy="80" r="40" fx="80" fy="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ringGlow" cx="80" cy="80" r="48" fx="80" fy="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
            </radialGradient>
          </defs>

          {/* Concentric ambient geometric rays (extremely subtle) */}
          {/* Outer dashed helper ring (rotating counter-clockwise) */}
          <circle
            cx="80"
            cy="80"
            r="68"
            stroke="currentColor"
            className="text-emerald-500/10 dark:text-emerald-500/5 anim-rotate-reverse-slow"
            strokeWidth="0.75"
            strokeDasharray="4 16"
          />
          {/* Inner dashed helper ring (rotating clockwise) */}
          <circle
            cx="80"
            cy="80"
            r="56"
            stroke="currentColor"
            className="text-emerald-500/15 dark:text-emerald-500/10 anim-rotate-slow"
            strokeWidth="1"
            strokeDasharray="6 12"
          />

          {/* Pulse Glow Behind Ring */}
          <circle
            cx="80"
            cy="80"
            r="48"
            fill="url(#ringGlow)"
            className="anim-glow-pulse"
            opacity="0.15"
          />

          {/* Inner Circle Glow Area */}
          <circle
            cx="80"
            cy="80"
            r="39"
            fill="url(#innerGlow)"
          />

          {/* Static thin track ring */}
          <circle
            cx="80"
            cy="80"
            r="40"
            stroke="currentColor"
            className="text-emerald-500/15 dark:text-emerald-500/5"
            strokeWidth="2"
          />

          {/* Animated active progress ring */}
          <circle
            cx="80"
            cy="80"
            r="40"
            stroke="url(#emeraldGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="anim-ring-draw"
          />

          {/* Center Checkmark */}
          <path
            d="M 62 81 L 74 92 L 98 67"
            stroke="url(#emeraldGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="anim-check-draw"
          />
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
