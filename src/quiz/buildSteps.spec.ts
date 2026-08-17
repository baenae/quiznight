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
	it('starts with a start step, then category/question phases and a pause between categories, ending with end', () => {
		const steps = buildSteps(quiz)

		expect(steps).toEqual([
			{ type: 'start' },
			{ type: 'category', categoryIndex: 0 },
			{ type: 'question', categoryIndex: 0, questionIndex: 0, phase: 'intro' },
			{ type: 'question', categoryIndex: 0, questionIndex: 0, phase: 'answers' },
			{ type: 'question', categoryIndex: 0, questionIndex: 0, phase: 'resolved' },
			{ type: 'question', categoryIndex: 0, questionIndex: 1, phase: 'intro' },
			{ type: 'question', categoryIndex: 0, questionIndex: 1, phase: 'answers' },
			{ type: 'question', categoryIndex: 0, questionIndex: 1, phase: 'resolved' },
			{ type: 'pause' },
			{ type: 'category', categoryIndex: 1 },
			{ type: 'question', categoryIndex: 1, questionIndex: 0, phase: 'intro' },
			{ type: 'question', categoryIndex: 1, questionIndex: 0, phase: 'answers' },
			{ type: 'question', categoryIndex: 1, questionIndex: 0, phase: 'resolved' },
			{ type: 'question', categoryIndex: 1, questionIndex: 1, phase: 'intro' },
			{ type: 'question', categoryIndex: 1, questionIndex: 1, phase: 'answers' },
			{ type: 'question', categoryIndex: 1, questionIndex: 1, phase: 'resolved' },
			{ type: 'end' },
		])
	})
})