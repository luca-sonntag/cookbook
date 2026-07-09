import React, { useState } from 'react';
import { Card, Button } from '@heroui/react';
import { Plus } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { uiTranslations } from '../../i18n';

interface CustomItemFormProps {
  addCustomItem: (name: string, amount: number, unit: string) => void;
  addFormRef: React.RefObject<HTMLDivElement | null>;
}

export default function CustomItemForm({ addCustomItem, addFormRef }: CustomItemFormProps) {
  const { t, language } = useI18n();

  // Manual item state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');

  // Quick unit suggestions
  const suggestions = uiTranslations[language].shopping.suggestionsList;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numAmount = parseFloat(amount.replace(',', '.'));
    addCustomItem(name.trim(), isNaN(numAmount) ? 0 : numAmount, unit.trim());

    // Reset state
    setName('');
    setAmount('');
    setUnit('');
  };

  return (
    <div ref={addFormRef}>
      <Card className="glass-panel p-4 rounded-2xl border border-black/5 dark:border-white/5">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-500" />
          <span>{t('shopping.addTitle')}</span>
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-6 md:col-span-6">
              <input
                type="text"
                placeholder={t('shopping.placeholderName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2.5 text-base text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="col-span-3 md:col-span-3">
              <input
                type="text"
                placeholder={t('shopping.placeholderAmount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2.5 text-base text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="col-span-3 md:col-span-3">
              <input
                type="text"
                placeholder={t('shopping.placeholderUnit')}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2.5 text-base text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 items-center mt-1">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mr-1">{t('shopping.suggestions')}</span>
            {suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setUnit(sug)}
                className="text-xs px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>

          <Button
            type="submit"
            className="w-full mt-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 h-10 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('shopping.btnAdd')}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
