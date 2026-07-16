export default function DataDeletionPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daten löschen</h1>
      <div className="prose prose-emerald dark:prose-invert">
        <p>
          Wenn du deinen Account und alle zugehörigen Daten bei Snagbite löschen möchtest, kannst du dies direkt in der App tun.
        </p>
        <h3>Schritt-für-Schritt Anleitung:</h3>
        <ol>
          <li>Öffne die Snagbite App auf deinem Gerät.</li>
          <li>Navigiere zum <strong>Profil</strong> bzw. <strong>Settings</strong> Tab unten rechts.</li>
          <li>Scrolle ganz nach unten.</li>
          <li>Tippe auf den roten Button <strong>"Account & Daten löschen"</strong>.</li>
          <li>Bestätige die Sicherheitsabfrage.</li>
        </ol>
        <p>
          <strong>Was passiert danach?</strong><br />
          Dein Account, alle deine gespeicherten Rezepte und zugehörigen Medien werden unwiderruflich von unseren Servern gelöscht.
        </p>
        <p>
          Falls du keinen Zugriff mehr auf die App hast, kannst du uns auch eine E-Mail an <code>support@snagbite.app</code> senden, und wir werden deine Daten manuell löschen.
        </p>
      </div>
    </div>
  );
}
