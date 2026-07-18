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
    onboarding: {
      skip: 'Überspringen',
      back: 'Zurück',
      next: 'Weiter',
      cta: "Los geht's",
      replayLabel: 'Einführung erneut ansehen',
      slides: {
        welcome: {
          title: 'Willkommen bei Snagbite',
          desc: 'Verwandle Koch-Reels aus dem Netz in übersichtliche, interaktive Rezepte – automatisch aufbereitet von KI.',
        },
        import: {
          title: 'Importieren & Teilen',
          desc: 'Füge einen Link ein oder teile ein Reel direkt aus Instagram, TikTok, YouTube oder Facebook an Snagbite. Wir extrahieren das komplette Rezept für dich.',
        },
        cookbook: {
          title: 'Dein Kochbuch',
          desc: 'Jedes extrahierte Rezept landet automatisch in deinem Kochbuch – durchsuchbar, filterbar und mit anpassbarer Portionsgröße.',
        },
        organize: {
          title: 'Ordnen & Filtern',
          desc: 'Lege eigene Sammlungen mit Emoji & Farbe an, markiere Favoriten und vergib Labels. Filtere dein Kochbuch mit einem Tipp nach Sammlung, Favorit, Kochzeit oder Label.',
        },
        shopping: {
          title: 'Smarte Einkaufsliste',
          desc: 'Übernimm Zutaten mit einem Tipp in die Einkaufsliste. Sie werden automatisch zusammengefasst und nach Supermarkt-Abteilung sortiert.',
        },
        cooking: {
          title: 'Kochen wie ein Profi',
          desc: 'Schritt-für-Schritt-Kochmodus, integrierte Timer und ein KI-Copilot, der Fragen beantwortet und Rezepte anpasst.',
        },
      },
    },
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
        premiumActive: 'Aktiv',
        premiumActiveDesc: 'Du hast unbegrenzten Zugriff auf alle Premium-Features.',
        betaActive: 'Beta-Zugriff',
        betaActiveDesc: 'Du bist Beta-Tester! Du hast kostenlosen Zugriff auf alle Premium-Features während der Beta. Extraktionslimits gelten weiterhin.',
      },
      dialog: {
        deleteAccount: {
          title: 'Konto löschen?',
          message: 'Möchtest du dein Konto wirklich unwiderruflich löschen? Alle deine gespeicherten Rezepte und Einkaufslisten gehen dauerhaft verloren. **Bitte beachte: Falls du ein aktives Premium-Abonnement hast, musst du dieses zusätzlich im Google Play Store kündigen, um weitere Zahlungen zu verhindern.**',
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
      urlPlaceholderShort: 'Link einfügen…',
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
      helpShareStep1Desc: 'Öffne das Reel oder Video (Instagram, TikTok, YouTube) und tippe auf das Teilen-Symbol (Papierflieger).',
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
    recipe: {
      copyRecipe: 'Rezept kopieren',
      copied: 'Kopiert!',
      delete: 'Rezept löschen',
      save: 'Speichern',
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
      aiEstimateTooltip: 'Diese Nährwerte wurden durch eine KI automatisiert basierend auf den Zutaten und Mengen geschätzt, da in der Quelle keine Angaben vorhanden waren.',
      aiIngredientsEstimateTooltip: 'Die Nährwerte der einzelnen Zutaten sind von der KI geschätzte Richtwerte und können je nach Sorte, Marke und Zubereitung variieren.',
      aiGeneratedNotice: 'KI-generierter Inhalt',
      aiGeneratedDisclaimer: 'Dieses Rezept wurde KI-gestützt aus einem Social-Media-Video extrahiert und kann Fehler aufweisen. Bitte prüfe die Angaben sorgfältig.',
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
      emptyState: {
        welcomeTitle: 'Dein Kochbuch wartet auf Rezepte!',
        welcomeDesc: 'Snagbite verwandelt Kochvideos von Instagram, TikTok oder YouTube in strukturierte Rezepte mit Einkaufslisten und Nährwertangaben.',
        ctaButton: 'Rezept hinzufügen',
        step1Title: '1. Entdecken',
        step1Desc: 'Suche ein Rezept-Video auf Instagram, TikTok oder YouTube.',
        step2Title: '2. Link kopieren',
        step2Desc: 'Tippe auf Teilen und kopiere den Link in die Zwischenablage.',
        step3Title: '3. Zaubern lassen',
        step3Desc: 'Füge den Link unter "Neues Rezept" ein und Gemini erledigt den Rest.',
      },
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
      favoritesFilter: 'Favoriten',
      sortNewest: 'Neueste',
      sortTitle: 'Name A–Z',
      sortTime: 'Zubereitungszeit',
      collectionsTitle: 'Sammlungen',
      addCollection: 'Neue Sammlung',
      editCollection: 'Sammlung bearbeiten',
      deleteCollection: 'Sammlung löschen',
      collectionName: 'Name der Sammlung',
      collectionEmoji: 'Symbol / Emoji',
      collectionColor: 'Farbe',
      collectionPlaceholder: 'z.B. Sonntagsbrunch',
      collectionNameRequired: 'Name der Sammlung ist erforderlich',
      flagsTitle: 'Labels / Tags',
      addFlag: 'Neues Label',
      flagPlaceholder: 'z.B. Ausprobieren',
      manageCollections: 'Sammlungen verwalten',
      manageFlags: 'Labels verwalten',
      noCollections: 'Keine Sammlungen erstellt',
      noFlags: 'Keine Labels erstellt',
      premiumFeatureTitle: 'Premium-Funktion',
      premiumFeatureCollectionsDesc: 'Erstelle Sammlungen und ordne Rezepte zu, um dein Kochbuch perfekt zu strukturieren.',
      premiumFeatureFlagsDesc: 'Erstelle eigene Labels und Tags, um Rezepte noch flexibler zu filtern.',
      bulkAddToCollection: 'Zu Sammlung hinzufügen',
      assignCollectionsTitle: 'Sammlungen zuweisen',
      manageRecipeFlagsTitle: 'Rezept-Labels verwalten',
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
      emptyState: {
        welcomeTitle: 'Deine Einkaufsliste ist noch leer',
        welcomeDesc: 'Wirf die Zutaten deiner gespeicherten Rezepte mit einem Tipp auf die Liste – automatisch nach Supermarkt-Regalen sortiert.',
        ctaButton: 'Rezepte ansehen',
        step1Title: '1. Rezept öffnen',
        step1Desc: 'Öffne ein gespeichertes Rezept in deinem Kochbuch.',
        step2Title: '2. Einkaufswagen antippen',
        step2Desc: 'Tippe auf das Einkaufswagen-Symbol, um alle Zutaten hinzuzufügen.',
        step3Title: '3. Nach Regalen sortiert',
        step3Desc: 'Die Zutaten landen gebündelt nach Supermarkt-Bereich – bereit zum Einkaufen.',
      },
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
      recipeCount: '{count} Rezepte',
      doneCount: 'Erledigt ({count})',
      moreActions: 'Weitere Aktionen',
      allDoneTitle: 'Alles erledigt!',
      allDoneDesc: 'Du hast alle Zutaten im Korb. Guten Appetit!',
      finishShopping: 'Einkauf beenden',
      restoreItem: 'Wieder aufnehmen',
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
    copilot: {
      title: 'Rezepte Copilot',
      subtitle: 'Dein smarter KI-Küchenchef',
      placeholder: 'Frage etwas zur Zubereitung oder Zutaten...',
      sendAria: 'Nachricht senden',
      remixReady: '🪄 Rezept-Remix bereit!',
      remixLoadBtn: '✨ Neue Version laden & speichern',
      remixSuccessToast: 'Rezept wurde erfolgreich aktualisiert!',
      shoppingListToast: '🛒 Zutaten zur Einkaufsliste hinzugefügt: {ingredients}',
      timerToast: '⏱️ Timer für {label} ({duration} Min.) gestartet!',
      timerNoLabel: 'Kochschritt',
      errorForbidden: 'Der Copilot ist ein Premium-Feature. Bitte upgrade auf Pro.',
      errorGeneral: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
      chipsHeaderRemix: '🌱 Rezept anpassen',
      chipsHeaderHelp: '🍳 Zubereitungshilfe',
      chipsHeaderSubs: '❌ Zutaten-Notfall',
      chipsHeaderShopping: '🛒 Einkaufsliste',
      chipsHeaderTimer: '⏱️ Timer',
      chipVegan: 'Vegan machen',
      chipProtein: 'High-Protein',
      chipPortions: 'Portionen anpassen',
      chipAirfryer: 'Alternative ohne Airfryer?',
      chipRoux: 'Begriff: Was bedeutet "Roux"?',
      chipFreeze: 'Wie friere ich Reste ein?',
      chipSubstitute: 'Alternative für {ingredient}?',
      loading: 'Antwortet...',
      actionRunning: 'Führe Aktion aus...',
      showSuggestionsAria: 'Vorschläge anzeigen',
      remixConfirmTitle: 'Rezept-Änderung bestätigen',
      remixConfirmBody: 'Möchtest du das Rezept anpassen mit: „{request}"?',
      remixReplaceBtn: 'Aktuelles ersetzen',
      remixNewBtn: 'Als neues Rezept',
      remixCreated: '✅ Das Remix-Rezept „{title}" wurde erstellt!',
      clearAria: 'Chat zurücksetzen',
      clearConfirmTitle: 'Chat zurücksetzen?',
      clearConfirmBody: 'Möchtest du diese Unterhaltung und die Vorschläge für dieses Rezept löschen? Das kann nicht rückgängig gemacht werden.',
      clearConfirmBtn: 'Zurücksetzen',
      changesTitle: 'Geplante Änderungen ({count})',
      changesHint: 'Sammle Änderungen und wende sie gemeinsam an.',
      changesApply: 'Änderungen anwenden',
      changesDiscardAll: 'Alle verwerfen',
      changesDeleteAria: 'Änderung entfernen',
      changesApplyPrompt: 'Wie möchtest du die Änderungen anwenden?',
      changesEmpty: 'Noch keine Änderungen gesammelt.',
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
        close: 'Schließen',
        owned: 'Du hast Premium',
        betaOwned: 'Beta-Zugriff Aktiv',
        verifying: 'Verifiziere Status...',
        footer: 'Jederzeit kündbar · Sicher über Google Play',
        monthly: 'Monatlich',
        yearly: 'Jährlich',
        savePercent: 'Spare {percent}%',
        bestseller: 'Bestseller',
        coffeeAnchor: 'Weniger als ein Kaffee im Monat ☕',
        pricePeriod: '{price} / Monat',
        priceYearlyPeriod: '{price} / Jahr',
        priceMonthlyEquivalent: 'nur {price}/Monat',
        freeTrialTitle: '7 Tage kostenlos testen',
        ctaWithTrial: 'Kostenlose Testphase starten >',
        ctaWithoutTrial: 'Premium freischalten >',
        cancelSubtitle: 'Kein Risiko. Jederzeit kündbar.',
        timeline: {
          step1Title: 'Heute',
          step1Desc: 'Testphase starten. Vollzugriff.',
          step2Title: 'Tag 5',
          step2Desc: 'Erinnerungs-Push erhalten.',
          step3Title: 'Tag 7',
          step3Desc: 'Abo beginnt. Jederzeit kündbar.'
        },
        comparison: {
          tableTitle: 'Free vs. Premium im Vergleich',
          headerFeature: 'Funktion',
          headerFree: 'Kostenlos',
          headerPremium: 'Premium',
          rowExtractions: 'Rezept-Extraktion',
          rowExtractionsFree: '3 / Tag',
          rowExtractionsPremium: 'Unbegrenzt',
          rowCookbook: 'Kochbuch (Speichern)',
          rowCookbookFree: 'Max. 5 Rezepte',
          rowCookbookPremium: 'Unbegrenzt',
          rowShoppingList: 'Einkaufsliste',
          rowShoppingListFree: 'Lokal, 1 Rezept',
          rowShoppingListPremium: 'Smarte Kombi',
          rowAiChat: 'Rezept-KI-Chat',
          rowAiChatFree: '❌ Nein',
          rowAiChatPremium: '✔️ Ja',
          rowNutrition: 'Nährwerte & Makros',
          rowNutritionFree: '❌ Nein',
          rowNutritionPremium: '✔️ Ja',
          rowCollections: 'Sammlungen & Labels',
          rowCookingMode: 'Kochmodus & Timer'
        },
        features: {
          extractions: {
            title: 'Unbegrenzt Rezepte',
            desc: 'Rezepte aus Social Media & Web importieren.'
          },
          remix: {
            title: 'Rezept-KI-Chat',
            desc: 'Rezepte flexibel per Chat anpassen.'
          },
          nutrition: {
            title: 'Nährwerte & Makros',
            desc: 'Zutaten & Portionen im Blick behalten.'
          },
          shoppingList: {
            title: 'Smarte Einkaufsliste',
            desc: 'Zutaten automatisch kombinieren.'
          }
        }
      },
      shoppingListLimit: {
        title: 'Premium-Funktion',
        message: 'Du hast bereits Zutaten von einem anderen Rezept auf deiner Einkaufsliste. Hol dir Premium, um Zutaten aus beliebig vielen Rezepten zu kombinieren!'
      },
      hint: {
        extractUnlimited: 'Premium: Unbegrenzt freischalten',
        catalogFull: 'Kochbuch voll ({count}/{limit}) – Lösche ein Rezept oder upgrade.',
        catalogAlmostFull: 'Kochbuch fast voll ({count}/{limit})',
        extractionLimitReached: 'Tageslimit erreicht ({used}/{limit}) – Upgrade auf Premium für unbegrenzte Extraktionen.',
        unlockNutrition: 'Nährwerte freischalten',
        upgrade: 'Upgrade'
      }
    },
    feedback: {
      rowLabel: 'Fehler melden / Feedback',
      title: 'Fehler melden / Feedback',
      typeBug: 'Fehler',
      typeIdea: 'Idee',
      messageLabel: 'Deine Nachricht',
      placeholder: 'Beschreibe das Problem oder deine Idee möglichst genau...',
      screenshotLabel: 'Screenshots (optional)',
      attachScreenshot: 'Screenshots anhängen',
      addMoreScreenshots: 'Weitere hinzufügen',
      removeScreenshot: 'Screenshot entfernen',
      screenshotLimit: 'Du kannst bis zu 6 Bilder anhängen.',
      screenshotError: 'Screenshot konnte nicht verarbeitet werden.',
      diagnosticNote: 'Grundlegende Geräteinfos und die letzten App-Logs werden angehängt, damit wir Fehler schneller finden.',
      cancel: 'Abbrechen',
      submit: 'Absenden',
      submitting: 'Wird gesendet...',
      successTitle: 'Danke!',
      success: 'Danke für dein Feedback! Wir schauen es uns an.',
      error: 'Feedback konnte nicht gesendet werden. Bitte versuche es erneut.'
    }
  },
  en: {
    onboarding: {
      skip: 'Skip',
      back: 'Back',
      next: 'Next',
      cta: "Let's go",
      replayLabel: 'Replay intro',
      slides: {
        welcome: {
          title: 'Welcome to Snagbite',
          desc: 'Turn cooking reels from across the web into clean, interactive recipes — automatically prepared by AI.',
        },
        import: {
          title: 'Import & Share',
          desc: 'Paste a link or share a reel straight from Instagram, TikTok, YouTube or Facebook to Snagbite. We extract the full recipe for you.',
        },
        cookbook: {
          title: 'Your Cookbook',
          desc: 'Every extracted recipe is saved to your cookbook automatically — searchable, filterable and with adjustable serving sizes.',
        },
        organize: {
          title: 'Organize & Filter',
          desc: 'Create your own collections with emoji & color, mark favorites and add labels. Filter your cookbook with one tap by collection, favorite, cook time or label.',
        },
        shopping: {
          title: 'Smart Shopping List',
          desc: 'Add ingredients to your shopping list with one tap. They are merged automatically and sorted by grocery aisle.',
        },
        cooking: {
          title: 'Cook Like a Pro',
          desc: 'Step-by-step cooking mode, built-in timers and an AI copilot that answers questions and adapts recipes.',
        },
      },
    },
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
        premiumActive: 'Active',
        premiumActiveDesc: 'You have unlimited access to all premium features.',
        betaActive: 'Beta Access',
        betaActiveDesc: 'You are a beta tester! You have free access to all premium features during the beta. Extraction limits apply.',
      },
      dialog: {
        deleteAccount: {
          title: 'Delete Account?',
          message: 'Are you sure you want to permanently delete your account? All your saved recipes and shopping lists will be permanently lost. **Note: If you have an active Premium subscription, you must also cancel it in the Google Play Store to prevent future charges.**',
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
      urlPlaceholderShort: 'Paste link…',
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
      helpShareStep1Desc: 'Open the Reel or video (Instagram, TikTok, YouTube) and tap the Share icon (paper airplane).',
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
    recipe: {
      copyRecipe: 'Copy Recipe',
      copied: 'Copied!',
      delete: 'Delete Recipe',
      save: 'Save',
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
      aiEstimateTooltip: 'These nutritional values were automatically estimated by an AI based on the ingredients and quantities since no specifications were present in the source.',
      aiIngredientsEstimateTooltip: 'The nutritional values for individual ingredients are guidelines estimated by the AI and may vary depending on variety, brand, and preparation.',
      aiGeneratedNotice: 'AI-Generated Content',
      aiGeneratedDisclaimer: 'This recipe was extracted from a social media video with AI assistance and may contain errors. Please verify the information carefully.',
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
      emptyState: {
        welcomeTitle: 'Your Cookbook is Waiting for Recipes!',
        welcomeDesc: 'Snagbite turns cooking videos from Instagram, TikTok, or YouTube into structured recipes with shopping lists and nutritional values.',
        ctaButton: 'Add First Recipe',
        step1Title: '1. Discover',
        step1Desc: 'Find a cooking video or Reel on Instagram, TikTok, or YouTube.',
        step2Title: '2. Copy Link',
        step2Desc: 'Tap the share icon and copy the link to your clipboard.',
        step3Title: '3. Let Magic Happen',
        step3Desc: 'Paste the link in the "New Recipe" tab and let Gemini extract everything.',
      },
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
      favoritesFilter: 'Favorites',
      sortNewest: 'Newest',
      sortTitle: 'Name A–Z',
      sortTime: 'Cooking Time',
      collectionsTitle: 'Collections',
      addCollection: 'New Collection',
      editCollection: 'Edit Collection',
      deleteCollection: 'Delete Collection',
      collectionName: 'Collection Name',
      collectionEmoji: 'Icon / Emoji',
      collectionColor: 'Color',
      collectionPlaceholder: 'e.g. Sunday Brunch',
      collectionNameRequired: 'Collection name is required',
      flagsTitle: 'Labels & Flags',
      addFlag: 'New Label',
      flagPlaceholder: 'e.g. Try Out',
      manageCollections: 'Manage Collections',
      manageFlags: 'Manage Labels',
      noCollections: 'No collections created yet',
      noFlags: 'No labels created yet',
      premiumFeatureTitle: 'Premium Feature',
      premiumFeatureCollectionsDesc: 'Create collections and organize recipes to perfectly structure your cookbook.',
      premiumFeatureFlagsDesc: 'Create your own custom labels and tags to filter recipes even more flexibly.',
      bulkAddToCollection: 'Add to Collection',
      assignCollectionsTitle: 'Assign Collections',
      manageRecipeFlagsTitle: 'Manage Recipe Labels',
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
      emptyState: {
        welcomeTitle: 'Your shopping list is empty',
        welcomeDesc: 'Send the ingredients of your saved recipes to the list with one tap — automatically sorted by supermarket aisle.',
        ctaButton: 'Browse recipes',
        step1Title: '1. Open a recipe',
        step1Desc: 'Open a saved recipe from your cookbook.',
        step2Title: '2. Tap the cart',
        step2Desc: 'Tap the shopping-cart icon to add all its ingredients.',
        step3Title: '3. Sorted by aisle',
        step3Desc: 'Ingredients land grouped by supermarket aisle — ready to shop.',
      },
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
      recipeCount: '{count} recipes',
      doneCount: 'Done ({count})',
      moreActions: 'More actions',
      allDoneTitle: 'All done!',
      allDoneDesc: 'Everything is in your cart. Enjoy your meal!',
      finishShopping: 'Finish Shopping',
      restoreItem: 'Restore item',
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
    copilot: {
      title: 'Recipe Copilot',
      subtitle: 'Your smart AI sous-chef',
      placeholder: 'Ask about preparation or ingredients...',
      sendAria: 'Send message',
      remixReady: '🪄 Recipe Remix ready!',
      remixLoadBtn: '✨ Load & save new version',
      remixSuccessToast: 'Recipe successfully updated!',
      shoppingListToast: '🛒 Added ingredients to shopping list: {ingredients}',
      timerToast: '⏱️ Started timer for {label} ({duration} min.)!',
      timerNoLabel: 'Cooking step',
      errorForbidden: 'The Copilot is a premium feature. Please upgrade to Pro.',
      errorGeneral: 'An error occurred. Please try again.',
      chipsHeaderRemix: '🌱 Customize Recipe',
      chipsHeaderHelp: '🍳 Preparation Help',
      chipsHeaderSubs: '❌ Ingredient Emergency',
      chipsHeaderShopping: '🛒 Shopping List',
      chipsHeaderTimer: '⏱️ Timer',
      chipVegan: 'Make it vegan',
      chipProtein: 'Make it high protein',
      chipPortions: 'Adjust portions',
      chipAirfryer: 'Alternative without Airfryer?',
      chipRoux: 'Term: What does "Roux" mean?',
      chipFreeze: 'How to freeze leftovers?',
      chipSubstitute: 'Alternative for {ingredient}?',
      loading: 'Responding...',
      actionRunning: 'Running action...',
      showSuggestionsAria: 'Show suggestions',
      remixConfirmTitle: 'Confirm recipe change',
      remixConfirmBody: 'Do you want to modify the recipe with: "{request}"?',
      remixReplaceBtn: 'Replace current',
      remixNewBtn: 'As new recipe',
      remixCreated: '✅ The remix recipe "{title}" has been created!',
      clearAria: 'Reset chat',
      clearConfirmTitle: 'Reset chat?',
      clearConfirmBody: 'Do you want to clear this conversation and the suggestions for this recipe? This cannot be undone.',
      clearConfirmBtn: 'Reset',
      changesTitle: 'Planned changes ({count})',
      changesHint: 'Collect changes and apply them together.',
      changesApply: 'Apply changes',
      changesDiscardAll: 'Discard all',
      changesDeleteAria: 'Remove change',
      changesApplyPrompt: 'How do you want to apply the changes?',
      changesEmpty: 'No changes collected yet.',
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
        close: 'Close',
        owned: 'You have Premium',
        betaOwned: 'Beta Access Active',
        verifying: 'Verifying Status...',
        footer: 'Cancel anytime · Secure via Google Play',
        monthly: 'Monthly',
        yearly: 'Yearly',
        savePercent: 'Save {percent}%',
        bestseller: 'Best Value',
        coffeeAnchor: 'Less than the price of a coffee per month ☕',
        pricePeriod: '{price} / month',
        priceYearlyPeriod: '{price} / year',
        priceMonthlyEquivalent: 'only {price}/month',
        freeTrialTitle: '7-Day Free Trial',
        ctaWithTrial: 'Start Free Trial >',
        ctaWithoutTrial: 'Unlock Premium >',
        cancelSubtitle: 'No risk. Cancel anytime.',
        timeline: {
          step1Title: 'Today',
          step1Desc: 'Start free trial. Full access.',
          step2Title: 'Day 5',
          step2Desc: 'Get reminder notification.',
          step3Title: 'Day 7',
          step3Desc: 'Subscription starts. Cancel anytime.'
        },
        comparison: {
          tableTitle: 'Free vs. Premium Comparison',
          headerFeature: 'Feature',
          headerFree: 'Free',
          headerPremium: 'Premium',
          rowExtractions: 'Recipe Extraction',
          rowExtractionsFree: '3 / day',
          rowExtractionsPremium: 'Unlimited',
          rowCookbook: 'Cookbook (Save)',
          rowCookbookFree: 'Max 5 recipes',
          rowCookbookPremium: 'Unlimited',
          rowShoppingList: 'Shopping List',
          rowShoppingListFree: 'Local, 1 recipe',
          rowShoppingListPremium: 'Smart Combined',
          rowAiChat: 'Recipe AI Chat',
          rowAiChatFree: '❌ No',
          rowAiChatPremium: '✔️ Yes',
          rowNutrition: 'Nutrition & Macros',
          rowNutritionFree: '❌ No',
          rowNutritionPremium: '✔️ Yes',
          rowCollections: 'Collections & Labels',
          rowCookingMode: 'Cooking Mode & Timers'
        },
        features: {
          extractions: {
            title: 'Unlimited Recipes',
            desc: 'Import recipes from social media & web.'
          },
          remix: {
            title: 'Recipe AI Chat',
            desc: 'Adapt recipes dynamically via chat.'
          },
          nutrition: {
            title: 'Nutrition & Macros',
            desc: 'Keep track of ingredients & portions.'
          },
          shoppingList: {
            title: 'Smart Shopping List',
            desc: 'Combine shopping items automatically.'
          }
        }
      },
      shoppingListLimit: {
        title: 'Premium Feature',
        message: 'You already have ingredients from another recipe on your shopping list. Get Premium to combine ingredients from multiple recipes!'
      },
      hint: {
        extractUnlimited: 'Premium: Unlock unlimited',
        catalogFull: 'Cookbook full ({count}/{limit}) – Delete a recipe or upgrade.',
        catalogAlmostFull: 'Cookbook almost full ({count}/{limit})',
        extractionLimitReached: 'Daily limit reached ({used}/{limit}) – Upgrade to Premium for unlimited extractions.',
        unlockNutrition: 'Unlock nutrition',
        upgrade: 'Upgrade'
      }
    },
    feedback: {
      rowLabel: 'Report a bug / Feedback',
      title: 'Report a bug / Feedback',
      typeBug: 'Bug',
      typeIdea: 'Idea',
      messageLabel: 'Your message',
      placeholder: 'Describe the issue or your idea in as much detail as possible...',
      screenshotLabel: 'Screenshots (optional)',
      attachScreenshot: 'Attach screenshots',
      addMoreScreenshots: 'Add more',
      removeScreenshot: 'Remove screenshot',
      screenshotLimit: 'You can attach up to 6 images.',
      screenshotError: 'Could not process the screenshot.',
      diagnosticNote: 'Basic device info and recent app logs are attached to help us debug faster.',
      cancel: 'Cancel',
      submit: 'Submit',
      submitting: 'Sending...',
      successTitle: 'Thank you!',
      success: 'Thanks for your feedback! We\'ll take a look.',
      error: 'Could not send feedback. Please try again.'
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

  if (lowerMsg.includes('cookbook full')) {
    const m = errorMsg.match(/\((\d+)\/(\d+)\)/);
    const count = m ? m[1] : '';
    const limit = m ? m[2] : '5';
    const countStr = count ? `${count}/${limit}` : `${limit}`;
    return lang === 'de'
      ? `Kochbuch voll (${countStr}). Lösche ein Rezept oder hol dir Premium, um weitere Rezepte zu extrahieren.`
      : `Cookbook full (${countStr}). Delete a recipe or upgrade to Premium to extract more.`;
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

/**
 * Resolves a *stored* job error into localized display text using the CURRENT
 * language. Hooks keep the raw error in state — a backend/worker message, a
 * synthetic code like `too many requests`, or a `form.validation.*` i18n key —
 * instead of pre-translated text. Translating here (at render) means the message
 * re-localizes when the user switches language, rather than freezing in whatever
 * language happened to be active when the job failed.
 */
export function resolveJobError(err: string | null | undefined, lang: SupportedLanguage): string {
  if (!err) return '';
  if (err.startsWith('form.validation.')) return getTranslation(err, lang);
  return translateApiError(err, lang);
}


