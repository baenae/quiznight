<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { loadQuiz } from '@/quiz/loadQuiz'
import { useQuizFlowStore } from '@/stores/quizFlow'
import { useQuizKeyboard } from '@/composables/useQuizKeyboard'
import ErrorSlide from '@/components/slides/ErrorSlide.vue'
import StartSlide from '@/components/slides/StartSlide.vue'
import CategorySlide from '@/components/slides/CategorySlide.vue'
import QuestionSlide from '@/components/slides/QuestionSlide.vue'
import PauseSlide from '@/components/slides/PauseSlide.vue'
import EndSlide from '@/components/slides/EndSlide.vue'
import OverviewSlide from '@/components/slides/OverviewSlide.vue'

const route = useRoute()
const store = useQuizFlowStore()

useQuizKeyboard(
	() => store.next(),
	() => store.prev(),
	() => store.toggleOverview(),
)

const stepType = computed(() => store.currentStep?.type ?? null)
const questionPhase = computed(() => {
	const step = store.currentStep
	return step?.type === 'question' ? step.phase : 'intro'
})

function queryIndex(name: string): number | undefined {
	const raw = route.query[name]
	if (typeof raw !== 'string') return undefined
	const value = Number(raw)
	return Number.isInteger(value) ? value - 1 : undefined
}

function selectFromOverview(categoryIndex: number, questionIndex: number | undefined) {
	store.jumpTo(categoryIndex, questionIndex)
	store.toggleOverview()
}

onMounted(async () => {
	const fileName = typeof route.query.quiz === 'string' ? route.query.quiz : null
	const result = await loadQuiz(fileName)
	if (result.ok) {
		store.load(result.quiz)
		const categoryIndex = queryIndex('category')
		if (categoryIndex !== undefined) {
			store.jumpTo(categoryIndex, queryIndex('question'))
		}
	} else {
		store.setError(result.message)
	}
})
</script>

<template>
	<Transition name="fade">
		<ErrorSlide v-if="store.loadError" :key="store.currentIndex" :message="store.loadError" />
		<StartSlide v-else-if="stepType === 'start'" :key="store.currentIndex" />
		<CategorySlide
			v-else-if="stepType === 'category'"
			:key="store.currentIndex"
			:name="store.currentCategory?.name ?? ''"
			:progress="store.categoryProgress"
		/>
		<QuestionSlide
			v-else-if="stepType === 'question'"
			:key="store.currentIndex"
			:text="store.currentQuestion?.text ?? ''"
			:category="store.currentCategory?.name ?? ''"
			:answers="store.currentQuestion?.answers ?? []"
			:phase="questionPhase"
			:progress="store.questionProgress"
		/>
		<PauseSlide v-else-if="stepType === 'pause'" :key="store.currentIndex" />
		<EndSlide v-else-if="stepType === 'end'" :key="store.currentIndex" />
	</Transition>
	<OverviewSlide
		v-if="store.overviewOpen"
		:categories="store.quiz?.categories ?? []"
		@select="selectFromOverview"
	/>
</template>

<style>
.fade-enter-active {
	transition: opacity 0.4s ease;
	z-index: 1;
}

.fade-enter-from {
	opacity: 0;
}

.fade-leave-active {
	position: fixed !important;
	inset: 0;
	z-index: 0;
	transition: opacity 0.4s ease;
}
</style>
