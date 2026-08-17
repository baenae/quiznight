import type { Quiz, QuizResult } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateQuiz(data: unknown): QuizResult {
	if (!isRecord(data)) {
		return { ok: false, message: 'Quiz muss ein Objekt sein' }
	}

	if (typeof data.title !== 'string') {
		return { ok: false, message: 'Feld "title" fehlt oder ist kein String' }
	}

	if (!Array.isArray(data.categories)) {
		return { ok: false, message: 'Feld "categories" fehlt oder ist kein Array' }
	}

	for (const [categoryIndex, category] of data.categories.entries()) {
		const categoryError = validateCategory(category, categoryIndex)
		if (categoryError) return categoryError
	}

	return { ok: true, quiz: data as unknown as Quiz }
}

function validateCategory(category: unknown, categoryIndex: number): QuizResult | null {
	const label = `Kategorie ${categoryIndex + 1}`

	if (!isRecord(category)) {
		return { ok: false, message: `${label}: muss ein Objekt sein` }
	}

	if (typeof category.name !== 'string') {
		return { ok: false, message: `${label}: Feld "name" fehlt oder ist kein String` }
	}

	if (!Array.isArray(category.questions)) {
		return {
			ok: false,
			message: `${label} "${category.name}": Feld "questions" fehlt oder ist kein Array`,
		}
	}

	if (category.questions.length !== 5) {
		return {
			ok: false,
			message: `${label} "${category.name}": erwartet 5 Fragen, gefunden ${category.questions.length}`,
		}
	}

	for (const [questionIndex, question] of category.questions.entries()) {
		const questionError = validateQuestion(question, categoryIndex, questionIndex)
		if (questionError) return questionError
	}

	return null
}

function validateQuestion(
	question: unknown,
	categoryIndex: number,
	questionIndex: number,
): QuizResult | null {
	const label = `Kategorie ${categoryIndex + 1}, Frage ${questionIndex + 1}`

	if (!isRecord(question)) {
		return { ok: false, message: `${label}: muss ein Objekt sein` }
	}

	if (typeof question.text !== 'string') {
		return { ok: false, message: `${label}: Feld "text" fehlt oder ist kein String` }
	}

	if (!Array.isArray(question.answers)) {
		return { ok: false, message: `${label}: Feld "answers" fehlt oder ist kein Array` }
	}

	if (question.answers.length !== 4) {
		return {
			ok: false,
			message: `${label}: erwartet 4 Antworten, gefunden ${question.answers.length}`,
		}
	}

	let correctCount = 0
	for (const [answerIndex, answer] of question.answers.entries()) {
		if (!isRecord(answer)) {
			return { ok: false, message: `${label}, Antwort ${answerIndex + 1}: muss ein Objekt sein` }
		}
		if (typeof answer.text !== 'string') {
			return {
				ok: false,
				message: `${label}, Antwort ${answerIndex + 1}: Feld "text" fehlt oder ist kein String`,
			}
		}
		if (typeof answer.correct !== 'boolean') {
			return {
				ok: false,
				message: `${label}, Antwort ${answerIndex + 1}: Feld "correct" fehlt oder ist kein Boolean`,
			}
		}
		if (answer.correct) correctCount++
	}

	if (correctCount < 1) {
		return { ok: false, message: `${label}: mindestens 1 richtige Antwort erforderlich` }
	}

	return null
}
