# Pub-Quiz-Anwendung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine Vue-3-Präsentationsanwendung bauen, die ein Pub-Quiz als Slide-Abfolge (Kategorie → Frage → Auflösung → Pause → Ende) auf einem Monitor zeigt, gesteuert vom Moderator per Leertaste/Backspace.

**Architecture:** Quizdaten werden per `fetch` aus `public/` geladen und gegen ein festes Schema validiert. Der Ablauf wird einmalig als flache Liste aller Slides (`Step[]`) vorberechnet; ein Pinia-Store hält `currentIndex` in dieser Liste und stellt `next()`/`prev()` als geklammerte Index-Arithmetik bereit, wodurch Vor- und Zurücknavigation automatisch symmetrisch sind. `QuizView.vue` verdrahtet Laden, Store und Tastatursteuerung und rendert die zum aktuellen Schritt passende, rein präsentationale Slide-Komponente.

**Tech Stack:** Vue 3 (Composition API, `<script setup lang="ts">`), TypeScript, Pinia, Vue Router, Vitest + @vue/test-utils, pnpm.

**Spec:** `docs/superpowers/specs/2026-07-07-pub-quiz-app-design.md`

## Global Constraints

- Quizdatei-Name kommt per URL-Query-Parameter `?quiz=<dateiname>.json`, Datei liegt in `public/`, wird per `fetch` geladen.
- Fehlt der Parameter oder schlägt Laden/Validierung fehl: klare Fehlermeldung, Anwendung startet nicht (keine Slides).
- Jede Kategorie hat exakt 5 Fragen; jede Frage hat exakt 4 Antworten; jede Frage hat 1–4 korrekte Antworten.
- Validierung bricht beim ersten Verstoß ab und benennt die Stelle so genau wie möglich (z. B. „Kategorie 2, Frage 3: ...").
- Steuerung: Leertaste = ein Schritt vorwärts, Backspace = ein Schritt rückwärts. Browser-Standardverhalten (Scrollen, Zurück-Navigation) wird per `preventDefault()` unterbunden.
- Kein UI-Framework, keine Animationen, keine Layout-Bibliotheken. Nur rudimentäres CSS für Lesbarkeit; grüne/graue Markierung bei der Auflösung ist die einzige funktionale Farb-Logik.
- Vue 3 Composition API, ausschließlich `<script setup lang="ts">`.
- Bestehende Codebase-Konventionen einhalten (siehe `src/stores/counter.ts`, `src/App.vue`): 2 Leerzeichen Einzug, einfache Anführungszeichen, keine Semikolons.
- `tsconfig.app.json` setzt `"noUncheckedIndexedAccess": true` — rohe Array-Indexzugriffe (`arr[i]`) liefern `T | undefined`. Bevorzugt `for...of`/`forEach`/`.entries()` statt Index-Schleifen verwenden; wo Indexzugriff nötig ist, explizit mit `?? null` / Optional Chaining behandeln.
- Nur `pnpm` verwenden (`pnpm add`, `pnpm install`) — `npm install` ist im Projekt per `only-allow` gesperrt.

---

### Task 1: Vitest-Setup, Quiz-Typen & Validierung

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (devDependencies + `test:unit`-Script)
- Create: `src/quiz/types.ts`
- Create: `src/quiz/validateQuiz.ts`
- Test: `src/quiz/validateQuiz.spec.ts`

**Interfaces:**
- Produces: `Quiz`, `Answer`, `Question`, `Category`, `QuizResult` (aus `src/quiz/types.ts`); `validateQuiz(data: unknown): QuizResult` (aus `src/quiz/validateQuiz.ts`)

- [ ] **Step 1: Vitest-Abhängigkeiten installieren**

Run: `pnpm add -D vitest @vue/test-utils jsdom`
Expected: `vitest`, `@vue/test-utils`, `jsdom` erscheinen unter `devDependencies` in `package.json`.

- [ ] **Step 2: `vitest.config.ts` anlegen**

```ts
import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
```

- [ ] **Step 3: `test:unit`-Script in `package.json` ergänzen**

In den `scripts`-Block von `package.json`, direkt nach `"preview": "vite preview",` einfügen:

```json
    "test:unit": "vitest",
```

- [ ] **Step 4: Fehlschlagenden Test schreiben**

Create `src/quiz/validateQuiz.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { validateQuiz } from './validateQuiz'

function validAnswer(correct: boolean) {
  return { text: 'Antwort', correct }
}

function validQuestion() {
  return {
    text: 'Frage?',
    answers: [validAnswer(true), validAnswer(false), validAnswer(false), validAnswer(false)],
  }
}

function validCategory() {
  return {
    name: 'Kategorie',
    questions: Array.from({ length: 5 }, () => validQuestion()),
  }
}

function validQuiz(categoryCount = 1) {
  return {
    title: 'Testquiz',
    categories: Array.from({ length: categoryCount }, () => validCategory()),
  }
}

describe('validateQuiz', () => {
  it('accepts a valid quiz', () => {
    const result = validateQuiz(validQuiz(2))
    expect(result.ok).toBe(true)
  })

  it('accepts a special question with multiple correct answers', () => {
    const quiz = validQuiz(1)
    quiz.categories[0].questions[0] = {
      text: 'Sonderfrage?',
      answers: [validAnswer(true), validAnswer(true), validAnswer(false), validAnswer(false)],
    }
    const result = validateQuiz(quiz)
    expect(result.ok).toBe(true)
  })

  it('rejects a category without exactly 5 questions', () => {
    const quiz = validQuiz(1)
    quiz.categories[0].questions.pop()
    const result = validateQuiz(quiz)
    expect(result).toEqual({
      ok: false,
      message: 'Kategorie 1 "Kategorie": erwartet 5 Fragen, gefunden 4',
    })
  })

  it('rejects a question without exactly 4 answers', () => {
    const quiz = validQuiz(1)
    quiz.categories[0].questions[2].answers.pop()
    const result = validateQuiz(quiz)
    expect(result).toEqual({
      ok: false,
      message: 'Kategorie 1, Frage 3: erwartet 4 Antworten, gefunden 3',
    })
  })

  it('rejects a question with zero correct answers', () => {
    const quiz = validQuiz(1)
    quiz.categories[0].questions[1].answers.forEach((answer) => {
      answer.correct = false
    })
    const result = validateQuiz(quiz)
    expect(result).toEqual({
      ok: false,
      message: 'Kategorie 1, Frage 2: mindestens 1 richtige Antwort erforderlich',
    })
  })

  it('rejects a quiz missing the title field', () => {
    const quiz: Record<string, unknown> = validQuiz(1)
    delete quiz.title
    const result = validateQuiz(quiz)
    expect(result).toEqual({ ok: false, message: 'Feld "title" fehlt oder ist kein String' })
  })

  it('rejects a quiz that is not an object', () => {
    const result = validateQuiz('not an object')
    expect(result).toEqual({ ok: false, message: 'Quiz muss ein Objekt sein' })
  })
})
```

- [ ] **Step 5: Test ausführen, Fehlschlag bestätigen**

Run: `pnpm exec vitest run src/quiz/validateQuiz.spec.ts`
Expected: FAIL — Modul `./validateQuiz` kann nicht aufgelöst werden (Datei existiert noch nicht).

- [ ] **Step 6: `src/quiz/types.ts` anlegen**

```ts
export interface Answer {
  text: string
  correct: boolean
}

export interface Question {
  text: string
  answers: Answer[]
}

export interface Category {
  name: string
  questions: Question[]
}

export interface Quiz {
  title: string
  categories: Category[]
}

export type QuizResult = { ok: true; quiz: Quiz } | { ok: false; message: string }
```

- [ ] **Step 7: `src/quiz/validateQuiz.ts` implementieren**

```ts
import type { Quiz, QuizResult } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateQuiz(data: unknown): QuizResult {
  if (!isRecord(data)) {
    return { ok: false, message: 'Quiz muss ein Objekt sein' }
  }

  if (typeof data.title !== 'string') {
    return { ok: false, message: 'Feld "title" fehlt oder ist kein String' }
  }

  if (!Array.isArray(data.categories)) {
    return { ok: false, message: 'Feld "categories" fehlt oder ist kein Array' }
  }

  for (const [categoryIndex, category] of data.categories.entries()) {
    const categoryError = validateCategory(category, categoryIndex)
    if (categoryError) return categoryError
  }

  return { ok: true, quiz: data as unknown as Quiz }
}

function validateCategory(category: unknown, categoryIndex: number): QuizResult | null {
  const label = `Kategorie ${categoryIndex + 1}`

  if (!isRecord(category)) {
    return { ok: false, message: `${label}: muss ein Objekt sein` }
  }

  if (typeof category.name !== 'string') {
    return { ok: false, message: `${label}: Feld "name" fehlt oder ist kein String` }
  }

  if (!Array.isArray(category.questions)) {
    return {
      ok: false,
      message: `${label} "${category.name}": Feld "questions" fehlt oder ist kein Array`,
    }
  }

  if (category.questions.length !== 5) {
    return {
      ok: false,
      message: `${label} "${category.name}": erwartet 5 Fragen, gefunden ${category.questions.length}`,
    }
  }

  for (const [questionIndex, question] of category.questions.entries()) {
    const questionError = validateQuestion(question, categoryIndex, questionIndex)
    if (questionError) return questionError
  }

  return null
}

function validateQuestion(
  question: unknown,
  categoryIndex: number,
  questionIndex: number,
): QuizResult | null {
  const label = `Kategorie ${categoryIndex + 1}, Frage ${questionIndex + 1}`

  if (!isRecord(question)) {
    return { ok: false, message: `${label}: muss ein Objekt sein` }
  }

  if (typeof question.text !== 'string') {
    return { ok: false, message: `${label}: Feld "text" fehlt oder ist kein String` }
  }

  if (!Array.isArray(question.answers)) {
    return { ok: false, message: `${label}: Feld "answers" fehlt oder ist kein Array` }
  }

  if (question.answers.length !== 4) {
    return {
      ok: false,
      message: `${label}: erwartet 4 Antworten, gefunden ${question.answers.length}`,
    }
  }

  let correctCount = 0
  for (const [answerIndex, answer] of question.answers.entries()) {
    if (!isRecord(answer)) {
      return { ok: false, message: `${label}, Antwort ${answerIndex + 1}: muss ein Objekt sein` }
    }
    if (typeof answer.text !== 'string') {
      return {
        ok: false,
        message: `${label}, Antwort ${answerIndex + 1}: Feld "text" fehlt oder ist kein String`,
      }
    }
    if (typeof answer.correct !== 'boolean') {
      return {
        ok: false,
        message: `${label}, Antwort ${answerIndex + 1}: Feld "correct" fehlt oder ist kein Boolean`,
      }
    }
    if (answer.correct) correctCount++
  }

  if (correctCount < 1) {
    return { ok: false, message: `${label}: mindestens 1 richtige Antwort erforderlich` }
  }

  return null
}
```

- [ ] **Step 8: Test ausführen, Erfolg bestätigen**

Run: `pnpm exec vitest run src/quiz/validateQuiz.spec.ts`
Expected: PASS (7 Tests)

- [ ] **Step 9: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml src/quiz/types.ts src/quiz/validateQuiz.ts src/quiz/validateQuiz.spec.ts
git commit -m "feat: add quiz types and JSON validation"
```

---

### Task 2: Schritt-Liste (`buildSteps`)

**Files:**
- Create: `src/quiz/buildSteps.ts`
- Test: `src/quiz/buildSteps.spec.ts`

**Interfaces:**
- Consumes: `Quiz` (aus `src/quiz/types.ts`, Task 1)
- Produces: `Step` (Union-Typ), `buildSteps(quiz: Quiz): Step[]` (aus `src/quiz/buildSteps.ts`)

- [ ] **Step 1: Fehlschlagenden Test schreiben**

Create `src/quiz/buildSteps.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildSteps } from './buildSteps'
import type { Quiz } from './types'

