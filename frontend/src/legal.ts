// Public URLs for the legal documents required for an Austrian sole
// proprietorship ("Einzelunternehmen"): Datenschutzerklärung (privacy policy),
// AGB (terms & conditions) and Impressum (imprint). The documents are hosted on
// the Snagbite marketing website (`website/` workspace); the app only links to
// them. Centralized here so Settings, the login screen and the purchase flow all
// point at the same, single source of truth.
export const LEGAL_BASE_URL = 'https://snagbite.app';

export const LEGAL_URLS = {
  privacy: `${LEGAL_BASE_URL}/privacy`, // Datenschutzerklärung
  terms: `${LEGAL_BASE_URL}/terms`, // AGB
  imprint: `${LEGAL_BASE_URL}/legal`, // Impressum
} as const;
