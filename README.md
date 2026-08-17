# quiznight

## Voraussetzungen

- Node.js `^22.18.0` oder `>=24.12.0` (siehe `engines` in `package.json`)
- pnpm `10.28.2` (siehe `packageManager` in `package.json`, am einfachsten über `corepack enable`)

## Installation

```sh
pnpm install
```

### Font "LEMON MILK"

Die Titel-Schrift **LEMON MILK** ist Donationware und darf nicht in diesem (öffentlichen) Repo mitgeliefert werden. Vor dem ersten Start selbst herunterladen:

1. Auf https://www.marsnev.com die Bold-Variante (`LEMONMILK-Bold.otf`) laden.
2. Die Datei nach `src/assets/font/LEMONMILK-Bold.otf` legen (Ordner ist per `.gitignore` ausgeschlossen).

Ohne diese Datei startet die App trotzdem, Titel werden dann nur mit der Fallback-Schrift dargestellt.

## Projekt starten

```sh
pnpm dev
```

Der Dev-Server läuft danach unter `http://localhost:5173/`. Das Quiz wird über den Query-Parameter `quiz` geladen, der auf eine JSON-Datei im `public/`-Ordner verweist. Mit den mitgelieferten Testdaten:

```
http://localhost:5173/?quiz=beispiel.json
```

Mit Leertaste geht es zur nächsten, mit Backspace zur vorherigen Folie.

## Tests & Type-Check

```sh
pnpm test:unit
pnpm type-check
```
