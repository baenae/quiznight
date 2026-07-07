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
