import { COMPANY } from '../companyInfo';

export default function TermsPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Allgemeine Geschäftsbedingungen</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <p>Stand: {new Date().toLocaleDateString('de-DE')}</p>

        <h2>1. Geltungsbereich und Vertragspartner</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der
          Snagbite App und Website. Vertragspartner ist {COMPANY.name},
          {' '}{COMPANY.street}, {COMPANY.zipCity}, {COMPANY.country}
          {' '}(nachfolgend „wir" oder „Snagbite"). Abweichende Bedingungen des Nutzers
          werden nicht anerkannt, sofern wir ihrer Geltung nicht ausdrücklich schriftlich
          zustimmen.
        </p>

        <h2>2. Leistungsbeschreibung</h2>
        <p>
          Snagbite ermöglicht das Extrahieren von Rezeptdaten aus öffentlich zugänglichen
          Social-Media-Beiträgen (z. B. Instagram, TikTok, YouTube, Facebook) mithilfe
          automatisierter und KI-gestützter Verfahren. Wir übernehmen keine Gewähr für die
          Richtigkeit, Vollständigkeit oder Eignung der KI-generierten Zutatenlisten,
          Mengen oder Nährwerte.
        </p>

        <h2>3. Vertragsschluss und Registrierung</h2>
        <p>
          Für die Nutzung ist ein Nutzerkonto erforderlich, das über die Anmeldung mit
          einem Google-Konto erstellt wird. Der Nutzer verpflichtet sich, wahrheitsgemäße
          Angaben zu machen und seine Zugangsdaten geheim zu halten. Die kostenlose
          Grundnutzung kommt mit Abschluss der Registrierung zustande.
        </p>

        <h2>4. Premium-Abonnement, Preise und Zahlung</h2>
        <p>
          Snagbite bietet ein kostenpflichtiges Premium-Abonnement an. Die jeweils
          gültigen Preise, Abrechnungszeiträume und – sofern angeboten – eine kostenlose
          Testphase werden vor dem Kauf in der App bzw. im Google Play Store angezeigt. Die
          Zahlungsabwicklung und die Verwaltung des Abonnements erfolgen über den Google
          Play Store; es gelten insoweit ergänzend die Bedingungen von Google.
        </p>
        <p>
          Abonnements verlängern sich automatisch um den jeweiligen Zeitraum, sofern sie
          nicht rechtzeitig vor Ablauf gekündigt werden. Die Kündigung erfolgt über die
          Abo-Verwaltung im Google Play Store.
        </p>

        <h2>5. Rücktrittsrecht (Widerrufsrecht) für Verbraucher</h2>
        <p>
          Verbrauchern steht grundsätzlich ein 14-tägiges Rücktrittsrecht gemäß dem
          Fern- und Auswärtsgeschäfte-Gesetz (FAGG) zu. Die Frist beträgt 14 Tage ab
          Vertragsabschluss.
        </p>
        <p>
          <strong>Vorzeitiges Erlöschen bei digitalen Dienstleistungen/Inhalten:</strong>{' '}
          Da das Premium-Abonnement die Bereitstellung digitaler Dienstleistungen bzw.
          nicht auf einem körperlichen Datenträger gelieferter digitaler Inhalte
          umfasst, erlischt das Rücktrittsrecht gemäß § 18 Abs. 1 Z 11 FAGG vorzeitig,
          wenn du (a) ausdrücklich zugestimmt hast, dass wir mit der Ausführung vor Ablauf
          der Rücktrittsfrist beginnen, und (b) zur Kenntnis genommen hast, dass du dadurch
          dein Rücktrittsrecht verlierst.
        </p>
        <p>
          Um dein Rücktrittsrecht auszuüben, genügt eine eindeutige Erklärung (z. B. per
          E-Mail an <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>). Du kannst
          dafür das gesetzliche Muster-Rücktrittsformular verwenden, dies ist jedoch nicht
          vorgeschrieben.
        </p>

        <h2>6. Urheberrecht und Nutzungsrechte</h2>
        <p>
          Die über die App verarbeiteten Videos und Rezepte können urheberrechtlich
          geschützt sein. Die App darf nur für private, nicht-kommerzielle Zwecke im Rahmen
          des geltenden Urheberrechts genutzt werden. Snagbite beansprucht keine Rechte an
          den Inhalten der jeweiligen Creator.
        </p>

        <h2>7. Gewährleistung und Haftungsbeschränkung</h2>
        <p>
          Es gelten die gesetzlichen Gewährleistungsbestimmungen. Wir haften unbeschränkt
          für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des
          Lebens, des Körpers oder der Gesundheit. Im Übrigen ist die Haftung – soweit
          gesetzlich zulässig – ausgeschlossen. Für Schäden, die aus der Nutzung fehlerhaft
          extrahierter Rezepte entstehen (z. B. im Zusammenhang mit Allergien oder
          Unverträglichkeiten), wird keine Haftung übernommen; die eigenverantwortliche
          Prüfung der Zutaten obliegt dem Nutzer.
        </p>

        <h2>8. Änderungen der AGB</h2>
        <p>
          Wir behalten uns vor, diese AGB mit Wirkung für die Zukunft zu ändern, soweit
          dies aus sachlichen Gründen (z. B. geänderte Rechtslage oder Funktionsumfang)
          erforderlich ist. Über wesentliche Änderungen informieren wir in geeigneter Form.
        </p>

        <h2>9. Anwendbares Recht und Gerichtsstand</h2>
        <p>
          Es gilt österreichisches Recht unter Ausschluss der Verweisungsnormen und des
          UN-Kaufrechts. Zwingende verbraucherschutzrechtliche Bestimmungen des Staates,
          in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat, bleiben unberührt.
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit
          der übrigen Bestimmungen unberührt.
        </p>

        <p className="text-xs opacity-70">
          Hinweis: Diese AGB wurden als Standardvorlage nach österreichischem Recht
          erstellt und ersetzen keine individuelle Rechtsberatung.
        </p>
      </div>
    </div>
  );
}
