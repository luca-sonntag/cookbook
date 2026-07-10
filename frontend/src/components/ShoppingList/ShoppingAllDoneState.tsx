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
            {/* Baguette Main Body */}
            <path
              d="M 60 115 C 60 85, 62 48, 72 40 C 82 32, 88 75, 88 115 Z"
              fill="url(#breadGrad)"
              stroke="#92400e"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Floury Cuts with lighter inside */}
            <path
              d="M 63 60 C 66 56, 75 51, 77 54 C 77 56, 68 64, 65 64 C 64 64, 63 62, 63 60 Z"
              fill="#fef3c7"
              stroke="#b45309"
              strokeWidth="1.5"
            />
            <path
              d="M 66 75 C 69 71, 78 66, 80 69 C 80 71, 71 79, 68 79 C 67 79, 66 77, 66 75 Z"
              fill="#fef3c7"
              stroke="#b45309"
              strokeWidth="1.5"
            />
            <path
              d="M 69 90 C 72 86, 81 81, 83 84 C 83 86, 74 94, 71 94 C 70 94, 69 92, 69 90 Z"
              fill="#fef3c7"
              stroke="#b45309"
              strokeWidth="1.5"
            />
            {/* Texture shading lines */}
            <path d="M 61 100 Q 64 102 67 101 M 62 85 Q 65 87 68 86" stroke="#b45309" strokeWidth="1" opacity="0.3" />
          </g>

          {/* 2. Leafy greens / Salad (Center-Left) */}
          <g className="anim-greens">
            {/* Back dark leaf */}
            <path
              d="M 76 85 C 70 75, 73 63, 83 62 C 89 62, 93 72, 93 85 Z"
              fill="#15803d"
              stroke="#14532d"
              strokeWidth="1.5"
            />
            {/* Back right leaf */}
            <path
              d="M 95 85 C 95 72, 99 63, 104 63 C 111 63, 113 75, 107 85 Z"
              fill="#166534"
              stroke="#14532d"
              strokeWidth="1.5"
            />
            {/* Main center leaf (gradient) */}
            <path
              d="M 82 85 C 78 70, 86 64, 94 64 C 102 64, 106 70, 102 85 Z"
              fill="url(#greensGrad)"
              stroke="#15803d"
              strokeWidth="1.75"
            />
            {/* Front small leaf overlay */}
            <path
              d="M 87 85 C 85 76, 91 72, 94 76 C 97 80, 96 85, 94 85 Z"
              fill="#86efac"
              stroke="#22c55e"
              strokeWidth="1.25"
            />
            {/* Salad texture lines/veins */}
            <path d="M 91 80 Q 93 72 92 67" stroke="#166534" strokeWidth="1.25" strokeLinecap="round" opacity="0.7" />
          </g>

          {/* 3. Carrot (Center-Right) */}
          <g className="anim-carrot">
            {/* Carrot Leaves (swaying) */}
            <g className="anim-carrot-leaves">
              {/* Branch 1 */}
              <path d="M 111 70 Q 107 54 99 44" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="99" cy="44" r="3.5" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
              <circle cx="103" cy="51" r="2.5" fill="#4ade80" />
              {/* Branch 2 (center) */}
              <path d="M 111 70 Q 112 50 112 36" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="112" cy="36" r="3.5" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
              <circle cx="110" cy="45" r="2.5" fill="#22c55e" />
              {/* Branch 3 */}
              <path d="M 111 70 Q 117 54 123 44" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="123" cy="44" r="3.5" fill="#16a34a" stroke="#15803d" strokeWidth="1" />
              <circle cx="119" cy="51" r="2.5" fill="#22c55e" />
            </g>
            {/* Carrot Body (more organic shape) */}
            <path
              d="M 103 70 Q 111 67 118 71 C 119 75, 116 88, 114 98 C 113 103, 112 108, 111 110 C 110 108, 108 103, 107 98 C 105 88, 103 75, 103 70 Z"
              fill="url(#carrotGrad)"
              stroke="#c2410c"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Carrot ridges */}
            <path d="M 105 78 Q 109 80 114 79 M 106 87 Q 110 89 115 88 M 108 96 Q 110 97 112 96" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>

          {/* 4. Tomato (Right) */}
          <g className="anim-tomato">
            {/* Tomato Body */}
            <circle
              cx="129"
              cy="92"
              r="17"
              fill="url(#tomatoGrad)"
              stroke="#b91c1c"
              strokeWidth="2"
            />
            {/* Calyx (green leaf star on top) */}
            <path
              d="M 129 77 C 127 75, 126 73, 124 73 C 126 75, 127 76, 128 77 C 127 78, 125 80, 122 80 C 125 80, 127 79, 129 78 C 130 79, 132 81, 134 82 C 132 80, 130 79, 129 78 C 131 77, 133 76, 135 74 C 132 75, 130 76, 129 77 Z"
              fill="#16a34a"
              stroke="#15803d"
              strokeWidth="0.75"
              strokeLinejoin="round"
            />
            {/* Stem */}
            <path
              d="M 129 76 Q 130 68 134 65"
              stroke="#15803d"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Tomato highlight gloss */}
            <ellipse
              cx="122"
              cy="84"
              rx="4"
              ry="2"
              transform="rotate(-30 122 84)"
              fill="#ffffff"
              opacity="0.5"
            />
            <circle
              cx="118"
              cy="88"
              r="1.25"
              fill="#ffffff"
              opacity="0.4"
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
