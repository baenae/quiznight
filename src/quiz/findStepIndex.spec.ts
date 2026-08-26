import { describe, expect, it } from 'vitest'
import { buildSteps } from './buildSteps'
import { findStepIndex } from './findStepIndex'
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

const steps = buildSteps(quiz)

describe('findStepIndex', () => {
	it('finds the category step for a category index', () => {
		expect(findStepIndex(steps, 1)).toBe(steps.findIndex((s) => s.type === 'category' && s.categoryIndex === 1))
	})

	it('finds the intro question step for a category and question index', () => {
		const index = findStepIndex(steps, 1, 1)
		expect(steps[index!]).toEqual({
			type: 'question',
			categoryIndex: 1,
			questionIndex: 1,
			phase: 'intro',
		})
	})

	it('returns null for an out-of-range category index', () => {
		expect(findStepIndex(steps, 5)).toBeNull()
	})

	it('returns null for an out-of-range question index', () => {
		expect(findStepIndex(steps, 0, 99)).toBeNull()
	})

	it('returns null for a negative category index', () => {
		expect(findStepIndex(steps, -1)).toBeNull()
	})
})