function question(text: string) {
  return {
    text,
    answers: [
      { text: 'A', correct: true },
      { text: 'B', correct: false },
      { text: 'C', correct: false },
      { text: 'D', correct: false },
    ],
  }
}

function category(name: string, questionCount: number) {
  return {
    name,
    questions: Array.from({ length: questionCount }, (_, i) => question(`${name} Frage ${i + 1}`)),
  }
}

const quiz: Quiz = {
  title: 'Testquiz',
  categories: [category('Kategorie A', 2), category('Kategorie B', 2)],
}

describe('buildSteps', () => {
  it('produces category/question pairs and a pause between categories, ending with end', () => {
    const steps = buildSteps(quiz)

    expect(steps).toEqual([
      { type: 'category', categoryIndex: 0 },
      { type: 'question', categoryIndex: 0, questionIndex: 0, resolved: false },
      { type: 'question', categoryIndex: 0, questionIndex: 0, resolved: true },
      { type: 'question', categoryIndex: 0, questionIndex: 1, resolved: false },
      { type: 'question', categoryIndex: 0, questionIndex: 1, resolved: true },
      { type: 'pause' },
      { type: 'category', categoryIndex: 1 },
      { type: 'question', categoryIndex: 1, questionIndex: 0, resolved: false },
      { type: 'question', categoryIndex: 1, questionIndex: 0, resolved: true },
      { type: 'question', categoryIndex: 1, questionIndex: 1, resolved: false },
      { type: 'question', categoryIndex: 1, questionIndex: 1, resolved: true },
      { type: 'end' },
    ])
  })
})
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `pnpm exec vitest run src/quiz/buildSteps.spec.ts`
Expected: FAIL — Modul `./buildSteps` kann nicht aufgelöst werden.

