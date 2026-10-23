import { describe, expect, it } from 'vitest'
import { parseLessonParagraphs, type LessonParagraph } from './lesson-docx'

const paragraph = (text: string, heading: number | null = null): LessonParagraph => ({ text, heading })
const questionTemplate = (type: 'QUIZ' | 'PRACTICE'): LessonParagraph[] => [
  paragraph(`${type[0]}${type.slice(1).toLowerCase()} template instructions`),
  paragraph(`LESSON TYPE: ${type}`),
  paragraph('Fractions', 1),
]

const validQuestion = (number: number): LessonParagraph[] => [
  paragraph(`Question ${number}`, 2),
  paragraph('Question: What is one half?'),
  paragraph('Topic: Fractions'),
  paragraph('A. 1/2'),
  paragraph('B. 1/3'),
  paragraph('Correct: A'),
  paragraph('Explanation: One half is 1/2.'),
]

describe('parseLessonParagraphs', () => {
  it('imports an Article body as plain text under its Heading 1 title', () => {
    const result = parseLessonParagraphs('article', [
      paragraph('Article template instructions'),
      paragraph('LESSON TYPE: ARTICLE'),
      paragraph('Light and Exposure', 1),
      paragraph('Exposure controls brightness.'),
      paragraph('Aperture', 2),
      paragraph('A wider aperture lets in more light.'),
    ])

    expect(result).toMatchObject({ title: 'Light and Exposure', articleBody: 'Exposure controls brightness.\nAperture\nA wider aperture lets in more light.', fatalError: null })
  })

  it('preserves inline image marker positions and descriptions in an Article import', () => {
    const result = parseLessonParagraphs('article', [
      paragraph('Article template instructions'),
      paragraph('LESSON TYPE: ARTICLE'),
      paragraph('Light and Exposure', 1),
      paragraph('Exposure controls brightness.'),
      paragraph('[IMAGE: a close-up of an aperture]'),
      paragraph('Aperture', 2),
      paragraph('A wider aperture lets in more light.'),
    ])

    expect(result.articleBlocks).toEqual([
      { type: 'text', text: 'Exposure controls brightness.' },
      { type: 'image', marker: 'a close-up of an aperture', caption: '' },
      { type: 'heading', text: 'Aperture' },
      { type: 'text', text: 'A wider aperture lets in more light.' },
    ])
    expect(result.fatalError).toBeNull()
  })

  it('preserves embedded image position and associates a following short caption', () => {
    const result = parseLessonParagraphs('article', [
      paragraph('Article template instructions'),
      paragraph('LESSON TYPE: ARTICLE'),
      paragraph('Light and Exposure', 1),
      paragraph('Exposure controls brightness.'),
      { text: '', heading: null, parts: [{ type: 'image', imageUrl: 'data:image/png;base64,aGVsbG8=' }] },
      paragraph('Aperture blades form the opening.'),
      paragraph('A wider aperture lets in more light.'),
    ])

    expect(result.articleBlocks).toEqual([
      { type: 'text', text: 'Exposure controls brightness.' },
      { type: 'image', imageUrl: 'data:image/png;base64,aGVsbG8=', caption: 'Aperture blades form the opening.' },
      { type: 'text', text: 'A wider aperture lets in more light.' },
    ])
  })

  it('keeps valid questions and identifies malformed questions by source number', () => {
    const result = parseLessonParagraphs('quiz', [
      ...questionTemplate('QUIZ'),
      ...validQuestion(1),
      paragraph('Question 2', 2),
      paragraph('Question: Which option is correct?'),
      paragraph('Topic: Science'),
      paragraph('A. First'),
      paragraph('B. Second'),
    ])

    expect(result.questions).toHaveLength(1)
    expect(result.questions[0]).toMatchObject({ number: 1, correctOption: 0 })
    expect(result.issues).toContain('Question 2 has no option marked as correct; add one Correct: letter line.')
    expect(result.fatalError).toBeNull()
  })

  it('imports quiz image placeholders for questions, options, and explanations', () => {
    const result = parseLessonParagraphs('quiz', [
      ...questionTemplate('QUIZ'),
      paragraph('Question 1', 2),
      paragraph('Question: Which object is shown?'),
      paragraph('Topic: Science'),
      paragraph('Question image: [IMAGE: microscope view]'),
      paragraph('A. Cell'),
      paragraph('A image: [IMAGE: cell diagram]'),
      paragraph('B. Star'),
      paragraph('Correct: A'),
      paragraph('Explanation: It shows a cell.'),
      paragraph('Explanation image: [IMAGE: labeled cell]'),
    ])

    expect(result.questions[0]).toMatchObject({ questionImageMarker: 'microscope view', optionImageMarkers: ['cell diagram', undefined], explanationImageMarker: 'labeled cell' })
    expect(result.fatalError).toBeNull()
  })

  it('imports embedded quiz images from labeled image lines', () => {
    const imageUrl = 'data:image/png;base64,aGVsbG8='
    const result = parseLessonParagraphs('quiz', [
      ...questionTemplate('QUIZ'),
      paragraph('Question 1', 2),
      paragraph('Question: Which object is shown?'),
      paragraph('Topic: Science'),
      { text: 'Question image:', heading: null, parts: [{ type: 'text', text: 'Question image:' }, { type: 'image', imageUrl }] },
      paragraph('A. Cell'),
      { text: 'A image:', heading: null, parts: [{ type: 'text', text: 'A image:' }, { type: 'image', imageUrl }] },
      paragraph('B. Star'),
      paragraph('Correct: A'),
      paragraph('Explanation: It shows a cell.'),
    ])

    expect(result.questions[0]).toMatchObject({ questionImage: imageUrl, optionImages: [imageUrl, undefined] })
    expect(result.fatalError).toBeNull()
  })

  it('rejects importing a Quiz template as Practice', () => {
    const result = parseLessonParagraphs('practice', [...questionTemplate('QUIZ'), ...validQuestion(1)])

    expect(result.fatalError).toBe('This file is a Quiz template, not a Practice template.')
  })

  it('reports when a question heading uses the wrong level', () => {
    const result = parseLessonParagraphs('quiz', [
      ...questionTemplate('QUIZ'),
      ...validQuestion(1).map((item) => item.text === 'Question 1' ? { ...item, heading: 3 } : item),
    ])

    expect(result.fatalError).toBe('Question 1 must use Heading 2 in the Quiz template.')
  })
})

