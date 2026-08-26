import type { Quiz } from './types'

export type Step =
	| { type: 'start' }
	| { type: 'category'; categoryIndex: number }
	| {
			type: 'question'
			categoryIndex: number
			questionIndex: number
			phase: 'intro' | 'answers' | 'resolved'
	  }
	| { type: 'pause' }
	| { type: 'end' }

export function buildSteps(quiz: Quiz): Step[] {
	const steps: Step[] = [{ type: 'start' }]

	quiz.categories.forEach((category, categoryIndex) => {
		steps.push({ type: 'category', categoryIndex })

		category.questions.forEach((_, questionIndex) => {
			steps.push({ type: 'question', categoryIndex, questionIndex, phase: 'intro' })
			steps.push({ type: 'question', categoryIndex, questionIndex, phase: 'answers' })
			steps.push({ type: 'question', categoryIndex, questionIndex, phase: 'resolved' })
		})

		const isLastCategory = categoryIndex === quiz.categories.length - 1
		steps.push(isLastCategory ? { type: 'end' } : { type: 'pause' })
	})

	return steps
}