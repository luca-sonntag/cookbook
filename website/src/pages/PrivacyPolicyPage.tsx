export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Datenschutzerklärung</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <p>Stand: {new Date().toLocaleDateString('de-DE')}</p>
        <h2>1. Allgemeine Hinweise</h2>
        <p>[Hier Standard-Datenschutzerklärung einfügen, z.B. von eRecht24]</p>
        
        <h2>2. Datenerfassung in unserer App</h2>
        <p>Die Nutzung unserer App erfordert eine Registrierung. Dabei erfassen wir:</p>
        <ul>
          <li>E-Mail-Adresse</li>
          <li>Name (bei Google Login)</li>
          <li>Profilbild (bei Google Login)</li>
        </ul>
        <p>Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Vertragserfüllung.</p>

        <h2>3. Drittanbieter</h2>
        <p>Wir verwenden folgende Dienste von Drittanbietern:</p>
        <ul>
          <li><strong>Supabase:</strong> Für Authentifizierung und Datenbank-Hosting.</li>
          <li><strong>Google Gemini:</strong> Zur KI-basierten Analyse der extrahierten Rezepttexte.</li>
          <li><strong>Apify:</strong> Für den Download öffentlicher Instagram-Inhalte.</li>
        </ul>

        <h2>4. Ihre Rechte</h2>
        <p>Sie haben das Recht auf Auskunft, Löschung, Sperrung und Berichtigung Ihrer Daten. Details zur Kontolöschung finden Sie unter <a href="/delete-data">Daten löschen</a>.</p>
      </div>
    </div>
  );
}
