import { describe, expect, it } from 'vitest'
import { answerFontSize } from './answerFontSize'

describe('answerFontSize', () => {
	it('returns 72 for short answers', () => {
		expect(answerFontSize('Antwort B')).toBe(72)
	})

	it('returns 64 for medium-length answers', () => {
		expect(answerFontSize('Ganz lange Antwort mit ganz vielen Buchstaben')).toBe(64)
	})

	it('returns 54 for very long answers', () => {
		expect(answerFontSize('Noch ganz längere Antwort mit noch ganz viel mehr Buchstaben')).toBe(54)
	})

	it('treats exactly 20 characters as short', () => {
		expect(answerFontSize('a'.repeat(20))).toBe(72)
	})

	it('treats exactly 21 characters as medium', () => {
		expect(answerFontSize('a'.repeat(21))).toBe(64)
	})

	it('treats exactly 50 characters as medium', () => {
		expect(answerFontSize('a'.repeat(50))).toBe(64)
	})

	it('treats exactly 51 characters as long', () => {
		expect(answerFontSize('a'.repeat(51))).toBe(54)
	})
})