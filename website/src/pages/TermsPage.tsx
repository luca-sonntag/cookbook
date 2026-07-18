import { legal } from '../legal';

export default function TermsPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Allgemeine Geschäftsbedingungen</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <p>Stand: {legal.lastUpdated}</p>

        <h2>1. Geltungsbereich und Vertragspartner</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der
          App und Website „Snagbite" sowie für alle darüber abgeschlossenen
          Verträge zwischen dir und {legal.operatorName}, {legal.street},{' '}
          {legal.city}, {legal.country} („wir", „uns"). Abweichende Bedingungen
          des Nutzers werden nicht Vertragsbestandteil, es sei denn, wir stimmen
          ihrer Geltung ausdrücklich schriftlich zu.
        </p>
        <p>
          Verbraucher im Sinne dieser AGB ist jede natürliche Person, die den
          Vertrag zu Zwecken abschließt, die überwiegend weder ihrer
          gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet
          werden können (§ 1 KSchG).
        </p>

        <h2>2. Leistungsbeschreibung</h2>
        <p>
          Snagbite ermöglicht das automatisierte Extrahieren von Rezeptdaten aus
          öffentlich zugänglichen Social-Media-Beiträgen (z.&nbsp;B. Instagram,
          TikTok, YouTube, Facebook) mithilfe Künstlicher Intelligenz sowie das
          Verwalten dieser Rezepte, das Erstellen von Einkaufslisten und die
          Nutzung eines Kochmodus.
        </p>
        <p>
          Die Rezepte, Zutatenlisten, Mengen- und Nährwertangaben werden
          automatisiert und KI-gestützt erzeugt. Wir übernehmen keine Gewähr für
          deren Richtigkeit, Vollständigkeit oder Eignung für einen bestimmten
          Zweck. Die Angaben ersetzen insbesondere keine ärztliche oder
          ernährungswissenschaftliche Beratung.
        </p>
        <p>
          Es besteht kein Anspruch auf ununterbrochene Verfügbarkeit des
          Dienstes. Wir sind berechtigt, den Funktionsumfang weiterzuentwickeln,
          zu ändern oder – unter Wahrung berechtigter Nutzerinteressen –
          einzustellen.
        </p>

        <h2>3. Registrierung und Nutzerkonto</h2>
        <p>
          Für die Nutzung ist ein Nutzerkonto erforderlich. Du verpflichtest
          dich, wahrheitsgemäße Angaben zu machen und deine Zugangsdaten geheim
          zu halten. Die Nutzung setzt ein Mindestalter von 14 Jahren voraus;
          Minderjährige benötigen die Zustimmung ihrer Erziehungsberechtigten.
        </p>

        <h2>4. Nutzungsregeln und Verantwortung für Inhalte</h2>
        <p>
          Die über die App verarbeiteten Videos, Bilder und Texte können
          urheber-, marken- oder leistungsschutzrechtlich geschützt sein. Du
          darfst die App nur im Rahmen des geltenden Rechts und ausschließlich
          für deine private, nicht-kommerzielle Nutzung verwenden. Du sicherst
          zu, nur Links zu öffentlich zugänglichen Inhalten zu übermitteln und
          keine Rechte Dritter zu verletzen. Snagbite beansprucht keine Rechte
          an den Inhalten der jeweiligen Creator.
        </p>

        <h2>5. Premium-Abonnement, Preise und Zahlung</h2>
        <p>
          Die Grundfunktionen von Snagbite sind kostenlos nutzbar (mit
          Nutzungslimits). Zusätzliche Funktionen sind über ein kostenpflichtiges
          Premium-Abonnement verfügbar:
        </p>
        <ul>
          <li>Monatsabo: {legal.priceMonthly} pro Monat</li>
          <li>Jahresabo: {legal.priceYearly} pro Jahr</li>
        </ul>
        <p>
          Alle Preise verstehen sich als Endpreise inklusive der gesetzlichen
          Umsatzsteuer. Der maßgebliche Preis wird dir vor Abschluss im
          Kaufdialog des Google Play Stores angezeigt. Sofern ein kostenloser
          Testzeitraum (z.&nbsp;B. 7 Tage) angeboten wird, geht dieser nach Ablauf
          automatisch in ein kostenpflichtiges Abonnement über, sofern du nicht
          vorher kündigst.
        </p>
        <p>
          Der Kauf und die Zahlungsabwicklung erfolgen über den Google Play
          Store; es gelten ergänzend dessen Nutzungsbedingungen. Das Abonnement
          verlängert sich automatisch um die jeweils gewählte Laufzeit, solange
          es nicht bis spätestens 24 Stunden vor Ablauf des laufenden Zeitraums
          gekündigt wird.
        </p>

        <h2>6. Kündigung</h2>
        <p>
          Du kannst dein Abonnement jederzeit zum Ende des laufenden
          Abrechnungszeitraums über die Abo-Verwaltung deines Google-Play-Kontos
          kündigen. Nach der Kündigung bleiben die Premium-Funktionen bis zum
          Ende des bereits bezahlten Zeitraums verfügbar. Das kostenlose
          Basiskonto kannst du jederzeit durch Löschung des Kontos in der App
          beenden.
        </p>

        <h2>7. Widerrufsrecht für Verbraucher</h2>
        <p>
          Bei Abschluss eines kostenpflichtigen Abonnements steht dir als
          Verbraucher ein gesetzliches Rücktrittsrecht (Widerrufsrecht) nach dem
          Fern- und Auswärtsgeschäfte-Gesetz (FAGG) zu. Die vollständige
          Widerrufsbelehrung findest du im nachstehenden Abschnitt.
        </p>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 my-4 not-prose">
          <h3 className="text-lg font-semibold mb-2">Widerrufsbelehrung</h3>
          <p className="mb-2"><strong>Widerrufsrecht</strong></p>
          <p className="mb-2 text-sm">
            Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
            diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn
            Tage ab dem Tag des Vertragsabschlusses.
          </p>
          <p className="mb-2 text-sm">
            Um dein Widerrufsrecht auszuüben, musst du uns ({legal.operatorName},{' '}
            {legal.street}, {legal.city}, {legal.country}, E-Mail:{' '}
            {legal.email}) mittels einer eindeutigen Erklärung (z.&nbsp;B. ein mit
            der Post versandter Brief oder eine E-Mail) über deinen Entschluss,
            diesen Vertrag zu widerrufen, informieren. Zur Wahrung der
            Widerrufsfrist genügt es, dass du die Mitteilung über die Ausübung
            des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.
          </p>
          <p className="mb-2 text-sm"><strong>Folgen des Widerrufs</strong></p>
          <p className="mb-2 text-sm">
            Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die
            wir von dir erhalten haben, unverzüglich und spätestens binnen
            vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
            deinen Widerruf bei uns eingegangen ist. Erfolgte die Zahlung über
            den Google Play Store, wird die Rückerstattung über diesen
            abgewickelt.
          </p>
          <p className="mb-0 text-sm">
            <strong>Vorzeitiges Erlöschen des Widerrufsrechts:</strong> Wenn du
            ausdrücklich zugestimmt hast, dass wir mit der Erbringung der
            digitalen Dienstleistung vor Ablauf der Widerrufsfrist beginnen, und
            du zur Kenntnis genommen hast, dass du dadurch dein Widerrufsrecht
            verlierst, erlischt das Widerrufsrecht mit Beginn der
            Vertragsausführung (§ 18 Abs. 1 Z 11 FAGG).
          </p>
        </div>

        <p>
          <strong>Muster-Widerrufsformular</strong> (wenn du den Vertrag
          widerrufen willst, kannst du dieses Formular ausfüllen und an uns
          senden):
        </p>
        <blockquote>
          An {legal.operatorName}, {legal.street}, {legal.city},{' '}
          {legal.country}, E-Mail: {legal.email}:<br />
          Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag
          über die Erbringung der folgenden Dienstleistung: Snagbite
          Premium-Abonnement<br />
          Bestellt am / erhalten am: __________<br />
          Name des/der Verbraucher(s): __________<br />
          Anschrift des/der Verbraucher(s): __________<br />
          Datum, Unterschrift (nur bei Mitteilung auf Papier): __________
        </blockquote>

        <h2>8. Gewährleistung und Haftung</h2>
        <p>
          Es gelten die gesetzlichen Gewährleistungsbestimmungen. Wir haften
          unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers
          oder der Gesundheit sowie für Schäden, die wir vorsätzlich oder grob
          fahrlässig verursacht haben. Für leicht fahrlässig verursachte
          Sachschäden haften wir nur bei Verletzung einer wesentlichen
          Vertragspflicht und begrenzt auf den vertragstypischen, vorhersehbaren
          Schaden. Eine weitergehende Haftung ist ausgeschlossen. Gesetzlich
          zwingende Haftungsbestimmungen, insbesondere nach dem
          Konsumentenschutzgesetz (KSchG) und dem Produkthaftungsgesetz, bleiben
          unberührt.
        </p>
        <p>
          Insbesondere übernehmen wir keine Haftung für Schäden, die aus der
          Verwendung fehlerhaft oder unvollständig extrahierter Rezepte, Mengen-
          oder Nährwertangaben entstehen (z.&nbsp;B. im Zusammenhang mit
          Allergien oder Unverträglichkeiten). Prüfe Zutaten und Angaben stets
          eigenverantwortlich.
        </p>

        <h2>9. Änderungen dieser AGB</h2>
        <p>
          Wir behalten uns vor, diese AGB mit Wirkung für die Zukunft zu ändern,
          soweit dies aus sachlichem Grund (z.&nbsp;B. Änderungen der Rechtslage
          oder des Funktionsumfangs) erforderlich ist und dich nicht unangemessen
          benachteiligt. Über wesentliche Änderungen informieren wir dich
          rechtzeitig. Widersprichst du nicht innerhalb einer angemessenen Frist,
          gelten die geänderten Bedingungen als angenommen; auf die Bedeutung des
          Schweigens weisen wir dich in der Mitteilung gesondert hin.
        </p>

        <h2>10. Anwendbares Recht und Gerichtsstand</h2>
        <p>
          Es gilt österreichisches Recht unter Ausschluss des
          UN-Kaufrechts und der Verweisungsnormen des internationalen
          Privatrechts. Zwingende Verbraucherschutzbestimmungen des Staates,
          in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat, bleiben
          unberührt. Für Verbraucher gelten die gesetzlichen Gerichtsstände;
          insbesondere kann ein Verbraucher gemäß § 14 KSchG nur vor dem Gericht
          seines Wohnsitzes, gewöhnlichen Aufenthalts oder Beschäftigungsorts
          geklagt werden.
        </p>

        <h2>11. Salvatorische Klausel</h2>
        <p>
          Sollte eine Bestimmung dieser AGB unwirksam sein oder werden, bleibt
          die Wirksamkeit der übrigen Bestimmungen davon unberührt. An die Stelle
          der unwirksamen Bestimmung tritt die gesetzliche Regelung.
        </p>
      </div>
    </div>
  );
}