describe('parseLessonParagraphs for Step-by-Step Solver', () => {
  const solverParagraphs = (omitHint = false): LessonParagraph[] => [
    paragraph('Step-by-Step Solver template instructions'),
    paragraph('LESSON TYPE: STEP-BY-STEP SOLVER'),
    paragraph('Solve Linear Equations', 1),
    paragraph('Problem 1', 2),
    paragraph('Problem: Solve 2x = 8'),
    paragraph('Step 1', 3),
    paragraph('Instruction: Divide both sides by 2.'),
    paragraph('Correct answer: 4'),
    paragraph('Explanation: Dividing by 2 isolates x.'),
    ...(omitHint ? [] : [paragraph('Hint: Undo the multiplication.')]),
    paragraph('Corrective feedback: Divide, do not subtract.'),
    paragraph('Follow-up 1', 3),
    paragraph('Question: Solve 3x = 9'),
    paragraph('Correct answer: 3'),
    paragraph('Explanation: Divide both sides by 3.'),
    paragraph('Corrective feedback: Divide by the coefficient.'),
  ]

  it('imports problems with steps and follow-up questions', () => {
    const result = parseLessonParagraphs('stepByStepSolver', solverParagraphs())

    expect(result.fatalError).toBeNull()
    expect(result.title).toBe('Solve Linear Equations')
    expect(result.stepByStepSolver?.problems).toEqual([{
      id: 1,
      prompt: 'Solve 2x = 8',
      steps: [{ id: 1, instruction: 'Divide both sides by 2.', correctAnswer: '4', explanation: 'Dividing by 2 isolates x.', hint: 'Undo the multiplication.', correctiveFeedback: 'Divide, do not subtract.' }],
      followUpQuestions: [{ id: 1, prompt: 'Solve 3x = 9', correctAnswer: '3', explanation: 'Divide both sides by 3.', correctiveFeedback: 'Divide by the coefficient.' }],
    }])
  })

  it('skips a problem with a missing step field and reports it', () => {
    const result = parseLessonParagraphs('stepByStepSolver', solverParagraphs(true))

    expect(result.stepByStepSolver?.problems).toEqual([])
    expect(result.issues).toEqual(['Problem 1: Step 1 is missing hint.'])
    expect(result.fatalError).toBe('No valid problems were found. Problem 1: Step 1 is missing hint.')
  })

  it('rejects importing a Quiz template as Step-by-Step Solver', () => {
    const result = parseLessonParagraphs('stepByStepSolver', [...questionTemplate('QUIZ'), ...validQuestion(1)])

    expect(result.fatalError).toBe('This file is a Quiz template, not a Step-by-Step Solver template.')
  })
})
