import React, { useState } from 'react';
import { Card, Button } from '@heroui/react';
import { Plus, X } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { uiTranslations } from '../../i18n';

interface CustomItemFormProps {
  addCustomItem: (name: string, amount: number, unit: string) => void;
  addFormRef: React.RefObject<HTMLDivElement | null>;
  onClose?: () => void;
}

export default function CustomItemForm({ addCustomItem, addFormRef, onClose }: CustomItemFormProps) {
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
    <div ref={addFormRef} className="animate-fade-in-up">
      <Card className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>{t('shopping.addTitle')}</span>
          </h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label={t('common.cancel', { defaultValue: 'Abbrechen' })}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-6 md:col-span-6">
              <input
                type="text"
                autoFocus
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
            className="w-full mt-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 h-10 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('shopping.btnAdd')}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}