- [ ] **Step 3: `src/quiz/buildSteps.ts` implementieren**

```ts
import type { Quiz } from './types'

export type Step =
  | { type: 'category'; categoryIndex: number }
  | { type: 'question'; categoryIndex: number; questionIndex: number; resolved: boolean }
  | { type: 'pause' }
  | { type: 'end' }

export function buildSteps(quiz: Quiz): Step[] {
  const steps: Step[] = []

  quiz.categories.forEach((category, categoryIndex) => {
    steps.push({ type: 'category', categoryIndex })

    category.questions.forEach((_, questionIndex) => {
      steps.push({ type: 'question', categoryIndex, questionIndex, resolved: false })
      steps.push({ type: 'question', categoryIndex, questionIndex, resolved: true })
    })

    const isLastCategory = categoryIndex === quiz.categories.length - 1
    steps.push(isLastCategory ? { type: 'end' } : { type: 'pause' })
  })

  return steps
}
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `pnpm exec vitest run src/quiz/buildSteps.spec.ts`
Expected: PASS (1 Test)

- [ ] **Step 5: Commit**

```bash
git add src/quiz/buildSteps.ts src/quiz/buildSteps.spec.ts
git commit -m "feat: build flat step list for the quiz flow"
```

---

### Task 3: Quiz laden (`loadQuiz`)

**Files:**
- Create: `src/quiz/loadQuiz.ts`
- Test: `src/quiz/loadQuiz.spec.ts`

**Interfaces:**
- Consumes: `validateQuiz` (Task 1), `QuizResult` (Task 1)
- Produces: `loadQuiz(fileName: string | null): Promise<QuizResult>` (aus `src/quiz/loadQuiz.ts`)

- [ ] **Step 1: Fehlschlagenden Test schreiben**

Create `src/quiz/loadQuiz.spec.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadQuiz } from './loadQuiz'

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadQuiz', () => {
  it('returns an error when no file name is given', async () => {
    const result = await loadQuiz(null)
    expect(result).toEqual({
      ok: false,
      message: 'Kein Quiz angegeben. Bitte "?quiz=<dateiname>.json" an die URL anhängen.',
    })
  })

  it('returns an error when the fetch response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)))
    const result = await loadQuiz('missing.json')
    expect(result).toEqual({
      ok: false,
      message: 'Quiz-Datei "missing.json" konnte nicht geladen werden',
    })
  })

  it('returns an error when the response is not valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('bad json')),
      }),
    )
    const result = await loadQuiz('broken.json')
    expect(result).toEqual({
      ok: false,
      message: 'Quiz-Datei "broken.json" enthält kein gültiges JSON',
    })
  })

  it('returns the validation error when the JSON does not match the schema', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ title: 'X' })))
    const result = await loadQuiz('invalid.json')
    expect(result).toEqual({ ok: false, message: 'Feld "categories" fehlt oder ist kein Array' })
  })

  it('returns the parsed quiz on success', async () => {
    const quiz = { title: 'Testquiz', categories: [] }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(quiz))
    vi.stubGlobal('fetch', fetchMock)
    const result = await loadQuiz('valid.json')
    expect(result).toEqual({ ok: true, quiz })
    expect(fetchMock).toHaveBeenCalledWith('/valid.json')
  })
})
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `pnpm exec vitest run src/quiz/loadQuiz.spec.ts`
Expected: FAIL — Modul `./loadQuiz` kann nicht aufgelöst werden.

