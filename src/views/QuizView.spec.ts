import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import QuizView from './QuizView.vue'

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

	it('shows the first category slide once the quiz has loaded', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(quiz)))
		const wrapper = await mountAt({ quiz: 'beispiel.json' })
		expect(wrapper.text()).toContain('Kategorie A')
	})
})
