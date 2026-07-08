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
  [IngredientCategory.CONDIMENTS_OILS]: '🍶',
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
      title: 'Snagbite',
      subtitle: 'Rezept-Assistent',
      nav: {
        newRecipe: 'Neu',
        savedRecipes: 'Rezepte',
        shoppingList: 'Einkaufsliste',
        settings: 'Profil',
      },
      settings: {
        language: 'Sprache',
        theme: 'Erscheinungsbild',
        tempUnit: 'Temperatureinheit',
        unitSystem: 'Maßsystem',
        tempUnitCelsius: 'Celsius (°C)',
        tempUnitFahrenheit: 'Fahrenheit (°F)',
        tempUnitBoth: 'Beide (°C & °F)',
        unitSystemMetric: 'Metrisch (g, ml, kg)',
        unitSystemImperial: 'Imperial (oz, cups, lbs)',
        settingInfoTooltip: 'Diese Einstellung wirkt sich nur auf neu extrahierte Rezepte aus.',
        saving: 'Speichern...',
        saved: 'Einstellungen gespeichert!',
        deleteAccount: 'Konto löschen',
        upgradePremium: 'Auf Premium upgraden',
      },
      dialog: {
        deleteAccount: {
          title: 'Konto löschen?',
          message: 'Möchtest du dein Konto wirklich unwiderruflich löschen? Alle deine gespeicherten Rezepte und Einkaufslisten gehen dauerhaft verloren.',
          confirm: 'Konto löschen',
          cancel: 'Abbrechen',
        },
        deleteAccountError: {
          title: 'Fehler beim Löschen',
          message: 'Dein Konto konnte nicht gelöscht werden. Bitte versuche es später noch einmal.',
        },
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
          text: 'Quelle wird abgerufen...',
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
      },
      progress: {
        stages: {
          queued: 'Warteschlange',
          scraping: 'Instagram-Daten laden',
          downloading_media: 'Audio & Video herunterladen',
          extracting_frames: 'Videobilder extrahieren',
          extracting_recipe: 'Rezept extrahieren',
          finalizing: 'Speichern & Fertigstellen'
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
      default: 'Beim Analysieren des Links ist ein unbekannter Fehler aufgetreten.',
      retry: 'Wiederholen',
    },
    form: {
      urlLabel: 'Rezept Link',
      urlPlaceholder: 'https://www.instagram.com/reel/...',
      btnPending: 'Rezept wird gelesen...',
      btnSubmit: 'Rezept erstellen',
      pasteTooltip: 'Link aus Zwischenablage einfügen',
      pasteFailed: 'Zwischenablage konnte nicht gelesen werden. Bitte manuell einfügen.',
      demoTitle: 'Demo ausprobieren',
      remainingExtractions: 'Noch {remaining} von {limit} Rezepten {days} übrig',
      remainingExtractionsToday: 'heute',
      remainingExtractionsDays: 'in den letzten {days} Tagen',
      platformsTitle: 'Unterstützte Plattformen:',
      helpTitle: 'Wie kopiere ich einen Rezept-Link?',
      helpShareTitle: 'Direkt teilen (schnellste Methode)',
      helpShareDesc: 'Teile Links direkt über den Teilen-Button anderer Apps – ohne den Link zu kopieren.',
      helpShareStep: 'Tippe in Instagram, TikTok oder YouTube Shorts auf Teilen, wähle dann Snagbite aus der Liste.',
      helpShareStep1Title: '1. Papierflieger tippen',
      helpShareStep1Desc: 'Tippe im Instagram Reel auf das Teilen-Symbol (Papierflieger).',
      helpShareStep2Title: '2. Auf „Teilen“ tippen',
      helpShareStep2Desc: 'Tippe unten auf das Symbol „Teilen“ (nur bei Instagram nötig, um das Systemmenü zu öffnen).',
      helpShareStep3Title: '3. Snagbite auswählen',
      helpShareStep3Desc: 'Wähle Snagbite aus der Liste der Apps aus.',
      helpSteps: {
        instagram: 'Öffne ein Instagram Reel, tippe auf Teilen (Papierflieger-Symbol) und wähle Link kopieren.',
        tiktok: 'Öffne ein TikTok-Video, tippe auf den Teilen-Pfeil und wähle Link kopieren.',
        youtube: 'Öffne ein YouTube Short, tippe auf Teilen und wähle Link kopieren.',
        facebook: 'Öffne ein Facebook-Video, tippe auf Teilen und wähle Link kopieren.',
        website: 'Kopiere einfach die vollständige URL aus der Adresszeile deines Browsers.'
      },
      validation: {
        required: 'Rezept URL ist erforderlich.',
        invalid: 'Es muss eine gültige URL sein (z.B. Instagram, TikTok, Facebook, Website).',
        youtubeShortsOnly: 'Nur YouTube Shorts werden unterstützt, keine regulären YouTube-Videos.',
        failedCheck: 'Statusüberprüfung vom Server fehlgeschlagen.',
        failedExtraction: 'Die Rezept-Extraktion ist fehlgeschlagen.',
        lostConnection: 'Verbindung zum Backend-Server verloren.',
        unauthorized: 'Nicht autorisiert. Bitte überprüfe deinen API-Schlüssel in den Einstellungen.',
        submitFailed: 'Auftrag konnte nicht übermittelt werden.',
        submissionError: 'Bei der Übermittlung ist ein Fehler aufgetreten.',
        serverError: 'Der Server hat keine gültige Antwort zurückgegeben. Bitte versuche es erneut.',
      }
    },
    install: {
      title: 'Als App installieren',
      desc: 'Teile Links direkt mit dieser App, um Rezepte schneller zu speichern!',
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
      goToShoppingList: 'Zur Einkaufsliste hinzufügen',
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
      cookingModeTip: 'Tipp: Wische nach links/rechts auf dem Handy.',
      finishedAlertTitle: 'Fertig!',
      finishedAlertMessage: 'Guten Appetit! Du hast das Rezept erfolgreich zubereitet.',
    },
    catalog: {
      savedOn: 'Gespeichert am {date}',
      viewReel: 'Quelle ansehen',
      title: 'Rezepte',
      emptyTitle: 'Keine gespeicherten Rezepte',
      emptyDesc: 'Extrahiere Rezepte im "Neues Rezept" Tab, um sie hier zu speichern!',
      deleteRecipe: 'Rezept löschen',
      backToSaved: 'Zurück zu gespeicherten Rezepten',
      searchPlaceholder: 'Rezepte nach Name, Zutaten oder Tags filtern...',
      viewToggle: 'Ansicht umschalten',
      selectModeToggle: 'Auswahlmodus umschalten',
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
      btnCancelInline: 'Abbrechen',
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
      emptyHint: 'Tipp: Öffne ein Rezept und tippe auf den Einkaufswagen',
      toBuy: 'Noch zu kaufen ({count})',
      inCart: 'Bereits im Korb ({count})',
      progressLabel: 'Fortschritt',
      done: 'Erledigt',
      toBuyCount: 'offen',
      checkGroup: 'Gruppe abhaken',
      uncheckGroup: 'Gruppe abwählen',
      entry: 'Eintrag',
      entries: 'Einträge',
      manual: 'Manuell',
      deleteItem: 'Eintrag löschen',
    },
    dialog: {
      confirmDefault: 'Bestätigen',
      cancelDefault: 'Abbrechen',
      closeAria: 'Schließen',
    },
    remix: {
      title: 'Rezept Remix',
      subtitle: 'Lass die KI das Rezept für dich anpassen.',
      placeholder: 'Oder schreibe deinen eigenen Wunsch... z.B. \'Ich habe keine Eier, was kann ich nehmen?\'',
      generating: 'Remix wird generiert...',
      btnCancel: 'Abbrechen',
      btnStart: 'Remix starten',
      parentLinkPrefix: 'Abgewandelt von',
      parentLinkDeleted: 'gelöscht',
      chips: {
        vegan: { label: '🌱 Vegan', prompt: 'Mache es vegan' },
        highProtein: { label: '💪 High Protein', prompt: 'Mache es eiweißreich' },
        lowCalorie: { label: '📉 Kalorienarm', prompt: 'Mache es kalorienarm' },
        budget: { label: '💰 Günstig', prompt: 'Mache es günstig' },
        glutenFree: { label: '🌾 Glutenfrei', prompt: 'Mache es glutenfrei' }
      }
    },
    timer: {
      confirmTitle: 'Timer starten?',
      confirmStart: 'Timer starten',
      confirmCancel: 'Abbrechen',
      adjustDuration: 'Dauer anpassen',
      finished: 'Timer abgelaufen!',
      dismiss: 'Schließen',
      activeTimers: '{count} Timer aktiv',
      minutes: '{count} Min.',
      seconds: '{count} Sek.',
      minutesShort: 'm',
      notificationBody: 'Dein Koch-Timer ist abgelaufen.',
    },
    premium: {
      modal: {
        title: 'Snagbite Premium',
        subtitle: 'Koche wie ein Profi, ohne Limits!',
        cta: 'Jetzt Premium freischalten',
        loading: 'Zahlung wird verarbeitet...',
        success: 'Erfolgreich freigeschaltet!',
        error: 'Fehler bei der Zahlung. Bitte versuche es erneut.',
        features: {
          extractions: {
            title: 'Unbegrenzte Extraktionen',
            desc: 'Extrahiere so viele Rezepte aus Reels wie du möchtest (statt 3 pro Tag).'
          },
          remix: {
            title: 'Recipe Remix AI',
            desc: 'Passe Rezepte per Knopfdruck an (z. B. vegan, low-carb, kalorienarm).'
          },
          nutrition: {
            title: 'Nährwerte & Makros',
            desc: 'Detaillierte Nährwertangaben pro Portion und Zutat auf einen Blick.'
          },
          shoppingList: {
            title: 'Smarte Kombi-Einkaufsliste',
            desc: 'Führe Zutaten aus beliebig vielen Rezepten automatisch zusammen.'
          },
          cookingMode: {
            title: 'Koch-Timer & Modus',
            desc: 'Schritt-für-Schritt-Anleitungen mit direkt klickbaren In-App-Timern.'
          },
          catalog: {
            title: 'Unbegrenztes Kochbuch',
            desc: 'Speichere unendlich viele Rezepte (statt maximal 5).'
          }
        }
      },
      shoppingListLimit: {
        title: 'Premium-Funktion',
        message: 'Du hast bereits Zutaten von einem anderen Rezept auf deiner Einkaufsliste. Hol dir Premium, um Zutaten aus beliebig vielen Rezepten zu kombinieren!'
      }
    }
  },
  en: {
    app: {
      title: 'Snagbite',
      subtitle: 'Recipe Assistant',
      nav: {
        newRecipe: 'New',
        savedRecipes: 'Recipes',
        shoppingList: 'Shopping List',
        settings: 'Profile',
      },
      settings: {
        language: 'Language',
        theme: 'Appearance',
        tempUnit: 'Temperature Unit',
        unitSystem: 'Unit System',
        tempUnitCelsius: 'Celsius (°C)',
        tempUnitFahrenheit: 'Fahrenheit (°F)',
        tempUnitBoth: 'Both (°C & °F)',
        unitSystemMetric: 'Metric (g, ml, kg)',
        unitSystemImperial: 'Imperial (oz, cups, lbs)',
        settingInfoTooltip: 'This setting only affects newly extracted recipes.',
        saving: 'Saving...',
        saved: 'Settings saved!',
        deleteAccount: 'Delete Account',
        upgradePremium: 'Upgrade to Premium',
      },
      dialog: {
        deleteAccount: {
          title: 'Delete Account?',
          message: 'Are you sure you want to permanently delete your account? All your saved recipes and shopping lists will be permanently lost.',
          confirm: 'Delete Account',
          cancel: 'Cancel',
        },
        deleteAccountError: {
          title: 'Error Deleting Account',
          message: 'Your account could not be deleted. Please try again later.',
        },
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
          text: 'Retrieving source...',
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
          sub: 'Could not extract recipe from link.',
        }
      },
      progress: {
        stages: {
          queued: 'Queue',
          scraping: 'Fetching Instagram data',
          downloading_media: 'Downloading audio & video',
          extracting_frames: 'Extracting video frames',
          extracting_recipe: 'Extracting recipe',
          finalizing: 'Saving & Finalizing'
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
      default: 'An unknown error occurred while analyzing the link.',
      retry: 'Retry',
    },
    form: {
      urlLabel: 'Recipe Link',
      urlPlaceholder: 'https://www.instagram.com/reel/...',
      btnPending: 'Reading recipe...',
      btnSubmit: 'Extract Recipe',
      pasteTooltip: 'Paste link from clipboard',
      pasteFailed: 'Could not read from clipboard. Please paste manually.',
      demoTitle: 'Try a Demo',
      remainingExtractions: '{remaining} of {limit} recipes remaining {days}',
      remainingExtractionsToday: 'today',
      remainingExtractionsDays: 'in the last {days} days',
      platformsTitle: 'Supported Platforms:',
      helpTitle: 'How do I copy a recipe link?',
      helpShareTitle: 'Share directly (fastest method)',
      helpShareDesc: 'Send links directly via the Share button in other apps — no need to copy the link.',
      helpShareStep: 'Tap Share in Instagram, TikTok, or YouTube Shorts, then select Snagbite from the list.',
      helpShareStep1Title: '1. Tap paper airplane',
      helpShareStep1Desc: 'Open the Reel, tap the Share icon (paper airplane).',
      helpShareStep2Title: '2. Tap "Share"',
      helpShareStep2Desc: 'Tap the "Share" button at the bottom (only required for Instagram to open the system menu).',
      helpShareStep3Title: '3. Select Snagbite',
      helpShareStep3Desc: 'Select Snagbite from the list of available apps.',
      helpSteps: {
        instagram: 'Open an Instagram Reel, tap Share (paper airplane icon) and choose Copy Link.',
        tiktok: 'Open a TikTok video, tap the Share arrow and choose Copy Link.',
        youtube: 'Open a YouTube Short, tap Share and choose Copy Link.',
        facebook: 'Open a Facebook video, tap Share and choose Copy Link.',
        website: 'Simply copy the full URL from your browser\'s address bar.'
      },
      validation: {
        required: 'Recipe URL is required.',
        invalid: 'Must be a valid URL (e.g., Instagram, TikTok, Facebook, Website).',
        youtubeShortsOnly: 'Only YouTube Shorts are supported, not regular YouTube videos.',
        failedCheck: 'Failed to check status from server.',
        failedExtraction: 'The recipe extraction failed.',
        lostConnection: 'Lost connection to backend server.',
        unauthorized: 'Unauthorized. Please verify your API Key in Settings.',
        submitFailed: 'Failed to submit extraction job.',
        submissionError: 'An error occurred during submission.',
        serverError: 'The server returned an unexpected response. Please try again.',
      }
    },
    install: {
      title: 'Install as App',
      desc: 'Share links directly to this app to save recipes faster!',
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
      goToShoppingList: 'Add to shopping list',
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
      cookingModeTip: 'Tip: Swipe left/right on mobile.',
      finishedAlertTitle: 'Finished!',
      finishedAlertMessage: 'Bon appétit! You have successfully prepared the recipe.',
    },
    catalog: {
      savedOn: 'Saved on {date}',
      viewReel: 'View Source',
      title: 'Recipes',
      emptyTitle: 'No Saved Recipes',
      emptyDesc: 'Extract recipes in the "Extract New" tab to save them here!',
      deleteRecipe: 'Delete recipe',
      backToSaved: 'Back to Saved Recipes',
      searchPlaceholder: 'Search recipes by name, ingredients or tags...',
      viewToggle: 'Switch view',
      selectModeToggle: 'Toggle select mode',
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
      btnCancelInline: 'Cancel',
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
      emptyHint: 'Tip: Open a recipe and tap the shopping cart icon',
      toBuy: 'To buy ({count})',
      inCart: 'Already in cart ({count})',
      progressLabel: 'Progress',
      done: 'Done',
      toBuyCount: 'open',
      checkGroup: 'Check group',
      uncheckGroup: 'Uncheck group',
      entry: 'item',
      entries: 'items',
      manual: 'Manual',
      deleteItem: 'Delete item',
    },
    dialog: {
      confirmDefault: 'Confirm',
      cancelDefault: 'Cancel',
      closeAria: 'Close',
    },
    remix: {
      title: 'Recipe Remix',
      subtitle: 'Let the AI customize the recipe for you.',
      placeholder: 'Or write your own request... e.g. \'I don\'t have eggs, what can I use?\'',
      generating: 'Generating remix...',
      btnCancel: 'Cancel',
      btnStart: 'Start Remix',
      parentLinkPrefix: 'Remixed from',
      parentLinkDeleted: 'deleted',
      chips: {
        vegan: { label: '🌱 Vegan', prompt: 'Make it vegan' },
        highProtein: { label: '💪 High Protein', prompt: 'Make it high protein' },
        lowCalorie: { label: '📉 Low Calorie', prompt: 'Make it low calorie' },
        budget: { label: '💰 Budget Friendly', prompt: 'Make it budget friendly' },
        glutenFree: { label: '🌾 Gluten Free', prompt: 'Make it gluten free' }
      }
    },
    timer: {
      confirmTitle: 'Start timer?',
      confirmStart: 'Start Timer',
      confirmCancel: 'Cancel',
      adjustDuration: 'Adjust duration',
      finished: 'Timer finished!',
      dismiss: 'Dismiss',
      activeTimers: '{count} timer(s) active',
      minutes: '{count} min.',
      seconds: '{count} sec.',
      minutesShort: 'm',
      notificationBody: 'Your cooking timer has finished.',
    },
    premium: {
      modal: {
        title: 'Snagbite Premium',
        subtitle: 'Cook like a pro, without limits!',
        cta: 'Unlock Premium Now',
        loading: 'Processing payment...',
        success: 'Successfully unlocked!',
        error: 'Payment failed. Please try again.',
        features: {
          extractions: {
            title: 'Unlimited Extractions',
            desc: 'Extract as many recipes from Reels as you want (instead of 3 per day).'
          },
          remix: {
            title: 'Recipe Remix AI',
            desc: 'Adapt recipes with one click (e.g. vegan, low-carb, low-calorie).'
          },
          nutrition: {
            title: 'Nutrition & Macros',
            desc: 'Detailed nutritional facts per portion and ingredient at a glance.'
          },
          shoppingList: {
            title: 'Smart Combined Shopping List',
            desc: 'Automatically combine ingredients from as many recipes as you want.'
          },
          cookingMode: {
            title: 'Cooking Timers & Mode',
            desc: 'Step-by-step instructions with clickable in-app timers.'
          },
          catalog: {
            title: 'Unlimited Cookbook',
            desc: 'Save unlimited recipes (instead of a maximum of 5).'
          }
        }
      },
      shoppingListLimit: {
        title: 'Premium Feature',
        message: 'You already have ingredients from another recipe on your shopping list. Get Premium to combine ingredients from multiple recipes!'
      }
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

export function translateApiError(errorMsg: string | null | undefined, lang: SupportedLanguage = 'de'): string {
  if (!errorMsg) return '';

  const lowerMsg = errorMsg.toLowerCase();

  if (lowerMsg.includes('rate limit:')) {
    const limitMatch = errorMsg.match(/limit of (\d+)/i);
    const daysMatch = errorMsg.match(/per (\d+) days/i);
    const minMatch = errorMsg.match(/in (\d+) minutes/i);

    const limit = limitMatch ? limitMatch[1] : '10';
    const days = daysMatch ? daysMatch[1] : '1';
    const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;

    let timeTextDe = '';
    let timeTextEn = '';

    if (minutes > 0) {
      if (minutes >= 1440) {
        const d = Math.floor(minutes / 1440);
        const remainingMin = minutes % 1440;
        const h = Math.floor(remainingMin / 60);

        const dayStrDe = d === 1 ? '1 Tag' : `${d} Tagen`;
        const dayStrEn = d === 1 ? '1 day' : `${d} days`;

        const hourTextDe = h > 0 ? ` und ${h} Std.` : '';
        const hourTextEn = h > 0 ? ` and ${h} hr.` : '';

        timeTextDe = `Bitte versuche es in ${dayStrDe}${hourTextDe} erneut.`;
        timeTextEn = `Please try again in ${dayStrEn}${hourTextEn}.`;
      } else if (minutes >= 60) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        timeTextDe = m > 0
          ? `Bitte versuche es in ${h} Std. und ${m} Min. erneut.`
          : `Bitte versuche es in ${h} Std. erneut.`;
        timeTextEn = m > 0
          ? `Please try again in ${h} hr. and ${m} min.`
          : `Please try again in ${h} hr.`;
      } else {
        timeTextDe = `Bitte versuche es in ${minutes} Min. erneut.`;
        timeTextEn = `Please try again in ${minutes} min.`;
      }
    } else {
      timeTextDe = 'Bitte versuche es später erneut.';
      timeTextEn = 'Please try again later.';
    }

    const daysStr = days === '1'
      ? (lang === 'de' ? 'Tag' : 'day')
      : (lang === 'de' ? `${days} Tagen` : `${days} days`);

    return lang === 'de'
      ? `Du hast dein Limit von ${limit} Rezept-Extraktionen pro ${daysStr} erreicht. ${timeTextDe}`
      : `You have reached your limit of ${limit} recipe extractions per ${daysStr}. ${timeTextEn}`;
  }

  if (lowerMsg.includes('too many requests')) {
    return lang === 'de'
      ? 'Zu viele Anfragen. Bitte versuche es später noch einmal.'
      : 'Too many requests. Please try again later.';
  }

  if (lowerMsg.includes('active job')) {
    const match = errorMsg.match(/\d+/);
    const count = match ? match[0] : '1';
    return lang === 'de'
      ? `Du hast bereits ${count} aktive(n) Auftrag/Aufträge. Bitte warte, bis diese abgeschlossen sind.`
      : `You already have ${count} active job(s). Please wait for them to finish.`;
  }

  if (lowerMsg.includes('youtube shorts')) {
    return lang === 'de'
      ? 'Nur YouTube Shorts werden unterstützt, keine regulären YouTube-Videos.'
      : 'Only YouTube Shorts are supported, not regular YouTube videos.';
  }

  if (lowerMsg.includes('invalid url')) {
    return lang === 'de'
      ? 'Ungültige URL. Bitte überprüfe den Link (muss Instagram, TikTok, YouTube Shorts oder Website sein).'
      : 'Invalid URL. Please check the link (must be Instagram, TikTok, YouTube Shorts, or website).';
  }

  if (lowerMsg.includes('unauthorized') || lowerMsg.includes('not authorized') || lowerMsg.includes('401')) {
    return lang === 'de'
      ? 'Nicht autorisiert. Bitte melde dich erneut an.'
      : 'Unauthorized. Please sign in again.';
  }

  if (lowerMsg.includes('parent job not found') || lowerMsg.includes('parent job or recipe not found')) {
    return lang === 'de'
      ? 'Ursprungsrezept nicht gefunden.'
      : 'Parent recipe not found.';
  }

  if (lowerMsg.includes('remix prompt must not exceed')) {
    return lang === 'de'
      ? 'Der Remix-Text darf maximal 250 Zeichen lang sein.'
      : 'Remix prompt must not exceed 250 characters.';
  }

  if (lowerMsg.includes('unrelated request')) {
    return lang === 'de'
      ? 'Ungültige Anfrage: Die KI hat keine Rezeptänderung im eingegebenen Text erkannt.'
      : 'Invalid request: The AI did not recognize any recipe modifications in the text.';
  }

  if (lowerMsg.includes('failed to scrape instagram') || lowerMsg.includes('instagram data')) {
    return lang === 'de'
      ? 'Fehler beim Abrufen des Instagram Reels. Bitte überprüfe, ob das Video öffentlich und der Link korrekt ist.'
      : 'Failed to retrieve the Instagram Reel. Please make sure the video is public and the link is correct.';
  }

  if (lowerMsg.includes('could not find any recipe details')) {
    return lang === 'de'
      ? 'Auf dieser Website konnte kein Rezept gefunden werden.'
      : 'Could not find any recipe details on this website.';
  }

  if (lowerMsg.includes('failed to download') || lowerMsg.includes('audio download failed') || lowerMsg.includes('video download failed')) {
    return lang === 'de'
      ? 'Fehler beim Herunterladen der Medien-Audiodatei. Bitte versuche es noch einmal.'
      : 'Failed to download the media audio file. Please try again.';
  }

  if (lowerMsg.includes('internal server error')) {
    return lang === 'de'
      ? 'Ein interner Serverfehler ist aufgetreten. Bitte versuche es später erneut.'
      : 'An internal server error occurred. Please try again later.';
  }

  // Handle standard default messages
  if (errorMsg === 'failed_check' || errorMsg === 'failedCheck') {
    return lang === 'de' ? 'Statusüberprüfung vom Server fehlgeschlagen.' : 'Failed to check status from server.';
  }
  if (errorMsg === 'failed_extraction' || errorMsg === 'failedExtraction') {
    return lang === 'de' ? 'Die Rezept-Extraktion ist fehlgeschlagen.' : 'The recipe extraction failed.';
  }
  if (errorMsg === 'lost_connection' || errorMsg === 'lostConnection') {
    return lang === 'de' ? 'Verbindung zum Backend-Server verloren.' : 'Lost connection to backend server.';
  }
  if (errorMsg === 'submit_failed' || errorMsg === 'submitFailed') {
    return lang === 'de' ? 'Auftrag konnte nicht übermittelt werden.' : 'Failed to submit extraction job.';
  }

  return errorMsg;
}