- [ ] **Step 3: `src/quiz/loadQuiz.ts` implementieren**

```ts
import { validateQuiz } from './validateQuiz'
import type { QuizResult } from './types'

export async function loadQuiz(fileName: string | null): Promise<QuizResult> {
  if (!fileName) {
    return {
      ok: false,
      message: 'Kein Quiz angegeben. Bitte "?quiz=<dateiname>.json" an die URL anhängen.',
    }
  }

  let response: Response
  try {
    response = await fetch(`/${fileName}`)
  } catch {
    return { ok: false, message: `Quiz-Datei "${fileName}" konnte nicht geladen werden` }
  }

  if (!response.ok) {
    return { ok: false, message: `Quiz-Datei "${fileName}" konnte nicht geladen werden` }
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    return { ok: false, message: `Quiz-Datei "${fileName}" enthält kein gültiges JSON` }
  }

  return validateQuiz(data)
}
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `pnpm exec vitest run src/quiz/loadQuiz.spec.ts`
Expected: PASS (5 Tests)

- [ ] **Step 5: Commit**

```bash
git add src/quiz/loadQuiz.ts src/quiz/loadQuiz.spec.ts
git commit -m "feat: load and validate the quiz JSON file via fetch"
```

---

### Task 4: Pinia-Store `quizFlow`

**Files:**
- Create: `src/stores/quizFlow.ts`
- Test: `src/stores/quizFlow.spec.ts`

**Interfaces:**
- Consumes: `buildSteps`, `Step` (Task 2), `Quiz` (Task 1)
- Produces: `useQuizFlowStore()` mit State `quiz`, `steps`, `currentIndex`, `loadError`; Getter `currentStep: Step | null`, `currentCategory: Category | null`, `currentQuestion: Question | null`; Aktionen `load(quiz: Quiz)`, `next()`, `prev()`, `setError(message: string)`

- [ ] **Step 1: Fehlschlagenden Test schreiben**

Create `src/stores/quizFlow.spec.ts`:

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useQuizFlowStore } from './quizFlow'
import type { Quiz } from '@/quiz/types'

function question(text: string) {
  return {
    text,
    answers: [
      { text: 'A', correct: true },
      { text: 'B', correct: false },
      { text: 'C', correct: false },
      { text: 'D', correct: false },
    ],
  }
}

function category(name: string, questionCount: number) {
  return {
    name,
    questions: Array.from({ length: questionCount }, (_, i) => question(`${name} Frage ${i + 1}`)),
  }
}

const quiz: Quiz = {
  title: 'Testquiz',
  categories: [category('Kategorie A', 1), category('Kategorie B', 1)],
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useQuizFlowStore', () => {
  it('starts at the first step after loading a quiz', () => {
    const store = useQuizFlowStore()
    store.load(quiz)
    expect(store.currentStep).toEqual({ type: 'category', categoryIndex: 0 })
  })

  it('advances one step at a time with next()', () => {
    const store = useQuizFlowStore()
    store.load(quiz)
    store.next()
    expect(store.currentStep).toEqual({
      type: 'question',
      categoryIndex: 0,
      questionIndex: 0,
      resolved: false,
    })
  })

  it('goes back one step at a time with prev()', () => {
    const store = useQuizFlowStore()
    store.load(quiz)
    store.next()
    store.next()
    store.prev()
    expect(store.currentStep).toEqual({
      type: 'question',
      categoryIndex: 0,
      questionIndex: 0,
      resolved: false,
    })
  })

  it('stays on the first step when calling prev() at the start', () => {
    const store = useQuizFlowStore()
    store.load(quiz)
    store.prev()
    expect(store.currentStep).toEqual({ type: 'category', categoryIndex: 0 })
  })

  it('stays on the last step when calling next() at the end', () => {
    const store = useQuizFlowStore()
    store.load(quiz)
    for (let i = 0; i < 20; i++) store.next()
    expect(store.currentStep).toEqual({ type: 'end' })
  })

  it('stores a load error and clears it once a quiz loads successfully', () => {
    const store = useQuizFlowStore()
    store.setError('Kein Quiz angegeben.')
    expect(store.loadError).toBe('Kein Quiz angegeben.')
    store.load(quiz)
    expect(store.loadError).toBeNull()
  })
})
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `pnpm exec vitest run src/stores/quizFlow.spec.ts`
Expected: FAIL — Modul `./quizFlow` kann nicht aufgelöst werden.

- [ ] **Step 3: `src/stores/quizFlow.ts` implementieren**

```ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { buildSteps, type Step } from '@/quiz/buildSteps'
import type { Quiz } from '@/quiz/types'

