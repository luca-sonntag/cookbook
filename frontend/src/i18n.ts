export const IngredientCategory = {
  PRODUCE: 'PRODUCE',
  BAKERY: 'BAKERY',
  MEAT_POULTRY: 'MEAT_POULTRY',
  SEAFOOD: 'SEAFOOD',
  DAIRY_EGGS: 'DAIRY_EGGS',
  PANTRY: 'PANTRY',
  GRAINS_PASTA: 'GRAINS_PASTA',
  SPICES_HERBS: 'SPICES_HERBS',
  BAKING: 'BAKING',
  CONDIMENTS_OILS: 'CONDIMENTS_OILS',
  FROZEN: 'FROZEN',
  BEVERAGES: 'BEVERAGES',
  OTHER: 'OTHER'
} as const;

export type IngredientCategory = typeof IngredientCategory[keyof typeof IngredientCategory];

export type SupportedLanguage = 'de' | 'en';

export const categoryTranslations: Record<SupportedLanguage, Record<IngredientCategory, string>> = {
  de: {
    [IngredientCategory.PRODUCE]: 'Obst & Gemüse',
    [IngredientCategory.BAKERY]: 'Brot & Backwaren',
    [IngredientCategory.MEAT_POULTRY]: 'Fleisch & Geflügel',
    [IngredientCategory.SEAFOOD]: 'Fisch & Meeresfrüchte',
    [IngredientCategory.DAIRY_EGGS]: 'Molkereiprodukte & Eier',
    [IngredientCategory.PANTRY]: 'Konserven & Vorrat',
    [IngredientCategory.GRAINS_PASTA]: 'Getreide & Nudeln',
    [IngredientCategory.SPICES_HERBS]: 'Gewürze & Kräuter',
    [IngredientCategory.BAKING]: 'Backzutaten',
    [IngredientCategory.CONDIMENTS_OILS]: 'Saucen & Öle',
    [IngredientCategory.FROZEN]: 'Tiefkühlkost',
    [IngredientCategory.BEVERAGES]: 'Getränke',
    [IngredientCategory.OTHER]: 'Sonstiges',
  },
  en: {
    [IngredientCategory.PRODUCE]: 'Produce',
    [IngredientCategory.BAKERY]: 'Bakery',
    [IngredientCategory.MEAT_POULTRY]: 'Meat & Poultry',
    [IngredientCategory.SEAFOOD]: 'Seafood',
    [IngredientCategory.DAIRY_EGGS]: 'Dairy & Eggs',
    [IngredientCategory.PANTRY]: 'Pantry & Canned Goods',
    [IngredientCategory.GRAINS_PASTA]: 'Grains & Pasta',
    [IngredientCategory.SPICES_HERBS]: 'Spices & Herbs',
    [IngredientCategory.BAKING]: 'Baking',
    [IngredientCategory.CONDIMENTS_OILS]: 'Condiments & Oils',
    [IngredientCategory.FROZEN]: 'Frozen Foods',
    [IngredientCategory.BEVERAGES]: 'Beverages',
    [IngredientCategory.OTHER]: 'Other',
  }
};

// Map legacy category names (German or generic English) to English enum keys for backward compatibility
export const legacyCategoryMap: Record<string, IngredientCategory> = {
  'obst & gemüse': IngredientCategory.PRODUCE,
  'obst und gemüse': IngredientCategory.PRODUCE,
  'gemüse': IngredientCategory.PRODUCE,
  'frische kräuter': IngredientCategory.PRODUCE,
  'brot & backwaren': IngredientCategory.BAKERY,
  'backwaren': IngredientCategory.BAKERY,
  'fleisch & geflügel': IngredientCategory.MEAT_POULTRY,
  'fleisch': IngredientCategory.MEAT_POULTRY,
  'geflügel': IngredientCategory.MEAT_POULTRY,
  'fisch & meeresfrüchte': IngredientCategory.SEAFOOD,
  'fisch': IngredientCategory.SEAFOOD,
  'molkereiprodukte & eier': IngredientCategory.DAIRY_EGGS,
  'molkereiprodukte': IngredientCategory.DAIRY_EGGS,
  'käse & molkereiprodukte': IngredientCategory.DAIRY_EGGS,
  'milchprodukte': IngredientCategory.DAIRY_EGGS,
  'eier': IngredientCategory.DAIRY_EGGS,
  'konserven & vorrat': IngredientCategory.PANTRY,
  'konserven': IngredientCategory.PANTRY,
  'vorrat': IngredientCategory.PANTRY,
  'vorratskammer': IngredientCategory.PANTRY,
  'getreide & nudeln': IngredientCategory.GRAINS_PASTA,
  'getreide': IngredientCategory.GRAINS_PASTA,
  'nudeln': IngredientCategory.GRAINS_PASTA,
  'gewürze & kräuter': IngredientCategory.SPICES_HERBS,
  'gewürze': IngredientCategory.SPICES_HERBS,
  'backzutaten': IngredientCategory.BAKING,
  'saucen & öle': IngredientCategory.CONDIMENTS_OILS,
  'öle & saucen': IngredientCategory.CONDIMENTS_OILS,
  'öle': IngredientCategory.CONDIMENTS_OILS,
  'saucen': IngredientCategory.CONDIMENTS_OILS,
  'tiefkühlkost': IngredientCategory.FROZEN,
  'getränke': IngredientCategory.BEVERAGES,
  'sonstiges': IngredientCategory.OTHER,
  'extras': IngredientCategory.OTHER,
  'ingredients': IngredientCategory.OTHER,
  'zutaten': IngredientCategory.OTHER,
};

