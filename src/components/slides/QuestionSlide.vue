<script setup lang="ts">
import type { Answer } from '@/quiz/types'

defineProps<{
	text: string
	answers: Answer[]
	resolved: boolean
}>()
</script>

<template>
	<div>
		<p>{{ text }}</p>
		<ul>
			<li
				v-for="(answer, index) in answers"
				:key="index"
				:class="resolved ? (answer.correct ? 'correct' : 'incorrect') : ''"
			>
				{{ answer.text }}
			</li>
		</ul>
	</div>
</template>

<style scoped>
.correct {
	background-color: #b6f2b6;
}

.incorrect {
	color: #999;
}
</style>