export const useQuizFlowStore = defineStore('quizFlow', () => {
  const quiz = ref<Quiz | null>(null)
  const steps = ref<Step[]>([])
  const currentIndex = ref(0)
  const loadError = ref<string | null>(null)

  const currentStep = computed<Step | null>(() => steps.value[currentIndex.value] ?? null)

  const currentCategory = computed(() => {
    const step = currentStep.value
    if (!step || !quiz.value) return null
    if (step.type !== 'category' && step.type !== 'question') return null
    return quiz.value.categories[step.categoryIndex] ?? null
  })

  const currentQuestion = computed(() => {
    const step = currentStep.value
    if (!step || step.type !== 'question' || !quiz.value) return null
    return quiz.value.categories[step.categoryIndex]?.questions[step.questionIndex] ?? null
  })

  function load(loadedQuiz: Quiz) {
    quiz.value = loadedQuiz
    steps.value = buildSteps(loadedQuiz)
    currentIndex.value = 0
    loadError.value = null
  }

  function next() {
    currentIndex.value = Math.min(currentIndex.value + 1, steps.value.length - 1)
  }

  function prev() {
    currentIndex.value = Math.max(currentIndex.value - 1, 0)
  }

  function setError(message: string) {
    loadError.value = message
  }

  return {
    quiz,
    steps,
    currentIndex,
    loadError,
    currentStep,
    currentCategory,
    currentQuestion,
    load,
    next,
    prev,
    setError,
  }
})
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `pnpm exec vitest run src/stores/quizFlow.spec.ts`
Expected: PASS (6 Tests)

- [ ] **Step 5: Commit**

```bash
git add src/stores/quizFlow.ts src/stores/quizFlow.spec.ts
git commit -m "feat: add quizFlow store with index-based next/prev navigation"
```

---

### Task 5: Tastatursteuerung (`useQuizKeyboard`)

**Files:**
- Create: `src/composables/useQuizKeyboard.ts`
- Test: `src/composables/useQuizKeyboard.spec.ts`

**Interfaces:**
- Produces: `useQuizKeyboard(onNext: () => void, onPrev: () => void): void` (aus `src/composables/useQuizKeyboard.ts`)

- [ ] **Step 1: Fehlschlagenden Test schreiben**

Create `src/composables/useQuizKeyboard.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useQuizKeyboard } from './useQuizKeyboard'

function mountWithKeyboard(onNext: () => void, onPrev: () => void) {
  const TestComponent = defineComponent({
    setup() {
      useQuizKeyboard(onNext, onPrev)
      return () => h('div')
    },
  })
  return mount(TestComponent)
}

function pressKey(key: string) {
  const event = new KeyboardEvent('keydown', { key, cancelable: true })
  window.dispatchEvent(event)
  return event
}

describe('useQuizKeyboard', () => {
  it('calls onNext when Space is pressed and prevents the default scroll', () => {
    const onNext = vi.fn()
    const onPrev = vi.fn()
    mountWithKeyboard(onNext, onPrev)

    const event = pressKey(' ')

    expect(onNext).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
  })

  it('calls onPrev when Backspace is pressed and prevents the default navigation', () => {
    const onNext = vi.fn()
    const onPrev = vi.fn()
    mountWithKeyboard(onNext, onPrev)

    const event = pressKey('Backspace')

    expect(onPrev).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
  })

  it('ignores other keys', () => {
    const onNext = vi.fn()
    const onPrev = vi.fn()
    mountWithKeyboard(onNext, onPrev)

    pressKey('Enter')

    expect(onNext).not.toHaveBeenCalled()
    expect(onPrev).not.toHaveBeenCalled()
  })

  it('stops listening after the component unmounts', () => {
    const onNext = vi.fn()
    const onPrev = vi.fn()
    const wrapper = mountWithKeyboard(onNext, onPrev)

    wrapper.unmount()
    pressKey(' ')

    expect(onNext).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `pnpm exec vitest run src/composables/useQuizKeyboard.spec.ts`
Expected: FAIL — Modul `./useQuizKeyboard` kann nicht aufgelöst werden.

- [ ] **Step 3: `src/composables/useQuizKeyboard.ts` implementieren**

```ts
import { onMounted, onUnmounted } from 'vue'

