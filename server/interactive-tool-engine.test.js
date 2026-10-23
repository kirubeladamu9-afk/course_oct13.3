import { describe, expect, it } from 'vitest'
import { getPublicSolverStep, getSolverFeedback, getSolverHint, getSolverResult, parseInteractiveProblem, validateSolverStep } from './interactive-tool-engine.js'

const solve = (subject, toolType, difficulty, problem) => parseInteractiveProblem({ subject, toolType, difficulty, problem })

describe('interactive solver engine', () => {
  it('solves linear equations with exact fractions and accepts equivalent steps', () => {
    const result = solve('Mathematics', 'step-by-step-solver', 'Beginner', '2x + 3 = 11')
    expect(result.ok).toBe(true)
    expect(result.solution.finalAnswer).toBe('x = 4')
    expect(validateSolverStep(result.solution.steps[0], '2x = 8')).toBe(true)
    expect(validateSolverStep(result.solution.steps[0], '2x = 7')).toBe(false)
    expect(getSolverFeedback(result.solution.steps[0], result.solution)).toContain('same operation to both sides')
  })

  it('solves supported word problems with a translation step', () => {
    const result = solve('Mathematics', 'word-problems', 'Beginner', 'A number plus 3 is 11.')
    expect(result.ok).toBe(true)
    expect(result.solution.steps).toHaveLength(3)
    expect(validateSolverStep(result.solution.steps[0], 'x + 3 = 11')).toBe(true)
    expect(result.solution.finalAnswer).toContain('8')
  })

  it('accepts intermediate fractions and advanced systems but gates them by difficulty', () => {
    expect(solve('Mathematics', 'step-by-step-solver', 'Beginner', 'x/2 + 1 = 4').ok).toBe(false)
    const fractionResult = solve('Mathematics', 'step-by-step-solver', 'Intermediate', 'x/2 + 1 = 4')
    expect(fractionResult.ok && fractionResult.solution.finalAnswer).toBe('x = 6')
    const exactFraction = solve('Mathematics', 'step-by-step-solver', 'Intermediate', '2x = 3')
    expect(exactFraction.ok && exactFraction.solution.finalAnswer).toBe('x = 3/2')
    const system = solve('Mathematics', 'step-by-step-solver', 'Advanced', 'x + y = 5; x - y = 1')
    expect(system.ok && system.solution.finalAnswer).toBe('x = 3, y = 2')
    const quadratic = solve('Mathematics', 'step-by-step-solver', 'Advanced', 'x^2 - 7x + 12 = 0')
    expect(quadratic.ok && quadratic.solution.finalAnswer).toBe('x = 4, x = 3')
  })

  it('solves supported starter topics in Physics, Chemistry, and Biology', () => {
    const physics = solve('Physics', 'word-problems', 'Beginner', 'A car travels 120 meters in 2 seconds. Find its speed.')
    const chemistry = solve('Chemistry', 'step-by-step-solver', 'Beginner', 'H2 + O2 -> H2O')
    const biology = solve('Biology', 'word-problems', 'Beginner', 'Cross Aa with aa. Find the genotype ratio.')
    expect(physics.ok && physics.solution.finalAnswer).toBe('speed = 60')
    expect(chemistry.ok && chemistry.solution.finalAnswer).toBe('2H2 + O2 → 2H2O')
    expect(biology.ok && biology.solution.finalAnswer).toContain('Aa: 2/4, aa: 2/4')
  })

  it('rejects unsupported subjects and problem forms without exposing answers', () => {
    expect(solve('Other', 'word-problems', 'Beginner', 'anything').message).toContain('No solver is available')
    const unsupported = solve('Mathematics', 'step-by-step-solver', 'Beginner', 'find a cure for this disease')
    expect(unsupported.ok).toBe(false)
    expect(unsupported.message).not.toContain('x =')
  })

  it('releases only the active step and returns graduated hints', () => {
    const result = solve('Mathematics', 'step-by-step-solver', 'Beginner', '2x + 3 = 11')
    expect(getPublicSolverStep(result.solution, 0, 'Practice')).not.toHaveProperty('reasoning')
    expect(getPublicSolverStep(result.solution, 0, 'Guided')).toHaveProperty('reasoning')
    expect(getPublicSolverStep(result.solution, 1).prompt).toBe('Enter the value of x.')
    expect(getSolverHint(result.solution.steps[0], 1)).not.toBe(getSolverHint(result.solution.steps[0], 3))
    expect(getSolverResult(result.solution)).toMatchObject({ finalAnswer: 'x = 4', topic: 'Linear equations' })
  })
})
