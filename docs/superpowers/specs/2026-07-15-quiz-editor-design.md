# Quiz-JSON-Editor – Design

## Zweck

Ein einfaches Werkzeug, um die JSON-Dateien für Quizze (Format siehe `src/quiz/types.ts` / `docs/superpowers/specs/2026-07-07-pub-quiz-app-design.md`) komfortabel zu erstellen und zu bearbeiten, statt das JSON von Hand zu schreiben. Kein Speichern auf Server nötig – das fertige JSON wird aus dem Editor herauskopiert und manuell z. B. nach `public/` gelegt.

## Nicht-Ziele

- Keine Integration in die Vue-App (kein Bezug zu Build, Routing, Store).
- Kein serverseitiges Speichern/Laden – Import per lokaler Dateiauswahl, Export per Kopieren aus der Anzeige.
- Keine Unterstützung für ungültige Zwischenzustände „reparieren" beim Import (siehe unten).

## Architektur

Eine einzelne, eigenständige Datei `tools/quiz-editor.html` mit eingebettetem `<style>` und `<script>` (Vanilla JS, kein Framework, kein Build-Schritt). Ein JS-Objekt im Speicher hält den aktuellen Quiz-Zustand:

```js
{
  title: string,
  categories: [
    {
      name: string,
      questions: [
        {
          text: string,
          answers: [ { text: string, correct: boolean }, ... 4 Stück ]
        },
        ... 5 Stück
      ]
    },
    ...
  ]
}
```

Jede Nutzereingabe aktualisiert dieses Objekt und triggert ein Neu-Rendern von Formular (links) und JSON-Anzeige (rechts). Unidirektionaler Datenfluss: Formular → Zustand → Rendern (Zustand → Formular und Zustand → JSON-Anzeige). Keine Zwei-Wege-Bindung zur JSON-Anzeige (siehe unten).

## Struktur-Erzwingung (statt Warnungen)

Statt frei editierbarer Listen mit Validierungs-Warnungen wird die Struktur so fixiert, dass jeder erreichbare Zustand automatisch den bestehenden Regeln aus `validateQuiz.ts` entspricht:

- Eine neue Kategorie wird sofort mit genau 5 leeren Fragen-Slots erzeugt.
- Jede Frage wird sofort mit genau 4 leeren Antwort-Slots erzeugt.
- Es gibt keine „Frage hinzufügen/entfernen"- oder „Antwort hinzufügen/entfernen"-Buttons. Die Anzahl ist strukturell fix; es werden nur die Textfelder befüllt.
- Auf Kategorie-Ebene gibt es „Kategorie hinzufügen" (hängt eine neue Kategorie mit 5×4-Grundgerüst an) und „Kategorie entfernen" (pro Kategorie ein Button). Die Anzahl der Kategorien ist im Schema nicht begrenzt.
- Jede Antwort hat eine Checkbox „richtig". Damit nie 0 korrekte Antworten pro Frage entstehen können: Das Abwählen der letzten noch angehakten Checkbox einer Frage ist blockiert (Checkbox ist disabled, solange sie die einzige angehakte in dieser Frage ist).

Damit kann über die UI kein JSON entstehen, das gegen die 5-Fragen/4-Antworten/1-4-korrekt-Regeln verstößt.

## Layout

Zwei Spalten (CSS Grid, ca. 50/50, jede Spalte scrollbar):

- **Links:** Titel-Textfeld oben, darunter Datei-Import (siehe unten), darunter die Liste der Kategorien. Jede Kategorie: Namensfeld, „Kategorie entfernen"-Button, darunter die 5 Fragen. Jede Frage: Textfeld, darunter die 4 Antwort-Zeilen (Textfeld + „richtig"-Checkbox). Am Ende der Kategorienliste: „Kategorie hinzufügen"-Button.
- **Rechts:** `<pre>` mit `JSON.stringify(quiz, null, 2)`, live aktualisiert bei jeder Eingabe. Darüber ein „In Zwischenablage kopieren"-Button (`navigator.clipboard.writeText`, mit kurzer visueller Bestätigung z. B. Button-Text wechselt kurz zu „Kopiert!").

Die JSON-Anzeige ist reines Read-only-Display, keine Texteingabe/Rück-Synchronisation.

## Import bestehender JSON-Dateien

Über den Kategorien: `<input type="file" accept=".json">`. Ablauf beim Auswählen einer Datei:

1. Datei per `FileReader` lesen, `JSON.parse`.
2. Struktur gegen das Schema prüfen (jede Kategorie exakt 5 Fragen, jede Frage exakt 4 Antworten, jede Frage 1–4 korrekte Antworten, alle Pflichtfelder vorhanden und korrekt typisiert – analog zu den Regeln in `src/quiz/validateQuiz.ts`).
3. Bei Erfolg: Zustand wird ersetzt, Formular und JSON-Anzeige neu gerendert.
4. Bei Fehler (ungültiges JSON oder Schema-Verstoß): Fehlermeldung wird angezeigt (z. B. „Kategorie 2, Frage 3: nur 3 Antworten vorhanden"), der bisherige Zustand bleibt unverändert.

Es findet keine automatische Reparatur abweichender Strukturen statt (z. B. Auffüllen auf 5 Fragen) – nur Fehlermeldung.

## Dateistruktur

Nur eine neue Datei: `tools/quiz-editor.html`. Keine Änderungen an `src/`, `public/`, Build-Konfiguration. Das Werkzeug teilt sich informell das Schema mit `src/quiz/types.ts`, hat aber keine Code-Abhängigkeit dorthin (eigenständige Datei, kein Import).

## Testing

Kein automatisiertes Test-Setup (kein Build-Tooling für diese Datei vorgesehen). Manuelle Verifikation nach Implementierung:

- Neues Quiz von Grund auf erstellen (Titel, 1 Kategorie, alle 5 Fragen/4 Antworten befüllen, mind. 1 korrekt je Frage) → JSON rechts prüfen, kopieren, gegen `validateQuiz`-Regeln manuell abgleichen.
- `public/beispiel.json` importieren → Formular zeigt vorhandene Daten korrekt an → Änderung vornehmen → JSON-Anzeige aktualisiert sich.
- Import einer absichtlich invaliden JSON-Datei (z. B. Kategorie mit nur 3 Fragen) → Fehlermeldung erscheint, Zustand bleibt unverändert.
- Letzte angehakte „richtig"-Checkbox einer Frage lässt sich nicht abwählen.
- Kategorie hinzufügen/entfernen funktioniert, Frage-/Antwortanzahl bleibt dabei immer korrekt.
