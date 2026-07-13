import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Button, Drawer } from '@heroui/react';
import { Tag, X, Plus } from 'lucide-react';
import { Job } from '../../types';
import { useI18n } from '../../context/I18nContext';

interface FlagSheetProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  allExistingFlags: string[];
  onSave: (job: Job, flags: string[]) => Promise<void>;
}

export const FlagSheet: React.FC<FlagSheetProps> = ({
  isOpen,
  onClose,
  job,
  allExistingFlags,
  onSave
}) => {
  const { t, language } = useI18n();
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with job flags when opened
  useEffect(() => {
    if (isOpen && job) {
      setTags(job.flags || []);
      setInputValue('');
    }
  }, [isOpen, job]);

  if (!job) return null;

  const handleAddTag = (tagToAdd: string) => {
    const cleaned = tagToAdd.trim();
    if (!cleaned) return;
    if (!tags.includes(cleaned)) {
      setTags(prev => [...prev, cleaned]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Add any remaining text in input
      let finalTags = [...tags];
      const remaining = inputValue.trim();
      if (remaining && !finalTags.includes(remaining)) {
        finalTags.push(remaining);
      }
      await onSave(job, finalTags);
      onClose();
    } catch (err) {
      console.error('Failed to save flags:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Suggest tags that are not already added
  const suggestions = allExistingFlags.filter(
    flag => !tags.includes(flag)
  );

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Drawer>
        <Drawer.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} className="!z-[100]">
          <Drawer.Content placement="bottom" className="!z-[100]">
            <Drawer.Dialog className="!bg-white dark:!bg-gray-900 max-h-[85vh] flex flex-col">
              <Drawer.Handle />

              {/* Header */}
              <Drawer.Header className="border-b border-black/5 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <Tag className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <Drawer.Heading className="text-base font-bold">
                    {t('catalog.flagsTitle') || 'Labels / Tags'}
                  </Drawer.Heading>
                </div>
              </Drawer.Header>

              {/* Body */}
              <Drawer.Body className="overflow-y-auto py-4 flex-1 flex flex-col gap-4">
                {/* Active Tags / Chips list */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                    {language === 'de' ? 'Aktive Labels' : 'Active Labels'}
                  </label>
                  {tags.length === 0 ? (
                    <div className="text-xs text-gray-400 dark:text-gray-500 italic p-3 bg-black/5 dark:bg-white/5 rounded-2xl text-center">
                      {language === 'de' ? 'Keine Labels zugewiesen' : 'No labels assigned'}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-2 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-xl"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors p-0.5 rounded-full hover:bg-black/5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input Form */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                    {t('catalog.addFlag') || 'Neues Label'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('catalog.flagPlaceholder') || 'z.B. Ausprobieren'}
                      className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-base text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Button
                      isIconOnly
                      onPress={() => handleAddTag(inputValue)}
                      className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-md shadow-emerald-600/10"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1 mt-0.5">
                    {language === 'de'
                      ? 'Drücke Enter oder Komma, um das Label hinzuzufügen.'
                      : 'Press Enter or comma to add the label.'}
                  </span>
                </div>

                {/* Suggestions List */}
                {suggestions.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                      {language === 'de' ? 'Häufige Labels' : 'Suggested Labels'}
                    </label>
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {suggestions.slice(0, 12).map(flag => (
                        <button
                          key={flag}
                          type="button"
                          onClick={() => handleAddTag(flag)}
                          className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 transition-all active:scale-95"
                        >
                          + {flag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Drawer.Body>

              {/* Footer */}
              <Drawer.Footer className="border-t border-black/5 dark:border-white/5 pt-3 flex gap-2">
                <Button
                  variant="outline"
                  onPress={onClose}
                  className="flex-1 text-sm h-11 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-semibold active:scale-95 transition-all"
                >
                  {t('dialog.cancelDefault') || 'Abbrechen'}
                </Button>
                <Button
                  onPress={handleSave}
                  isLoading={isSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm h-11 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-95 transition-all"
                >
                  {t('recipe.save') || 'Speichern'}
                </Button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </div>
  );
};
