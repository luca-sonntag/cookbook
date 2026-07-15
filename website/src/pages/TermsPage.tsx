export default function TermsPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Allgemeine Geschäftsbedingungen</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <p>Stand: {new Date().toLocaleDateString('de-DE')}</p>
        
        <h2>1. Geltungsbereich</h2>
        <p>Diese AGB gelten für die Nutzung der Snagbite App und Website. Abweichende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, wir stimmen ihrer Geltung ausdrücklich schriftlich zu.</p>
        
        <h2>2. Leistungsbeschreibung</h2>
        <p>Snagbite ermöglicht das Extrahieren von Rezeptdaten aus öffentlich zugänglichen Social-Media-Posts (wie Instagram, TikTok, YouTube oder Facebook). Wir übernehmen keine Gewähr für die Richtigkeit der KI-generierten Zutatenlisten oder Nährwerte.</p>
        
        <h2>3. Registrierung und Account</h2>
        <p>Für die Nutzung ist ein Account erforderlich. Der Nutzer verpflichtet sich, wahrheitsgemäße Angaben zu machen und die Zugangsdaten geheim zu halten.</p>
        
        <h2>4. Urheberrecht</h2>
        <p>Die über unsere App verarbeiteten Videos und Rezepte können urheberrechtlich geschützt sein. Die App darf nur für private Zwecke im Rahmen des geltenden Urheberrechts genutzt werden. Snagbite beansprucht keine Rechte an den Inhalten der jeweiligen Creator.</p>

        <h2>5. Haftungsbeschränkung</h2>
        <p>Wir haften nur für Vorsatz und grobe Fahrlässigkeit. Für Schäden, die durch die Nutzung fehlerhaft extrahierter Rezepte entstehen (z.B. Allergien), wird keine Haftung übernommen.</p>
        
        <p><em>[Dies ist ein Platzhalter-Text und ersetzt keine rechtliche Beratung]</em></p>
      </div>
    </div>
  );
}
