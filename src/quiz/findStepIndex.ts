import type { Step } from './buildSteps'

export function findStepIndex(steps: Step[], categoryIndex: number, questionIndex?: number): number | null {
	const index = steps.findIndex((step) => {
		if (questionIndex === undefined) {
			return step.type === 'category' && step.categoryIndex === categoryIndex
		}
		return (
			step.type === 'question' &&
			step.categoryIndex === categoryIndex &&
			step.questionIndex === questionIndex &&
			step.phase === 'intro'
		)
	})

	return index === -1 ? null : index
}
