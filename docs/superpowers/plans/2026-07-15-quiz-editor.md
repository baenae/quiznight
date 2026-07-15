# Quiz-JSON-Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single, standalone `tools/quiz-editor.html` that lets someone fill in a pub-quiz JSON file (title, categories, questions, answers) through form fields on the left, see the live-generated JSON on the right, and copy it out.

**Architecture:** One HTML file with inline `<style>` and `<script>`, no framework, no build step. A global `quiz` object (`{ title, categories }`) is the single source of truth. Text-field edits mutate `quiz` directly and only re-render the JSON panel (so the input never loses focus). Structural edits (add/remove category, import) rebuild the whole form via `renderForm()`. Category/question/answer counts are structurally fixed (5 questions/category, 4 answers/question) so no invalid count can ever be produced through the UI.

**Tech Stack:** Vanilla HTML/CSS/JS (ES2017+, no transpilation), `navigator.clipboard` with an `execCommand` fallback for `file://` contexts, `FileReader` + `JSON.parse` for import.

## Global Constraints

- Single file: `tools/quiz-editor.html`. No other files are created or modified.
- No build tooling, no npm dependency, must work opened directly via `file://` in a browser.
- Schema is fixed exactly as documented in `docs/superpowers/specs/2026-07-07-pub-quiz-app-design.md`: every category has exactly 5 questions, every question has exactly 4 answers, every question has 1–4 correct answers (`answer.correct: boolean`).
- The JSON output panel is read-only display only — no two-way sync back into the form.
- Verification for every task uses the chrome-devtools MCP tools. Before first use in a task, load their schemas with `ToolSearch({query: "select:navigate_page,take_snapshot,click,fill,upload_file,list_console_messages,evaluate_script", max_results: 10})`. Navigate with `navigate_page` to `file:///Users/besa/Documents/development/privat/quiznight/tools/quiz-editor.html` (reload with the same call after each change).

---

### Task 1: Scaffold + title binding + JSON panel

**Files:**
- Create: `tools/quiz-editor.html`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: global `quiz` object, `renderJSON()`, `renderForm()`, `render()` — all three are called and extended by later tasks. `#title-input`, `#categories-container`, `#json-output` element IDs are relied on by later tasks.

- [ ] **Step 1: Create the file with the scaffold**

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Quiz-JSON-Editor</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: sans-serif;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    height: 100vh;
  }
  #form-panel, #json-panel {
    overflow-y: auto;
    padding: 1rem;
  }
  #form-panel { border-right: 1px solid #ccc; }
  #json-panel { background: #f7f7f7; }
  input[type="text"] { width: 100%; padding: 0.25rem; }
  #json-output { white-space: pre-wrap; word-break: break-word; }
</style>
</head>
<body>
  <div id="form-panel">
    <h1>Quiz-Editor</h1>
    <label>
      Titel<br>
      <input type="text" id="title-input">
    </label>
    <div id="categories-container"></div>
  </div>
  <div id="json-panel">
    <pre id="json-output"></pre>
  </div>

<script>
  let quiz = { title: '', categories: [] };

  function renderJSON() {
    document.getElementById('json-output').textContent = JSON.stringify(quiz, null, 2);
  }

  function renderForm() {
    document.getElementById('title-input').value = quiz.title;
  }

  document.getElementById('title-input').oninput = (e) => {
    quiz.title = e.target.value;
    renderJSON();
  };

  function render() {
    renderForm();
    renderJSON();
  }

  render();
</script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**

Load chrome-devtools tools, then run:
- `navigate_page` → `file:///Users/besa/Documents/development/privat/quiznight/tools/quiz-editor.html`
- `take_snapshot` → confirm `#json-output` text is exactly:
  ```
  {
    "title": "",
    "categories": []
  }
  ```
- `fill` on `#title-input` with `Test-Quiz`
- `take_snapshot` → confirm `#json-output` now shows `"title": "Test-Quiz"`
- `list_console_messages` → confirm no errors

- [ ] **Step 3: Commit**

```bash
git add tools/quiz-editor.html
git commit -m "feat: scaffold standalone quiz JSON editor with title binding"
```

