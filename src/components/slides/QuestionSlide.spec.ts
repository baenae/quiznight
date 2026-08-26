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
	it('shows only the question text during the intro phase', () => {
		const wrapper = mount(QuestionSlide, {
			props: { text: 'Frage?', category: 'Kategorie A', answers, phase: 'intro' },
		})

		expect(wrapper.text()).toContain('Frage?')
		answers.forEach((answer) => expect(wrapper.text()).not.toContain(answer.text))
	})

	it('shows the question text and all answers without revealing which is correct', () => {
		const wrapper = mount(QuestionSlide, {
			props: { text: 'Frage?', category: 'Kategorie A', answers, phase: 'answers' },
		})

		expect(wrapper.text()).toContain('Frage?')
		answers.forEach((answer) => expect(wrapper.text()).toContain(answer.text))
		expect(wrapper.find('.correct').exists()).toBe(false)
		expect(wrapper.find('.incorrect').exists()).toBe(false)
	})

	it('marks correct answers green and incorrect answers grey when resolved', () => {
		const wrapper = mount(QuestionSlide, {
			props: { text: 'Frage?', category: 'Kategorie A', answers, phase: 'resolved' },
		})

		const items = wrapper.findAll('li')
		expect(items[0]!.classes()).toContain('incorrect')
		expect(items[1]!.classes()).toContain('correct')
		expect(items[2]!.classes()).toContain('incorrect')
		expect(items[3]!.classes()).toContain('incorrect')
	})
})
