import { useEffect, useState } from 'react';
import { Button, Drawer } from '@heroui/react';
import { Folder, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useCollections } from '../../hooks/useCollections';
import type { Job, Collection } from '../../types';

interface CollectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  job?: Job;
  selectedJobIds?: string[];
  onUpdated?: () => void;
}

const EMOJIS = ['🥦', '🍕', '🍝', '🥩', '🍰', '🥐', '🥑', '🌮', '🍣', '🍩', '🍳', '🥗', '☕', '🍷'];

export default function CollectionSheet({
  isOpen,
  onClose,
  job,
  selectedJobIds = [],
  onUpdated
}: CollectionSheetProps) {
  const { t } = useI18n();
  const {
    collections,
    refreshCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    updateRecipeCollections
  } = useCollections();

  // Mode: 'assign' (checkboxes) or 'create' (form) or 'edit' (form)
  const [mode, setMode] = useState<'assign' | 'create' | 'edit'>('assign');
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');

  // Memberships state for checkboxes
  const [membershipIds, setMembershipIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Load collections and current memberships on open
  useEffect(() => {
    if (isOpen) {
      refreshCollections();
      setMode('assign');
      setFormError(null);
      
      if (job) {
        setMembershipIds(job.collectionIds ?? []);
      } else {
        setMembershipIds([]);
      }
    }
  }, [isOpen, job, refreshCollections]);

  const handleCreateOpen = () => {
    setName('');
    setSelectedEmoji('');
    setFormError(null);
    setMode('create');
  };

  const handleEditOpen = (col: Collection) => {
    setEditingCollection(col);
    setName(col.name);
    setSelectedEmoji(col.emoji || '');
    setFormError(null);
    setMode('edit');
  };

  const handleSaveCollection = async () => {
    if (!name.trim()) {
      setFormError(t('catalog.collectionNameRequired') || 'Name ist erforderlich');
      return;
    }

    if (mode === 'create') {
      const res = await createCollection(name, selectedEmoji || null);
      if (res.success) {
        setMode('assign');
        onUpdated?.();
      } else {
        setFormError(res.error || 'Fehler beim Erstellen');
      }
    } else if (mode === 'edit' && editingCollection) {
      const res = await updateCollection(editingCollection.id, {
        name,
        emoji: selectedEmoji || null
      });
      if (res.success) {
        setMode('assign');
        onUpdated?.();
      } else {
        setFormError(res.error || 'Fehler beim Aktualisieren');
      }
    }
  };

  const handleDeleteCollection = async () => {
    if (!editingCollection) return;
    const res = await deleteCollection(editingCollection.id);
    if (res.success) {
      setMode('assign');
      onUpdated?.();
    } else {
      setFormError(res.error || 'Fehler beim Löschen');
    }
  };

  const handleToggleMembership = (colId: string) => {
    setMembershipIds(prev =>
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const handleConfirmAssignment = async () => {
    const targetJobIds = job ? [job.id] : selectedJobIds;

    const promises = targetJobIds.map(id => updateRecipeCollections(id, membershipIds));
    await Promise.all(promises);

    onUpdated?.();
    onClose();
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Drawer>
        <Drawer.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} className="!z-[100]">
          <Drawer.Content placement="bottom" className="!z-[100]">
            <Drawer.Dialog className="!bg-white dark:!bg-gray-900 max-h-[85vh] flex flex-col">
              <Drawer.Handle />

              {/* Header */}
              <Drawer.Header className="border-b border-black/5 dark:border-white/5 pb-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <Folder className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <Drawer.Heading className="text-base font-bold">
                      {mode === 'assign'
                        ? (job ? t('catalog.assignCollectionsTitle') || 'Sammlungen zuweisen' : t('catalog.bulkAddToCollection') || 'Zu Sammlung hinzufügen')
                        : mode === 'create'
                        ? t('catalog.addCollection') || 'Neue Sammlung'
                        : t('catalog.editCollection') || 'Sammlung bearbeiten'}
                    </Drawer.Heading>
                  </div>
                  {mode !== 'assign' && (
                    <Button
                      isIconOnly
                      variant="tertiary"
                      className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500"
                      onPress={() => setMode('assign')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Drawer.Header>

              {/* Body */}
              <Drawer.Body className="overflow-y-auto py-4 flex-1">
                {formError && (
                  <div className="mb-3 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10">
                    {formError}
                  </div>
                )}

                {mode === 'assign' ? (
                  <div className="flex flex-col gap-2.5">
                    {collections.length === 0 ? (
                      <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500">
                        {t('catalog.noCollections') || 'Keine Sammlungen erstellt'}
                      </div>
                    ) : (
                      collections.map(col => {
                        const isChecked = membershipIds.includes(col.id);
                        return (
                          <div
                            key={col.id}
                            onClick={() => handleToggleMembership(col.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none active:scale-[0.99] ${
                              isChecked
                                ? 'bg-emerald-500/5 border-emerald-500 dark:bg-emerald-500/10'
                                : 'bg-black/5 dark:bg-white/5 border-transparent hover:border-black/10 dark:hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {col.emoji && <span className="text-xl">{col.emoji}</span>}
                              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                {col.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                isIconOnly
                                variant="tertiary"
                                className="w-8 h-8 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditOpen(col);
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-black/20 dark:border-white/20'
                              }`}>
                                {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <Button
                      variant="secondary"
                      className="mt-2 py-3.5 rounded-2xl border border-dashed border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 flex items-center justify-center gap-2 font-bold text-xs shrink-0"
                      onPress={handleCreateOpen}
                    >
                      <Plus className="w-4 h-4" />
                      {t('catalog.addCollection') || 'Neue Sammlung'}
                    </Button>
                  </div>
                ) : (
                  /* Create / Edit Form */
                  <div className="flex flex-col gap-4">
                    {/* Collection Name Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                        {t('catalog.collectionName') || 'Name der Sammlung'}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('catalog.collectionPlaceholder') || 'z.B. Sonntagsbrunch'}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 text-base text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Emoji Select Grid */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                        {t('catalog.collectionEmoji') || 'Symbol / Emoji'}
                      </label>
                      <div className="flex flex-wrap gap-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedEmoji('')}
                          className={`w-11 h-11 text-lg flex items-center justify-center rounded-2xl transition-all active:scale-90 border border-dashed cursor-pointer ${
                            !selectedEmoji
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'bg-black/5 dark:bg-white/5 border-black/20 dark:border-white/20 hover:border-black/35 dark:hover:border-white/35 text-gray-400 dark:text-gray-500'
                          }`}
                          title={t('dialog.cancelDefault') || 'Keins'}
                        >
                          ∅
                        </button>
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setSelectedEmoji(emoji)}
                            className={`w-11 h-11 text-xl flex items-center justify-center rounded-2xl transition-all active:scale-90 border cursor-pointer ${
                              selectedEmoji === emoji
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                : 'bg-black/5 dark:bg-white/5 border-transparent hover:border-black/10 dark:hover:border-white/10'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Drawer.Body>

              {/* Footer */}
              <Drawer.Footer className="border-t border-black/5 dark:border-white/5 pt-3">
                {mode === 'assign' ? (
                  <div className="flex gap-3 w-full">
                    <Button
                      variant="tertiary"
                      className="flex-1 py-3 rounded-xl text-sm font-semibold"
                      onPress={onClose}
                    >
                      {t('app.dialog.deleteRecipe.cancel') || 'Abbrechen'}
                    </Button>
                    <Button
                      className="flex-[2] py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all"
                      onPress={handleConfirmAssignment}
                      isDisabled={collections.length === 0}
                    >
                      {t('recipe.save') || 'Speichern'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3 w-full">
                    {mode === 'edit' && (
                      <Button
                        variant="tertiary"
                        className="py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10"
                        onPress={handleDeleteCollection}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="tertiary"
                      className="flex-1 py-3 rounded-xl text-sm font-semibold"
                      onPress={() => setMode('assign')}
                    >
                      {t('app.dialog.deleteRecipe.cancel') || 'Abbrechen'}
                    </Button>
                    <Button
                      className="flex-[2] py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-all"
                      onPress={handleSaveCollection}
                    >
                      {t('recipe.save') || 'Speichern'}
                    </Button>
                  </div>
                )}
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </div>
  );
}
