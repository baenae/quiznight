<script setup lang="ts"></script>

<template>
	<div class="start-slide">
		<img src="@/assets/background.jpg" alt="" class="background" />
		<div class="content">
			<h1 class="title">QUIZNIGHT</h1>
			<p class="byline">by Bänä – EST. 2019</p>
		</div>
	</div>
</template>

<style scoped>
.start-slide {
	position: relative;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	background-color: #060b1b;
}

.background {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.content {
	position: absolute;
	left: 50%;
	top: 40.42vw;
	transform: translateX(-50%);
	text-align: center;
}

.title {
	margin: 0;
	font-family: 'LEMON MILK', sans-serif;
	font-weight: 700;
	font-size: 6.25vw;
	letter-spacing: 1.875vw;
	color: #fff;
	white-space: nowrap;
	animation: glow-pulse 4s ease-in-out infinite;
}

@keyframes glow-pulse {
	0%,
	100% {
		text-shadow: 0 0 2.6vw #fd029d;
	}
	50% {
		text-shadow: 0 0 2.6vw #00e5ff;
	}
}

.byline {
	margin: 4vw 0 0;
	font-weight: 700;
	font-size: 1.25vw;
	letter-spacing: 0.375vw;
	color: #36a9bc;
}
</style>
