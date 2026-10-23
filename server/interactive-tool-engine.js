const abs = (value) => value < 0n ? -value : value
const gcd = (left, right) => {
  let a = abs(left)
  let b = abs(right)
  while (b) [a, b] = [b, a % b]
  return a || 1n
}
const fraction = (numerator, denominator = 1n) => {
  if (denominator === 0n) throw new Error('Division by zero.')
  const sign = denominator < 0n ? -1n : 1n
  const divisor = gcd(numerator, denominator)
  return { n: numerator / divisor * sign, d: abs(denominator) / divisor }
}
const add = (a, b) => fraction(a.n * b.d + b.n * a.d, a.d * b.d)
const subtract = (a, b) => add(a, fraction(-b.n, b.d))
const multiply = (a, b) => fraction(a.n * b.n, a.d * b.d)
const divide = (a, b) => fraction(a.n * b.d, a.d * b.n)
const negate = (value) => fraction(-value.n, value.d)
const isZero = (value) => value.n === 0n
const parseFraction = (value) => {
  const normalized = String(value).trim().replace(/−/g, '-').replace(/,/g, '')
  const fractionMatch = normalized.match(/^([+-]?\d+)\s*\/\s*(\d+)$/)
  if (fractionMatch && BigInt(fractionMatch[2]) !== 0n) return fraction(BigInt(fractionMatch[1]), BigInt(fractionMatch[2]))
  const decimalMatch = normalized.match(/^([+-]?)(\d+)(?:\.(\d+))?$/)
  if (!decimalMatch) return null
  const places = decimalMatch[3]?.length ?? 0
  const denominator = 10n ** BigInt(places)
  const whole = BigInt(decimalMatch[2]) * denominator + BigInt(decimalMatch[3] ?? '0')
  return fraction(decimalMatch[1] === '-' ? -whole : whole, denominator)
}
const formatFraction = (value) => value.d === 1n ? String(value.n) : `${value.n}/${value.d}`
const formatTerm = (coefficient, variable) => isZero(coefficient) ? '' : `${formatFraction(coefficient)}${variable}`
const constantPoly = (value) => ({ c: value, x: fraction(0n), y: fraction(0n) })
const addPoly = (a, b) => ({ c: add(a.c, b.c), x: add(a.x, b.x), y: add(a.y, b.y) })
const subtractPoly = (a, b) => ({ c: subtract(a.c, b.c), x: subtract(a.x, b.x), y: subtract(a.y, b.y) })
const multiplyPoly = (a, b) => {
  const aConstant = isZero(a.x) && isZero(a.y)
  const bConstant = isZero(b.x) && isZero(b.y)
  if (!aConstant && !bConstant) return null
  const variable = aConstant ? b : a
  const scalar = aConstant ? a.c : b.c
  return { c: multiply(a.c, b.c), x: multiply(variable.x, scalar), y: multiply(variable.y, scalar) }
}
const dividePoly = (a, b) => isZero(b.x) && isZero(b.y) && !isZero(b.c)
  ? { c: divide(a.c, b.c), x: divide(a.x, b.c), y: divide(a.y, b.c) }
  : null

const parseLinearExpression = (source) => {
  const compact = source.toLowerCase().replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/')
  const tokens = compact.match(/(?:\d+(?:\.\d*)?|\.\d+)|[xy()+\-*/]/g) ?? []
  if (!tokens.length || tokens.join('') !== compact) return null
  let position = 0
  const startsPrimary = (token) => token !== undefined && (token === '(' || token === 'x' || token === 'y' || /^\d|^\./.test(token))
  const parseExpression = () => {
    const parsePrimary = () => {
      const token = tokens[position++]
      if (token === '+' || token === '-') {
        const value = parsePrimary()
        if (!value) return null
        return token === '-' ? { c: negate(value.c), x: negate(value.x), y: negate(value.y) } : value
      }
      if (token === '(') {
        const value = parseExpression()
        if (!value || tokens[position++] !== ')') return null
        return value
      }
      if (token === 'x' || token === 'y') return { ...constantPoly(fraction(0n)), [token]: fraction(1n) }
      const numeric = parseFraction(token)
      return numeric ? constantPoly(numeric) : null
    }
    const parseTerm = () => {
      let value = parsePrimary()
      if (!value) return null
      while (position < tokens.length && (tokens[position] === '*' || tokens[position] === '/' || startsPrimary(tokens[position]))) {
        const operator = tokens[position]
        if (operator === '*' || operator === '/') position += 1
        const right = parsePrimary()
        if (!right) return null
        value = operator === '/' ? dividePoly(value, right) : multiplyPoly(value, right)
        if (!value) return null
      }
      return value
    }
    let value = parseTerm()
    if (!value) return null
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position++]
      const right = parseTerm()
      if (!right) return null
      value = operator === '+' ? addPoly(value, right) : subtractPoly(value, right)
    }
    return value
  }
  const result = parseExpression()
  return result && position === tokens.length ? result : null
}

