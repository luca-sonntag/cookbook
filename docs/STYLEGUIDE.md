# 🎨 App Styleguide & Design System

Dieses Dokument definiert die visuellen Richtlinien, Design-Prinzipien und die architektonische Umsetzung des User Interfaces für diese Anwendung. Ziel ist eine konsistente, hochwertige ("Premium") User Experience über alle Bereiche hinweg.

## 1. Design Philosophie
- **Premium Aesthetic:** Die App soll auf den ersten Blick durch moderne UI-Elemente, harmonische Farbpaletten und hochwertige Typografie bestechen. Vermeidung von platten "Standard-Designs".
- **Glassmorphismus:** Dezenter Einsatz von halbtransparenten Hintergründen mit Hintergrundunschärfe (Blur-Effekten), um Tiefe, Kontext und Modernität zu erzeugen.
- **Micro-Interactions & Animationen:** Lebendiges Design durch flüssige Hover-Effekte, geschmeidige Transitions und durchdachte Einblend-Animationen (z. B. beim Abhaken von Zutaten).
- **Dark/Light Mode:** Volle Unterstützung für nahtloses Umschalten zwischen einem hellen, sauberen Theme und einem immersiven, eleganten Dark Mode, verankert in einer durchdachten Farbpalette.

## 2. Typografie
Die App verwendet als primäre Schriftart **Outfit** (eingebunden über Google Fonts), die dem Interface ein sehr modernes und rundes Erscheinungsbild gibt.

- **Font Family:** `'Outfit', system-ui, -apple-system, sans-serif`
- **Gewichte:** `300` (Light), `400` (Regular), `500` (Medium), `600` (Semi-Bold), `700` (Bold)
- **Einsatz:** Generell als Standardschrift für das gesamte Interface (Überschriften, Fließtext, UI-Komponenten).

## 3. Farben & Theming

Die App nutzt Tailwind CSS v4 in Kombination mit HeroUI-Tokens. Die globalen Werte werden in der `index.css` via `@theme` definiert.

### ☀️ Light Mode
- **Main Background:** `#f9fafb` (Weiches Off-White/Grau für optimalen Kontrast)
- **Main Text:** `#111827` (Tiefes Schiefergrau, weicher als reines Schwarz)

### 🌙 Dark Mode (warme Neutral-Grau-Palette, an die Claude-App angelehnt)
- **Main Background:** `var(--color-gray-950)` bzw. `#1a1917` (Tiefes, warmes Neutralgrau statt kühlem Fast-Schwarz)
- **Card/Element Backgrounds:** `var(--color-gray-900)` bzw. `#262624` und `#363531` (Deutlich abgesetztes warmes Dunkelgrau für strukturelle Tiefe)
- **Main Text:** `#f3f4f6` (Weiches Off-White für angenehmes Lesen bei Dunkelheit)

### Akzentfarben
- **Primary / Accent:** Emerald / Sage Green (`var(--color-emerald-500)`). Wird beispielsweise für Highlights, Buttons und den angepassten Custom-Scrollbar genutzt, da es eine kulinarisch/frische Assoziation (für eine Rezept-App) weckt.

## 4. UI-Komponenten (HeroUI)
Für die Struktur und Basis-Komponenten wird **HeroUI v3** (auf Basis von React Aria) verwendet.

- **Best Practice:** Wo immer möglich, sollten die eingebauten HeroUI-Props (z. B. `color="primary"`, `variant="flat"`, `variant="faded"`, `radius="lg"`, `size="md"`) statt manuell zusammengebauter Tailwind-Klassen verwendet werden.
- **Vorteile:** Dies garantiert volle Kompatibilität mit Accessibility-Standards (ARIA), sanfte eingebaute Transitions und konsistente UI-States (Hover, Focus, Active, Disabled).

## 5. Eigene CSS-Klassen & Layout-Utilities

Neben den Standard-Tailwind-Klassen gibt es in der `index.css` vordefinierte semantische Utility-Klassen für wiederkehrende Muster.

### Glassmorphismus Panels
`className="glass-panel"`
Erzeugt eine Karte oder ein Panel mit Glas-Effekt. Passt sich automatisch dem System-Theme an:
- **Light Mode:** Weiß halbtransparent (`rgba(255, 255, 255, 0.75)`), Blur 12px, sehr leichter Schlagschatten.
- **Dark Mode:** Warmes Dunkelgrau (`rgba(38, 38, 36, 0.75)`), Blur 12px, mit einer feinen, subtilen Outline statt eines Schattens.

### Scrollbars
- **Premium Scrollbar:** Systemweit durch ein schlankes Design (`::-webkit-scrollbar`) überschrieben (schmal, dunkler Track, Emerald-Thumb).
- **Hiding Utilities:** `className="scrollbar-none"` blendet die Scrollbar visuell komplett aus, erhält aber das native Scroll-Verhalten (wichtig für horizontale Listen oder Image-Galerien).

## 6. Animationen & Transitions

In der `index.css` stehen fertige, performance-optimierte CSS-Animationen (`@keyframes`) als Tailwind-Klassen zur Verfügung:

- **`animate-pulse-slow`:** Langsames, elegantes Pulsieren (3 Sekunden Intervall, gut für Lade-Skelette oder subtile Highlights).
- **`animate-fade-in-up`:** Weiches Einblenden von unten nach oben (perfekt für das Erscheinen von Floating Action Buttons, Toast-Messages oder Bottom-Sheets).
- **`animate-tab-in-right` / `animate-tab-in-left`:** Für direktionale Swipe-Übergänge zwischen Seiten oder Tabs (z. B. in der Rezept-Ansicht). Respektiert automatisch `prefers-reduced-motion`.
- **`animate-item-collapse` / `animate-item-expand`:** Spezifische, weiche Höhen- und Padding-Animation für Listenelemente, die dynamisch hinzugefügt oder entfernt (z. B. abgehakt) werden, ohne dass das Layout abrupt springt.
- **`animate-group-collapse` / `animate-group-expand`:** Entspricht der Item-Animation, jedoch auf größere Container skaliert (z. B. das Einklappen ganzer Zutaten-Kategorien in der Einkaufsliste).

## 7. Best Practices & Code-Konventionen

1. **Inline-Styling vermeiden:** Vermeide das `style={{ ... }}` Attribut in React, es sei denn, es handelt sich um dynamisch zur Laufzeit berechnete Werte (wie z. B. absolute `left`/`top`-Positionierungen bei Drag & Drop).
2. **Tailwind First:** Nutze ausschließlich Tailwind-Utility-Klassen für Spacing (Abstände), Flexbox-Layouts, Grids und Typografie-Hierarchien.
3. **Zentrale Stylesheets nutzen:** Neue globale Keyframes oder extrem komplexe, wiederkehrende Selektoren gehören in die globale `index.css` (bzw. `App.css`), um inkonsistenten Inline-CSS-Müll zu vermeiden.
4. **HeroUI-Dialoge statt nativer Alerts:** Verwende den zentralen `DialogContext` (`useDialog()`), um native, blockierende JavaScript-Aufrufe (`window.alert`, `window.confirm`) durch visuell ansprechende HeroUI-Modals zu ersetzen, die sich in das Design einfügen.
