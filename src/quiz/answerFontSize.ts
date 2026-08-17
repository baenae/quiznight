export function answerFontSize(text: string): number {
	if (text.length > 50) return 54
	if (text.length > 20) return 64
	return 72
}