export function translateCategory(category: string, lang: SupportedLanguage = 'de'): string {
  if (!category) return categoryTranslations[lang][IngredientCategory.OTHER];
  const cleanCategory = category.trim().toUpperCase();

  // 1. If it's already a valid enum key, translate it directly
  if (cleanCategory in IngredientCategory) {
    return categoryTranslations[lang][cleanCategory as IngredientCategory] || category;
  }

  // 2. Backward compatibility: check if it's a legacy category name
  const lowerCategory = category.trim().toLowerCase();
  const mappedKey = legacyCategoryMap[lowerCategory];
  if (mappedKey) {
    return categoryTranslations[lang][mappedKey];
  }

  // 3. Fallback: return the original string
  return category;
}

// Fixed sorting order for supermarket layout
export const categoryOrder: IngredientCategory[] = [
  IngredientCategory.PRODUCE,
  IngredientCategory.BAKERY,
  IngredientCategory.PANTRY,
  IngredientCategory.GRAINS_PASTA,
  IngredientCategory.SPICES_HERBS,
  IngredientCategory.DAIRY_EGGS,
  IngredientCategory.MEAT_POULTRY,
  IngredientCategory.SEAFOOD,
  IngredientCategory.BAKING,
  IngredientCategory.CONDIMENTS_OILS,
  IngredientCategory.FROZEN,
  IngredientCategory.BEVERAGES,
  IngredientCategory.OTHER
];

// Icons for each category
export const categoryIcons: Record<IngredientCategory, string> = {
  [IngredientCategory.PRODUCE]: '🥦',
  [IngredientCategory.BAKERY]: '🍞',
  [IngredientCategory.MEAT_POULTRY]: '🥩',
  [IngredientCategory.SEAFOOD]: '🐟',
  [IngredientCategory.DAIRY_EGGS]: '🥛',
  [IngredientCategory.PANTRY]: '🥫',
  [IngredientCategory.GRAINS_PASTA]: '🍝',
  [IngredientCategory.SPICES_HERBS]: '🧂',
  [IngredientCategory.BAKING]: '🥣',
  [IngredientCategory.CONDIMENTS_OILS]: '🍾',
  [IngredientCategory.FROZEN]: '❄️',
  [IngredientCategory.BEVERAGES]: '🥤',
  [IngredientCategory.OTHER]: '🛍️',
};

export function getCategoryIcon(category: string): string {
  if (!category) return '🛍️';
  const cleanCategory = category.trim().toUpperCase();
  if (cleanCategory in IngredientCategory) {
    return categoryIcons[cleanCategory as IngredientCategory];
  }
  const lowerCategory = category.trim().toLowerCase();
  const mappedKey = legacyCategoryMap[lowerCategory];
  if (mappedKey) {
    return categoryIcons[mappedKey];
  }
  return '🛍️'; // Default
}

