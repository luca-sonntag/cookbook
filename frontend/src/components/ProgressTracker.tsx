import { useEffect, useState } from 'react';
import { Card } from '@heroui/react';
import { RefreshCw } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import type { SupportedLanguage } from '../i18n';

interface ProgressTrackerProps {
  isPending: boolean;
  jobStatus: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed' | null;
  statusDetails: { text: string; sub: string } | null;
}

const FUNNY_TEXTS: Record<SupportedLanguage, Record<'pending' | 'scraping' | 'processing' | 'completed' | 'failed', string[]>> = {
  de: {
    pending: [
      'Kochmütze wird gerichtet... 👨‍🍳',
      'Hände werden gründlich gewaschen... 🧼',
      'Arbeitsplatte wird sauber gewischt... ✨',
      'Die Pfannen werden vorgeheizt... 🍳',
      'Messer werden geschärft (Vorsicht!)... 🔪',
      'Kochschürze wird festgeknotet... 🎽',
      'Der Ofen wird auf Betriebstemperatur gebracht... 🌡️',
      'Kochlöffel wird bereitgelegt... 🥄',
      'Gemini zieht die Kochschürze an... 🤖',
      'Gewürzregal wird auf Vollständigkeit geprüft... 🌶️'
    ],
    scraping: [
      'Instagram-Küche wird durchwühlt... 🔍',
      'Reel-Zutaten werden digital eingescannt... 📷',
      'Die Tonspur wird aus dem Video gefiltert... 🔊',
      'Untertitel werden entziffert... ✍️',
      'Video-Metadaten werden analysiert... 📊',
      'Audio-Frequenzen werden glattgebügelt... 〰️',
      'Instagrams Anti-Spam-Wächter werden abgelenkt... 🤫',
      'Der Apify-Küchenhelfer holt das Video ab... 📦',
      'Video-Bilder werden stichprobenartig betrachtet... 🎞️',
      'Koch-Reel wird in die Küche getragen... 🏃‍♂️'
    ],
    processing: [
      'Gemini probiert die Soße... 🥣',
      'Gemüse wird geschnippelt... 🥕',
      'Zwiebeln werden geschnitten (Tränen fließen!)... 🧅',
      'Google Gemini liest das Rezept Korrektur... 📖',
      'Soße wird abgeschmeckt und nachgewürzt... 🧂',
      'Kreatives Küchen-Chaos wird verwaltet... 🍳',
      'Portionsgrößen werden mathematisch berechnet... 🧮',
      'Gemini berät sich mit dem Chefkoch... 🧑‍🍳',
      'Eine Prise KI-Magie wird hinzugefügt... ✨',
      'Gericht wird im Ofen überbacken... 🧀'
    ],
    completed: [
      'Rezept wird serviert! 🎉'
    ],
    failed: [
      'Der Topf ist übergelaufen! 💥'
    ]
  },
  en: {
    pending: [
      'Adjusting chef\'s hat... 👨‍🍳',
      'Washing hands thoroughly... 🧼',
      'Wiping down the countertop... ✨',
      'Preheating the pans... 🍳',
      'Sharpening knives (careful!)... 🔪',
      'Tying the apron... 🎽',
      'Bringing the oven to temperature... 🌡️',
      'Setting out the wooden spoon... 🥄',
      'Gemini is putting on the apron... 🤖',
      'Checking the spice rack... 🌶️'
    ],
    scraping: [
      'Rummaging through the Instagram kitchen... 🔍',
      'Digitally scanning Reel ingredients... 📷',
      'Filtering the audio track from the video... 🔊',
      'Deciphering subtitles... ✍️',
      'Analyzing video metadata... 📊',
      'Smoothing out audio frequencies... 〰️',
      'Distracting Instagram\'s anti-spam guardians... 🤫',
      'The Apify kitchen helper is fetching the video... 📦',
      'Reviewing video frames... 🎞️',
      'Carrying the cooking Reel into the kitchen... 🏃‍♂️'
    ],
    processing: [
      'Gemini is tasting the sauce... 🥣',
      'Chopping vegetables... 🥕',
      'Chopping onions (tears are falling!)... 🧅',
      'Google Gemini is proofreading the recipe... 📖',
      'Tasting and seasoning the sauce... 🧂',
      'Managing creative kitchen chaos... 🍳',
      'Mathematically calculating portion sizes... 🧮',
      'Gemini is consulting with the head chef... 🧑‍🍳',
      'Adding a pinch of AI magic... ✨',
      'Grilling the dish in the oven... 🧀'
    ],
    completed: [
      'Recipe is served! 🎉'
    ],
    failed: [
      'The pot boiled over! 💥'
    ]
  }
};

export default function ProgressTracker({ isPending, jobStatus, statusDetails }: ProgressTrackerProps) {
  const { language } = useI18n();
  const [funnyText, setFunnyText] = useState('');

  useEffect(() => {
    if (!isPending || !jobStatus) return;

    const texts = FUNNY_TEXTS[language][jobStatus] || [];
    if (texts.length === 0) return;

    const pickRandom = (current: string) => {
      const available = texts.filter(t => t !== current);
      if (available.length === 0) return texts[0];
      const randomIndex = Math.floor(Math.random() * available.length);
      return available[randomIndex];
    };

    setFunnyText(pickRandom(''));

    const interval = setInterval(() => {
      setFunnyText(prev => pickRandom(prev));
    }, 5000);

    return () => clearInterval(interval);
  }, [jobStatus, isPending, language]);

  if (!isPending || !statusDetails) return null;


  return (
    <Card className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/5 shadow-md transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Spinner */}
        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-500 shrink-0">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {statusDetails.text}
          </h3>
          <p key={funnyText} className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate transition-all duration-300 opacity-90 animate-pulse">
            {funnyText}
          </p>
        </div>
      </div>
    </Card>
  );
}