const parseLinearEquation = (problem) => {
  const sides = problem.split('=')
  if (sides.length !== 2) return null
  const left = parseLinearExpression(sides[0])
  const right = parseLinearExpression(sides[1])
  return left && right ? { left, right, x: subtract(left.x, right.x), y: subtract(left.y, right.y), c: subtract(right.c, left.c) } : null
}
const equationsEquivalent = (actual, original) => {
  const a = parseLinearEquation(actual)
  const b = parseLinearEquation(original)
  if (!a || !b || isZero(a.x) && isZero(a.y) || isZero(b.x) && isZero(b.y)) return false
  if (!isZero(b.x)) return isZero(subtract(multiply(a.y, b.x), multiply(b.y, a.x))) && isZero(subtract(multiply(a.c, b.x), multiply(b.c, a.x)))
  return isZero(subtract(multiply(a.x, b.y), multiply(b.x, a.y))) && isZero(subtract(multiply(a.c, b.y), multiply(b.c, a.y)))
}
const equationFromCoefficients = (coefficient, result, variable = 'x') => `${formatTerm(coefficient, variable)} = ${formatFraction(result)}`
const integerSquareRoot = (value) => {
  if (value < 2n) return value
  let current = value
  let next = (current + 1n) >> 1n
  while (next < current) {
    current = next
    next = (current + value / current) >> 1n
  }
  return current
}
const squareRootFraction = (value) => {
  if (value.n < 0n) return null
  const numerator = integerSquareRoot(value.n)
  const denominator = integerSquareRoot(value.d)
  return numerator * numerator === value.n && denominator * denominator === value.d ? fraction(numerator, denominator) : null
}
const parseQuadraticExpression = (source) => {
  const compact = source.toLowerCase().replace(/\s+/g, '')
  const terms = compact.match(/[+-]?[^+-]+/g)
  if (!terms || terms.join('') !== compact) return null
  const result = { a: fraction(0n), b: fraction(0n), c: fraction(0n) }
  for (const term of terms) {
    const negative = term.startsWith('-')
    const body = term.replace(/^[+-]/, '')
    const target = body.endsWith('x^2') ? 'a' : body.endsWith('x') ? 'b' : 'c'
    const numeric = target === 'c' ? body : body.slice(0, target === 'a' ? -3 : -1)
    const coefficient = numeric ? parseFraction(numeric) : fraction(1n)
    if (!coefficient) return null
    result[target] = add(result[target], negative ? negate(coefficient) : coefficient)
  }
  return result
}
const solveQuadratic = (problem, toolType) => {
  const sides = problem.split('=')
  if (sides.length !== 2) return null
  const left = parseQuadraticExpression(sides[0])
  const right = parseQuadraticExpression(sides[1])
  if (!left || !right) return null
  const a = subtract(left.a, right.a)
  const b = subtract(left.b, right.b)
  const c = subtract(left.c, right.c)
  if (isZero(a)) return null
  const discriminant = subtract(multiply(b, b), multiply(fraction(4n), multiply(a, c)))
  const root = squareRootFraction(discriminant)
  if (!root) return null
  const denominator = multiply(fraction(2n), a)
  const firstRoot = divide(add(negate(b), root), denominator)
  const secondRoot = divide(subtract(negate(b), root), denominator)
  const first = formatFraction(firstRoot)
  const second = formatFraction(secondRoot)
  const roots = isZero(subtract(firstRoot, secondRoot)) ? `x = ${first}` : `x = ${first}, x = ${second}`
  return solution('Mathematics', toolType, problem, 'Quadratic equations', [
    makeStep('Calculate the discriminant', 'Enter the discriminant b² − 4ac.', { value: formatFraction(discriminant) }, 'number', 'The discriminant determines whether the quadratic has real roots.', ['Identify a, b, and c in ax² + bx + c = 0.', 'Calculate b² and 4ac.', 'Subtract 4ac from b².'], 'Quadratic equations'),
    makeStep('Apply the quadratic formula', 'Enter the real solution value(s) for x.', { text: roots }, 'text', 'Substitute the coefficients and the square root of the discriminant into the quadratic formula.', ['Use x = (−b ± √D) ÷ 2a.', 'Evaluate both signs of the square root.', 'Check each root in the original equation.'], 'Quadratic equations'),
  ], roots, `For ${formatFraction(a)}x² + ${formatFraction(b)}x + ${formatFraction(c)} = 0, the discriminant is ${formatFraction(discriminant)}. Applying the quadratic formula gives ${roots}.`, 'x^2 - 7x + 12 = 0')
}

