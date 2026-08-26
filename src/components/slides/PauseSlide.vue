<script setup lang="ts"></script>

<template>
	<div class="pause-slide">
		<img src="@/assets/background.jpg" alt="" class="background" />
		<p class="brand">QUIZNIGHT</p>
		<p class="title">PAUSE</p>
	</div>
</template>

<style scoped>
.pause-slide {
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

.brand {
	position: absolute;
	left: 50%;
	top: 16.93vw;
	transform: translateX(-50%);
	margin: 0;
	font-family: 'LEMON MILK', sans-serif;
	font-weight: 700;
	font-size: 3.125vw;
	letter-spacing: 0.9375vw;
	color: #fff;
	white-space: nowrap;
	opacity: 0;
	animation:
		glow-pulse 4s ease-in-out infinite,
		title-reveal 0.5s ease-out 1s forwards;
}

.title {
	position: absolute;
	left: 50%;
	top: 19.06vw;
	transform: translateX(-50%);
	margin: 0;
	width: 63.75vw;
	text-align: center;
	font-family: 'LEMON MILK', sans-serif;
	font-weight: 700;
	font-size: 11.98vw;
	letter-spacing: 3.59vw;
	color: transparent;
	-webkit-text-stroke: 0.15vw #fff;
	opacity: 0;
	animation:
		glow-pulse 20s ease-in-out infinite,
		title-reveal 0.5s ease-out 3s forwards;
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

@keyframes title-reveal {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
</style>
