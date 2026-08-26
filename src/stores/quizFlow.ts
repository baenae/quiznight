import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { buildSteps, type Step } from '@/quiz/buildSteps'
import { findStepIndex } from '@/quiz/findStepIndex'
import type { Quiz } from '@/quiz/types'

export const useQuizFlowStore = defineStore('quizFlow', () => {
	const quiz = ref<Quiz | null>(null)
	const steps = ref<Step[]>([])
	const currentIndex = ref(0)
	const loadError = ref<string | null>(null)
	const overviewOpen = ref(false)

	const currentStep = computed<Step | null>(() => steps.value[currentIndex.value] ?? null)

	const currentCategory = computed(() => {
		const step = currentStep.value
		if (!step || !quiz.value) return null
		if (step.type !== 'category' && step.type !== 'question') return null
		return quiz.value.categories[step.categoryIndex] ?? null
	})

	const currentQuestion = computed(() => {
		const step = currentStep.value
		if (!step || step.type !== 'question' || !quiz.value) return null
		return quiz.value.categories[step.categoryIndex]?.questions[step.questionIndex] ?? null
	})

	const categoryProgress = computed(() => {
		const step = currentStep.value
		if (!step || !quiz.value || (step.type !== 'category' && step.type !== 'question')) return null
		return { index: step.categoryIndex + 1, total: quiz.value.categories.length }
	})

	const questionProgress = computed(() => {
		const step = currentStep.value
		if (!step || step.type !== 'question' || !quiz.value) return null
		const category = quiz.value.categories[step.categoryIndex]
		if (!category) return null
		return { index: step.questionIndex + 1, total: category.questions.length }
	})

	function load(loadedQuiz: Quiz) {
		quiz.value = loadedQuiz
		steps.value = buildSteps(loadedQuiz)
		currentIndex.value = 0
		loadError.value = null
	}

	function next() {
		currentIndex.value = Math.min(currentIndex.value + 1, Math.max(steps.value.length - 1, 0))
	}

	function prev() {
		currentIndex.value = Math.max(currentIndex.value - 1, 0)
	}

	function setError(message: string) {
		loadError.value = message
	}

	function jumpTo(categoryIndex: number, questionIndex?: number) {
		const index = findStepIndex(steps.value, categoryIndex, questionIndex)
		if (index !== null) {
			currentIndex.value = index
		}
	}

	function toggleOverview() {
		overviewOpen.value = !overviewOpen.value
	}

	return {
		quiz,
		steps,
		currentIndex,
		loadError,
		overviewOpen,
		currentStep,
		currentCategory,
		currentQuestion,
		categoryProgress,
		questionProgress,
		load,
		next,
		prev,
		setError,
		jumpTo,
		toggleOverview,
	}
})