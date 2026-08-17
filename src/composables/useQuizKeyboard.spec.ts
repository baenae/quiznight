import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useQuizKeyboard } from './useQuizKeyboard'

function mountWithKeyboard(onNext: () => void, onPrev: () => void) {
	const TestComponent = defineComponent({
		setup() {
			useQuizKeyboard(onNext, onPrev)
			return () => h('div')
		},
	})
	return mount(TestComponent)
}

function pressKey(key: string) {
	const event = new KeyboardEvent('keydown', { key, cancelable: true })
	window.dispatchEvent(event)
	return event
}

describe('useQuizKeyboard', () => {
	it('calls onNext when Space is pressed and prevents the default scroll', () => {
		const onNext = vi.fn()
		const onPrev = vi.fn()
		mountWithKeyboard(onNext, onPrev)

		const event = pressKey(' ')

		expect(onNext).toHaveBeenCalledOnce()
		expect(event.defaultPrevented).toBe(true)
	})

	it('calls onPrev when Backspace is pressed and prevents the default navigation', () => {
		const onNext = vi.fn()
		const onPrev = vi.fn()
		mountWithKeyboard(onNext, onPrev)

		const event = pressKey('Backspace')

		expect(onPrev).toHaveBeenCalledOnce()
		expect(event.defaultPrevented).toBe(true)
	})

	it('calls onNext when ArrowRight is pressed and prevents the default scroll', () => {
		const onNext = vi.fn()
		const onPrev = vi.fn()
		mountWithKeyboard(onNext, onPrev)

		const event = pressKey('ArrowRight')

		expect(onNext).toHaveBeenCalledOnce()
		expect(event.defaultPrevented).toBe(true)
	})

	it('calls onPrev when ArrowLeft is pressed and prevents the default scroll', () => {
		const onNext = vi.fn()
		const onPrev = vi.fn()
		mountWithKeyboard(onNext, onPrev)

		const event = pressKey('ArrowLeft')

		expect(onPrev).toHaveBeenCalledOnce()
		expect(event.defaultPrevented).toBe(true)
	})

	it('ignores other keys', () => {
		const onNext = vi.fn()
		const onPrev = vi.fn()
		mountWithKeyboard(onNext, onPrev)

		pressKey('Enter')

		expect(onNext).not.toHaveBeenCalled()
		expect(onPrev).not.toHaveBeenCalled()
	})

	it('stops listening after the component unmounts', () => {
		const onNext = vi.fn()
		const onPrev = vi.fn()
		const wrapper = mountWithKeyboard(onNext, onPrev)

		wrapper.unmount()
		pressKey(' ')

		expect(onNext).not.toHaveBeenCalled()
	})
})