---

### Task 2: Category/question/answer model + add/remove category

**Files:**
- Modify: `tools/quiz-editor.html`

**Interfaces:**
- Consumes: `quiz`, `renderJSON()`, `renderForm()`, `render()`, `#categories-container` from Task 1.
- Produces: `createAnswer()`, `createQuestion()`, `createCategory()`, `renderCategory(category, categoryIndex)`, `renderQuestion(question, questionIndex)` — `renderQuestion` is modified again in Task 3 (must keep the same name and signature).

- [ ] **Step 1: Replace the file with the extended version**

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Quiz-JSON-Editor</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: sans-serif;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    height: 100vh;
  }
  #form-panel, #json-panel {
    overflow-y: auto;
    padding: 1rem;
  }
  #form-panel { border-right: 1px solid #ccc; }
  #json-panel { background: #f7f7f7; }
  .category {
    border: 1px solid #999;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  .question {
    border: 1px solid #ccc;
    padding: 0.5rem;
    margin: 0.5rem 0;
  }
  .answer-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.25rem 0;
  }
  .answer-row input[type="text"] { flex: 1; }
  input[type="text"] { width: 100%; padding: 0.25rem; }
  #json-output { white-space: pre-wrap; word-break: break-word; }
</style>
</head>
<body>
  <div id="form-panel">
    <h1>Quiz-Editor</h1>
    <label>
      Titel<br>
      <input type="text" id="title-input">
    </label>
    <div id="categories-container"></div>
    <button id="add-category-btn">Kategorie hinzufügen</button>
  </div>
  <div id="json-panel">
    <pre id="json-output"></pre>
  </div>

<script>
  let quiz = { title: '', categories: [] };

  function createAnswer() {
    return { text: '', correct: false };
  }

  function createQuestion() {
    return {
      text: '',
      answers: [createAnswer(), createAnswer(), createAnswer(), createAnswer()],
    };
  }

  function createCategory() {
    const questions = [];
    for (let i = 0; i < 5; i++) questions.push(createQuestion());
    return { name: '', questions };
  }

  function renderJSON() {
    document.getElementById('json-output').textContent = JSON.stringify(quiz, null, 2);
  }

  function renderForm() {
    document.getElementById('title-input').value = quiz.title;
    const container = document.getElementById('categories-container');
    container.innerHTML = '';
    quiz.categories.forEach((category, categoryIndex) => {
      container.appendChild(renderCategory(category, categoryIndex));
    });
  }

  function renderCategory(category, categoryIndex) {
    const div = document.createElement('div');
    div.className = 'category';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Kategoriename';
    nameInput.value = category.name;
    nameInput.oninput = () => {
      category.name = nameInput.value;
      renderJSON();
    };
    div.appendChild(nameInput);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Kategorie entfernen';
    removeBtn.onclick = () => {
      quiz.categories.splice(categoryIndex, 1);
      renderForm();
      renderJSON();
    };
    div.appendChild(removeBtn);

    category.questions.forEach((question, questionIndex) => {
      div.appendChild(renderQuestion(question, questionIndex));
    });

    return div;
  }

  function renderQuestion(question, questionIndex) {
    const div = document.createElement('div');
    div.className = 'question';

    const label = document.createElement('div');
    label.textContent = `Frage ${questionIndex + 1}`;
    div.appendChild(label);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = 'Fragetext';
    textInput.value = question.text;
    textInput.oninput = () => {
      question.text = textInput.value;
      renderJSON();
    };
    div.appendChild(textInput);

    question.answers.forEach((answer, answerIndex) => {
      const row = document.createElement('div');
      row.className = 'answer-row';

      const answerInput = document.createElement('input');
      answerInput.type = 'text';
      answerInput.placeholder = `Antwort ${answerIndex + 1}`;
      answerInput.value = answer.text;
      answerInput.oninput = () => {
        answer.text = answerInput.value;
        renderJSON();
      };
      row.appendChild(answerInput);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = answer.correct;
      checkbox.onchange = () => {
        answer.correct = checkbox.checked;
        renderJSON();
      };
      row.appendChild(checkbox);

      const checkboxLabel = document.createElement('span');
      checkboxLabel.textContent = 'richtig';
      row.appendChild(checkboxLabel);

      div.appendChild(row);
    });

    return div;
  }

  document.getElementById('title-input').oninput = (e) => {
    quiz.title = e.target.value;
    renderJSON();
  };

  document.getElementById('add-category-btn').onclick = () => {
    quiz.categories.push(createCategory());
    renderForm();
    renderJSON();
  };

  function render() {
    renderForm();
    renderJSON();
  }

  render();
