import { describe, expect, it } from 'vitest'
import { areSolverFollowUpsComplete, areSolverProblemsComplete, getStepByStepSolverSessionView, isValidStepByStepSolverConfig, normalizeSolverAnswer } from './step-by-step-solver-engine.js'

const config = {
  problems: [{
    id: 1,
    prompt: 'Solve 2x + 3 = 11.',
    steps: [
      { id: 1, instruction: 'Subtract 3 from both sides.', explanation: 'Keep the equation balanced.', hint: 'Undo the addition.', correctiveFeedback: 'Subtract 3 from each side.', correctAnswer: '2x = 8' },
      { id: 2, instruction: 'Divide both sides by 2.', explanation: 'Isolate x.', hint: 'Undo multiplication by 2.', correctiveFeedback: 'Divide each side by 2.', correctAnswer: 'x = 4' },
    ],
    followUpQuestions: [{ id: 1, prompt: 'Solve 3x = 12.', correctAnswer: 'x = 4', explanation: 'Divide by 3.', correctiveFeedback: 'Divide both sides by 3.' }],
  }],
}

describe('step-by-step solver helpers', () => {
  it('validates authored problem content and unique item ids', () => {
    expect(isValidStepByStepSolverConfig(config)).toBe(true)
    const invalid = structuredClone(config)
    invalid.problems[0].steps[1].id = 1
    expect(isValidStepByStepSolverConfig(invalid)).toBe(false)
  })

  it('normalizes whitespace and case while preserving mathematical content', () => {
    expect(normalizeSolverAnswer('  X = 4 ')).toBe(normalizeSolverAnswer('x=4'))
    expect(normalizeSolverAnswer('x = 4')).not.toBe(normalizeSolverAnswer('x = 5'))
  })

  it('releases only the active instruction and already revealed answers', () => {
    const view = getStepByStepSolverSessionView({
      id: 7,
      problem_id: 1,
      current_step: 1,
      revealed_steps: [{ index: 0, instruction: config.problems[0].steps[0].instruction, correctAnswer: '2x = 8', explanation: 'Keep the equation balanced.' }],
      follow_up_results: {},
      completed_at: null,
    }, config.problems[0])
    expect(view.revealedSteps).toHaveLength(1)
    expect(view.activeStep).toEqual({ index: 1, instruction: 'Divide both sides by 2.' })
    expect(view.activeStep).not.toHaveProperty('correctAnswer')
    expect(view.followUpQuestions).toEqual([])
  })

  it('requires every teacher-authored follow-up before completion', () => {
    const problem = { ...config.problems[0], followUpQuestions: [...config.problems[0].followUpQuestions, { id: 2, prompt: 'Solve y + 2 = 5.', correctAnswer: 'y = 3', explanation: 'Subtract 2.', correctiveFeedback: 'Subtract 2 from both sides.' }] }
    expect(areSolverFollowUpsComplete(problem, { '1': { correct: true } })).toBe(false)
    expect(areSolverFollowUpsComplete(problem, { '1': { correct: true }, '2': { correct: true } })).toBe(true)
  })

  it('requires every worked problem before the lesson is complete', () => {
    const problems = [config.problems[0], { ...config.problems[0], id: 2 }]
    expect(areSolverProblemsComplete(problems, [1])).toBe(false)
    expect(areSolverProblemsComplete(problems, [1, 2])).toBe(true)
    expect(areSolverProblemsComplete([], [])).toBe(false)
  })
})