const makeStep = (title, prompt, expected, answerType, reasoning, hints, topic) => ({ title, prompt, expected, answerType, reasoning, hints, topic })
const solution = (subject, toolType, problem, topic, steps, finalAnswer, explanation, similarProblem) => ({ subject, toolType, problem, topic, steps, finalAnswer, explanation, similarProblem })

const solveMathEquation = (problem, difficulty, toolType) => {
  const equation = parseLinearEquation(problem)
  if (!equation || isZero(equation.x) || !isZero(equation.y)) return null
  const source = problem.toLowerCase()
  const multiplyStep = abs(equation.x.n) !== equation.x.d ? 1 : 0
  const additiveSteps = (source.match(/[+-]/g) ?? []).length
  if (difficulty === 'Beginner' && (source.includes('(') || source.includes('/') || !isZero(equation.right.x) || additiveSteps + multiplyStep > 2)) return null
  if (difficulty === 'Intermediate' && /\^|\b(?:system|simultaneous)\b/.test(source)) return null
  const simplifiedEquation = equationFromCoefficients(equation.x, equation.c)
  const answer = divide(equation.c, equation.x)
  const firstStep = makeStep('Collect variable terms', 'Enter the equivalent equation with variable terms collected on the left.', { equation: simplifiedEquation, original: problem }, 'equation', 'Apply the same operation to both sides and combine like terms.', ['Move variable terms to one side and constants to the other.', 'Combine like terms on each side.', 'Check that the same operations were applied to both sides.'], 'Linear equations')
  const finalStep = makeStep('Solve for x', 'Enter the value of x.', { value: formatFraction(answer) }, 'number', 'Divide both sides by the coefficient of x.', ['The coefficient multiplying x is the number attached to the variable.', `Divide both sides by ${formatFraction(equation.x)}.`, 'Check your value by substituting it into the original equation.'], 'Linear equations')
  const steps = isZero(equation.c) ? [finalStep] : [firstStep, finalStep]
  const explanation = `The equation reduces to ${simplifiedEquation}. Dividing both sides by ${formatFraction(equation.x)} gives x = ${formatFraction(answer)}.`
  const similarProblem = `${formatFraction(equation.x)}x + ${formatFraction(equation.c)} = ${formatFraction(multiply(equation.c, fraction(2n)))}`
  return solution('Mathematics', toolType, problem, 'Linear equations', steps, `x = ${formatFraction(answer)}`, explanation, similarProblem)
}

const parseMathWordProblem = (problem) => {
  const source = problem.toLowerCase().replace(/,/g, '')
  let match = source.match(/(?:a number|some number)\s+(?:plus|increased by)\s+(\d+(?:\.\d+)?)\s+(?:is|equals|makes)\s+(\d+(?:\.\d+)?)/)
  if (match) return `x + ${match[1]} = ${match[2]}`
  match = source.match(/(\d+(?:\.\d+)?)\s+more than (?:a number|some number)\s+(?:is|equals)\s+(\d+(?:\.\d+)?)/)
  if (match) return `x + ${match[1]} = ${match[2]}`
  match = source.match(/(?:a number|some number)\s+(?:minus|decreased by)\s+(\d+(?:\.\d+)?)\s+(?:is|equals)\s+(\d+(?:\.\d+)?)/)
  if (match) return `x - ${match[1]} = ${match[2]}`
  match = source.match(/(\d+(?:\.\d+)?)\s+less than (?:a number|some number)\s+(?:is|equals)\s+(\d+(?:\.\d+)?)/)
  if (match) return `x - ${match[1]} = ${match[2]}`
  match = source.match(/(?:twice|double) (?:a number|some number)\s+(?:plus|increased by)\s+(\d+(?:\.\d+)?)\s+(?:is|equals)\s+(\d+(?:\.\d+)?)/)
  if (match) return `2x + ${match[1]} = ${match[2]}`
  return null
}

