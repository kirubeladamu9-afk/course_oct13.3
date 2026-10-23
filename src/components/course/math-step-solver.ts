export type MathSolverTask = 'automatic' | 'equation' | 'arithmetic' | 'geometry'
export type MathSolverAnswerType = 'number' | 'text' | 'equation'

export interface MathSolverStep {
  title: string
  reasoning: string
  formula?: string
  prompt: string
  hint: string
  expectedAnswer: string
  answerType: MathSolverAnswerType
  acceptedAnswers?: string[]
}

export interface MathSolverSolution {
  steps: MathSolverStep[]
  answer: string
  explanation: string
  practiceProblem: string
}

export interface LinearExpression {
  coefficient: number
  constant: number
}

const round = (value: number) => Math.round(value * 1e8) / 1e8
const formatNumber = (value: number) => String(Number(round(value).toFixed(8)))
const tokenize = (source: string) => {
  const compact = source.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/')
  const tokens = compact.match(/(?:\d+(?:\.\d*)?|\.\d+)|[xX]|[()+\-*/]/g) ?? []
  return tokens.join('') === compact ? tokens : []
}

export const parseLinearExpression = (source: string): LinearExpression | null => {
  const tokens = tokenize(source.replace(/\s+/g, ''))
  if (!tokens.length) return null
  let position = 0
  const parsePrimary = (): LinearExpression | null => {
    const token = tokens[position++]
    if (token === undefined) return null
    if (token === '+' || token === '-') {
      const value = parsePrimary()
      return value ? { coefficient: value.coefficient * (token === '-' ? -1 : 1), constant: value.constant * (token === '-' ? -1 : 1) } : null
    }
    if (token === '(') {
      const value = parseExpression()
      if (tokens[position++] !== ')') return null
      return value
    }
    if (/^[xX]$/.test(token)) return { coefficient: 1, constant: 0 }
    if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) return { coefficient: 0, constant: Number(token) }
    return null
  }
  const startsPrimary = (token: string | undefined) => token !== undefined && (token === '(' || token === 'x' || token === 'X' || /^\d|^\./.test(token))
  const multiply = (left: LinearExpression, right: LinearExpression): LinearExpression | null => {
    if (left.coefficient && right.coefficient) return null
    return { coefficient: left.coefficient * right.constant + right.coefficient * left.constant, constant: left.constant * right.constant }
  }
  const divide = (left: LinearExpression, right: LinearExpression): LinearExpression | null => right.coefficient === 0 && right.constant !== 0
    ? { coefficient: left.coefficient / right.constant, constant: left.constant / right.constant }
    : null
  const parseTerm = (): LinearExpression | null => {
    let value = parsePrimary()
    if (!value) return null
    while (position < tokens.length) {
      const operator = tokens[position]
      if (operator === '*' || operator === '/' || startsPrimary(operator)) {
        if (operator === '*' || operator === '/') position += 1
        const next = parsePrimary()
        if (!next) return null
        value = operator === '/' ? divide(value, next) : multiply(value, next)
        if (!value) return null
      } else break
    }
    return value
  }
  const parseExpression = (): LinearExpression | null => {
    let value = parseTerm()
    if (!value) return null
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position++]
      const next = parseTerm()
      if (!next) return null
      value = { coefficient: value.coefficient + (operator === '+' ? 1 : -1) * next.coefficient, constant: value.constant + (operator === '+' ? 1 : -1) * next.constant }
    }
    return value
  }
  const result = parseExpression()
  return result && position === tokens.length && Number.isFinite(result.coefficient) && Number.isFinite(result.constant) ? { coefficient: round(result.coefficient), constant: round(result.constant) } : null
}

const formatLinear = ({ coefficient, constant }: LinearExpression) => {
  if (coefficient === 0) return formatNumber(constant)
  const variable = coefficient === 1 ? 'x' : coefficient === -1 ? '-x' : `${formatNumber(coefficient)}x`
  if (constant === 0) return variable
  return `${variable}${constant > 0 ? '+' : ''}${formatNumber(constant)}`
}