</script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**

- `navigate_page` → reload the file
- `click` on `#add-category-btn` twice → `take_snapshot` should show two `.category` blocks, each containing 5 `.question` blocks with 4 `.answer-row` each
- `fill` category 1's name input with `Geographie`, question 1's text input with `Hauptstadt von Australien?`, answer 1's text input with `Canberra`, check answer 1's checkbox
- `take_snapshot` on `#json-output` → confirm it contains:
  ```
  "categories": [
    {
      "name": "Geographie",
      "questions": [
        {
          "text": "Hauptstadt von Australien?",
          "answers": [
            {
              "text": "Canberra",
              "correct": true
            },
  ```
  and that `categories[0].questions` has exactly 5 entries, `answers` has exactly 4 entries
- Click the second category's `Kategorie entfernen` button → `take_snapshot` → confirm only one `.category` block remains and `categories` in the JSON has length 1
- `list_console_messages` → confirm no errors

- [ ] **Step 3: Commit**

```bash
git add tools/quiz-editor.html
git commit -m "feat: add category/question/answer editing with fixed 5x4 structure"
```

---

### Task 3: Enforce at least one correct answer per question

**Files:**
- Modify: `tools/quiz-editor.html`

**Interfaces:**
- Consumes: `renderQuestion(question, questionIndex)` from Task 2 (modified in place, same name/signature).
- Produces: `updateCorrectCheckboxState(question, checkboxes)`.

- [ ] **Step 1: Replace `renderQuestion` and add `updateCorrectCheckboxState`**

Replace the existing `renderQuestion` function body with:

```js
  function renderQuestion(question, questionIndex) {
    const div = document.createElement('div');
    div.className = 'question';

    const label = document.createElement('div');
    label.textContent = `Frage ${questionIndex + 1}`;
    div.appendChild(label);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = 'Fragetext';
    textInput.value = question.text;
    textInput.oninput = () => {
      question.text = textInput.value;
      renderJSON();
    };
    div.appendChild(textInput);

    const checkboxes = [];
    question.answers.forEach((answer, answerIndex) => {
      const row = document.createElement('div');
      row.className = 'answer-row';

      const answerInput = document.createElement('input');
      answerInput.type = 'text';
      answerInput.placeholder = `Antwort ${answerIndex + 1}`;
      answerInput.value = answer.text;
      answerInput.oninput = () => {
        answer.text = answerInput.value;
        renderJSON();
      };
      row.appendChild(answerInput);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = answer.correct;
      checkbox.onchange = () => {
        answer.correct = checkbox.checked;
        updateCorrectCheckboxState(question, checkboxes);
        renderJSON();
      };
      checkboxes.push(checkbox);
      row.appendChild(checkbox);

      const checkboxLabel = document.createElement('span');
      checkboxLabel.textContent = 'richtig';
      row.appendChild(checkboxLabel);

      div.appendChild(row);
    });

    updateCorrectCheckboxState(question, checkboxes);

    return div;
  }

  function updateCorrectCheckboxState(question, checkboxes) {
    const correctCount = question.answers.filter(a => a.correct).length;
    question.answers.forEach((answer, i) => {
      checkboxes[i].disabled = answer.correct && correctCount === 1;
    });
  }
```

- [ ] **Step 2: Verify in browser**

