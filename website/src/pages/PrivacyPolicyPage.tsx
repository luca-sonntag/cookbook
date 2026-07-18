import { legal } from '../legal';

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Datenschutzerklärung</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <p>Stand: {legal.lastUpdated}</p>

        <p>
          Der Schutz deiner personenbezogenen Daten ist uns wichtig. Wir
          verarbeiten deine Daten ausschließlich auf Grundlage der
          Datenschutz-Grundverordnung (DSGVO) und des österreichischen
          Datenschutzgesetzes (DSG). Diese Erklärung informiert dich über Art,
          Umfang und Zweck der Verarbeitung im Rahmen der Snagbite App und
          Website.
        </p>

        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlicher im Sinne des Art. 4 Z 7 DSGVO ist:<br />
          {legal.operatorName}<br />
          {legal.street}<br />
          {legal.city}, {legal.country}<br />
          E-Mail: <a href={`mailto:${legal.email}`}>{legal.email}</a>
        </p>
        <p>
          Wir haben keinen Datenschutzbeauftragten bestellt, da hierfür die
          gesetzlichen Voraussetzungen (Art. 37 DSGVO) nicht vorliegen. Bei
          Fragen zum Datenschutz wende dich bitte an die oben genannte
          E-Mail-Adresse.
        </p>

        <h2>2. Welche Daten wir verarbeiten</h2>
        <h3>a) Konto- und Registrierungsdaten</h3>
        <p>Für die Nutzung der App ist ein Nutzerkonto erforderlich. Dabei verarbeiten wir:</p>
        <ul>
          <li>E-Mail-Adresse</li>
          <li>Passwort (ausschließlich verschlüsselt/gehasht gespeichert)</li>
          <li>bei Anmeldung über Google: Name und Profilbild deines Google-Kontos</li>
          <li>eindeutige Nutzer-ID sowie Registrierungs- und Login-Zeitpunkte</li>
        </ul>

        <h3>b) Nutzungs- und Inhaltsdaten</h3>
        <ul>
          <li>von dir geteilte bzw. eingegebene Links zu Social-Media-Inhalten (Instagram, TikTok, YouTube, Facebook u.&nbsp;a.)</li>
          <li>die daraus generierten Rezepte samt Zutaten, Zubereitungsschritten, Nährwertschätzungen und extrahierten Vorschaubildern</li>
          <li>von dir angelegte Sammlungen, Favoriten, Labels und Einkaufslisten</li>
          <li>persönliche Präferenzen (Rezeptsprache, Maßsystem, Temperatureinheit)</li>
          <li>Anzahl und Zeitpunkt deiner Extraktionen (zur Durchsetzung von Nutzungslimits)</li>
        </ul>

        <h3>c) Zahlungs- und Abodaten</h3>
        <p>
          Bei Abschluss eines Premium-Abonnements wird die Zahlung über den
          Google Play Store abgewickelt. Wir selbst erhalten keine
          Kreditkarten- oder Kontodaten. Über unseren Dienstleister RevenueCat
          verarbeiten wir lediglich deinen Abo-Status („free"/„premium"), die
          Kauf-Kennung und den Ablaufzeitpunkt, um dir die Premium-Funktionen
          freizuschalten.
        </p>

        <h3>d) Feedback- und Fehlerberichte</h3>
        <p>
          Wenn du in der App Feedback oder einen Fehlerbericht sendest,
          verarbeiten wir deine Nachricht sowie – zur Fehlerdiagnose –
          technischen Kontext (Geräte- und App-Informationen, App-Version,
          zuletzt aufgetretene Konsolen-/Fehlerprotokolle) und optionale, von dir
          angehängte Screenshots.
        </p>

        <h3>e) Technische Daten (Server-Logs)</h3>
        <p>
          Beim Aufruf unserer Website und bei API-Anfragen der App werden aus
          technischen Gründen automatisch Daten verarbeitet, die dein Gerät
          übermittelt (u.&nbsp;a. IP-Adresse, Datum und Uhrzeit, angefragte
          Ressource, Browser-/Betriebssystem-Kennung). Diese Server-Logs dienen
          dem sicheren und stabilen Betrieb und werden nur kurzfristig
          gespeichert.
        </p>

        <h2>3. Zwecke und Rechtsgrundlagen</h2>
        <ul>
          <li><strong>Bereitstellung des Kontos und der App-Funktionen</strong> (Konto-, Nutzungs- und Inhaltsdaten): Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO.</li>
          <li><strong>Abwicklung von Premium-Abonnements</strong> (Abodaten): Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO.</li>
          <li><strong>Anmeldung über Google</strong>: deine Einwilligung, Art. 6 Abs. 1 lit. a DSGVO.</li>
          <li><strong>Bearbeitung von Feedback/Fehlerberichten</strong> sowie Betriebssicherheit, Missbrauchs- und Betrugsvermeidung (Server-Logs): berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO.</li>
          <li><strong>Erfüllung rechtlicher Pflichten</strong> (z.&nbsp;B. handels- und steuerrechtliche Aufbewahrung): Art. 6 Abs. 1 lit. c DSGVO.</li>
        </ul>

        <h2>4. Automatisierte Verarbeitung durch Künstliche Intelligenz</h2>
        <p>
          Zur Erstellung der Rezepte werden die von dir übermittelten Inhalte
          (Video-Frames, Beschreibungstexte) automatisiert durch das KI-Modell
          Google Gemini ausgewertet. Diese KI-Auswertung dient allein der
          Struktur­ierung des Rezepts. Eine ausschließlich automatisierte
          Entscheidung mit rechtlicher Wirkung oder ähnlich erheblicher
          Beeinträchtigung im Sinne des Art. 22 DSGVO findet nicht statt. Bitte
          beachte, dass KI-generierte Angaben (insbesondere Zutatenmengen und
          Nährwerte) fehlerhaft sein können und keine Ernährungs- oder
          Gesundheitsberatung darstellen.
        </p>

        <h2>5. Empfänger und Auftragsverarbeiter</h2>
        <p>
          Wir geben deine Daten nicht zum Verkauf oder zu Werbezwecken an Dritte
          weiter. Zur Erbringung unseres Dienstes setzen wir sorgfältig
          ausgewählte Dienstleister ein, mit denen – soweit erforderlich –
          Auftragsverarbeitungsverträge nach Art. 28 DSGVO bestehen:
        </p>
        <ul>
          <li><strong>Supabase (Supabase Inc., USA / EU-Hosting):</strong> Authentifizierung, Datenbank- und Speicher-Hosting (Konto, Rezepte, Feedback, Bilder). <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Datenschutzhinweise</a>.</li>
          <li><strong>Google Gemini (Google Ireland Ltd. / Google LLC, USA):</strong> KI-gestützte Analyse der übermittelten Rezeptinhalte. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Datenschutzhinweise</a>.</li>
          <li><strong>Apify (Apify Technologies s.r.o., Tschechien) und RapidAPI (SmartAPI/Nordic APIs, USA):</strong> Abruf öffentlich zugänglicher Social-Media-Inhalte zum übermittelten Link. <a href="https://apify.com/privacy-policy" target="_blank" rel="noopener noreferrer">Datenschutzhinweise Apify</a> | <a href="https://rapidapi.com/terms-and-privacy" target="_blank" rel="noopener noreferrer">Datenschutzhinweise RapidAPI</a>.</li>
          <li><strong>RevenueCat (RevenueCat Inc., USA):</strong> Verwaltung und Verifizierung des Abo-Status. <a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer">Datenschutzhinweise</a>.</li>
          <li><strong>Google Play (Google Ireland Ltd.):</strong> Vertrieb der App und Abwicklung der Zahlungen. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Datenschutzhinweise</a>.</li>
          <li><strong>Railway (Railway Corp., USA):</strong> Hosting der Server-Infrastruktur (Backend und Website). <a href="https://railway.com/legal/privacy" target="_blank" rel="noopener noreferrer">Datenschutzhinweise</a>.</li>
        </ul>

        <h2>6. Übermittlung in Drittländer</h2>
        <p>
          Einige der genannten Dienstleister haben ihren Sitz bzw. betreiben
          Server in den USA oder anderen Drittländern. Eine Übermittlung erfolgt
          nur, soweit sie durch geeignete Garantien im Sinne der Art. 44 ff.
          DSGVO abgesichert ist – insbesondere durch Standardvertragsklauseln
          der EU-Kommission und, soweit anwendbar, eine Zertifizierung nach dem
          EU-U.S. Data Privacy Framework. Auf Anfrage stellen wir dir nähere
          Informationen zu den vereinbarten Garantien zur Verfügung.
        </p>

        <h2>7. Speicherdauer</h2>
        <p>
          Wir speichern deine Daten nur so lange, wie es für die genannten
          Zwecke erforderlich ist:
        </p>
        <ul>
          <li>Konto-, Nutzungs- und Inhaltsdaten: bis zur Löschung deines Kontos.</li>
          <li>Feedback/Fehlerberichte: bis zur Erledigung des Anliegens bzw. Behebung des Fehlers.</li>
          <li>Server-Logs: in der Regel wenige Tage, danach automatische Löschung.</li>
          <li>Daten mit gesetzlicher Aufbewahrungspflicht (z.&nbsp;B. Belege): bis zum Ablauf der gesetzlichen Fristen (i.&nbsp;d.&nbsp;R. 7 Jahre gemäß § 132 BAO).</li>
        </ul>
        <p>
          Wie du dein Konto und alle zugehörigen Daten löschst, erfährst du auf
          der Seite <a href="/delete-data">Daten löschen</a>.
        </p>

        <h2>8. Push-/Lokale Benachrichtigungen</h2>
        <p>
          Die App kann dir lokale Benachrichtigungen (z.&nbsp;B. bei Ablauf eines
          Koch-Timers) anzeigen. Diese werden ausschließlich auf deinem Gerät
          erzeugt; es werden dafür keine personenbezogenen Daten an uns
          übermittelt. Du kannst die Berechtigung jederzeit in den
          Geräteeinstellungen widerrufen.
        </p>

        <h2>9. Deine Rechte</h2>
        <p>Dir stehen nach der DSGVO folgende Rechte zu:</p>
        <ul>
          <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
          <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
          <li>Recht auf Löschung (Art. 17 DSGVO)</li>
          <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Recht auf Widerspruch gegen Verarbeitungen auf Basis berechtigter Interessen (Art. 21 DSGVO)</li>
          <li>Recht, eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen (Art. 7 Abs. 3 DSGVO)</li>
        </ul>
        <p>
          Zur Ausübung deiner Rechte genügt eine Nachricht an{' '}
          <a href={`mailto:${legal.email}`}>{legal.email}</a>.
        </p>

        <h2>10. Beschwerderecht bei der Aufsichtsbehörde</h2>
        <p>
          Wenn du der Ansicht bist, dass die Verarbeitung deiner Daten gegen die
          DSGVO verstößt, hast du das Recht auf Beschwerde bei der zuständigen
          Aufsichtsbehörde. In Österreich ist dies die Österreichische
          Datenschutzbehörde, Barichgasse 40–42, 1030 Wien,{' '}
          <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">www.dsb.gv.at</a>.
        </p>

        <h2>11. Alter der Nutzer</h2>
        <p>
          Die App richtet sich nicht an Kinder. Personen unter 14 Jahren dürfen
          ohne Zustimmung der Erziehungsberechtigten kein Konto anlegen. Wir
          erheben nicht wissentlich Daten von Kindern unter dieser Altersgrenze.
        </p>

        <h2>12. Datensicherheit</h2>
        <p>
          Die Übertragung erfolgt verschlüsselt (TLS/HTTPS). Der Zugriff auf
          deine gespeicherten Inhalte ist durch Zugriffskontrollen auf
          Datenbankebene (Row-Level-Security) so abgesichert, dass ausschließlich
          du auf deine eigenen Daten zugreifen kannst.
        </p>

        <h2>13. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir passen diese Datenschutzerklärung an, wenn Änderungen an der App
          oder der Rechtslage dies erfordern. Es gilt die jeweils auf dieser
          Seite veröffentlichte Fassung.
        </p>
      </div>
    </div>
  );
}
