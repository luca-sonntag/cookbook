import { useEffect, useState } from 'react';
import { Card } from '@heroui/react';
import { Check, RefreshCw } from 'lucide-react';

interface ProgressTrackerProps {
  isPending: boolean;
  jobStatus: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed' | null;
  statusDetails: { text: string; sub: string } | null;
}

const PHASES = [
  {
    id: 'pending',
    title: 'Vorbereitung',
    description: 'Küchenhelfer bereitet die Arbeitsfläche vor...',
    tasks: [
      'Hände waschen & Schürze umbinden 👨‍🍳',
      'Kochmütze geraderücken 👨‍🍳',
      'Arbeitsplatte sauber wischen 🧼'
    ]
  },
  {
    id: 'scraping',
    title: 'Zutaten sammeln',
    description: 'Video-Reel herunterladen und scannen...',
    tasks: [
      'Instagram nach dem Reel durchwühlen 🔍',
      'Video-Metadaten scannen 📋',
      'Audiospur extrahieren & anpassen 🔊'
    ]
  },
  {
    id: 'processing',
    title: 'Zubereitung & Kochen',
    description: 'Google Gemini kocht das strukturierte Rezept...',
    tasks: [
      'Gemüse schnippeln & Zwiebeln schneiden (Tränen fließen!) 🧅',
      'Google Gemini liest das Rezept Korrektur 🤖',
      'Soße abschmecken und verfeinern 🧂',
      'Kreatives Küchen-Chaos verwalten 🍳'
    ]
  },
  {
    id: 'completed',
    title: 'Anrichten & Servieren',
    description: 'Das Rezept wird serviert!',
    tasks: [
      'Teller mit Petersilie garnieren 🌿',
      'Rezept schön anrichten 🍽️',
      'Guten Appetit wünschen! 🎉'
    ]
  }
];

export default function ProgressTracker({ isPending, jobStatus, statusDetails }: ProgressTrackerProps) {
  const [activeSubTaskIndex, setActiveSubTaskIndex] = useState(0);

  useEffect(() => {
    setActiveSubTaskIndex(0);
  }, [jobStatus]);

  useEffect(() => {
    if (!isPending || !jobStatus) return;

    const currentPhase = PHASES.find(p => p.id === jobStatus);
    if (!currentPhase) return;

    const interval = setInterval(() => {
      setActiveSubTaskIndex(prev => {
        if (prev < currentPhase.tasks.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [jobStatus, isPending]);

  if (!isPending || !statusDetails) return null;

  const currentPhaseIndex = PHASES.findIndex(p => p.id === jobStatus);

  return (
    <Card className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/5 shadow-xl transition-all duration-300">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-4">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-500 animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Extrahiere Rezept...</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Unser KI-Koch buddy bereitet dein Rezept zu. Bitte hab einen Moment Geduld.
            </p>
          </div>
        </div>

        {/* Vertical timeline */}
        <div className="relative pl-4 flex flex-col gap-8">
          {/* Vertical line connecting steps */}
          <div className="absolute left-[31px] top-4 bottom-4 w-[2px] bg-black/10 dark:bg-white/10" />

          {PHASES.map((phase, idx) => {
            const isCompleted = idx < currentPhaseIndex;
            const isActive = idx === currentPhaseIndex;

            return (
              <div key={phase.id} className="relative flex gap-5 items-start">
                {/* Step node */}
                <div className="relative z-10">
                  {isCompleted ? (
                    <div className="bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-emerald-400 transition-all duration-300">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : isActive ? (
                    <div className="bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 rounded-full w-8 h-8 flex items-center justify-center animate-pulse transition-all duration-300">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold font-mono transition-all duration-300">
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold transition-colors duration-350 ${isActive ? 'text-emerald-500' : isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                      {phase.title}
                    </h4>
                    {isActive && (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider font-mono animate-pulse">
                        Aktiv
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 transition-colors duration-300 ${isActive ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
                    {phase.description}
                  </p>

                  {/* Sub-tasks checklist */}
                  {(isActive || isCompleted) && (
                    <div className="mt-3 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 flex flex-col gap-2.5 transition-all duration-300">
                      {phase.tasks.map((task, taskIdx) => {
                        const isTaskCompleted = isCompleted || taskIdx < activeSubTaskIndex;
                        const isTaskActive = isActive && taskIdx === activeSubTaskIndex;

                        return (
                          <div
                            key={task}
                            className={`flex items-center gap-2.5 text-xs transition-all duration-305 ${
                              isTaskCompleted 
                                ? 'text-emerald-600 dark:text-emerald-400 font-medium' 
                                : isTaskActive 
                                ? 'text-gray-900 dark:text-white font-semibold' 
                                : 'text-gray-400 dark:text-gray-600'
                            }`}
                          >
                            {isTaskCompleted ? (
                              <div className="bg-emerald-500/10 text-emerald-500 rounded-full p-0.5 border border-emerald-500/20 shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : isTaskActive ? (
                              <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-700 shrink-0" />
                            )}
                            <span className={isTaskCompleted ? 'line-through decoration-emerald-500/30' : ''}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
