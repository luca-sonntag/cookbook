import { COMPANY } from '../companyInfo';

export default function LegalPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Impressum</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <p className="text-sm">
          Offenlegung gemäß § 5 E-Commerce-Gesetz (ECG), § 14 Unternehmensgesetzbuch
          (UGB) und Offenlegung gemäß § 25 Mediengesetz.
        </p>

        <h2>Medieninhaber, Herausgeber &amp; Diensteanbieter</h2>
        <p>
          {COMPANY.name}<br />
          Einzelunternehmen<br />
          {COMPANY.street}<br />
          {COMPANY.zipCity}<br />
          {COMPANY.country}
        </p>

        <h2>Kontakt</h2>
        <p>
          E-Mail: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a><br />
          Telefon: {COMPANY.phone}
        </p>

        <h2>Unternehmensgegenstand</h2>
        <p>{COMPANY.businessPurpose}</p>

        <h2>Umsatzsteuer-Identifikationsnummer</h2>
        <p>
          UID-Nummer: {COMPANY.uid}
        </p>

        <h2>Gewerberecht</h2>
        <p>
          Anwendbare Rechtsvorschrift: Gewerbeordnung (GewO), abrufbar unter{' '}
          <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener noreferrer">
            www.ris.bka.gv.at
          </a>.<br />
          Zuständige Gewerbebehörde: {COMPANY.gewerbebehoerde}<br />
          Kammerzugehörigkeit: {COMPANY.wko}
        </p>

        <h2>Online-Streitbeilegung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
          (OS) bereit:{' '}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
            https://ec.europa.eu/consumers/odr/
          </a>.<br />
          Unsere E-Mail-Adresse finden Sie oben in diesem Impressum. Wir sind weder
          bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h2>Haftung für Inhalte</h2>
        <p>
          Die Inhalte dieser Website und der Snagbite-App wurden mit größtmöglicher
          Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der
          Inhalte kann jedoch keine Gewähr übernommen werden. Insbesondere werden
          Rezeptdaten automatisiert aus öffentlich zugänglichen Inhalten erzeugt; für
          deren Richtigkeit (z. B. Zutatenmengen, Nährwerte, Allergene) wird keine
          Haftung übernommen.
        </p>

        <h2>Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte
          wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der
          jeweilige Anbieter oder Betreiber verantwortlich.
        </p>

        <h2>Urheberrecht</h2>
        <p>
          Die durch die Betreiber erstellten Inhalte und Werke unterliegen dem
          österreichischen Urheberrecht. Die über die App verarbeiteten Videos und
          Rezepte können urheberrechtlich geschützt sein und verbleiben im Eigentum der
          jeweiligen Rechteinhaber (Creator/Plattformen). Snagbite beansprucht keine
          Rechte an diesen Inhalten.
        </p>

        <p className="text-xs opacity-70">
          Hinweis: Dieses Impressum wurde als Standardvorlage nach österreichischem
          Recht erstellt und ersetzt keine individuelle Rechtsberatung.
        </p>
      </div>
    </div>
  );
}
