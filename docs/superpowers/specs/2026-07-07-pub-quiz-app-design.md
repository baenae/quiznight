# Pub-Quiz-Anwendung – Design

## Zweck

Präsentations-Anwendung für einen Pub-Quiz-Abend, die auf einem Monitor angezeigt wird. Es gibt keine Interaktion durch Spieler – ein Moderator steuert den Ablauf per Tastatur (Leertaste vorwärts, Backspace rückwärts). Die Anwendung ist eine reine Slide-Abfolge (Kategorie → Frage → Auflösung → ... → Pause → nächste Kategorie → ... → Ende).

## Nicht-Ziele (aktuell)

- Keine Spieler-Interaktion, kein Multiplayer, keine Eingabegeräte außer der Moderator-Tastatur.
- Kein Styling/Design – nur rudimentäres, blankes CSS für Lesbarkeit. Kein UI-Framework, keine Animationen.
- Kein Punkte-Board zum direkten Springen in Kategorien/Fragen (z. B. Jeopardy-Stil mit Punktwerten 100–500). Das ist ein bewusst zurückgestelltes Folge-Feature (siehe „Zukünftige Erweiterung" unten) – das Datenmodell wird aber so gebaut, dass es sich später ohne Umbau ergänzen lässt.

## Datenquelle & Laden

- Quizdaten liegen als JSON-Datei in `public/`.
- Der Dateiname wird per URL-Query-Parameter übergeben: `?quiz=beispiel.json`.
- Die Anwendung lädt die Datei beim Start per `fetch` relativ zu `public/`.
- Fehlt der Parameter, oder schlägt das Laden (Netzwerkfehler, ungültiges JSON, Validierungsfehler) fehl, wird eine klare Fehlermeldung angezeigt. Die Anwendung startet in diesem Fall nicht (keine Slides werden gerendert, nur die Fehlermeldung).

## JSON-Schema & TypeScript-Typen

```json
{
  "title": "Quiz-Titel",
  "categories": [
    {
      "name": "Kategoriename",
      "questions": [
        {
          "text": "Fragetext",
          "answers": [
            { "text": "Antwort A", "correct": false },
            { "text": "Antwort B", "correct": true },
            { "text": "Antwort C", "correct": false },
            { "text": "Antwort D", "correct": false }
          ]
        }
      ]
    }
  ]
}
```

TypeScript-Interfaces (`src/quiz/types.ts`):

```ts
interface Answer {
	text: string;
	correct: boolean;
}

interface Question {
	text: string;
	answers: Answer[];
}

interface Category {
	name: string;
	questions: Question[];
}

interface Quiz {
	title: string;
	categories: Category[];
}
```

## Validierung

Reine Funktion `validateQuiz(data: unknown): { ok: true; quiz: Quiz } | { ok: false; message: string }` in `src/quiz/validateQuiz.ts`.

Regeln (Prüfung bricht beim ersten Verstoß ab):

- Alle Pflichtfelder (`title`, `categories`, `name`, `questions`, `text`, `answers`, `correct`) sind vorhanden und korrekt typisiert.
- Jede Kategorie hat exakt 5 Fragen.
- Jede Frage hat exakt 4 Antworten.
- Jede Frage hat mindestens 1 und höchstens 4 korrekte Antworten (Sonderfragen können mehrere richtige haben).

Die Fehlermeldung benennt die Stelle möglichst genau, z. B. „Kategorie 2, Frage 3: nur 3 Antworten vorhanden".

Da dies eine reine, isolierte Funktion ist, wird sie mit Vitest-Unit-Tests abgedeckt (ein Test pro Regelverstoß + ein Happy-Path-Test inkl. Sonderfrage mit mehreren korrekten Antworten).

## Ablauf-Steuerung: vorberechnete Schritt-Liste

**Entscheidung:** Der Ablauf wird als vorberechnete, flache Liste aller Slides modelliert statt als explizite State Machine mit Phasen-Feld und separaten `next()`/`prev()`-Fallunterscheidungen. Grund: Bei einer Schritt-Liste ist Navigation nur `currentIndex++`/`currentIndex--` – Vorwärts- und Rückwärts-Verhalten sind dadurch *by construction* symmetrisch, es gibt keine zwei unabhängigen Implementierungen, die auseinanderlaufen könnten. Das erfüllt auch die spätere Anforderung, direkt zu einem beliebigen Schritt springen zu können (siehe „Zukünftige Erweiterung").

**Typ** (`src/quiz/buildSteps.ts`):

```ts
type Step =
	| { type: "category"; categoryIndex: number }
	| { type: "question"; categoryIndex: number; questionIndex: number; resolved: boolean }
	| { type: "pause" }
	| { type: "end" };
```

**Reihenfolge pro Kategorie:** `category` → für jede der 5 Fragen: `question(resolved:false)`, `question(resolved:true)` → `pause` (außer nach der letzten Kategorie, dort stattdessen `end`).

`buildSteps(quiz: Quiz): Step[]` ist eine reine Funktion, wird einmalig beim Laden des Quiz aufgerufen und mit Vitest getestet (prüft die erzeugte Reihenfolge für ein kleines Beispiel-Quiz).

## State-Management: Pinia-Store

`src/stores/quizFlow.ts`:

- **State:** `quiz: Quiz | null`, `steps: Step[]`, `currentIndex: number`, `loadError: string | null`
- **Getter:** `currentStep` (= `steps[currentIndex]`), `currentCategory`, `currentQuestion` (leiten aus `currentStep` + `quiz` ab)
- **Actions:**
  - `load(quiz: Quiz)`: setzt `quiz`, ruft `buildSteps` auf, setzt `currentIndex = 0`
  - `next()`: `currentIndex = Math.min(currentIndex + 1, steps.length - 1)`
  - `prev()`: `currentIndex = Math.max(currentIndex - 1, 0)`
  - `setError(message: string)`: für Lade-/Validierungsfehler

Da `next`/`prev` geklammerte Index-Arithmetik sind, verhalten sich die Randfälle automatisch wie gewünscht: Leertaste auf der Ende-Slide und Backspace auf der ersten Kategorie-Slide sind wirkungslos, ohne dass eine Sonderfallbehandlung nötig ist.

Der Store wird mit Vitest getestet: `next()`/`prev()` über die gesamte Steps-Liste inkl. Randfälle (erster/letzter Schritt bleibt stabil).

## Tastatursteuerung

Composable `src/composables/useQuizKeyboard.ts`: registriert einen `keydown`-Listener auf `window`.

- `" "` (Leertaste) → `store.next()`, `event.preventDefault()` (verhindert Scrollen)
- `"Backspace"` → `store.prev()`, `event.preventDefault()` (verhindert Browser-Zurück-Navigation)

Der Listener wird in `onUnmounted` wieder entfernt.

## Routing & Komponenten

**Routing** (`src/router/index.ts`): eine Route `"/"` → `QuizView.vue`. Der `?quiz=`-Parameter bleibt ein reiner Query-Parameter (kein Router-Param), da er nur beim initialen Laden gelesen wird.

**`QuizView.vue`** (Container-Komponente unter der Route):

- Liest `?quiz=` aus `useRoute()`.
- Ruft beim Mounten `loadQuiz()` (fetch aus `public/`) → `validateQuiz()` → bei Erfolg `store.load(quiz)`, bei Fehler `store.setError(message)`.
- Bindet `useQuizKeyboard()` ein.
- Rendert abhängig von `store.currentStep?.type` (bzw. `store.loadError`) genau eine der folgenden Slide-Komponenten.

**Slide-Komponenten** (`src/components/slides/`, reine Präsentationskomponenten – Daten kommen ausschließlich per Props, kein Store-/API-Zugriff):

- `ErrorSlide.vue` – zeigt `loadError`
- `CategorySlide.vue` – zeigt `category.name`
- `QuestionSlide.vue` – zeigt Fragetext + 4 Antworten; Prop `resolved: boolean` steuert, ob korrekte Antworten grün und falsche grau markiert werden
- `PauseSlide.vue` – zeigt „Pause"
- `EndSlide.vue` – zeigt „Ende" (Platzhalter, wird später ausgestaltet)

## Styling

Ein einziges globales, minimales CSS (bestehendes `src/assets/base.css` aus dem Scaffold, entschlackt) – keine Component-Scoped-Styles außer den zwei Klassen `.correct` (grün) und `.incorrect` (grau) in `QuestionSlide.vue`. Kein UI-Framework, keine Layout-Bibliothek, keine Transitions/Animationen.

## Testing

Vitest + `@vue/test-utils` werden als devDependencies ergänzt (aktuell nicht im Projekt vorhanden), Konfiguration analog zum Standard-`create-vue`-Vitest-Preset (`vitest.config.ts`, Umgebung `jsdom`).

Testfokus liegt auf der Logik, nicht auf Rendering/Snapshots:

- `validateQuiz.spec.ts`: ein Test pro Regelverstoß + Happy-Path inkl. Sonderfrage
- `buildSteps.spec.ts`: erzeugte Reihenfolge für ein kleines Beispiel-Quiz
- `quizFlow.spec.ts`: `next()`/`prev()` inkl. Randfälle

## Beispieldaten

`public/beispiel.json`: 2 Kategorien à 5 Fragen, davon eine Sonderfrage mit 2 korrekten Antworten, damit die Anwendung direkt über `?quiz=beispiel.json` testbar ist.

## Dateistruktur

```
src/
  quiz/
    types.ts
    loadQuiz.ts
    validateQuiz.ts
    validateQuiz.spec.ts
    buildSteps.ts
    buildSteps.spec.ts
  stores/
    quizFlow.ts
    quizFlow.spec.ts
  composables/
    useQuizKeyboard.ts
  views/
    QuizView.vue
  components/
    slides/
      ErrorSlide.vue
      CategorySlide.vue
      QuestionSlide.vue
      PauseSlide.vue
      EndSlide.vue
  router/
    index.ts
public/
  beispiel.json
```

## Zukünftige Erweiterung (nicht Teil dieser Umsetzung)

Ein Kategorie-/Punkte-Board (z. B. „Autos" mit Punktwerten 100–500), aus dem der Moderator direkt in eine bestimmte Frage springen kann, ist als Folge-Feature vorgesehen. Die Schritt-Listen-Architektur unterstützt das später ohne Umbau: „Springe zu Schritt X" ist nur `currentIndex = targetIndex`, da jeder `Step` bereits seine Kategorie-/Frage-Zuordnung trägt.