export function useQuizKeyboard(onNext: () => void, onPrev: () => void) {
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.preventDefault()
      onNext()
    } else if (event.key === 'Backspace') {
      event.preventDefault()
      onPrev()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `pnpm exec vitest run src/composables/useQuizKeyboard.spec.ts`
Expected: PASS (4 Tests)

- [ ] **Step 5: Commit**

```bash
git add src/composables/useQuizKeyboard.ts src/composables/useQuizKeyboard.spec.ts
git commit -m "feat: add keyboard composable for space/backspace navigation"
```

---

### Task 6: Slide-Komponenten

**Files:**
- Create: `src/components/slides/QuestionSlide.vue`
- Test: `src/components/slides/QuestionSlide.spec.ts`
- Create: `src/components/slides/ErrorSlide.vue`
- Create: `src/components/slides/CategorySlide.vue`
- Create: `src/components/slides/PauseSlide.vue`
- Create: `src/components/slides/EndSlide.vue`

**Interfaces:**
- Consumes: `Answer` (aus `src/quiz/types.ts`, Task 1)
- Produces: `ErrorSlide` (Prop `message: string`), `CategorySlide` (Prop `name: string`), `QuestionSlide` (Props `text: string`, `answers: Answer[]`, `resolved: boolean`), `PauseSlide` (keine Props), `EndSlide` (keine Props)

- [ ] **Step 1: Fehlschlagenden Test für `QuestionSlide` schreiben**

Create `src/components/slides/QuestionSlide.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestionSlide from './QuestionSlide.vue'

const answers = [
  { text: 'Antwort A', correct: false },
  { text: 'Antwort B', correct: true },
  { text: 'Antwort C', correct: false },
  { text: 'Antwort D', correct: false },
]

describe('QuestionSlide', () => {
  it('shows the question text and all answers without revealing which is correct', () => {
    const wrapper = mount(QuestionSlide, {
      props: { text: 'Frage?', answers, resolved: false },
    })

    expect(wrapper.text()).toContain('Frage?')
    answers.forEach((answer) => expect(wrapper.text()).toContain(answer.text))
    expect(wrapper.find('.correct').exists()).toBe(false)
    expect(wrapper.find('.incorrect').exists()).toBe(false)
  })

  it('marks correct answers green and incorrect answers grey when resolved', () => {
    const wrapper = mount(QuestionSlide, {
      props: { text: 'Frage?', answers, resolved: true },
    })

    const items = wrapper.findAll('li')
    expect(items[0].classes()).toContain('incorrect')
    expect(items[1].classes()).toContain('correct')
    expect(items[2].classes()).toContain('incorrect')
    expect(items[3].classes()).toContain('incorrect')
  })
})
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `pnpm exec vitest run src/components/slides/QuestionSlide.spec.ts`
Expected: FAIL — Modul `./QuestionSlide.vue` kann nicht aufgelöst werden.

- [ ] **Step 3: `src/components/slides/QuestionSlide.vue` implementieren**

```vue
<script setup lang="ts">
import type { Answer } from '@/quiz/types'

defineProps<{
  text: string
  answers: Answer[]
  resolved: boolean
}>()
</script>

<template>
  <div>
    <p>{{ text }}</p>
    <ul>
      <li
        v-for="(answer, index) in answers"
        :key="index"
        :class="resolved ? (answer.correct ? 'correct' : 'incorrect') : ''"
      >
        {{ answer.text }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.correct {
  background-color: #b6f2b6;
}

.incorrect {
  color: #999;
}
</style>
```

- [ ] **Step 4: Test ausführen, Erfolg bestätigen**

Run: `pnpm exec vitest run src/components/slides/QuestionSlide.spec.ts`
Expected: PASS (2 Tests)

- [ ] **Step 5: Übrige, rein statische Slide-Komponenten anlegen (kein eigener Testfall nötig, da sie keine Logik enthalten — Sichtprüfung erfolgt in Task 8)**

Create `src/components/slides/ErrorSlide.vue`:

```vue
<script setup lang="ts">
defineProps<{
  message: string
}>()
</script>

<template>
  <div>
    <p>{{ message }}</p>
  </div>
</template>
```

Create `src/components/slides/CategorySlide.vue`:

```vue
<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <div>
    <h1>{{ name }}</h1>
  </div>
</template>
```

Create `src/components/slides/PauseSlide.vue`:

```vue
<template>
  <div>
    <p>Pause</p>
  </div>
</template>
```

Create `src/components/slides/EndSlide.vue`:

```vue
<template>
  <div>
    <p>Ende</p>
  </div>
</template>
```

- [ ] **Step 6: Typecheck ausführen**

Run: `pnpm type-check`
Expected: keine Fehler

- [ ] **Step 7: Commit**

```bash
git add src/components/slides/
git commit -m "feat: add presentational slide components"
```

---

### Task 7: Router, `QuizView` & Aufräumen des Scaffolds

**Files:**
- Create: `src/views/QuizView.vue`
- Test: `src/views/QuizView.spec.ts`
- Modify: `src/router/index.ts`
- Modify: `src/App.vue`
- Delete: `src/views/HomeView.vue`, `src/views/AboutView.vue`, `src/components/HelloWorld.vue`, `src/components/TheWelcome.vue`, `src/components/WelcomeItem.vue`, `src/components/icons/IconCommunity.vue`, `src/components/icons/IconDocumentation.vue`, `src/components/icons/IconEcosystem.vue`, `src/components/icons/IconSupport.vue`, `src/components/icons/IconTooling.vue`, `src/stores/counter.ts`, `src/assets/logo.svg`

**Interfaces:**
- Consumes: `loadQuiz` (Task 3), `useQuizFlowStore` (Task 4), `useQuizKeyboard` (Task 5), `ErrorSlide`/`CategorySlide`/`QuestionSlide`/`PauseSlide`/`EndSlide` (Task 6)

- [ ] **Step 1: Fehlschlagenden Test schreiben**

Create `src/views/QuizView.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import QuizView from './QuizView.vue'

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response
}

const quiz = {
  title: 'Testquiz',
  categories: [
    {
      name: 'Kategorie A',
      questions: Array.from({ length: 5 }, (_, i) => ({
        text: `Frage ${i + 1}`,
        answers: [
          { text: 'A', correct: true },
          { text: 'B', correct: false },
          { text: 'C', correct: false },
          { text: 'D', correct: false },
        ],
      })),
    },
  ],
}

async function mountAt(query: Record<string, string>) {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: QuizView }],
  })
  router.push({ path: '/', query })
  await router.isReady()
  const wrapper = mount(QuizView, { global: { plugins: [router] } })
  await new Promise((resolve) => setTimeout(resolve))
  await wrapper.vm.$nextTick()
  return wrapper
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('QuizView', () => {
  it('shows an error slide when the quiz query parameter is missing', async () => {
    const wrapper = await mountAt({})
    expect(wrapper.text()).toContain('Kein Quiz angegeben')
  })

  it('shows the first category slide once the quiz has loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(quiz)))
    const wrapper = await mountAt({ quiz: 'beispiel.json' })
    expect(wrapper.text()).toContain('Kategorie A')
  })
})
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `pnpm exec vitest run src/views/QuizView.spec.ts`
Expected: FAIL — Modul `./QuizView.vue` kann nicht aufgelöst werden.

