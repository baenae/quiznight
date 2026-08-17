<script setup lang="ts">
defineProps<{
	name: string
	progress?: { index: number; total: number } | null
}>()
</script>

<template>
	<div class="category-slide">
		<div class="text-block">
			<p class="label">Kategorie:</p>
			<h1 class="name">{{ name }}</h1>
		</div>
		<p v-if="progress" class="progress">Kategorie {{ progress.index }} von {{ progress.total }}</p>
	</div>
</template>

<style scoped>
.category-slide {
	position: relative;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	background: radial-gradient(75% 75% at 50% 50%, #234f9c 0%, #1c3f7b 25%, #152e5a 50%, #0e1e38 75%, #070e17 100%);
	color: #fff;
	text-align: center;
}

.text-block {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -55%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1vw;
}

.label {
	margin: 0;
	font-family: 'Arial Narrow', Arial, sans-serif;
	font-weight: 700;
	font-size: 2.8vw;
}

.name {
	margin: 0;
	font-family: 'LEMON MILK', sans-serif;
	font-weight: 700;
	font-size: 6.25vw;
	text-shadow: 0 0 2.6vw #00e5ff;
	max-width: 56vw;
}

.progress {
	position: absolute;
	left: 50%;
	bottom: 8vw;
	transform: translateX(-50%);
	margin: 0;
	font-family: 'Arial Narrow', Arial, sans-serif;
	font-weight: 700;
	font-size: 2.8vw;
}
</style>
