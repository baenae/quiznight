<script setup lang="ts">
import type { Category } from '@/quiz/types'

const props = defineProps<{
	categories: Category[]
}>()

const emit = defineEmits<{
	select: [categoryIndex: number, questionIndex: number | undefined]
}>()

function selectCategory(categoryIndex: number) {
	emit('select', categoryIndex, undefined)
}

function selectQuestion(categoryIndex: number, questionIndex: number) {
	emit('select', categoryIndex, questionIndex)
}
</script>

<template>
	<div class="overview-slide">
		<div v-for="(category, categoryIndex) in props.categories" :key="categoryIndex" class="category-block">
			<button type="button" class="category-link" @click="selectCategory(categoryIndex)">
				{{ category.name }}
			</button>
			<ul class="question-list">
				<li v-for="(question, questionIndex) in category.questions" :key="questionIndex">
					<button type="button" class="question-link" @click="selectQuestion(categoryIndex, questionIndex)">
						{{ question.text }}
					</button>
				</li>
			</ul>
		</div>
	</div>
</template>

<style scoped>
.overview-slide {
	position: relative;
	width: 100vw;
	height: 100vh;
	overflow-y: auto;
	background: radial-gradient(75% 75% at 50% 50%, #274470 0%, #172948 50%, #0f1b2f 75%, #070e17 100%);
	color: #fff;
	font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
	padding: 3vw 4vw;
	box-sizing: border-box;
}

.category-block {
	margin-bottom: 2vw;
}

.category-link {
	background: none;
	border: none;
	padding: 0;
	color: #fff;
	font-family: 'LEMON MILK', sans-serif;
	font-weight: 700;
	font-size: 2vw;
	text-decoration: underline;
	cursor: pointer;
}

.question-list {
	list-style: none;
	margin: 0.5vw 0 0;
	padding: 0 0 0 2vw;
}

.question-link {
	background: none;
	border: none;
	padding: 0.2vw 0;
	color: #fff;
	font-size: 1.2vw;
	text-decoration: underline;
	cursor: pointer;
	text-align: left;
}
</style>