- [ ] **Step 3: `src/views/QuizView.vue` implementieren**

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { loadQuiz } from '@/quiz/loadQuiz'
import { useQuizFlowStore } from '@/stores/quizFlow'
import { useQuizKeyboard } from '@/composables/useQuizKeyboard'
import ErrorSlide from '@/components/slides/ErrorSlide.vue'
import CategorySlide from '@/components/slides/CategorySlide.vue'
import QuestionSlide from '@/components/slides/QuestionSlide.vue'
import PauseSlide from '@/components/slides/PauseSlide.vue'
import EndSlide from '@/components/slides/EndSlide.vue'

const route = useRoute()
const store = useQuizFlowStore()

useQuizKeyboard(
  () => store.next(),
  () => store.prev(),
)

const stepType = computed(() => store.currentStep?.type ?? null)
const isResolved = computed(() => {
  const step = store.currentStep
  return step?.type === 'question' ? step.resolved : false
})

onMounted(async () => {
  const fileName = typeof route.query.quiz === 'string' ? route.query.quiz : null
  const result = await loadQuiz(fileName)
  if (result.ok) {
    store.load(result.quiz)
  } else {
    store.setError(result.message)
  }
})
</script>

<template>
  <ErrorSlide v-if="store.loadError" :message="store.loadError" />
  <CategorySlide v-else-if="stepType === 'category'" :name="store.currentCategory?.name ?? ''" />
  <QuestionSlide
    v-else-if="stepType === 'question'"
    :text="store.currentQuestion?.text ?? ''"
    :answers="store.currentQuestion?.answers ?? []"
    :resolved="isResolved"
  />
  <PauseSlide v-else-if="stepType === 'pause'" />
  <EndSlide v-else-if="stepType === 'end'" />
</template>
```

- [ ] **Step 4: `src/router/index.ts` auf eine einzige Route reduzieren**

```ts
import { createRouter, createWebHistory } from 'vue-router'
import QuizView from '../views/QuizView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'quiz',
      component: QuizView,
    },
  ],
})

export default router
```

- [ ] **Step 5: `src/App.vue` auf reines Router-Outlet reduzieren**

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>
```

- [ ] **Step 6: Ungenutzte Scaffold-Dateien löschen**

Run:

```bash
rm src/views/HomeView.vue src/views/AboutView.vue
rm src/components/HelloWorld.vue src/components/TheWelcome.vue src/components/WelcomeItem.vue
rm -r src/components/icons
rm src/stores/counter.ts src/stores/counter.spec.ts
rm src/assets/logo.svg
```

(Falls `src/stores/counter.spec.ts` nicht existiert, den entsprechenden `rm`-Befehl weglassen.)

- [ ] **Step 7: Test ausführen, Erfolg bestätigen**

Run: `pnpm exec vitest run src/views/QuizView.spec.ts`
Expected: PASS (2 Tests)

- [ ] **Step 8: Typecheck ausführen**

