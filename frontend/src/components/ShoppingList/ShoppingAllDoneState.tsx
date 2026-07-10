import { useI18n } from '../../context/I18nContext';

export default function ShoppingAllDoneState() {
  const { t } = useI18n();

  return (
    <div className="text-center py-10 px-4 flex flex-col items-center justify-center animate-fade-in-up relative overflow-hidden">
      {/* Self-contained CSS animations for the illustration */}
      <style>{`
        @keyframes bag-bounce {
          0% { transform: translateY(15px) scale(0.92); opacity: 0; }
          60% { transform: translateY(-4px) scale(1.02); opacity: 0.9; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes veggie-float-1 {
          0%, 100% { transform: translateY(0) rotate(-25deg); }
          50% { transform: translateY(-4px) rotate(-23deg); }
        }
        @keyframes veggie-float-2 {
          0%, 100% { transform: translateY(0) rotate(15deg); }
          50% { transform: translateY(-3px) rotate(17deg); }
        }
        @keyframes veggie-float-3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes leaf-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes sparkle-pulse-fast {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
          50% { transform: scale(1.25) rotate(45deg); opacity: 1; }
        }
        @keyframes sparkle-pulse-slow {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
          50% { transform: scale(1.2) rotate(-30deg); opacity: 0.9; }
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

        .anim-bag {
          animation: bag-bounce 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-bread {
          animation: veggie-float-1 3s ease-in-out infinite;
          transform-origin: 75px 110px;
        }
        .anim-carrot {
          animation: veggie-float-2 3.5s ease-in-out infinite;
          transform-origin: 110px 100px;
        }
        .anim-carrot-leaves {
          animation: leaf-sway 2.5s ease-in-out infinite;
          transform-origin: 111px 70px;
        }
        .anim-greens {
          animation: veggie-float-3 4s ease-in-out infinite;
        }
        .anim-tomato {
          animation: veggie-float-3 3.2s ease-in-out infinite 0.3s;
        }
        .anim-sparkle-1 {
          animation: sparkle-pulse-fast 2s ease-in-out infinite;
          transform-origin: 45px 50px;
        }
        .anim-sparkle-2 {
          animation: sparkle-pulse-slow 2.8s ease-in-out infinite;
          transform-origin: 160px 65px;
        }
        .anim-sparkle-3 {
          animation: sparkle-pulse-fast 2.4s ease-in-out infinite 0.5s;
          transform-origin: 40px 130px;
        }
        .anim-check-draw {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: check-draw 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.8s;
        }
        .anim-badge-pop {
          animation: badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.6s;
          transform-origin: 145px 145px;
          opacity: 0;
        }
      `}</style>

      {/* Decorative ambient background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Modern, organic cooking/shopping illustration */}
      <div className="relative w-48 h-48 mb-4 select-none anim-bag">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="paperBagGrad" x1="60" y1="100" x2="140" y2="170" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ebd8c3" />
              <stop offset="100%" stopColor="#d9be9e" />
            </linearGradient>
            <linearGradient id="paperBagDarkGrad" x1="60" y1="100" x2="140" y2="170" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#43372b" />
              <stop offset="100%" stopColor="#2c2217" />
            </linearGradient>
            <linearGradient id="breadGrad" x1="65" y1="55" x2="87" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="carrotGrad" x1="105" y1="70" x2="118" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="tomatoGrad" x1="112" y1="79" x2="144" y2="111" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <linearGradient id="greensGrad" x1="80" y1="60" x2="108" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="leavesGrad" x1="102" y1="40" x2="124" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <filter id="badgeShadow" x="110" y="110" width="70" height="70" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#047857" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* BACKGROUND SPARKLING STARS */}
          {/* Sparkle 1 */}
          <path
            d="M 45 42 L 47 47 L 52 49 L 47 51 L 45 56 L 43 51 L 38 49 L 43 47 Z"
            fill="#34d399"
            className="anim-sparkle-1"
          />
          {/* Sparkle 2 */}
          <path
            d="M 160 58 L 161.5 62 L 165.5 63.5 L 161.5 65 L 160 69 L 158.5 65 L 154.5 63.5 L 158.5 62 Z"
            fill="#fbbf24"
            className="anim-sparkle-2"
          />
          {/* Sparkle 3 */}
          <path
            d="M 40 125 L 41 129 L 45 130 L 41 131 L 40 135 L 39 131 L 35 130 L 39 129 Z"
            fill="#6ee7b7"
            className="anim-sparkle-3"
          />

          {/* GROCERIES INSIDE (Back Layer) */}
          
          {/* 1. Baguette / Bread (Left) */}
          <g className="anim-bread">
            <rect
              x="62"
              y="45"
              width="24"
              height="80"
              rx="12"
              fill="url(#breadGrad)"
              stroke="#b45309"
              strokeWidth="2"
            />
            {/* Diagonal cuts */}
            <line x1="68" y1="62" x2="80" y2="56" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="69" y1="77" x2="81" y2="71" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="70" y1="92" x2="82" y2="86" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* 2. Leafy greens / Salad (Center-Left) */}
          <g className="anim-greens">
            <path
              d="M 82 85 C 76 78, 76 68, 83 62 C 90 56, 100 56, 105 63 C 111 70, 109 80, 103 85 Z"
              fill="url(#greensGrad)"
              stroke="#15803d"
              strokeWidth="1.5"
            />
            {/* Salad veins */}
            <path d="M 91 80 Q 94 70 93 63 M 87 74 Q 92 73 93 70 M 97 76 Q 94 74 93 72" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* 3. Carrot (Center-Right) */}
          <g className="anim-carrot">
            {/* Carrot Leaves (swaying) */}
            <g className="anim-carrot-leaves">
              <path d="M 111 70 C 108 55, 102 50, 102 43 M 111 70 C 112 52, 115 45, 115 38 M 111 70 C 117 55, 123 50, 123 43" stroke="url(#leavesGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
            {/* Carrot Body */}
            <path
              d="M 104 70 Q 112 68 118 73 L 112 108 L 104 70 Z"
              fill="url(#carrotGrad)"
              stroke="#c2410c"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Carrot texture lines */}
            <path d="M 106 82 H 112 M 109 92 H 113 M 107 100 H 110" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* 4. Tomato (Right) */}
          <g className="anim-tomato">
            <circle
              cx="128"
              cy="92"
              r="17"
              fill="url(#tomatoGrad)"
              stroke="#b91c1c"
              strokeWidth="2"
            />
            {/* Stem */}
            <path
              d="M 128 75 C 127 72, 129 70, 129 67 M 128 75 L 123 73 M 128 75 L 133 73 M 128 75 L 125 78 M 128 75 L 131 78"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Tomato highlight gloss */}
            <path
              d="M 137 84 A 9 9 0 0 0 128 77"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.3"
            />
          </g>

          {/* BAG FRONT PANEL (Masks the groceries) */}
          {/* Handles */}
          <path
            d="M 82 100 C 82 78, 96 78, 96 100"
            stroke="#b45309"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="dark:stroke-[#5a4837]"
          />
          <path
            d="M 104 100 C 104 78, 118 78, 118 100"
            stroke="#b45309"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="dark:stroke-[#5a4837]"
          />

          {/* Paper Bag Body */}
          <path
            d="M 65 100 L 135 100 C 138 100, 140 102, 140 105 L 136 160 C 135 166, 130 170, 124 170 L 76 170 C 70 170, 65 166, 64 160 L 60 105 C 60 102, 62 100, 65 100 Z"
            fill="url(#paperBagGrad)"
            stroke="#854d0e"
            strokeWidth="2"
            strokeLinejoin="round"
            className="block dark:hidden"
          />
          <path
            d="M 65 100 L 135 100 C 138 100, 140 102, 140 105 L 136 160 C 135 166, 130 170, 124 170 L 76 170 C 70 170, 65 166, 64 160 L 60 105 C 60 102, 62 100, 65 100 Z"
            fill="url(#paperBagDarkGrad)"
            stroke="#5a432c"
            strokeWidth="2"
            strokeLinejoin="round"
            className="hidden dark:block"
          />

          {/* Fold lines/seams on the bag for detail */}
          <path
            d="M 64 110 L 76 170 M 136 110 L 124 170"
            stroke="#b45309"
            strokeWidth="1"
            opacity="0.15"
            className="block dark:hidden"
          />
          <path
            d="M 64 110 L 76 170 M 136 110 L 124 170"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.08"
            className="hidden dark:block"
          />

          {/* ELEGANT CHECKMARK BADGE OVERLAY */}
          <g className="anim-badge-pop" filter="url(#badgeShadow)">
            {/* Outer Badge Ring */}
            <circle
              cx="145"
              cy="145"
              r="22"
              fill="#ffffff"
              className="dark:fill-[#1b1d24]"
            />
            {/* Inner Emerald Circle */}
            <circle
              cx="145"
              cy="145"
              r="18"
              className="fill-emerald-500 dark:fill-emerald-600"
            />
            {/* Checkmark Line */}
            <path
              d="M 137 145 L 142 150 L 153 139"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="anim-check-draw"
            />
          </g>
        </svg>
      </div>

      {/* Copywriting / Text details */}
      <h4 className="text-base font-bold text-gray-900 dark:text-white Outfit">
        {t('shopping.allDoneTitle')}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-[260px] leading-relaxed">
        {t('shopping.allDoneDesc')}
      </p>
    </div>
  );
}