const solveMathSystem = (problem, toolType) => {
  const equations = problem.split(/[;\n]+/).map((part) => part.trim()).filter(Boolean)
  if (equations.length !== 2) return null
  const [first, second] = equations.map(parseLinearEquation)
  if (!first || !second || isZero(first.x) && isZero(first.y) || isZero(second.x) && isZero(second.y)) return null
  const xCoefficient = subtract(multiply(first.x, second.y), multiply(second.x, first.y))
  if (isZero(xCoefficient)) return null
  const xResult = subtract(multiply(first.c, second.y), multiply(second.c, first.y))
  const xValue = divide(xResult, xCoefficient)
  const yCoefficient = isZero(first.y) ? second.y : first.y
  const yRight = isZero(first.y) ? second.c : first.c
  const yXCoefficient = isZero(first.y) ? second.x : first.x
  const yValue = divide(subtract(yRight, multiply(yXCoefficient, xValue)), yCoefficient)
  const elimination = equationFromCoefficients(xCoefficient, xResult)
  const x = formatFraction(xValue)
  const y = formatFraction(yValue)
  return solution('Mathematics', toolType, problem, 'Systems of equations', [
    makeStep('Eliminate y', 'Enter the equation in x after eliminating y.', { equation: elimination }, 'equation', 'Multiply and combine the equations to eliminate y.', ['Choose multipliers that make the y-coefficients opposites.', 'Add the equations to cancel y.', 'Collect the remaining x terms and constants.'], 'Systems of equations'),
    makeStep('Solve for x', 'Enter the value of x.', { value: x }, 'number', 'Divide the resulting equation by the coefficient of x.', ['Use the eliminated equation.', `Divide both sides by ${formatFraction(xCoefficient)}.`, 'Substitute your value back into the eliminated equation to check it.'], 'Systems of equations'),
    makeStep('Substitute to solve for y', 'Enter the value of y.', { value: y }, 'number', 'Substitute x into either original equation and isolate y.', ['Substitute the value of x into one original equation.', 'Subtract the x-term from both sides.', 'Check the value in the other original equation.'], 'Systems of equations'),
  ], `x = ${x}, y = ${y}`, `Eliminate y to find x = ${x}, then substitute into an original equation to find y = ${y}.`, `${equations[0]}; ${equations[1]}`)
}

const solveMath = ({ problem, difficulty, toolType }) => {
  if (difficulty === 'Advanced' && /[;\n]/.test(problem)) return solveMathSystem(problem, toolType)
  if (difficulty === 'Advanced' && /x\s*\^\s*2/i.test(problem)) return solveQuadratic(problem, toolType)
  if (/\^/.test(problem)) return null
  if (toolType === 'word-problems') {
    const equation = parseMathWordProblem(problem)
    if (!equation) return null
    const result = solveMathEquation(equation, difficulty, toolType)
    if (!result) return null
    result.problem = problem
    result.steps.unshift(makeStep('Translate the words into an equation', 'Write an equation using x for the unknown number.', { text: equation }, 'text', 'Identify the unknown and translate the relationship described in the sentence.', ['Let x represent the unknown number.', 'Translate the operation words into an equation.', 'Use the relation word to choose addition or subtraction.'], 'Word problems'))
    result.topic = 'Word problems'
    result.finalAnswer = `${result.finalAnswer}; the unknown number is ${result.finalAnswer.replace('x = ', '')}.`
    result.explanation = `The words translate to ${equation}. ${result.explanation}`
    result.similarProblem = 'A number increased by 7 is 19. What is the number?'
    return result
  }
  return solveMathEquation(problem, difficulty, toolType)
}

