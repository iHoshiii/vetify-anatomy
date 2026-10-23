import type { AnatomyQuiz } from '../use-anatomy-quiz'

export default function QuizPanel({ quiz, onReveal, onNext, onExit }: {
  quiz: AnatomyQuiz; onReveal: () => void; onNext: () => void; onExit: () => void
}) {
  const round = quiz.round!
  const answered = ['correct', 'revealed'].includes(round.feedback)
  return <section className="quiz-panel" aria-label="Anatomy quiz">
    <div className="quiz-prompt">
      <span className="note-eyebrow">{round.complete ? 'Practice complete' : `Find the part · ${round.index + 1} of ${round.order.length}`}</span>
      <h2>{round.complete ? `${round.found} of ${round.order.length} found without revealing` : `Find ${quiz.target?.title}`}</h2>
      <p role="status" aria-live="polite">{round.complete ? 'Revisit the study notes, or try another round.'
        : round.feedback === 'correct' ? 'Correct. Explore the note, then continue.'
        : round.feedback === 'revealed' ? 'Answer shown. Use the note to review this part.'
        : round.feedback === 'wrong' ? 'Not quite. Try another dot.' : 'Tap a numbered dot on the diagram.'}</p>
    </div>
    <div className="quiz-actions">
      {!round.complete && (answered ? <button className="note-action" onClick={onNext}>
        {round.index === round.order.length - 1 ? 'Finish' : 'Next part'}
      </button> : <button className="quiet-button" onClick={onReveal}>Show answer</button>)}
      <button className="quiet-button" onClick={onExit}>Exit quiz</button>
    </div>
  </section>
}
