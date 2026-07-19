import { Button, Card } from "@heroui/react";
import { ArrowRight, Smartphone, ChefHat, HeartPulse, Sparkles, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col gap-20 relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-40 right-10 w-80 h-80 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        {/* Left Text Column */}
        <div className="md:col-span-7 flex flex-col items-start text-left">
          <div className="mb-6 shadow-xl shadow-emerald-500/10 rounded-2xl overflow-hidden inline-block p-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
            <img src="/icon-512.png" alt="Snagbite Logo" className="w-16 h-16 object-cover rounded-xl" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6 text-gray-900 dark:text-white leading-tight">
            Rezept-Videos.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
              Einfach extrahiert.
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg leading-relaxed">
            Teile einfach Short-Form Content (Reels, TikToks, Shorts) direkt mit der App und erhalte sofort ein strukturiertes Kochrezept mit sauberen Zutatenlisten, Schritten und Nährwerten.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button 
              className="w-full sm:w-auto font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 px-8 h-12"
            >
              App herunterladen <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <a 
              href="#how-it-works"
              className="inline-flex items-center justify-center font-semibold text-sm text-gray-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors h-12 px-6"
            >
              Mehr erfahren
            </a>
          </div>
        </div>

        {/* Right Preview Column (CSS Mockup transformation) */}
        <div className="md:col-span-5 flex justify-center w-full relative">
          <div className="w-full max-w-sm relative flex flex-col gap-4">
            
            {/* Source Social Reel Card */}
            <div className="glass-panel rounded-2xl p-4 shadow-xl border border-white/25 relative z-10 transition-all hover:scale-[1.02] duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold">IG</div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">@chef_cooker</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">Original Reel</span>
              </div>
              <div className="aspect-video w-full rounded-lg bg-gray-200 dark:bg-gray-800 relative overflow-hidden mb-3 group flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('/icon-512.png')] bg-cover bg-center opacity-25 filter blur-xs"></div>
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-white ml-1"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                🔥 High Protein Smash Taco! 🌮 450 kcal | 40g Protein! Zuerst 150g Rinderhack anbraten auf der Tortilla, dann Cheddar drüber schmelzen...
              </p>
            </div>

            {/* Transition Arrow / Sparkle Indicator */}
            <div className="flex justify-center my-[-8px] relative z-20">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {/* Destination Structured Recipe Card */}
            <div className="glass-panel rounded-2xl p-5 shadow-2xl border border-emerald-500/20 relative z-10 transition-all hover:scale-[1.02] duration-300 bg-white/95 dark:bg-gray-900/95">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">High Protein Smash Taco</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Snagbite Rezept</span>
              </div>

              {/* Nutrition Badges */}
              <div className="grid grid-cols-4 gap-1.5 mb-4 text-center">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded-md">
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">Kcal</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">450</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/40 p-1 rounded-md">
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">Prot</div>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400">40g</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-1 rounded-md">
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">Carb</div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">25g</div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/40 p-1 rounded-md">
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">Fett</div>
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400">18g</div>
                </div>
              </div>

              {/* Mini Ingredients checklist */}
              <div className="flex flex-col gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Check className="w-2.5 h-2.5" /></div>
                  <span>150g Rinderhackfleisch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Check className="w-2.5 h-2.5" /></div>
                  <span>1 Tortilla-Wrap</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Check className="w-2.5 h-2.5" /></div>
                  <span>30g Cheddar-Käse</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="flex flex-col gap-10 scroll-mt-24">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-4">In 3 einfachen Schritten</h2>
          <p className="text-gray-600 dark:text-gray-400">Kein Abtippen, kein Pausieren von Videos. Einfacher geht es nicht.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-200/50 dark:border-gray-800/50">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-500 mb-4 font-bold text-lg">1</div>
            <h3 className="font-semibold text-lg mb-2">Video finden</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Finde ein interessantes Rezept-Video auf Instagram, TikTok oder YouTube Shorts.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-200/50 dark:border-gray-800/50">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-500 mb-4 font-bold text-lg">2</div>
            <h3 className="font-semibold text-lg mb-2">Teilen & Senden</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Tippe im Video auf "Teilen" (Share), wähle Snagbite aus oder kopiere den Link direkt.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-200/50 dark:border-gray-800/50">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-500 mb-4 font-bold text-lg">3</div>
            <h3 className="font-semibold text-lg mb-2">Loskochen!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Das strukturierte Rezept ist sofort bereit: übersichtliche Zutaten, Schritte und genaue Nährwerte.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="flex flex-col gap-10">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Warum Snagbite?</h2>
          <p className="text-gray-600 dark:text-gray-400">Unsere Features machen den Unterschied in deiner Küche.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-panel border-none shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <Card.Header className="flex gap-3 px-6 pt-6 pb-0">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-md font-bold">Direkt im Teilen-Menü</p>
              </div>
            </Card.Header>
            <Card.Body className="px-6 pb-6 text-sm text-gray-500 dark:text-gray-400 mt-2">
              Kein lästiges Kopieren. Teile das Video einfach direkt aus deiner liebsten Social-Media-App mit Snagbite.
            </Card.Body>
          </Card>

          <Card className="glass-panel border-none shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <Card.Header className="flex gap-3 px-6 pt-6 pb-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                <ChefHat className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-md font-bold">KI-gestützte Extraktion</p>
              </div>
            </Card.Header>
            <Card.Body className="px-6 pb-6 text-sm text-gray-500 dark:text-gray-400 mt-2">
              Unsere moderne Multimodal-KI extrahiert Zutaten, Arbeitsschritte und Mengen fehlerfrei aus Video, Bild und Beschreibung.
            </Card.Body>
          </Card>

          <Card className="glass-panel border-none shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <Card.Header className="flex gap-3 px-6 pt-6 pb-0">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-md font-bold">Nährwerte & Makros</p>
              </div>
            </Card.Header>
            <Card.Body className="px-6 pb-6 text-sm text-gray-500 dark:text-gray-400 mt-2">
              Erhalte automatisch berechnete Nährwerte (Kalorien, Eiweiß, Kohlenhydrate, Fett) für jedes Kochrezept.
            </Card.Body>
          </Card>
        </div>
      </section>
      
      <div className="h-4"></div>
    </div>
  );
}