- `navigate_page` → reload the file
- Click `#add-category-btn`, then check the first question's answer-1 checkbox
- `take_snapshot` → confirm answer-1's checkbox is now `disabled` and answers 2–4 are not
- Check answer-2's checkbox too → `take_snapshot` → confirm answer-1's checkbox becomes enabled again (2 correct answers, neither is the sole one)
- Uncheck answer-2 → `take_snapshot` → confirm answer-1's checkbox is disabled again (back to sole correct answer)
- `list_console_messages` → confirm no errors

- [ ] **Step 3: Commit**

```bash
git add tools/quiz-editor.html
git commit -m "feat: prevent unchecking the last correct answer of a question"
```

---

### Task 4: Copy JSON to clipboard

**Files:**
- Modify: `tools/quiz-editor.html`

**Interfaces:**
- Consumes: `quiz` global from Task 1.
- Produces: `#copy-btn` element, `fallbackCopy(text, onDone)`.

- [ ] **Step 1: Add the copy button and its handlers**

Replace the `#json-panel` div with:

```html
  <div id="json-panel">
    <button id="copy-btn">In Zwischenablage kopieren</button>
    <pre id="json-output"></pre>
  </div>
```

Add this script block right after the `add-category-btn` handler (before `function render()`):

```js
  document.getElementById('copy-btn').onclick = () => {
    const text = JSON.stringify(quiz, null, 2);
    const btn = document.getElementById('copy-btn');
    const showCopied = () => {
      const original = btn.textContent;
      btn.textContent = 'Kopiert!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied).catch(() => fallbackCopy(text, showCopied));
    } else {
      fallbackCopy(text, showCopied);
    }
  };

  function fallbackCopy(text, onDone) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    onDone();
  }
```

- [ ] **Step 2: Verify in browser**

- `navigate_page` → reload the file
- `click` on `#copy-btn`
- `take_snapshot` immediately → confirm button text is `Kopiert!`
- `list_console_messages` → confirm no errors (in particular no uncaught clipboard permission error — the fallback must have kicked in silently if the Clipboard API was blocked on `file://`)

- [ ] **Step 3: Commit**

```bash
git add tools/quiz-editor.html
git commit -m "feat: add copy-to-clipboard button with execCommand fallback"
```

---

### Task 5: Import an existing quiz JSON file

**Files:**
- Modify: `tools/quiz-editor.html`

**Interfaces:**
- Consumes: `quiz`, `renderForm()`, `renderJSON()` globals from Task 1–2.
- Produces: `validateQuiz(data)` returning `{ ok: true, quiz } | { ok: false, message }`, `#import-input`, `#import-error`.

- [ ] **Step 1: Add the import UI and wire it up**

Add this markup right after the title `<label>` in `#form-panel` (before `#categories-container`):

```html
    <p>
      <label>Bestehendes Quiz importieren:
        <input type="file" id="import-input" accept=".json">
      </label>
    </p>
    <div id="import-error" style="color:#b00020;"></div>
```

Add `validateQuiz` and the `#import-input` handler right after `createCategory()`:

