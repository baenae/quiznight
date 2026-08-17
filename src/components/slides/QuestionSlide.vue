<script setup lang="ts">
import type { Answer } from '@/quiz/types'
import { answerFontSize } from '@/quiz/answerFontSize'

defineProps<{
	text: string
	category: string
	answers: Answer[]
	phase: 'intro' | 'answers' | 'resolved'
	progress?: { index: number; total: number } | null
}>()

function answerLetter(index: number): string {
	return String.fromCharCode(65 + index)
}
</script>

<template>
	<div class="question-slide">
		<div class="category-bar">
			<p class="category-label">Kategorie: {{ category }}</p>
			<p v-if="progress" class="page-badge">{{ progress.index }}/{{ progress.total }}</p>
		</div>
		<p class="question-text" :class="phase === 'intro' ? 'question-text--intro' : 'question-text--compact'">
			{{ text }}
		</p>
		<ul v-if="phase !== 'intro'" class="answers">
			<li
				v-for="(answer, index) in answers"
				:key="index"
				class="answer"
				:class="phase === 'resolved' ? (answer.correct ? 'correct' : 'incorrect') : ''"
			>
				<span class="answer-letter">{{ answerLetter(index) }}</span>
				<span class="answer-text" :style="{ fontSize: `${answerFontSize(answer.text)}px` }">{{
					answer.text
				}}</span>
			</li>
		</ul>
	</div>
</template>

<style scoped>
.question-slide {
	position: relative;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	background: radial-gradient(75% 75% at 50% 50%, #274470 0%, #172948 50%, #0f1b2f 75%, #070e17 100%);
	color: #fff;
	font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
}

.category-bar {
	position: absolute;
	left: 0;
	top: 0;
	width: 4.375vw;
	height: 100vh;
	background: #fd029d;
	box-shadow: 0 0 1.56vw #fd029d;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 2vw 0;
}

.category-label {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	writing-mode: vertical-rl;
	transform: rotate(180deg);
	white-space: nowrap;
	font-family: 'Arial Narrow', Arial, sans-serif;
	font-weight: 700;
	font-size: 1.875vw;
	margin: 0;
}

.page-badge {
	margin: 0;
	font-family: 'Arial Narrow', Arial, sans-serif;
	font-weight: 700;
	font-size: 1.875vw;
}

.question-text {
	position: absolute;
	margin: 0;
}

.question-text--intro {
	left: 14.69vw;
	top: 12.34vw;
	width: 72.9vw;
	font-size: 5.21vw;
}

.question-text--compact {
	left: 8.33vw;
	top: 5.21vw;
	width: 30.73vw;
	font-size: 3.33vw;
}

.answers {
	position: absolute;
	left: 42.7vw;
	top: 0;
	width: 57.29vw;
	height: 100vh;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	padding: 5.21vw 0;
	margin: 0;
	list-style: none;
}

.answer {
	position: relative;
	display: flex;
	align-items: center;
	gap: 2vw;
	width: 46.875vw;
	height: 10vw;
	padding: 0 3vw;
	border-radius: 5.21vw;
	border: 2px solid #fd029d;
	background: linear-gradient(to right, #152034, #1d232e);
	box-shadow: 0 0 0.26vw rgba(0, 229, 255, 0.8);
}

.answer-letter {
	flex-shrink: 0;
	font-family: 'LEMON MILK', sans-serif;
	font-weight: 700;
	font-size: 3.33vw;
	text-shadow: 0 0 1.56vw rgba(0, 229, 255, 0.8);
}

.answer-text {
	flex: 1;
	text-align: center;
	text-shadow: 0 0 1.56vw rgba(0, 229, 255, 0.8);
}

.answer.correct {
	border-color: #adfc02;
	box-shadow: 0 0 5.21vw 0.26vw #adfc02;
}

.answer.correct .answer-letter,
.answer.correct .answer-text {
	text-shadow: 0 0 1.56vw #adfc02;
}

.answer.incorrect {
	opacity: 0.33;
}
</style>
