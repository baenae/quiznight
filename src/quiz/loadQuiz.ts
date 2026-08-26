import { validateQuiz } from './validateQuiz'
import type { QuizResult } from './types'

const SAFE_FILE_NAME = /^[\w-]+\.json$/

export async function loadQuiz(fileName: string | null): Promise<QuizResult> {
	if (!fileName) {
		return {
			ok: false,
			message: 'Kein Quiz angegeben. Bitte "?quiz=<dateiname>.json" an die URL anhängen.',
		}
	}

	if (!SAFE_FILE_NAME.test(fileName)) {
		return { ok: false, message: `Ungültiger Quiz-Dateiname "${fileName}"` }
	}

	let response: Response
	try {
		response = await fetch(`/${fileName}`)
	} catch {
		return { ok: false, message: `Quiz-Datei "${fileName}" konnte nicht geladen werden` }
	}

	if (!response.ok) {
		return { ok: false, message: `Quiz-Datei "${fileName}" konnte nicht geladen werden` }
	}

	let data: unknown
	try {
		data = await response.json()
	} catch {
		return { ok: false, message: `Quiz-Datei "${fileName}" enthält kein gültiges JSON` }
	}

	return validateQuiz(data)
}
