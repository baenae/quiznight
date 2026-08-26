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
		expect(store.currentStep).toEqual({ type: 'start' })
	})

	it('advances one step at a time with next()', () => {
		const store = useQuizFlowStore()
		store.load(quiz)
		store.next()
		store.next()
		expect(store.currentStep).toEqual({
			type: 'question',
			categoryIndex: 0,
			questionIndex: 0,
			phase: 'intro',
		})
	})

	it('goes back one step at a time with prev()', () => {
		const store = useQuizFlowStore()
		store.load(quiz)
		store.next()
		store.next()
		store.next()
		store.prev()
		expect(store.currentStep).toEqual({
			type: 'question',
			categoryIndex: 0,
			questionIndex: 0,
			phase: 'intro',
		})
	})

	it('stays on the first step when calling prev() at the start', () => {
		const store = useQuizFlowStore()
		store.load(quiz)
		store.prev()
		expect(store.currentStep).toEqual({ type: 'start' })
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

	it('does not go negative when calling next() before any quiz is loaded', () => {
		const store = useQuizFlowStore()
		store.next()
		expect(store.currentIndex).toBe(0)
	})

	it('jumps to a category step with jumpTo()', () => {
		const store = useQuizFlowStore()
		store.load(quiz)
		store.jumpTo(1)
		expect(store.currentStep).toEqual({ type: 'category', categoryIndex: 1 })
	})

	it('jumps to a question intro step with jumpTo()', () => {
		const store = useQuizFlowStore()
		store.load(quiz)
		store.jumpTo(1, 0)
		expect(store.currentStep).toEqual({
			type: 'question',
			categoryIndex: 1,
			questionIndex: 0,
			phase: 'intro',
		})
	})

	it('ignores jumpTo() with an out-of-range category index', () => {
		const store = useQuizFlowStore()
		store.load(quiz)
		store.next()
		store.jumpTo(99)
		expect(store.currentIndex).toBe(1)
	})

	it('toggles the overview with toggleOverview()', () => {
		const store = useQuizFlowStore()
		expect(store.overviewOpen).toBe(false)
		store.toggleOverview()
		expect(store.overviewOpen).toBe(true)
		store.toggleOverview()
		expect(store.overviewOpen).toBe(false)
	})
})
