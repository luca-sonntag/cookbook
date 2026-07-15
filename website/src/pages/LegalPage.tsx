export default function LegalPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Impressum</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <h2>Angaben gemäß § 5 TMG</h2>
        <p>
          [Vorname] [Nachname]<br />
          [Straße und Hausnummer]<br />
          [PLZ] [Ort]<br />
        </p>

        <h2>Kontakt</h2>
        <p>
          Telefon: [Telefonnummer]<br />
          E-Mail: [E-Mail-Adresse]<br />
        </p>

        <h2>EU-Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>.<br />
          Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>

        <h2>Verbraucher­streit­beilegung/Universal­schlichtungs­stelle</h2>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </div>
    </div>
  );
}