Run: `pnpm type-check`
Expected: keine Fehler (insbesondere keine Referenzen mehr auf gelöschte Dateien)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: wire up QuizView behind the single quiz route, remove scaffold boilerplate"
```

---

### Task 8: Beispiel-Quiz, minimales CSS & Gesamtverifikation

**Files:**
- Create: `public/beispiel.json`
- Modify: `src/assets/base.css`
- Modify: `src/assets/main.css`

**Interfaces:**
- Keine (Abschluss-Task: Beispieldaten, Styling-Reduktion, End-to-End-Check)

- [ ] **Step 1: Beispiel-Quiz anlegen**

Create `public/beispiel.json`:

```json
{
  "title": "Beispiel-Quiz",
  "categories": [
    {
      "name": "Geographie",
      "questions": [
        {
          "text": "Was ist die Hauptstadt von Australien?",
          "answers": [
            { "text": "Sydney", "correct": false },
            { "text": "Canberra", "correct": true },
            { "text": "Melbourne", "correct": false },
            { "text": "Perth", "correct": false }
          ]
        },
        {
          "text": "Welcher Fluss ist der längste der Welt?",
          "answers": [
            { "text": "Amazonas", "correct": true },
            { "text": "Nil", "correct": false },
            { "text": "Jangtse", "correct": false },
            { "text": "Mississippi", "correct": false }
          ]
        },
        {
          "text": "In welchem Land liegt der Mount Everest?",
          "answers": [
            { "text": "Indien", "correct": false },
            { "text": "Nepal", "correct": true },
            { "text": "China", "correct": false },
            { "text": "Bhutan", "correct": false }
          ]
        },
        {
          "text": "Welches ist der kleinste Kontinent?",
          "answers": [
            { "text": "Europa", "correct": false },
            { "text": "Australien", "correct": true },
            { "text": "Antarktis", "correct": false },
            { "text": "Südamerika", "correct": false }
          ]
        },
        {
          "text": "Welche Wüste ist die größte der Welt?",
          "answers": [
            { "text": "Sahara", "correct": false },
            { "text": "Antarktische Wüste", "correct": true },
            { "text": "Gobi", "correct": false },
            { "text": "Kalahari", "correct": false }
          ]
        }
      ]
    },
    {
      "name": "Filme & Serien",
      "questions": [
        {
          "text": "Wer spielt die Hauptrolle in \"Forrest Gump\"?",
          "answers": [
            { "text": "Tom Hanks", "correct": true },
            { "text": "Tom Cruise", "correct": false },
            { "text": "Brad Pitt", "correct": false },
            { "text": "Kevin Costner", "correct": false }
          ]
        },
        {
          "text": "In welcher Stadt spielt die Serie \"Friends\"?",
          "answers": [
            { "text": "Boston", "correct": false },
            { "text": "New York", "correct": true },
            { "text": "Chicago", "correct": false },
            { "text": "Los Angeles", "correct": false }
          ]
        },
        {
          "text": "Welche dieser Filme wurden von Christopher Nolan inszeniert? (mehrere richtig)",
          "answers": [
            { "text": "Inception", "correct": true },
            { "text": "Interstellar", "correct": true },
            { "text": "Gladiator", "correct": false },
            { "text": "Titanic", "correct": false }
          ]
        },
        {
          "text": "Wie heißt der Zauberschüler in \"Harry Potter\"?",
          "answers": [
            { "text": "Ron Weasley", "correct": false },
            { "text": "Harry Potter", "correct": true },
            { "text": "Neville Longbottom", "correct": false },
            { "text": "Draco Malfoy", "correct": false }
          ]
        },
        {
          "text": "Welches Studio produzierte \"Toy Story\"?",
          "answers": [
            { "text": "DreamWorks", "correct": false },
            { "text": "Pixar", "correct": true },
            { "text": "Illumination", "correct": false },
            { "text": "Blue Sky Studios", "correct": false }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: `src/assets/base.css` auf rudimentäres CSS reduzieren**

Replace the full file content with:

```css
* {
  box-sizing: border-box;
  margin: 0;
}

body {
  min-height: 100vh;
  font-family: sans-serif;
  font-size: 2.5rem;
  line-height: 1.4;
}
```

- [ ] **Step 3: `src/assets/main.css` auf den reinen Import reduzieren**

Replace the full file content with:

```css
@import './base.css';
```

- [ ] **Step 4: Vollständige Testsuite, Typecheck, Lint und Build ausführen**

Run: `pnpm test:unit run`
Expected: alle Tests aus Task 1–7 PASS (insgesamt 21 Tests)

Run: `pnpm type-check`
Expected: keine Fehler

Run: `pnpm lint`
Expected: keine Fehler

Run: `pnpm build`
Expected: Build erfolgreich

- [ ] **Step 5: Manuelle Verifikation im Browser**

Run: `pnpm dev`

Im Browser `http://localhost:5173/?quiz=beispiel.json` öffnen und prüfen:
- Erste Kategorie-Slide zeigt „Geographie".
- Leertaste zeigt die erste Frage (Antworten sichtbar, noch keine Markierung).
- Erneute Leertaste löst die Frage auf (richtige Antwort grün, falsche grau).
- Leertaste durch alle 5 Fragen der Kategorie, danach „Pause"-Slide, danach zweite Kategorie „Filme & Serien".
- Bei der Sonderfrage (Christopher Nolan) sind nach der Auflösung zwei Antworten grün markiert.
- Nach der letzten Frage der zweiten Kategorie erscheint „Ende"; weitere Leertaste ändert nichts.
- Backspace navigiert exakt spiegelbildlich zurück bis zur ersten Kategorie-Slide; weiteres Backspace ändert nichts.
- Leertaste scrollt die Seite nicht, Backspace navigiert nicht im Browser zurück.
- `http://localhost:5173/` (ohne `?quiz=`) öffnen und prüfen, dass eine Fehlermeldung statt einer Slide erscheint.

- [ ] **Step 6: Commit**

```bash
git add public/beispiel.json src/assets/base.css src/assets/main.css
git commit -m "feat: add example quiz data and reduce styling to bare minimum"
```