const solvePhysics = ({ problem, difficulty, toolType }) => {
  const text = problem.toLowerCase()
  const numbers = [...text.matchAll(/(-?\d+(?:\.\d+)?)/g)].map((match) => match[1]).map(parseFraction)
  const labeled = (names) => {
    const match = text.match(new RegExp(`(?:${names})\\s*(?:is|=|:)\\s*(-?\\d+(?:\\.\\d+)?)`))
    return match ? parseFraction(match[1]) : null
  }
  const distanceValue = labeled('distance|d')
  const speedValue = labeled('speed|velocity|v')
  const timeValue = labeled('time|t')
  const accelerationValue = labeled('acceleration|a')
  const speedQuestion = /speed|velocity/.test(text) && /meter|metre|distance/.test(text) && /second|time/.test(text)
  const accelerationQuestion = difficulty !== 'Beginner' && /acceleration/.test(text) && numbers.length >= 2 && /second|time/.test(text)
  const distanceQuestion = /distance|how far/.test(text) && /speed|velocity/.test(text) && /second|time/.test(text)
  const labeledQuestion = distanceValue && timeValue && /speed|velocity/.test(text) || speedValue && timeValue && /distance/.test(text) || distanceValue && speedValue && /time/.test(text) || difficulty !== 'Beginner' && accelerationValue && timeValue && /distance/.test(text)
  if (toolType !== 'word-problems' && !labeledQuestion) return null
  if (numbers.length < 2 && !labeledQuestion || !(speedQuestion || accelerationQuestion || distanceQuestion || labeledQuestion)) return null
  let label
  let answer
  let formula
  if (speedQuestion || distanceValue && timeValue && /speed|velocity/.test(text)) {
    const distance = distanceValue ?? numbers[0]
    const time = timeValue ?? numbers[1]
    if (isZero(time)) return null
    answer = divide(distance, time)
    formula = 'speed = distance ÷ time'
    label = 'speed'
  } else if (accelerationQuestion || accelerationValue && timeValue && /distance/.test(text)) {
    const acceleration = accelerationValue ?? numbers[0]
    const time = timeValue ?? numbers[1]
    answer = divide(multiply(acceleration, multiply(time, time)), fraction(2n))
    formula = 'distance = ½ × acceleration × time² (starting from rest)'
    label = 'distance'
  } else if (speedValue && timeValue && /distance/.test(text)) {
    answer = multiply(speedValue, timeValue)
    formula = 'distance = speed × time'
    label = 'distance'
  } else if (distanceValue && speedValue && /time/.test(text)) {
    if (isZero(speedValue)) return null
    answer = divide(distanceValue, speedValue)
    formula = 'time = distance ÷ speed'
    label = 'time'
  } else {
    answer = multiply(numbers[0], numbers[1])
    formula = 'distance = speed × time'
    label = 'distance'
  }
  const numeric = formatFraction(answer)
  const similarProblem = label === 'speed' ? `A vehicle travels ${formatFraction(multiply(answer, fraction(2n)))} meters in 2 seconds. Find its speed.` : label === 'time' ? 'A runner covers 100 meters at 5 meters per second. Find the time.' : 'A vehicle travels at 5 meters per second for 8 seconds. How far does it travel?'
  return solution('Physics', toolType, problem, 'One-dimensional motion', [
    makeStep('Choose the motion relationship', `Enter the formula for ${label}.`, { text: formula }, 'text', 'Select the constant-motion relationship that includes the quantity being asked for.', ['List the known values and the quantity to find.', `Choose a relationship that contains ${label}.`, 'Check that the formula has the units required for the quantity.'], 'One-dimensional motion'),
    makeStep('Substitute and calculate', `Enter the ${label} value.`, { value: numeric }, 'number', `Substitute the known measurements into ${formula}.`, ['Substitute the values with their units.', 'Calculate the result using the selected relationship.', `The numerical result is ${numeric}.`], 'One-dimensional motion'),
  ], `${label} = ${numeric}`, `Using ${formula}, the result is ${numeric}.`, similarProblem)
}

