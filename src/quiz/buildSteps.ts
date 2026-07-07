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
