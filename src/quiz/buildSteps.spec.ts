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