const parseCompound = (formulaText) => {
  const counts = {}
  const matches = formulaText.match(/(?:[A-Z][a-z]?\d*)+/g)
  if (!matches || matches.join('') !== formulaText) return null
  for (const match of matches) {
    for (const atom of match.matchAll(/([A-Z][a-z]?)(\d*)/g)) counts[atom[1]] = (counts[atom[1]] ?? 0) + Number(atom[2] || 1)
  }
  return counts
}
const balanceChemicalEquation = (problem) => {
  const parts = problem.split(/->|→|=/).map((part) => part.trim())
  if (parts.length !== 2) return null
  const reactants = parts[0].split('+').map((part) => part.trim())
  const products = parts[1].split('+').map((part) => part.trim())
  if (!reactants.length || !products.length || reactants.length + products.length > 6) return null
  const compounds = [...reactants, ...products].map(parseCompound)
  if (compounds.some((compound) => !compound)) return null
  const atoms = [...new Set(compounds.flatMap((compound) => Object.keys(compound)))].sort()
  let best = null
  const coefficients = Array(compounds.length).fill(1)
  const search = (index, maxCoefficient) => {
    if (index === coefficients.length) {
      if (coefficients.reduce((sum, coefficient) => sum + coefficient, 0) >= (best?.sum ?? Infinity)) return
      if (atoms.every((atom) => {
        const left = compounds.slice(0, reactants.length).reduce((sum, compound, compoundIndex) => sum + (compound[atom] ?? 0) * coefficients[compoundIndex], 0)
        const right = compounds.slice(reactants.length).reduce((sum, compound, compoundIndex) => sum + (compound[atom] ?? 0) * coefficients[reactants.length + compoundIndex], 0)
        return left === right
      })) best = { coefficients: [...coefficients], sum: coefficients.reduce((sum, coefficient) => sum + coefficient, 0) }
      return
    }
    for (let coefficient = 1; coefficient <= Math.min(8, maxCoefficient); coefficient += 1) {
      coefficients[index] = coefficient
      search(index + 1, maxCoefficient)
    }
  }
  for (let maxCoefficient = 1; maxCoefficient <= 8 && !best; maxCoefficient += 1) search(0, maxCoefficient)
  return best ? { reactants, products, coefficients: best.coefficients, atoms } : null
}
const solveChemistry = ({ problem, difficulty, toolType }) => {
  const result = toolType === 'step-by-step-solver' ? balanceChemicalEquation(problem) : null
  if (result && difficulty === 'Beginner' && Math.max(...result.coefficients) > 2) return null
  if (result) {
    const balanced = `${result.reactants.map((compound, index) => `${result.coefficients[index] === 1 ? '' : result.coefficients[index]}${compound}`).join(' + ')} → ${result.products.map((compound, index) => `${result.coefficients[result.reactants.length + index] === 1 ? '' : result.coefficients[result.reactants.length + index]}${compound}`).join(' + ')}`
    return solution('Chemistry', toolType, problem, 'Balancing equations', [
      makeStep('Count each atom', 'Enter the atom counts for the unbalanced equation.', { text: result.atoms.map((atom) => `${atom}: ${result.reactants.reduce((sum, compound) => sum + (parseCompound(compound)[atom] ?? 0), 0)} reactant atoms; ${result.products.reduce((sum, compound) => sum + (parseCompound(compound)[atom] ?? 0), 0)} product atoms`).join('; ') }, 'text', 'A balanced equation has the same number of each atom on both sides.', ['Count atoms in each reactant formula.', 'Count atoms in each product formula.', 'Compare both sides element by element.'], 'Balancing equations'),
      makeStep('Balance the coefficients', 'Enter the balanced chemical equation.', { text: balanced }, 'text', 'Change coefficients in front of formulas without changing subscripts.', ['Choose coefficients that make each atom count equal.', 'Recheck every element on both sides.', 'Reduce the coefficients to the smallest whole-number ratio.'], 'Balancing equations'),
    ], balanced, `The equation is balanced when each element has equal counts on both sides: ${result.atoms.join(', ')}.`, 'H2 + Cl2 → HCl')
  }
  if (toolType === 'word-problems') {
    const stoich = problem.match(/(?:how many )?moles?\s+(?:are in|does|for)?\s*(\d+(?:\.\d+)?)\s*g?\s*(?:of)?\s*([A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)*)/i)
    if (stoich) {
      const mass = parseFraction(stoich[1])
      const compound = stoich[2]
      const atoms = parseCompound(compound)
      if (!atoms) return null
      const atomicMasses = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, S: 32, Cl: 35.5, K: 39, Ca: 40 }
      if (Object.keys(atoms).some((atom) => !atomicMasses[atom])) return null
      const molarMass = Object.entries(atoms).reduce((sum, [atom, count]) => sum + atomicMasses[atom] * count, 0)
      const moles = divide(mass, parseFraction(String(molarMass)))
      return solution('Chemistry', toolType, problem, 'Mole calculations', [
        makeStep('Find the molar mass', `Enter the molar mass of ${compound}.`, { value: String(molarMass) }, 'number', 'Add the atomic masses of all atoms in one molecule or formula unit.', ['Count each element in the formula.', 'Multiply each count by its atomic mass.', 'Add the element contributions and include the units g/mol.'], 'Mole calculations'),
        makeStep('Convert mass to moles', 'Enter the amount in moles.', { value: formatFraction(moles) }, 'number', 'Divide the sample mass by the molar mass.', ['Use moles = mass ÷ molar mass.', `Divide ${formatFraction(mass)} g by ${molarMass} g/mol.`, 'Check that grams cancel so the remaining unit is moles.'], 'Mole calculations'),
      ], `${formatFraction(moles)} mol`, `Moles = mass ÷ molar mass = ${formatFraction(mass)} ÷ ${molarMass} = ${formatFraction(moles)} mol.`, `How many moles are in ${formatFraction(multiply(mass, fraction(2n)))} g of ${compound}?`)
    }
  }
  return null
}

