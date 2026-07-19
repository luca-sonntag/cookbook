import { legal } from '../legal';

export default function DataDeletionPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daten löschen</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <p>
          Du hast jederzeit das Recht, dein Konto und alle zugehörigen
          personenbezogenen Daten bei Snagbite zu löschen (Art. 17 DSGVO). Am
          einfachsten geht das direkt in der App.
        </p>
        <h3>Schritt-für-Schritt-Anleitung:</h3>
        <ol>
          <li>Öffne die Snagbite App auf deinem Gerät.</li>
          <li>Navigiere zum <strong>Profil</strong>- bzw. <strong>Settings</strong>-Tab unten rechts.</li>
          <li>Scrolle ganz nach unten.</li>
          <li>Tippe auf den roten Button <strong>„Account &amp; Daten löschen"</strong>.</li>
          <li>Bestätige die Sicherheitsabfrage.</li>
        </ol>
        <p>
          <strong>Was passiert danach?</strong><br />
          Dein Konto, alle gespeicherten Rezepte, Sammlungen, Einkaufslisten,
          Feedback-Beiträge und zugehörigen Medien (z.&nbsp;B. Vorschaubilder)
          werden unwiderruflich von unseren Servern gelöscht. Die Löschung ist
          endgültig und kann nicht rückgängig gemacht werden.
        </p>
        <p>
          <strong>Was passiert mit einem laufenden Abo?</strong><br />
          Ein bestehendes Premium-Abonnement wird durch die Kontolöschung nicht
          automatisch beendet. Bitte kündige es zusätzlich in der Abo-Verwaltung
          deines Google-Play-Kontos, um weitere Abbuchungen zu vermeiden.
        </p>
        <p>
          <strong>Manuelle Löschung per E-Mail:</strong><br />
          Falls du keinen Zugriff mehr auf die App hast, sende uns einfach eine
          E-Mail an <a href={`mailto:${legal.email}`}><code>{legal.email}</code></a>{' '}
          von der bei uns hinterlegten Adresse, und wir löschen deine Daten
          manuell. Wir bearbeiten deine Anfrage unverzüglich, spätestens
          innerhalb von 30 Tagen.
        </p>
        <p>
          <strong>Hinweis zu gesetzlichen Aufbewahrungspflichten:</strong> Daten,
          die wir aufgrund gesetzlicher Vorschriften (z.&nbsp;B. steuer- oder
          handelsrechtlicher Aufbewahrungspflichten) weiter aufbewahren müssen,
          werden bis zum Ablauf der jeweiligen Frist eingeschränkt verarbeitet
          und erst danach gelöscht.
        </p>
      </div>
    </div>
  );
}
