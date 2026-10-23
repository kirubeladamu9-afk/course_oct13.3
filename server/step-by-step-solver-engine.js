const isValidText = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 5000
const hasUniquePositiveIds = (items) => Array.isArray(items) && items.every((item) => Number.isSafeInteger(item?.id) && item.id > 0) && new Set(items.map((item) => item.id)).size === items.length
const readJson = (value) => typeof value === 'string' ? JSON.parse(value) : value

export const isValidStepByStepSolverConfig = (config) =>
  Array.isArray(config?.problems) && config.problems.length > 0 && config.problems.length <= 100 && hasUniquePositiveIds(config.problems) && config.problems.every((problem) =>
    isValidText(problem?.prompt) && Array.isArray(problem?.steps) && problem.steps.length > 0 && problem.steps.length <= 100 && hasUniquePositiveIds(problem.steps) && problem.steps.every((step) =>
      isValidText(step.instruction) && isValidText(step.explanation) && isValidText(step.hint) && isValidText(step.correctiveFeedback) && isValidText(step.correctAnswer)
    ) && Array.isArray(problem.followUpQuestions) && problem.followUpQuestions.length > 0 && problem.followUpQuestions.length <= 100 && hasUniquePositiveIds(problem.followUpQuestions) && problem.followUpQuestions.every((question) =>
      isValidText(question.prompt) && isValidText(question.correctAnswer) && isValidText(question.explanation) && isValidText(question.correctiveFeedback)
    )
  )

export const normalizeSolverAnswer = (value) => value.trim().toLowerCase().replace(/\s+/g, '')

export const getStepByStepSolverSessionView = (record, problem) => {
  if (!record || !problem) return null
  const revealedSteps = readJson(record.revealed_steps) ?? []
  const followUpResults = readJson(record.follow_up_results) ?? {}
  const currentStep = Number(record.current_step)
  const isCompleted = Boolean(record.completed_at)
  return {
    sessionId: Number(record.id),
    problemId: Number(record.problem_id),
    problem: problem.prompt,
    currentStep,
    totalSteps: problem.steps.length,
    completed: isCompleted,
    revealedSteps,
    activeStep: isCompleted || currentStep >= problem.steps.length ? null : { index: currentStep, instruction: problem.steps[currentStep].instruction },
    followUpQuestions: currentStep >= problem.steps.length ? problem.followUpQuestions.map(({ id, prompt }) => ({ id, prompt })) : [],
    followUpResults: Object.fromEntries(problem.followUpQuestions.filter((question) => followUpResults[String(question.id)]).map(({ id }) => [id, { correct: followUpResults[String(id)].correct, feedback: followUpResults[String(id)].feedback }])),
  }
}

export const areSolverFollowUpsComplete = (problem, results) => problem.followUpQuestions.every((question) => results[String(question.id)]?.correct)
