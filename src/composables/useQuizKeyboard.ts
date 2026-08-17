import { onMounted, onUnmounted } from 'vue'

export function useQuizKeyboard(onNext: () => void, onPrev: () => void) {
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === ' ' || event.key === 'ArrowRight') {
			event.preventDefault()
			onNext()
		} else if (event.key === 'Backspace' || event.key === 'ArrowLeft') {
			event.preventDefault()
			onPrev()
		}
	}

	onMounted(() => {
		window.addEventListener('keydown', handleKeydown)
	})

	onUnmounted(() => {
		window.removeEventListener('keydown', handleKeydown)
	})
}