const parseEquation = (source: string) => {
  const parts = source.split('=')
  if (parts.length !== 2) return null
  const left = parseLinearExpression(parts[0])
  const right = parseLinearExpression(parts[1])
  return left && right ? { left, right } : null
}

const normalizeAnswer = (value: string) => value.toLowerCase().replace(/×/g, '*').replace(/\s+/g, '').replace(/−/g, '-')
const isSameEquation = (actual: string, expected: string) => {
  const a = parseEquation(actual)
  const b = parseEquation(expected)
  return Boolean(a && b && Math.abs(a.left.coefficient - b.left.coefficient) < 1e-8 && Math.abs(a.left.constant - b.left.constant) < 1e-8 && Math.abs(a.right.coefficient - b.right.coefficient) < 1e-8 && Math.abs(a.right.constant - b.right.constant) < 1e-8)
}

export const isMathSolverAnswerCorrect = (step: MathSolverStep, answer: string) => {
  if (step.answerType === 'number') {
    const numericAnswer = Number(answer.trim())
    return Number.isFinite(numericAnswer) && Math.abs(numericAnswer - Number(step.expectedAnswer)) < 1e-6
  }
  if (step.answerType === 'equation') return isSameEquation(answer, step.expectedAnswer)
  const accepted = [step.expectedAnswer, ...(step.acceptedAnswers ?? [])].map(normalizeAnswer)
  return accepted.includes(normalizeAnswer(answer))
}

const equationSolution = (problem: string): MathSolverSolution | null => {
  const sides = parseEquation(problem)
  if (!sides) return null
  const coefficient = round(sides.left.coefficient - sides.right.coefficient)
  const result = round(sides.right.constant - sides.left.constant)
  if (Math.abs(coefficient) < 1e-8) return null
  const simplifiedLeft = formatLinear(sides.left)
  const simplifiedRight = formatLinear(sides.right)
  const reduced = `${formatLinear({ coefficient, constant: 0 })}=${formatNumber(result)}`
  const answer = formatNumber(result / coefficient)
  return {
    steps: [
      { title: 'Simplify both sides', reasoning: 'Combine like terms before solving, while keeping each side of the equation balanced.', formula: `${problem} → ${simplifiedLeft} = ${simplifiedRight}`, prompt: 'Enter the simplified equation.', hint: 'Combine the x-terms and the constants separately on each side.', expectedAnswer: `${simplifiedLeft}=${simplifiedRight}`, answerType: 'equation' },
      { title: 'Isolate the variable', reasoning: 'Move variable terms to the left and constants to the right, then divide both sides by the coefficient of x.', formula: `${simplifiedLeft} = ${simplifiedRight} → ${reduced} → x = ${answer}`, prompt: 'Enter the value of x.', hint: `Subtract the right-side x coefficient from the left, move the left constant to the right, then divide by ${formatNumber(coefficient)}.`, expectedAnswer: answer, answerType: 'number' },
    ],
    answer: `x = ${answer}`,
    explanation: `After simplifying, ${reduced}. Dividing both sides by ${formatNumber(coefficient)} gives x = ${answer}.`,
    practiceProblem: `${formatNumber(coefficient)}x + ${formatNumber(result)} = ${formatNumber(result * 2)}`,
  }
}

const evaluateArithmetic = (problem: string) => {
  const parsed = parseLinearExpression(problem)
  return parsed && Math.abs(parsed.coefficient) < 1e-8 ? parsed.constant : null
}

const arithmeticSolution = (problem: string): MathSolverSolution | null => {
  const value = evaluateArithmetic(problem)
  if (value === null) return null
  const answer = formatNumber(value)
  return {
    steps: [{ title: 'Evaluate the expression', reasoning: 'Use the order of operations: parentheses, multiplication and division, then addition and subtraction.', formula: problem, prompt: 'Enter the value of the expression.', hint: 'Work from the innermost parentheses, then multiply or divide before adding or subtracting.', expectedAnswer: answer, answerType: 'number' }],
    answer,
    explanation: `Following the order of operations, ${problem} = ${answer}.`,
    practiceProblem: problem.includes('*') || problem.includes('×') ? '6 × 4 + 8 ÷ 2' : '18 - 3 × 4 + 2',
  }
}

