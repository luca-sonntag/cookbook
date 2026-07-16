import { Button, Card } from "@heroui/react";
import { ArrowRight, Smartphone, ChefHat, HeartPulse } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-12">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center mt-8">
        <div className="mb-6 shadow-xl shadow-emerald-500/20 rounded-2xl overflow-hidden">
          <img src="/icon-512.png" alt="Snagbite Logo" className="w-16 h-16 object-cover" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
          Rezept-Videos. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
            Einfach extrahiert.
          </span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
          Teile einfach Short-Form Content (Reels, TikToks, Shorts) mit der App und erhalte sofort ein strukturiertes Rezept mit Zutaten, Schritten und Nährwerten.
        </p>
        <Button 
          variant="primary"
          className="w-full font-semibold text-white bg-emerald-500 shadow-lg shadow-emerald-500/30"
        >
          App herunterladen <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </section>

      {/* Features Section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold mb-2">Features</h2>
        
        <Card className="glass-panel border-none shadow-sm">
          <Card.Header className="flex gap-3 px-4 pt-4 pb-0">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <p className="text-md font-semibold">Direkt über das "Teilen"-Menü</p>
            </div>
          </Card.Header>
          <Card.Content className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">
            Kein lästiges Kopieren. Teile das Video einfach direkt aus der Social-Media-App mit Snagbite.
          </Card.Content>
        </Card>

        <Card className="glass-panel border-none shadow-sm">
          <Card.Header className="flex gap-3 px-4 pt-4 pb-0">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
              <ChefHat className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <p className="text-md font-semibold">KI-gestützte Extraktion</p>
            </div>
          </Card.Header>
          <Card.Content className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">
            Unsere KI erkennt Zutaten und Arbeitsschritte aus dem Video und der Beschreibung und strukturiert sie perfekt.
          </Card.Content>
        </Card>

        <Card className="glass-panel border-none shadow-sm">
          <Card.Header className="flex gap-3 px-4 pt-4 pb-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <p className="text-md font-semibold">Nährwerte inklusive</p>
            </div>
          </Card.Header>
          <Card.Content className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">
            Erhalte automatisch berechnete Nährwerte (Kalorien, Protein, Kohlenhydrate, Fett) für jedes extrahierte Rezept.
          </Card.Content>
        </Card>
      </section>
      
      <div className="h-8"></div>
    </div>
  );
}
