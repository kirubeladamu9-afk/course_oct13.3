import { describe, expect, it } from 'vitest'
import { isMathSolverAnswerCorrect, parseLinearExpression, solveMathProblem } from './math-step-solver'

describe('parseLinearExpression', () => {
  it('parses arithmetic, parentheses, and implicit multiplication', () => {
    expect(parseLinearExpression('3(x - 2) + 4')).toEqual({ coefficient: 3, constant: -2 })
    expect(parseLinearExpression('18 - 3 * 4 + 2')).toEqual({ coefficient: 0, constant: 8 })
  })

  it('rejects nonlinear and malformed expressions', () => {
    expect(parseLinearExpression('x*x')).toBeNull()
    expect(parseLinearExpression('x^2')).toBeNull()
    expect(parseLinearExpression('2 + )')).toBeNull()
  })
})

describe('solveMathProblem', () => {
  it('builds guided steps for a linear equation and checks numerical answers', () => {
    const solution = solveMathProblem('3x + 2 = 14')
    expect(solution?.steps).toHaveLength(2)
    expect(solution?.steps[0].expectedAnswer).toBe('3x+2=14')
    expect(isMathSolverAnswerCorrect(solution!.steps[1], '4')).toBe(true)
    expect(isMathSolverAnswerCorrect(solution!.steps[1], '5')).toBe(false)
    expect(solution?.answer).toBe('x = 4')
  })

  it('handles parenthesized equations and equation-equivalence checks', () => {
    const solution = solveMathProblem('3(x - 2) = 12')
    expect(solution?.steps[0].expectedAnswer).toBe('3x-6=12')
    expect(isMathSolverAnswerCorrect(solution!.steps[0], '3x - 6 = 12')).toBe(true)
    expect(solution?.answer).toBe('x = 6')
  })

  it('solves arithmetic and supported geometry tasks', () => {
    expect(solveMathProblem('18 - 3 × 4 + 2')?.answer).toBe('8')
    const geometry = solveMathProblem('Find the area of a rectangle with length=8 and width=5.')
    expect(geometry?.answer).toBe('40 square units')
    expect(isMathSolverAnswerCorrect(geometry!.steps[0], 'A = l × w')).toBe(true)
  })

  it('returns no solution for unsupported or undefined problems', () => {
    expect(solveMathProblem('x*x = 9')).toBeNull()
    expect(solveMathProblem('find a rectangle')).toBeNull()
  })
})