type GeometryResult = { formula: string; substitution: string; answer: number; unit: string; title: string }
const solveGeometry = (problem: string): GeometryResult | null => {
  const source = problem.toLowerCase().replace(/,/g, ' ')
  const values = (key: string) => source.match(new RegExp(`${key}\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)`))?.[1]
  const length = Number(values('length'))
  const width = Number(values('width'))
  if (/rectangle/.test(source) && Number.isFinite(length) && Number.isFinite(width)) {
    if (/perimeter/.test(source)) return { formula: 'P = 2(l + w)', substitution: `P = 2(${length} + ${width})`, answer: 2 * (length + width), unit: 'units', title: 'Calculate the rectangle perimeter' }
    if (/area/.test(source)) return { formula: 'A = l × w', substitution: `A = ${length} × ${width}`, answer: length * width, unit: 'square units', title: 'Calculate the rectangle area' }
  }
  const base = Number(values('base'))
  const height = Number(values('height'))
  if (/triangle/.test(source) && /area/.test(source) && Number.isFinite(base) && Number.isFinite(height)) return { formula: 'A = (b × h) ÷ 2', substitution: `A = (${base} × ${height}) ÷ 2`, answer: (base * height) / 2, unit: 'square units', title: 'Calculate the triangle area' }
  const radius = Number(values('radius'))
  if (/circle/.test(source) && /area/.test(source) && Number.isFinite(radius)) return { formula: 'A = πr²', substitution: `A = π × ${radius}²`, answer: Math.PI * radius ** 2, unit: 'square units', title: 'Calculate the circle area' }
  const a = Number(values('a'))
  const b = Number(values('b'))
  if (/right triangle|hypotenuse|pythagorean/.test(source) && Number.isFinite(a) && Number.isFinite(b)) return { formula: 'c = √(a² + b²)', substitution: `c = √(${a}² + ${b}²)`, answer: Math.sqrt(a ** 2 + b ** 2), unit: 'units', title: 'Find the hypotenuse' }
  return null
}

const geometrySolution = (problem: string): MathSolverSolution | null => {
  const result = solveGeometry(problem)
  if (!result) return null
  const answer = formatNumber(result.answer)
  return {
    steps: [
      { title: 'Choose the formula', reasoning: 'Identify the shape and the measurement the problem asks for.', formula: result.formula, prompt: 'Enter the formula shown.', hint: 'Use the displayed relationship between the given dimensions and the requested measurement.', expectedAnswer: result.formula, answerType: 'text', acceptedAnswers: [result.formula.replace(/ × /g, '*').replace(/ ÷ /g, '/')] },
      { title: 'Substitute the known values', reasoning: 'Replace each variable in the formula with the measurements given in the problem.', formula: result.substitution, prompt: 'Calculate the result using the substituted values.', hint: `Evaluate ${result.substitution}.`, expectedAnswer: answer, answerType: 'number' },
    ],
    answer: `${answer} ${result.unit}`,
    explanation: `Use ${result.formula}, substitute the known measurements to get ${result.substitution}, and calculate ${answer} ${result.unit}.`,
    practiceProblem: result.title.includes('rectangle') ? 'Find the area of a rectangle with length=7 and width=4.' : result.title.includes('triangle') ? 'Find the area of a triangle with base=12 and height=5.' : result.title.includes('circle') ? 'Find the area of a circle with radius=3.' : 'Find the hypotenuse of a right triangle with a=5 and b=12.',
  }
}

export const solveMathProblem = (problem: string, task: MathSolverTask = 'automatic'): MathSolverSolution | null => {
  const normalizedTask = task === 'automatic'
    ? /rectangle|triangle|circle|hypotenuse|pythagorean/i.test(problem) ? 'geometry' : problem.includes('=') ? 'equation' : 'arithmetic'
    : task
  if (normalizedTask === 'geometry') return geometrySolution(problem)
  if (normalizedTask === 'equation') return equationSolution(problem)
  return arithmeticSolution(problem)
}
