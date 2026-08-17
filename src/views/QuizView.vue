<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { loadQuiz } from '@/quiz/loadQuiz'
import { useQuizFlowStore } from '@/stores/quizFlow'
import { useQuizKeyboard } from '@/composables/useQuizKeyboard'
import ErrorSlide from '@/components/slides/ErrorSlide.vue'
import CategorySlide from '@/components/slides/CategorySlide.vue'
import QuestionSlide from '@/components/slides/QuestionSlide.vue'
import PauseSlide from '@/components/slides/PauseSlide.vue'
import EndSlide from '@/components/slides/EndSlide.vue'

const route = useRoute()
const store = useQuizFlowStore()

useQuizKeyboard(
	() => store.next(),
	() => store.prev(),
)

const stepType = computed(() => store.currentStep?.type ?? null)
const isResolved = computed(() => {
	const step = store.currentStep
	return step?.type === 'question' ? step.resolved : false
})

onMounted(async () => {
	const fileName = typeof route.query.quiz === 'string' ? route.query.quiz : null
	const result = await loadQuiz(fileName)
	if (result.ok) {
		store.load(result.quiz)
	} else {
		store.setError(result.message)
	}
})
</script>

<template>
	<ErrorSlide v-if="store.loadError" :message="store.loadError" />
	<CategorySlide v-else-if="stepType === 'category'" :name="store.currentCategory?.name ?? ''" />
	<QuestionSlide
		v-else-if="stepType === 'question'"
		:text="store.currentQuestion?.text ?? ''"
		:answers="store.currentQuestion?.answers ?? []"
		:resolved="isResolved"
	/>
	<PauseSlide v-else-if="stepType === 'pause'" />
	<EndSlide v-else-if="stepType === 'end'" />
</template>
