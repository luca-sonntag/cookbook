import { useEffect, useState } from 'react';
import { Card } from '@heroui/react';
import { useI18n } from '../context/I18nContext';
import type { SupportedLanguage } from '../i18n';
import type { ProgressData } from '../types';

interface ProgressTrackerProps {
  isPending: boolean;
  jobStatus: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed' | null;
  statusDetails: { text: string; sub: string } | null;
  progress: ProgressData | null;
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
      'KI zieht die Kochschürze an... 🤖',
      'Gewürzregal wird auf Vollständigkeit geprüft... 🌶️'
    ],
    scraping: [
      'Instagram-Küche wird durchwühlt... 🔍',
      'Video-Zutaten werden digital eingescannt... 📷',
      'Die Tonspur wird aus dem Video gefiltert... 🔊',
      'Untertitel werden entziffert... ✍️',
      'Video-Metadaten werden analysiert... 📊',
      'Audio-Frequenzen werden glattgebügelt... 〰️',
      'Instagrams Anti-Spam-Wächter werden abgelenkt... 🤫',
      'Der Apify-Küchenhelfer holt das Video ab... 📦',
      'Video-Bilder werden stichprobenartig betrachtet... 🎞️',
      'Koch-Video wird in die Küche getragen... 🏃‍♂️'
    ],
    processing: [
      'KI probiert die Soße... 🥣',
      'Gemüse wird geschnippelt... 🥕',
      'Zwiebeln werden geschnitten (Tränen fließen!)... 🧅',
      'KI liest das Rezept Korrektur... 📖',
      'Soße wird abgeschmeckt und nachgewürzt... 🧂',
      'Kreatives Küchen-Chaos wird verwaltet... 🍳',
      'Portionsgrößen werden mathematisch berechnet... 🧮',
      'KI berät sich mit dem Chefkoch... 🧑‍🍳',
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
      'AI is putting on the apron... 🤖',
      'Checking the spice rack... 🌶️'
    ],
    scraping: [
      'Rummaging through the Instagram kitchen... 🔍',
      'Digitally scanning video ingredients... 📷',
      'Filtering the audio track from the video... 🔊',
      'Deciphering subtitles... ✍️',
      'Analyzing video metadata... 📊',
      'Smoothing out audio frequencies... 〰️',
      'Distracting Instagram\'s anti-spam guardians... 🤫',
      'The Apify kitchen helper is fetching the video... 📦',
      'Reviewing video frames... 🎞️',
      'Carrying the cooking video into the kitchen... 🏃‍♂️'
    ],
    processing: [
      'AI is tasting the sauce... 🥣',
      'Chopping vegetables... 🥕',
      'Chopping onions (tears are falling!)... 🧅',
      'AI is proofreading the recipe... 📖',
      'Tasting and seasoning the sauce... 🧂',
      'Managing creative kitchen chaos... 🍳',
      'Mathematically calculating portion sizes... 🧮',
      'AI is consulting with the head chef... 🧑‍🍳',
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

export default function ProgressTracker({ isPending, jobStatus, statusDetails, progress }: ProgressTrackerProps) {
  const { language } = useI18n();
  const [funnyText, setFunnyText] = useState('');

  // Determine current stage & percent
  const percent = progress?.percent ?? (jobStatus === 'scraping' ? 15 : jobStatus === 'processing' ? 35 : 5);
  const activeStage = progress?.stage ?? (jobStatus === 'scraping' ? 'scraping' : jobStatus === 'processing' ? 'downloading_media' : 'queued');

  useEffect(() => {
    if (!isPending || !jobStatus) return;

    // Map the active stage to the funny text categories
    let funnyKey: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed' = 'processing';
    if (activeStage === 'queued') {
      funnyKey = 'pending';
    } else if (activeStage === 'scraping') {
      funnyKey = 'scraping';
    } else if (jobStatus === 'completed') {
      funnyKey = 'completed';
    } else if (jobStatus === 'failed') {
      funnyKey = 'failed';
    }

    const texts = FUNNY_TEXTS[language][funnyKey] || [];
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
  }, [jobStatus, activeStage, isPending, language]);

  if (!isPending || !statusDetails) return null;

  return (
    <Card className="glass-panel p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/5 shadow-md transition-all duration-300 w-full">
      <div className="flex flex-col gap-4">
        {/* Top details and percent */}
        <div>
          <div className="flex justify-between items-center text-sm font-semibold text-gray-900 dark:text-white mb-2">
            <span className="truncate pr-2">{statusDetails.text}</span>
            <span className="text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">{percent}%</span>
          </div>

          {/* Smooth Linear Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden relative shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${percent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Rotating funny status text */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5 min-h-[28px] flex items-center">
          <p
            key={funnyText}
            className="text-xs text-gray-500 dark:text-gray-400 italic truncate opacity-90 animate-fade-in"
          >
            {funnyText}
          </p>
        </div>
      </div>
    </Card>
  );
}
