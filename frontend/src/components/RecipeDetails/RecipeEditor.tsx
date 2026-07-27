import { useState } from 'react';
import { Button } from '@heroui/react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import type { Recipe, Ingredient, IngredientGroup } from '../../types';
import { apiUrl } from '../../api';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';

// The parent mounts this only while editing (see RecipeDetails), so the form is
// seeded once from props via useState initializers — no syncing effect needed.
interface RecipeEditorProps {
  recipe: Recipe;
  onClose: () => void;
  onReplaceCurrent: (newRecipe: Recipe) => void;
}

// Working copies keep amounts as strings so the field can be cleared / typed
// with a comma while editing; they are coerced back to numbers on save.
interface EditIngredient extends Omit<Ingredient, 'amount'> {
  amount: string;
}
interface EditGroup {
  name: string;
  items: EditIngredient[];
}

const toEditGroups = (groups: IngredientGroup[] | undefined): EditGroup[] =>
  (groups ?? []).map(g => ({
    name: g.name,
    items: (g.items ?? []).map(item => ({
      ...item,
      amount: item.amount ? String(item.amount) : '',
    })),
  }));

export default function RecipeEditor({ recipe, onClose, onReplaceCurrent }: RecipeEditorProps) {
  const { t } = useI18n();
  const { getAccessToken } = useAuth();

  const [title, setTitle] = useState(recipe.title);
  const [servings, setServings] = useState<string>(recipe.servings ? String(recipe.servings) : '');
  const [groups, setGroups] = useState<EditGroup[]>(() => toEditGroups(recipe.ingredients));
  const [steps, setSteps] = useState<string[]>(() => (recipe.instructions ?? []).map(s => s.description));
  const [notes, setNotes] = useState<string>(recipe.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Ingredient helpers ──────────────────────────────────────────────
  const updateIngredient = (gi: number, ii: number, patch: Partial<EditIngredient>) => {
    setGroups(prev => prev.map((g, gIdx) =>
      gIdx !== gi ? g : { ...g, items: g.items.map((it, iIdx) => (iIdx !== ii ? it : { ...it, ...patch })) }
    ));
  };

  const removeIngredient = (gi: number, ii: number) => {
    setGroups(prev => prev.map((g, gIdx) =>
      gIdx !== gi ? g : { ...g, items: g.items.filter((_, iIdx) => iIdx !== ii) }
    ));
  };

  const addIngredient = (gi: number) => {
    setGroups(prev => prev.map((g, gIdx) =>
      gIdx !== gi ? g : { ...g, items: [...g.items, { name: '', amount: '', unit: '' }] }
    ));
  };

  // Adds a fresh ingredient — creating a fallback group when the recipe has none.
  const addIngredientToNewOrLastGroup = () => {
    setGroups(prev => {
      if (prev.length === 0) {
        return [{ name: t('recipe.editMoreIngredientsGroup'), items: [{ name: '', amount: '', unit: '' }] }];
      }
      const lastIdx = prev.length - 1;
      return prev.map((g, gIdx) =>
        gIdx !== lastIdx ? g : { ...g, items: [...g.items, { name: '', amount: '', unit: '' }] }
      );
    });
  };

  // ─── Step helpers ────────────────────────────────────────────────────
  const updateStep = (idx: number, value: string) =>
    setSteps(prev => prev.map((s, i) => (i === idx ? value : s)));
  const removeStep = (idx: number) => setSteps(prev => prev.filter((_, i) => i !== idx));
  const addStep = () => setSteps(prev => [...prev, '']);

  // ─── Save ────────────────────────────────────────────────────────────
  const buildRecipe = (): Recipe => {
    const parsedServings = parseFloat(servings.replace(',', '.'));
    return {
      ...recipe,
      title: title.trim() || recipe.title,
      servings: Number.isFinite(parsedServings) && parsedServings > 0 ? parsedServings : recipe.servings,
      ingredients: groups
        .map(g => ({
          name: g.name,
          items: g.items
            .filter(it => it.name.trim().length > 0)
            .map(it => {
              const amt = parseFloat(String(it.amount).replace(',', '.'));
              return {
                ...it,
                name: it.name.trim(),
                amount: Number.isFinite(amt) ? amt : 0,
                unit: (it.unit ?? '').trim(),
              } as Ingredient;
            }),
        }))
        .filter(g => g.items.length > 0),
      instructions: steps
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map((description, i) => ({ step: i + 1, description })),
      notes: notes.trim() ? notes.trim() : undefined,
    };
  };

  const handleSave = async () => {
    if (isSaving || !recipe.id) return;
    setIsSaving(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const res = await fetch(apiUrl(`/api/jobs/${recipe.id}/recipe`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ recipe: buildRecipe() }),
      });
      if (!res.ok) throw new Error('Failed to save recipe.');
      const data = await res.json();
      if (data?.updatedRecipeJson) {
        onReplaceCurrent(data.updatedRecipeJson);
      }
      onClose();
    } catch (err) {
      console.error('Error saving recipe edits:', err);
      setError(t('recipe.editSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors';
  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400';

  return (
    <div className="fixed inset-0 z-[95] bg-white dark:bg-gray-950 flex flex-col pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-black/5 dark:border-white/5 shrink-0">
        <Button
          isIconOnly
          variant="outline"
          onClick={onClose}
          aria-label={t('recipe.editCancel')}
          className="w-10 h-10 min-w-[40px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-black/10 dark:border-white/10 rounded-xl flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </Button>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">{t('recipe.editRecipe')}</h2>
        <Button
          onClick={handleSave}
          isDisabled={isSaving}
          className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-60"
        >
          <Check className="w-4 h-4" />
          {isSaving ? t('recipe.editSaving') : t('recipe.editSave')}
        </Button>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t('recipe.editTitleLabel')}</label>
          <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Servings */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t('recipe.editServingsLabel')}</label>
          <input
            className={`${inputClass} max-w-[120px]`}
            type="number"
            inputMode="numeric"
            min={1}
            value={servings}
            onChange={e => setServings(e.target.value)}
          />
        </div>

        {/* Ingredients */}
        <div className="flex flex-col gap-3">
          <label className={labelClass}>{t('recipe.editIngredientsLabel')}</label>
          {groups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-2">
              {groups.length > 1 && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {group.name}
                </span>
              )}
              {group.items.map((item, ii) => (
                <div key={ii} className="flex items-center gap-2">
                  <input
                    className={`${inputClass} w-16 text-center px-2`}
                    placeholder={t('recipe.editAmountPlaceholder')}
                    inputMode="decimal"
                    value={item.amount}
                    onChange={e => updateIngredient(gi, ii, { amount: e.target.value })}
                  />
                  <input
                    className={`${inputClass} w-20 px-2`}
                    placeholder={t('recipe.editUnitPlaceholder')}
                    value={item.unit ?? ''}
                    onChange={e => updateIngredient(gi, ii, { unit: e.target.value })}
                  />
                  <input
                    className={`${inputClass} flex-1`}
                    placeholder={t('recipe.editIngredientNamePlaceholder')}
                    value={item.name}
                    onChange={e => updateIngredient(gi, ii, { name: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(gi, ii)}
                    aria-label={t('recipe.editRemove')}
                    className="shrink-0 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {groups.length > 1 && (
                <button
                  type="button"
                  onClick={() => addIngredient(gi)}
                  className="self-start text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 px-1 py-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('recipe.editAddIngredient')}
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredientToNewOrLastGroup}
            className="self-start mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t('recipe.editAddIngredient')}
          </button>
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('recipe.editInstructionsLabel')}</label>
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-2.5 w-6 shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-center">
                {idx + 1}.
              </span>
              <textarea
                className={`${inputClass} resize-y min-h-[64px]`}
                placeholder={t('recipe.editStepPlaceholder')}
                value={step}
                onChange={e => updateStep(idx, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeStep(idx)}
                aria-label={t('recipe.editRemove')}
                className="mt-1.5 shrink-0 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
            className="self-start mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t('recipe.editAddStep')}
          </button>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t('recipe.notesTitle')}</label>
          <textarea
            className={`${inputClass} resize-y min-h-[96px]`}
            placeholder={t('recipe.notesPlaceholder')}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
