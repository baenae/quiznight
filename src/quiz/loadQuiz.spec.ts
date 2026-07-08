import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadQuiz } from './loadQuiz'

function jsonResponse(body: unknown, ok = true) {
	return { ok, json: () => Promise.resolve(body) } as Response
}

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('loadQuiz', () => {
	it('returns an error when no file name is given', async () => {
		const result = await loadQuiz(null)
		expect(result).toEqual({
			ok: false,
			message: 'Kein Quiz angegeben. Bitte "?quiz=<dateiname>.json" an die URL anhängen.',
		})
	})

	it('returns an error when the fetch response is not ok', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)))
		const result = await loadQuiz('missing.json')
		expect(result).toEqual({
			ok: false,
			message: 'Quiz-Datei "missing.json" konnte nicht geladen werden',
		})
	})

	it('returns an error when the response is not valid JSON', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.reject(new Error('bad json')),
			}),
		)
		const result = await loadQuiz('broken.json')
		expect(result).toEqual({
			ok: false,
			message: 'Quiz-Datei "broken.json" enthält kein gültiges JSON',
		})
	})

	it('returns the validation error when the JSON does not match the schema', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ title: 'X' })))
		const result = await loadQuiz('invalid.json')
		expect(result).toEqual({ ok: false, message: 'Feld "categories" fehlt oder ist kein Array' })
	})

	it('returns the parsed quiz on success', async () => {
		const quiz = { title: 'Testquiz', categories: [] }
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(quiz))
		vi.stubGlobal('fetch', fetchMock)
		const result = await loadQuiz('valid.json')
		expect(result).toEqual({ ok: true, quiz })
		expect(fetchMock).toHaveBeenCalledWith('/valid.json')
	})
})