const solveBiology = ({ problem, difficulty, toolType }) => {
  if (toolType === 'word-problems' && !/cross|offspring|genotype|trait/i.test(problem)) return null
  const cross = problem.match(/\b([A-Za-z]{2}(?:[A-Za-z]{2})?)\s*(?:×|x|with|cross(?:ed)? with)\s*([A-Za-z]{2}(?:[A-Za-z]{2})?)\b/)
  if (!cross) return null
  const first = cross[1]
  const second = cross[2]
  const geneCount = first.length / 2
  if (first.length !== second.length || geneCount > 1 && difficulty !== 'Advanced') return null
  const firstPairs = first.match(/.{2}/g)
  const secondPairs = second.match(/.{2}/g)
  if (firstPairs.some((pair, index) => pair[0].toLowerCase() !== pair[1].toLowerCase() || pair[0].toLowerCase() !== secondPairs[index][0].toLowerCase() || secondPairs[index][0].toLowerCase() !== secondPairs[index][1].toLowerCase())) return null
  const gametes = (genotype) => Array.from({ length: 2 ** geneCount }, (_, mask) => Array.from({ length: geneCount }, (_, index) => genotype[index * 2 + (mask >> index & 1)]).join(''))
  const combine = (left, right) => Array.from({ length: geneCount }, (_, index) => [left[index], right[index]].sort((a, b) => a === a.toUpperCase() ? -1 : b === b.toUpperCase() ? 1 : 0).join('')).join('')
  const offspring = gametes(first).flatMap((left) => gametes(second).map((right) => combine(left, right)))
  const tally = offspring.reduce((counts, genotype) => ({ ...counts, [genotype]: (counts[genotype] ?? 0) + 1 }), {})
  const denominator = offspring.length
  const ratio = Object.entries(tally).map(([genotype, count]) => `${genotype}: ${count}/${denominator}`).join(', ')
  const phenotypeCount = offspring.filter((genotype) => Array.from({ length: geneCount }, (_, index) => genotype.slice(index * 2, index * 2 + 2).includes(genotype[index * 2].toUpperCase())).every(Boolean)).length
  const gameteText = `${gametes(first).join(', ')}; ${gametes(second).join(', ')}`
  const steps = [
    makeStep('List the possible gametes', `Enter the gametes produced by ${first} and ${second}.`, { text: gameteText }, 'text', 'Each gamete receives one allele for each gene from its parent.', ['Each parent contributes one allele per gene.', 'List all possible allele combinations for each parent.', 'For each gene pair, choose one allele at a time.'], 'Mendelian genetics'),
    makeStep('Combine the alleles', `Enter the offspring genotype ratio (${denominator} combinations).`, { text: ratio }, 'text', 'Combine each gamete from one parent with each gamete from the other parent.', [`Make all ${denominator} possible combinations.`, 'Group matching genotypes and count each group.', 'Check that the genotype counts add up to all possible combinations.'], 'Mendelian genetics'),
  ]
  return solution('Biology', toolType, problem, 'Mendelian genetics', steps, `${ratio}; ${phenotypeCount}/${denominator} show all dominant traits.`, `${denominator} equally likely offspring combinations produce ${ratio}. ${phenotypeCount} inherit at least one dominant allele for each gene.`, `Cross ${first} with ${second}. What genotype ratio is expected?`)
}