```js
  function validateQuiz(data) {
    if (typeof data !== 'object' || data === null) {
      return { ok: false, message: 'JSON ist kein Objekt.' };
    }
    if (typeof data.title !== 'string') {
      return { ok: false, message: 'Feld "title" fehlt oder ist kein String.' };
    }
    if (!Array.isArray(data.categories)) {
      return { ok: false, message: 'Feld "categories" fehlt oder ist kein Array.' };
    }
    for (let ci = 0; ci < data.categories.length; ci++) {
      const category = data.categories[ci];
      if (typeof category !== 'object' || category === null) {
        return { ok: false, message: `Kategorie ${ci + 1}: kein Objekt.` };
      }
      if (typeof category.name !== 'string') {
        return { ok: false, message: `Kategorie ${ci + 1}: Feld "name" fehlt oder ist kein String.` };
      }
      if (!Array.isArray(category.questions) || category.questions.length !== 5) {
        return { ok: false, message: `Kategorie ${ci + 1}: benötigt genau 5 Fragen.` };
      }
      for (let qi = 0; qi < category.questions.length; qi++) {
        const question = category.questions[qi];
        if (typeof question !== 'object' || question === null) {
          return { ok: false, message: `Kategorie ${ci + 1}, Frage ${qi + 1}: kein Objekt.` };
        }
        if (typeof question.text !== 'string') {
          return { ok: false, message: `Kategorie ${ci + 1}, Frage ${qi + 1}: Feld "text" fehlt oder ist kein String.` };
        }
        if (!Array.isArray(question.answers) || question.answers.length !== 4) {
          return { ok: false, message: `Kategorie ${ci + 1}, Frage ${qi + 1}: benötigt genau 4 Antworten.` };
        }
        let correctCount = 0;
        for (let ai = 0; ai < question.answers.length; ai++) {
          const answer = question.answers[ai];
          if (typeof answer !== 'object' || answer === null) {
            return { ok: false, message: `Kategorie ${ci + 1}, Frage ${qi + 1}, Antwort ${ai + 1}: kein Objekt.` };
          }
          if (typeof answer.text !== 'string') {
            return { ok: false, message: `Kategorie ${ci + 1}, Frage ${qi + 1}, Antwort ${ai + 1}: Feld "text" fehlt oder ist kein String.` };
          }
          if (typeof answer.correct !== 'boolean') {
            return { ok: false, message: `Kategorie ${ci + 1}, Frage ${qi + 1}, Antwort ${ai + 1}: Feld "correct" fehlt oder ist kein Boolean.` };
          }
          if (answer.correct) correctCount++;
        }
        if (correctCount < 1 || correctCount > 4) {
          return { ok: false, message: `Kategorie ${ci + 1}, Frage ${qi + 1}: benötigt 1 bis 4 korrekte Antworten.` };
        }
      }
    }
    return { ok: true, quiz: data };
  }

  document.getElementById('import-input').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const errorDiv = document.getElementById('import-error');
    errorDiv.textContent = '';
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try {
        data = JSON.parse(reader.result);
      } catch (err) {
        errorDiv.textContent = 'Ungültiges JSON: ' + err.message;
        return;
      }
      const result = validateQuiz(data);
      if (!result.ok) {
        errorDiv.textContent = result.message;
        return;
      }
      quiz = result.quiz;
      renderForm();
      renderJSON();
    };
    reader.readAsText(file);
  };
```

- [ ] **Step 2: Verify invalid import is rejected**

- `navigate_page` → reload the file
- First create an invalid fixture file on disk with the Write tool at `/tmp/quiz-editor-invalid-fixture.json` (plain OS temp path, not tied to any session) containing:
  ```json
  { "title": "Kaputt", "categories": [ { "name": "Nur 3 Fragen", "questions": [
    { "text": "Frage 1", "answers": [ {"text":"A","correct":true}, {"text":"B","correct":false}, {"text":"C","correct":false}, {"text":"D","correct":false} ] },
    { "text": "Frage 2", "answers": [ {"text":"A","correct":true}, {"text":"B","correct":false}, {"text":"C","correct":false}, {"text":"D","correct":false} ] },
    { "text": "Frage 3", "answers": [ {"text":"A","correct":true}, {"text":"B","correct":false}, {"text":"C","correct":false}, {"text":"D","correct":false} ] }
  ] } ] }
  ```
- `upload_file` on `#import-input` with `/tmp/quiz-editor-invalid-fixture.json`
- `take_snapshot` → confirm `#import-error` shows exactly `Kategorie 1: benötigt genau 5 Fragen.` and `#json-output` is unchanged (still `{"title": "", "categories": []}` if nothing was imported before)

- [ ] **Step 3: Verify valid import (public/beispiel.json) succeeds**

- `upload_file` on `#import-input` with `/Users/besa/Documents/development/privat/quiznight/public/beispiel.json`
- `take_snapshot` → confirm `#import-error` is empty, `.category` blocks show names `Geographie` and `Filme & Serien`, the first question's text input shows `Was ist die Hauptstadt von Australien?`, and `#json-output` contains `"name": "Geographie"` and 2 entries in `categories`
- `list_console_messages` → confirm no errors

- [ ] **Step 4: Commit**

```bash
git add tools/quiz-editor.html
git commit -m "feat: add JSON import with schema validation and error display"
```
