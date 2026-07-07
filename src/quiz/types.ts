export interface Answer {
  text: string
  correct: boolean
}

export interface Question {
  text: string
  answers: Answer[]
}

export interface Category {
  name: string
  questions: Question[]
}

export interface Quiz {
  title: string
  categories: Category[]
}

export type QuizResult = { ok: true; quiz: Quiz } | { ok: false; message: string }