export const uiTranslations = {
  de: {
    app: {
      title: 'KochBuddy',
      subtitle: 'Instagram Reel Rezept-Assistent',
      nav: {
        newRecipe: 'Neues Rezept',
        savedRecipes: 'Rezepte',
        shoppingList: 'Einkaufsliste',
      },
      dialog: {
        deleteRecipe: {
          title: 'Rezept löschen?',
          message: 'Möchtest du dieses Rezept wirklich aus den gespeicherten Rezepten löschen?',
          confirm: 'Löschen',
          cancel: 'Abbrechen',
        },
        deleteError: {
          title: 'Fehler beim Löschen',
          message: 'Das Rezept konnte nicht gelöscht werden.',
        },
        connectionError: {
          title: 'Verbindungsfehler',
          message: 'Es konnte keine Verbindung zum Server hergestellt werden.',
        }
      }
    },
    job: {
      status: {
        pending: {
          text: 'In der Warteschlange...',
          sub: 'Warte auf Server-Ressourcen...',
        },
        scraping: {
          text: 'Reel wird abgerufen...',
          sub: 'Instagram-Daten werden ausgelesen...',
        },
        processing: {
          text: 'Rezept wird erstellt...',
          sub: 'KI analysiert Audio und Text...',
        },
        completed: {
          text: 'Extraktion abgeschlossen!',
          sub: 'Das Rezept wird geladen...',
        },
        failed: {
          text: 'Extraktion fehlgeschlagen',
          sub: 'Das Rezept konnte nicht extrahiert werden.',
        }
      }
    },
    theme: {
      toggle: 'Theme umschalten',
    },
    api: {
      title: 'Backend-Zugriffseinstellungen',
      desc: 'Konfiguriere deinen geheimen API-Schlüssel, um mit den Backend-Endpunkten des Servers zu kommunizieren.',
      keyLabel: 'API-Schlüssel',
      keyPlaceholder: 'Geheimen API-Schlüssel eingeben',
      close: 'Schließen',
    },
    auth: {
      signInTitle: 'Melde dich an, um deine Rezepte zu verwalten',
      signUpTitle: 'Erstelle ein Konto, um loszulegen',
      email: 'E-Mail',
      emailPlaceholder: 'deine@email.de',
      password: 'Passwort',
      passwordPlaceholder: 'Mindestens 6 Zeichen',
      signIn: 'Anmelden',
      signUp: 'Registrieren',
      submitting: 'Wird verarbeitet...',
      haveAccount: 'Bereits ein Konto? Anmelden',
      noAccount: 'Kein Konto? Registrieren',
      checkEmail: 'Bestätigungs-E-Mail gesendet! Bitte überprüfe deinen Posteingang.',
      unexpectedError: 'Ein unerwarteter Fehler ist aufgetreten.',
      signOut: 'Abmelden',
      signInWithGoogle: 'Mit Google anmelden',
    },
    error: {
      title: 'Extraktion fehlgeschlagen',
      default: 'Beim Analysieren des Reels ist ein unbekannter Fehler aufgetreten.',
      retry: 'Wiederholen',
    },
    form: {
      urlLabel: 'Instagram Reel Link',
      urlPlaceholder: 'https://www.instagram.com/reel/...',
      btnPending: 'Rezept wird gelesen...',
      btnSubmit: 'Rezept erstellen',
      validation: {
        required: 'Instagram Reel URL ist erforderlich.',
        invalid: 'Es muss eine gültige Instagram Reel URL sein (z.B. https://www.instagram.com/reel/...Parallel).',
        failedCheck: 'Statusüberprüfung vom Server fehlgeschlagen.',
        failedExtraction: 'Die Rezept-Extraktion ist fehlgeschlagen.',
        lostConnection: 'Verbindung zum Backend-Server verloren.',
        unauthorized: 'Nicht autorisiert. Bitte überprüfe deinen API-Schlüssel in den Einstellungen.',
        submitFailed: 'Auftrag konnte nicht übermittelt werden.',
        submissionError: 'Bei der Übermittlung ist ein Fehler aufgetreten.',
      }
    },
    install: {
      title: 'Als App installieren',
      desc: 'Teile Reels direkt aus Instagram mit dieser App, um Rezepte schneller zu speichern!',
      btn: 'Installieren',
    },
    recipe: {
      copyMarkdown: 'Rezept als Markdown kopieren',
      copyRecipe: 'Rezept kopieren',
      copied: 'Kopiert!',
      delete: 'Rezept löschen',
      prep: 'Vorbereitung',
      cook: 'Zubereitung',
      minutes: '{count} Min.',
      serves: 'Portionen',
      nutritionTitle: 'Nährwerte',
      nutritionPerServing: 'Pro Portion',
      nutritionTotal: 'Gesamt',
      nutritionCalories: 'kcal',
      nutritionProtein: 'Eiweiß',
      nutritionCarbs: 'Kohlenhydrate',
      nutritionFat: 'Fett',
      nutritionProteinShort: 'E',
      nutritionCarbsShort: 'K',
      nutritionFatShort: 'F',
      aiEstimateNotice: 'KI-geschätzte Werte',
      aiEstimateTooltip: 'Diese Nährwerte wurden automatisiert basierend auf den Zutaten und Mengen geschätzt, da in der Quelle keine Angaben vorhanden waren.',
      aiIngredientsEstimateTooltip: 'Die Nährwerte der einzelnen Zutaten sind von der KI geschätzte Richtwerte und können je nach Sorte, Marke und Zubereitung variieren.',
      tabIngredients: 'Zutaten',
      tabInstructions: 'Zubereitung',
      ingredientsTitle: 'Zutaten-Checkliste',
      ingredientsSubtitle: 'Bereits vorbereitete Zutaten abhaken',
      showNutritionPerIngredient: 'Nährwerte pro Zutat',
      addedToShopping: 'In Einkaufsliste hinzugefügt!',
      addToShopping: 'Zur Einkaufsliste hinzufügen',
      goToShoppingList: 'Zur Einkaufsliste gehen',
      alreadyAddedTitle: 'Bereits hinzugefügt',
      alreadyAddedMessage: 'Alle Zutaten dieses Rezepts sind bereits abgehakt!',
      alternativeIngredients: 'Alternative Zutaten',
      requiredEquipment: 'Benötigte Küchengeräte',
      equipmentTooltip: 'Gerät: {name}',
      cookingProgress: 'Kochfortschritt',
      progressSteps: '{completed} von {total} Schritten ({percent}%)',
      startCooking: 'Kochen starten',
      stepByStep: 'Schritt-für-Schritt-Anleitung',
      currentStep: 'Aktueller Schritt',
      tipsTitle: 'Kochtipps vom Chefkoch',
      cookingMode: 'Kochmodus',
      cookingModeProgress: 'Schritt {current} von {total}',
      ingredientsForStep: 'Zutaten für diesen Schritt:',
      back: 'Zurück',
      finish: 'Fertigstellen',
      doneNext: 'Erledigt & Weiter',
      cookingModeTip: 'Tipp: Nutze die Pfeiltasten ← → auf dem Desktop oder wische nach links/rechts auf dem Handy.',
      finishedAlertTitle: 'Fertig!',
      finishedAlertMessage: 'Guten Appetit! Du hast das Rezept erfolgreich zubereitet.',
    },
    catalog: {
      savedOn: 'Gespeichert am {date}',
      viewReel: 'Reel ansehen',
      title: 'Rezepte',
      emptyTitle: 'Keine gespeicherten Rezepte',
      emptyDesc: 'Extrahiere Rezepte aus Instagram Reels im "Neues Rezept" Tab, um sie hier zu speichern!',
      deleteRecipe: 'Rezept löschen',
      backToSaved: 'Zurück zu gespeicherten Rezepten',
      searchPlaceholder: 'Rezepte nach Name, Zutaten oder Tags filtern...',
      viewToggle: 'Ansicht umschalten',
      allFilter: 'Alle',
      under15: '< 15 Min.',
      under30: '< 30 Min.',
      deleteSelected: 'Ausgewählte löschen',
      addToShoppingList: 'Zutaten auf die Einkaufsliste werfen',
      addedToShoppingList: 'Hinzugefügt!',
      itemsSelected: '{count} Rezepte ausgewählt',
      confirmBulkDeleteTitle: 'Rezepte löschen?',
      confirmBulkDeleteMessage: 'Möchtest du die {count} ausgewählten Rezepte wirklich unwiderruflich löschen?',
    },
    shopping: {
      addTitle: 'Eintrag hinzufügen',
      placeholderName: 'Zutat (z.B. Tomaten)',
      placeholderAmount: 'Menge',
      placeholderUnit: 'Einheit',
      suggestions: 'Vorschläge:',
      suggestionsList: ['Stück', 'g', 'ml', 'Pkg.', 'Dose', 'TL', 'EL'],
      btnAdd: 'Hinzufügen',
      title: 'Einkaufsliste',
      clearChecked: 'Erledigte löschen',
      clearAll: 'Liste leeren',
      dialogClear: {
        title: 'Einkaufsliste leeren?',
        message: 'Möchtest du wirklich alle Einträge von der Einkaufsliste löschen?',
        confirm: 'Leeren',
        cancel: 'Abbrechen',
      },
      emptyTitle: 'Deine Einkaufsliste ist leer',
      emptyDesc: 'Füge Zutaten direkt aus einem Rezept hinzu oder trage eigene Einträge oben ein!',
      toBuy: 'Noch zu kaufen ({count})',
      inCart: 'Bereits im Korb ({count})',
      entry: 'Eintrag',
      entries: 'Einträge',
      manual: 'Manuell',
      deleteItem: 'Eintrag löschen',
    },
    dialog: {
      confirmDefault: 'Bestätigen',
      cancelDefault: 'Abbrechen',
      closeAria: 'Schließen',
    }
  },
  en: {
    app: {
      title: 'CookBuddy',
      subtitle: 'Instagram Reel Recipe Assistant',
      nav: {
        newRecipe: 'Extract New',
        savedRecipes: 'Recipes',
        shoppingList: 'Shopping List',
      },
      dialog: {
        deleteRecipe: {
          title: 'Delete Recipe?',
          message: 'Are you sure you want to delete this recipe from your saved recipes?',
          confirm: 'Delete',
          cancel: 'Cancel',
        },
        deleteError: {
          title: 'Error Deleting',
          message: 'The recipe could not be deleted.',
        },
        connectionError: {
          title: 'Connection Error',
          message: 'Could not connect to the server.',
        }
      }
    },
    job: {
      status: {
        pending: {
          text: 'In queue...',
          sub: 'Waiting for server resources...',
        },
        scraping: {
          text: 'Retrieving Reel...',
          sub: 'Extracting Instagram data...',
        },
        processing: {
          text: 'Generating recipe...',
          sub: 'AI is analyzing audio and description...',
        },
        completed: {
          text: 'Extraction completed!',
          sub: 'Loading recipe details...',
        },
        failed: {
          text: 'Extraction failed',
          sub: 'Could not extract recipe from Reel.',
        }
      }
    },
    theme: {
      toggle: 'Toggle Theme',
    },
    api: {
      title: 'Backend Access Settings',
      desc: 'Configure your secret API Key to communicate with the server backend extractor endpoints.',
      keyLabel: 'API Key',
      keyPlaceholder: 'Enter secret API Key',
      close: 'Close',
    },
    auth: {
      signInTitle: 'Sign in to manage your recipes',
      signUpTitle: 'Create an account to get started',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: 'At least 6 characters',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      submitting: 'Processing...',
      haveAccount: 'Already have an account? Sign in',
      noAccount: "Don't have an account? Sign up",
      checkEmail: 'Confirmation email sent! Please check your inbox.',
      unexpectedError: 'An unexpected error occurred.',
      signOut: 'Sign Out',
      signInWithGoogle: 'Sign in with Google',
    },
    error: {
      title: 'Extraction Failed',
      default: 'An unknown error occurred while analyzing the Reel.',
      retry: 'Retry',
    },
    form: {
      urlLabel: 'Instagram Reel Link',
      urlPlaceholder: 'https://www.instagram.com/reel/...',
      btnPending: 'Reading recipe...',
      btnSubmit: 'Extract Recipe',
      validation: {
        required: 'Instagram Reel URL is required.',
        invalid: 'Must be a valid Instagram Reel URL (e.g., https://www.instagram.com/reel/...).',
        failedCheck: 'Failed to check status from server.',
        failedExtraction: 'The recipe extraction failed.',
        lostConnection: 'Lost connection to backend server.',
        unauthorized: 'Unauthorized. Please verify your API Key in Settings.',
        submitFailed: 'Failed to submit extraction job.',
        submissionError: 'An error occurred during submission.',
      }
    },
    install: {
      title: 'Install as App',
      desc: 'Share Reels directly from Instagram to this app to save recipes faster!',
      btn: 'Install',
    },
    recipe: {
      copyMarkdown: 'Copy Recipe Markdown',
      copyRecipe: 'Copy Recipe',
      copied: 'Copied!',
      delete: 'Delete Recipe',
      prep: 'Prep',
      cook: 'Cook',
      minutes: '{count} mins',
      serves: 'Serves',
      nutritionTitle: 'Nutritional Values',
      nutritionPerServing: 'Per serving',
      nutritionTotal: 'Total',
      nutritionCalories: 'kcal',
      nutritionProtein: 'Protein',
      nutritionCarbs: 'Carbs',
      nutritionFat: 'Fat',
      nutritionProteinShort: 'P',
      nutritionCarbsShort: 'C',
      nutritionFatShort: 'F',
      aiEstimateNotice: 'AI-Estimated',
      aiEstimateTooltip: 'These nutritional values were automatically estimated based on the ingredients and quantities since no specifications were present in the source.',
      aiIngredientsEstimateTooltip: 'The nutritional values for individual ingredients are guidelines estimated by the AI and may vary depending on variety, brand, and preparation.',
      tabIngredients: 'Ingredients',
      tabInstructions: 'Instructions',
      ingredientsTitle: 'Ingredients Checklist',
      ingredientsSubtitle: 'Check ingredients you have prepared',
      showNutritionPerIngredient: 'Nutrition per ingredient',
      addedToShopping: 'Added to shopping list!',
      addToShopping: 'Add to shopping list',
      goToShoppingList: 'Go to shopping list',
      alreadyAddedTitle: 'Already Added',
      alreadyAddedMessage: 'All ingredients of this recipe are already checked!',
      alternativeIngredients: 'Alternative Ingredients',
      requiredEquipment: 'Required Equipment',
      equipmentTooltip: 'Equipment: {name}',
      cookingProgress: 'Cooking Progress',
      progressSteps: '{completed} of {total} steps ({percent}%)',
      startCooking: 'Start Cooking',
      stepByStep: 'Step-by-Step Instructions',
      currentStep: 'Current Step',
      tipsTitle: 'Chef Cooking Tips',
      cookingMode: 'Cooking Mode',
      cookingModeProgress: 'Step {current} of {total}',
      ingredientsForStep: 'Ingredients for this step:',
      back: 'Back',
      finish: 'Finish',
      doneNext: 'Done & Next',
      cookingModeTip: 'Tip: Use the arrow keys ← → on desktop or swipe left/right on mobile.',
      finishedAlertTitle: 'Finished!',
      finishedAlertMessage: 'Bon appétit! You have successfully prepared the recipe.',
    },
    catalog: {
      savedOn: 'Saved on {date}',
      viewReel: 'View Reel',
      title: 'Recipes',
      emptyTitle: 'No Saved Recipes',
      emptyDesc: 'Extract recipes from Instagram Reels in the "Extract New" tab to save them here!',
      deleteRecipe: 'Delete recipe',
      backToSaved: 'Back to Saved Recipes',
      searchPlaceholder: 'Search recipes by name, ingredients or tags...',
      viewToggle: 'Switch view',
      allFilter: 'All',
      under15: '< 15 Min',
      under30: '< 30 Min',
      deleteSelected: 'Delete selected',
      addToShoppingList: 'Add ingredients to shopping list',
      addedToShoppingList: 'Added!',
      itemsSelected: '{count} recipes selected',
      confirmBulkDeleteTitle: 'Delete selected recipes?',
      confirmBulkDeleteMessage: 'Are you sure you want to permanently delete the {count} selected recipes?',
    },
    shopping: {
      addTitle: 'Add Item',
      placeholderName: 'Ingredient (e.g., tomatoes)',
      placeholderAmount: 'Amount',
      placeholderUnit: 'Unit',
      suggestions: 'Suggestions:',
      suggestionsList: ['pcs', 'g', 'ml', 'pkg', 'can', 'tsp', 'tbsp'],
      btnAdd: 'Add',
      title: 'Shopping List',
      clearChecked: 'Clear Checked',
      clearAll: 'Clear List',
      dialogClear: {
        title: 'Clear shopping list?',
        message: 'Are you sure you want to clear all items from the shopping list?',
        confirm: 'Clear',
        cancel: 'Cancel',
      },
      emptyTitle: 'Your shopping list is empty',
      emptyDesc: 'Add ingredients directly from a recipe or enter your own items above!',
      toBuy: 'To buy ({count})',
      inCart: 'Already in cart ({count})',
      entry: 'item',
      entries: 'items',
      manual: 'Manual',
      deleteItem: 'Delete item',
    },
    dialog: {
      confirmDefault: 'Confirm',
      cancelDefault: 'Cancel',
      closeAria: 'Close',
    }
  }
} as const;

export function getTranslation(key: string, lang: SupportedLanguage, variables?: Record<string, string | number>): string {
  const keys = key.split('.');
  let current: any = uiTranslations[lang];
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return key;
    }
  }
  if (typeof current !== 'string') {
    return key;
  }
  let result = current;
  if (variables) {
    Object.entries(variables).forEach(([name, val]) => {
      result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), String(val));
    });
  }
  return result;
}

