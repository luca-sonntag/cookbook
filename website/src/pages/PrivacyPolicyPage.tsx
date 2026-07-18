import { COMPANY } from '../companyInfo';

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Datenschutzerklärung</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <p>Stand: {new Date().toLocaleDateString('de-DE')}</p>

        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und des
          österreichischen Datenschutzgesetzes (DSG) ist:
        </p>
        <p>
          {COMPANY.name}<br />
          {COMPANY.street}<br />
          {COMPANY.zipCity}<br />
          {COMPANY.country}<br />
          E-Mail: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </p>

        <h2>2. Welche Daten wir verarbeiten</h2>
        <ul>
          <li><strong>Registrierungs- und Kontodaten:</strong> E-Mail-Adresse sowie – bei Anmeldung über Google – Name und Profilbild.</li>
          <li><strong>Nutzungsinhalte:</strong> von dir übermittelte Links zu Social-Media-Beiträgen (Reels) sowie die daraus extrahierten Rezepte, Sammlungen, Favoriten und Einkaufslisten.</li>
          <li><strong>Abo- und Kaufdaten:</strong> Status deines Premium-Abonnements (die Zahlungsabwicklung selbst erfolgt über Google Play; wir erhalten keine vollständigen Zahlungsdaten).</li>
          <li><strong>Technische Daten:</strong> Log- und Nutzungsdaten, die beim Betrieb der App und der Server automatisch anfallen (z. B. Zeitpunkt von Anfragen, Fehlerprotokolle).</li>
        </ul>

        <h2>3. Zwecke und Rechtsgrundlagen</h2>
        <ul>
          <li><strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> Bereitstellung des Kontos, Extraktion und Verwaltung von Rezepten, Abwicklung des Premium-Abos.</li>
          <li><strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> sicherer und stabiler Betrieb, Missbrauchs- und Fehlerabwehr, Weiterentwicklung des Dienstes.</li>
          <li><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> soweit für einzelne Funktionen erforderlich; eine erteilte Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden.</li>
        </ul>

        <h2>4. Empfänger und Auftragsverarbeiter</h2>
        <p>
          Zur Erbringung unseres Dienstes setzen wir sorgfältig ausgewählte Dienstleister
          ein, die als Auftragsverarbeiter für uns tätig sind:
        </p>
        <ul>
          <li><strong>Supabase:</strong> Authentifizierung und Datenbank-Hosting.</li>
          <li><strong>Google (Google Ireland/LLC):</strong> Anmeldung („Sign in with Google"), KI-gestützte Analyse der extrahierten Rezeptinhalte (Google Gemini) sowie Abwicklung der In-App-Käufe (Google Play Billing).</li>
          <li><strong>RevenueCat:</strong> Verwaltung und Synchronisierung des Abonnement-Status.</li>
          <li><strong>Apify / RapidAPI:</strong> technischer Abruf öffentlich zugänglicher Social-Media-Inhalte zur Rezept-Extraktion.</li>
          <li><strong>Railway:</strong> Hosting der Backend-Infrastruktur.</li>
        </ul>
        <p>
          Einzelne dieser Anbieter können Daten in Drittländern (insbesondere den USA)
          verarbeiten. In diesen Fällen stützen wir die Übermittlung auf geeignete
          Garantien im Sinne der Art. 44 ff. DSGVO, insbesondere die
          EU-Standardvertragsklauseln.
        </p>

        <h2>5. Speicherdauer</h2>
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie es für die genannten
          Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen. Bei
          Löschung deines Kontos werden die zugehörigen Daten unwiderruflich entfernt
          (siehe <a href="/delete-data">Daten löschen</a>).
        </p>

        <h2>6. Deine Rechte</h2>
        <p>Dir stehen nach der DSGVO folgende Rechte zu:</p>
        <ul>
          <li>Auskunft (Art. 15), Berichtigung (Art. 16) und Löschung (Art. 17)</li>
          <li>Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21)</li>
          <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3)</li>
        </ul>
        <p>
          Zur Ausübung deiner Rechte genügt eine Nachricht an{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Die Kontolöschung kannst
          du auch selbst in der App vornehmen (siehe <a href="/delete-data">Daten löschen</a>).
        </p>

        <h2>7. Beschwerderecht</h2>
        <p>
          Unbeschadet anderer Rechtsbehelfe hast du das Recht auf Beschwerde bei einer
          Aufsichtsbehörde. Zuständig ist die österreichische Datenschutzbehörde,
          Barichgasse 40–42, 1030 Wien,{' '}
          <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">
            www.dsb.gv.at
          </a>.
        </p>

        <h2>8. Datensicherheit</h2>
        <p>
          Wir treffen angemessene technische und organisatorische Maßnahmen, um deine
          Daten gegen Verlust, Missbrauch und unbefugten Zugriff zu schützen. Die
          Übertragung erfolgt verschlüsselt (TLS/HTTPS).
        </p>

        <p className="text-xs opacity-70">
          Hinweis: Diese Datenschutzerklärung wurde als Standardvorlage nach DSGVO/DSG
          erstellt und ersetzt keine individuelle Rechtsberatung.
        </p>
      </div>
    </div>
  );
}
