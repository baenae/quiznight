import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import QuizView from './QuizView.vue'
import { useQuizFlowStore } from '@/stores/quizFlow'

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

	it('shows the start slide once the quiz has loaded', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(quiz)))
		const wrapper = await mountAt({ quiz: 'beispiel.json' })
		expect(wrapper.text()).toContain('QUIZNIGHT')
	})

	it('shows the first category slide with category progress after advancing past the start slide', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(quiz)))
		const wrapper = await mountAt({ quiz: 'beispiel.json' })
		useQuizFlowStore().next()
		await wrapper.vm.$nextTick()
		expect(wrapper.text()).toContain('Kategorie A')
		expect(wrapper.text()).toContain('Kategorie 1 von 1')
	})

	it('shows question progress once a question step is reached', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(quiz)))
		const wrapper = await mountAt({ quiz: 'beispiel.json' })
		const store = useQuizFlowStore()
		store.next()
		store.next()
		await wrapper.vm.$nextTick()
		expect(wrapper.text()).toContain('1/5')
	})

	it('jumps directly to the question given by the category/question query params (1-based)', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(quiz)))
		const wrapper = await mountAt({ quiz: 'beispiel.json', category: '1', question: '2' })
		expect(wrapper.text()).toContain('Frage 2')
	})

	it('shows the overview and jumps there on select when overviewOpen is toggled', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(quiz)))
		const wrapper = await mountAt({ quiz: 'beispiel.json' })
		const store = useQuizFlowStore()

		store.toggleOverview()
		await wrapper.vm.$nextTick()
		expect(wrapper.text()).toContain('Kategorie A')

		await wrapper.find('.question-link').trigger('click')

		expect(store.overviewOpen).toBe(false)
		expect(store.currentStep).toEqual({
			type: 'question',
			categoryIndex: 0,
			questionIndex: 0,
			phase: 'intro',
		})
	})
})
