import { legal } from '../legal';

export default function LegalPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Impressum</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <p>
          Impressum und Offenlegung gemäß § 5 E-Commerce-Gesetz (ECG), § 63
          Gewerbeordnung (GewO) sowie §§ 24 f. Mediengesetz (MedienG).
        </p>

        <h2>Diensteanbieter / Medieninhaber</h2>
        <p>
          {legal.operatorName}<br />
          {legal.street}<br />
          {legal.city}<br />
          {legal.country}
        </p>

        <h2>Kontakt</h2>
        <p>
          E-Mail: <a href={`mailto:${legal.email}`}>{legal.email}</a><br />
          Telefon: {legal.phone}
        </p>

        <h2>Unternehmensdaten</h2>
        <ul>
          {legal.vatId && !legal.vatId.startsWith('AUSFÜLLEN') && (
            <li>Umsatzsteuer-Identifikationsnummer (UID): {legal.vatId}</li>
          )}
          {legal.companyRegister && (
            <li>Firmenbuch: {legal.companyRegister}</li>
          )}
          {legal.tradeAuthority && !legal.tradeAuthority.startsWith('AUSFÜLLEN') && (
            <li>Gewerbebehörde: {legal.tradeAuthority}</li>
          )}
          <li>Unternehmensgegenstand: Betrieb der App und Website „Snagbite" (KI-gestützte Extraktion von Rezepten aus öffentlich zugänglichen Social-Media-Inhalten).</li>
        </ul>
        <p>
          Anwendbare Rechtsvorschriften: Gewerbeordnung (GewO), abrufbar unter{' '}
          <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer">
            www.ris.bka.gv.at
          </a>. Kammerzugehörigkeit: Wirtschaftskammer Österreich (soweit ein
          Gewerbe angemeldet ist).
        </p>

        <h2>Offenlegung gemäß § 25 MedienG</h2>
        <p>
          Medieninhaber, Herausgeber und für den Inhalt verantwortlich:{' '}
          {legal.operatorName}, {legal.mediaOwnerLocation}.
        </p>
        <p>
          Grundlegende Richtung (Blattlinie): Diese Website dient der Information
          über die App „Snagbite" sowie der Bereitstellung der zugehörigen
          Rechtstexte. Sie verfolgt keine darüber hinausgehende politische oder
          weltanschauliche Ausrichtung.
        </p>

        <h2>Online-Streitbeilegung &amp; Verbraucherschlichtung</h2>
        <p>
          Die von der Europäischen Kommission bereitgestellte Plattform zur
          Online-Streitbeilegung (OS-Plattform) wurde mit 20. Juli 2025
          eingestellt und steht nicht mehr zur Verfügung. Für außergerichtliche
          Streitbeilegung steht Verbraucherinnen und Verbrauchern in Österreich
          unter anderem die Internet Ombudsstelle (
          <a href="https://www.ombudsstelle.at" target="_blank" rel="noopener noreferrer">
            www.ombudsstelle.at
          </a>) zur Verfügung.
        </p>
        <p>
          Wir sind nicht bereit und nicht verpflichtet, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>

        <h2>Urheberrecht</h2>
        <p>
          Die Inhalte dieser Website und der App unterliegen dem
          österreichischen Urheberrecht. Über die App verarbeitete Videos,
          Bilder und Texte Dritter (z.&nbsp;B. der jeweiligen Creator) bleiben im
          Eigentum ihrer Rechteinhaber; Snagbite beansprucht daran keine Rechte.
        </p>

        <h2>Haftung für Inhalte und Links</h2>
        <p>
          Als Diensteanbieter sind wir gemäß §§ 13 ff. ECG für eigene Inhalte
          verantwortlich, jedoch nicht verpflichtet, übermittelte oder
          gespeicherte fremde Informationen zu überwachen. Unsere Angebote
          können Links zu externen Websites Dritter enthalten, auf deren Inhalte
          wir keinen Einfluss haben. Für diese fremden Inhalte übernehmen wir
          keine Gewähr; verantwortlich ist stets der jeweilige Anbieter der
          verlinkten Seite.
        </p>
      </div>
    </div>
  );
}
