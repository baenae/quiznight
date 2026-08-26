import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import OverviewSlide from './OverviewSlide.vue'

const categories = [
	{
		name: 'Kategorie A',
		questions: [
			{ text: 'Frage A1', answers: [] },
			{ text: 'Frage A2', answers: [] },
		],
	},
	{
		name: 'Kategorie B',
		questions: [{ text: 'Frage B1', answers: [] }],
	},
]

describe('OverviewSlide', () => {
	it('lists every category name and its questions', () => {
		const wrapper = mount(OverviewSlide, { props: { categories } })

		expect(wrapper.text()).toContain('Kategorie A')
		expect(wrapper.text()).toContain('Frage A1')
		expect(wrapper.text()).toContain('Frage A2')
		expect(wrapper.text()).toContain('Kategorie B')
		expect(wrapper.text()).toContain('Frage B1')
	})

	it('emits select with only the category index when a category link is clicked', async () => {
		const wrapper = mount(OverviewSlide, { props: { categories } })

		await wrapper.findAll('.category-link')[1]!.trigger('click')

		expect(wrapper.emitted('select')).toEqual([[1, undefined]])
	})

	it('emits select with category and question index when a question link is clicked', async () => {
		const wrapper = mount(OverviewSlide, { props: { categories } })

		await wrapper.findAll('.question-link')[2]!.trigger('click')

		expect(wrapper.emitted('select')).toEqual([[1, 0]])
	})
})