const modules = new Map()
export const registerSolverModule = (subject, module) => modules.set(subject, module)
registerSolverModule('Mathematics', { solve: solveMath })
registerSolverModule('Physics', { solve: solvePhysics })
registerSolverModule('Chemistry', { solve: solveChemistry })
registerSolverModule('Biology', { solve: solveBiology })

export const parseInteractiveProblem = ({ subject, toolType = 'step-by-step-solver', difficulty = 'Beginner', problem }) => {
  const module = modules.get(subject)
  if (!module) return { ok: false, message: `No solver is available for ${subject || 'this subject'} yet. Choose Mathematics, Physics, Chemistry, or Biology.` }
  if (!['step-by-step-solver', 'word-problems'].includes(toolType)) return { ok: false, message: 'This solver tool is not supported.' }
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) return { ok: false, message: 'Choose a supported difficulty level.' }
  if (typeof problem !== 'string' || !problem.trim() || problem.length > 500) return { ok: false, message: 'Enter a problem between 1 and 500 characters.' }
  const parsed = module.solve({ subject, toolType, difficulty, problem: problem.trim() })
  return parsed ? { ok: true, solution: parsed } : { ok: false, message: `This ${subject.toLowerCase()} problem is not supported by the selected ${toolType === 'word-problems' ? 'word-problem' : 'step-by-step'} tool at ${difficulty} level. Try one of the examples or a supported problem format.` }
}

export const getPublicSolverStep = (solutionRecord, stepIndex, learningMode = 'Guided') => {
  const step = solutionRecord.steps[stepIndex]
  if (!step) return null
  return { title: step.title, prompt: step.prompt, ...(learningMode === 'Guided' ? { reasoning: step.reasoning } : {}) }
}

export const validateSolverStep = (step, answer) => {
  if (typeof answer !== 'string' || answer.length > 500) return false
  if (step.answerType === 'number') {
    const actual = parseFraction(answer)
    const expected = parseFraction(step.expected.value)
    return Boolean(actual && expected && isZero(subtract(actual, expected)))
  }
  if (step.answerType === 'equation') return equationsEquivalent(answer, step.expected.original ?? step.expected.equation)
  const normalize = (value) => value.toLowerCase().replace(/[\s.,]/g, '').replace(/→/g, '->').replace(/\*/g, '×')
  return normalize(answer) === normalize(step.expected.text)
}

export const getSolverHint = (step, hintLevel) => step.hints[Math.max(0, Math.min(step.hints.length - 1, hintLevel - 1))]
export const getSolverFeedback = (step, solutionRecord) => {
  if (step.topic === 'Word problems') return 'Re-read the relationship words and make sure the equation represents the unknown quantity and the stated result.'
  if (step.topic === 'Systems of equations') return 'Check the elimination multipliers, signs, and substitution into the original equations.'
  if (step.topic === 'Quadratic equations') return 'Check the signs in b² − 4ac and apply both signs in the quadratic formula.'
  if (solutionRecord.subject === 'Mathematics' && step.answerType === 'equation') return 'This equation is not equivalent to the original. Apply the same operation to both sides and check the variable and constant terms.'
  if (solutionRecord.subject === 'Mathematics') return 'Check the inverse operation and simplify the fraction. Substitute your value into the equation to verify it.'
  if (solutionRecord.subject === 'Physics') return 'Check that you chose a relationship containing the requested quantity, used the values in the right places, and kept the units consistent.'
  if (solutionRecord.subject === 'Chemistry') return 'The atom counts do not match yet. Change coefficients only, then compare each element on both sides.'
  if (solutionRecord.subject === 'Biology') return 'Check that each parent contributes one allele and that all four equally likely combinations are counted.'
  return `Review the ${step.topic.toLowerCase()} relationship and try the step again.`
}
export const getSolverResult = (solutionRecord) => ({ finalAnswer: solutionRecord.finalAnswer, explanation: solutionRecord.explanation, topic: solutionRecord.topic })
