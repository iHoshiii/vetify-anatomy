import { useState } from 'react'
import type { AnatomySystem } from './types/anatomy'

type Round = { order: AnatomySystem[]; index: number; found: number; feedback: 'idle' | 'wrong' | 'correct' | 'revealed'; complete: boolean }
export function useAnatomyQuiz(hotspots: AnatomySystem[]) {
  const [round, setRound] = useState<Round | null>(null)
  const target = round?.order[round.index]
  function start() {
    const order = [...hotspots]
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = order[i]; order[i] = order[j]; order[j] = temp
    }
    setRound({ order, index: 0, found: 0, feedback: 'idle', complete: false })
  }
  function answer(id: string) {
    if (!round || round.complete || ['correct', 'revealed'].includes(round.feedback)) return false
    const correct = id === target?.id
    setRound({ ...round, found: round.found + Number(correct), feedback: correct ? 'correct' : 'wrong' })
    return correct
  }
  function reveal() {
    if (round) setRound({ ...round, feedback: 'revealed' })
    return target
  }
  function next() {
    if (!round || !['correct', 'revealed'].includes(round.feedback)) return
    setRound(round.index === round.order.length - 1 ? { ...round, complete: true }
      : { ...round, index: round.index + 1, feedback: 'idle' })
  }
  return { round, target, start, answer, reveal, next, exit: () => setRound(null) }
}

export type AnatomyQuiz = ReturnType<typeof useAnatomyQuiz>
