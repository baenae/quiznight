# quiznight

## Voraussetzungen

- Node.js `^22.18.0` oder `>=24.12.0` (siehe `engines` in `package.json`)
- pnpm `10.28.2` (siehe `packageManager` in `package.json`, am einfachsten über `corepack enable`)

## Installation

```sh
pnpm install
```

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
