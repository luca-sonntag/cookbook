// ─────────────────────────────────────────────────────────────────────────────
// Zentrale Unternehmens-/Stammdaten für die Rechtstexte (Impressum,
// Datenschutzerklärung, AGB). Einmal hier pflegen — alle drei Seiten lesen daraus.
//
// WICHTIG: Die mit «[HIER EINTRAGEN: …]» markierten Felder müssen vor
// Veröffentlichung durch die echten Daten des Einzelunternehmens ersetzt werden.
// Diese Texte sind sorgfältig aufgebaute Standard-Boilerplate nach
// österreichischem Recht, ersetzen aber KEINE anwaltliche Prüfung.
// ─────────────────────────────────────────────────────────────────────────────

export const COMPANY = {
  /** Vollständiger Name der Einzelunternehmerin / des Einzelunternehmers. */
  name: '[HIER EINTRAGEN: Vor- und Nachname]',
  /** Straße und Hausnummer der Geschäftsanschrift. */
  street: '[HIER EINTRAGEN: Straße und Hausnummer]',
  /** PLZ und Ort der Geschäftsanschrift. */
  zipCity: '[HIER EINTRAGEN: PLZ und Ort]',
  /** Land. */
  country: 'Österreich',
  /** Kontakt-E-Mail (im Code bereits als Support-Adresse verwendet). */
  email: 'snagbite.app@gmail.com',
  /** Telefonnummer — optional; leer lassen bzw. Platzhalter entfernen, wenn nicht gewünscht. */
  phone: '[HIER EINTRAGEN: Telefon – optional]',
  /** UID-Nummer — nur falls umsatzsteuerpflichtig, sonst Platzhalter entfernen. */
  uid: '[HIER EINTRAGEN: UID-Nr. – falls umsatzsteuerpflichtig, sonst entfernen]',
  /** Unternehmensgegenstand / Tätigkeit. */
  businessPurpose:
    '[HIER EINTRAGEN: Unternehmensgegenstand, z. B. Softwareentwicklung / IT-Dienstleistungen]',
  /** Zuständige Gewerbebehörde (Bezirksverwaltungsbehörde / Magistrat). */
  gewerbebehoerde: '[HIER EINTRAGEN: zuständige Bezirksverwaltungsbehörde / Magistrat]',
  /** WKO-Mitgliedschaft / Fachgruppe — falls Kammermitglied. */
  wko: '[HIER EINTRAGEN: Wirtschaftskammer / Fachgruppe – falls Mitglied]',
} as const;

/** Zusammengesetzte Anschrift als mehrzeiliger String-Baustein. */
export const COMPANY_ADDRESS_LINES = [
  COMPANY.name,
  COMPANY.street,
  COMPANY.zipCity,
  COMPANY.country,
] as const;
