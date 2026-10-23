import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { useEffect, useMemo, useState } from 'react'
import { type InteractiveToolConfig, type InteractiveToolProgress } from '@/components/admin/admin-data'
import { getInteractiveToolProgress, resetInteractiveToolProgress, saveInteractiveToolProgress } from '@/services/api'
import { isMathSolverAnswerCorrect, solveMathProblem, type MathSolverTask } from './math-step-solver'

type Props = { config: InteractiveToolConfig; enrollmentId: number; lessonId: number; onCompleted: () => void }
const taskForSolver = (task: InteractiveToolConfig['task']): MathSolverTask => task === 'Automatic' ? 'automatic' : task === 'Equation solving' ? 'equation' : task === 'Arithmetic' ? 'arithmetic' : 'geometry'
const newProgress = (problem: string, task: InteractiveToolProgress['task']): InteractiveToolProgress => ({ problem, task, currentStep: 0, answers: {}, attempts: {}, hintsUsed: {}, isCompleted: false })

const InteractiveToolSolver = ({ config, enrollmentId, lessonId, onCompleted }: Props) => {
  const [progress, setProgress] = useState<InteractiveToolProgress | null>(null)
  const [problemInput, setProblemInput] = useState(config.exampleProblem ?? config.examples[0] ?? '')
  const [selectedTask, setSelectedTask] = useState(config.task)
  const [answerInput, setAnswerInput] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null)
  const [hintOpen, setHintOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const learningMode = config.learningMode ?? 'Guided'
  const demonstrationProblem = config.exampleProblem ?? config.examples[0] ?? ''
  const demonstrationSolution = useMemo(() => demonstrationProblem ? solveMathProblem(demonstrationProblem, taskForSolver(config.task)) : null, [demonstrationProblem, config.task])
  const solution = useMemo(() => progress ? solveMathProblem(progress.problem, taskForSolver(progress.task)) : null, [progress?.problem, progress?.task])
  const step = solution?.steps[progress?.currentStep ?? -1]

  useEffect(() => {
    let active = true
    void getInteractiveToolProgress(enrollmentId, lessonId)
      .then((saved) => {
        if (!active) return
        setProgress(saved)
        if (saved?.isCompleted) onCompleted()
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load saved progress.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [enrollmentId, lessonId, onCompleted])

  const persist = async (next: InteractiveToolProgress) => {
    setIsSaving(true)
    setError('')
    try {
      const saved = await saveInteractiveToolProgress(enrollmentId, lessonId, next)
      setProgress(saved)
      if (saved.isCompleted) onCompleted()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save solver progress.')
    } finally {
      setIsSaving(false)
    }
  }

  const beginProblem = (problem = problemInput, task = selectedTask) => {
    const result = solveMathProblem(problem, taskForSolver(task))
    if (!result) {
      setError('We could not recognize this problem yet. Try one of the examples or enter a linear equation, arithmetic expression, or supported geometry question.')
      return
    }
    setAnswerInput('')
    setFeedback(null)
    setHintOpen(false)
    setProblemInput(problem)
    void persist(newProgress(problem, selectedTask))
  }

  const checkAnswer = () => {
    if (!step || !progress || !answerInput.trim()) return
    const correct = isMathSolverAnswerCorrect(step, answerInput)
    const index = progress.currentStep
    const attempts = { ...progress.attempts, [index]: (progress.attempts[index] ?? 0) + 1 }
    const answers = { ...progress.answers, [index]: answerInput.trim() }
    if (!correct) {
      setFeedback('retry')
      void persist({ ...progress, answers, attempts })
      return
    }
    const nextStep = index + 1
    const isCompleted = nextStep >= (solution?.steps.length ?? 0)
    setFeedback('correct')
    void persist({ ...progress, answers, attempts, currentStep: nextStep, isCompleted })
    setAnswerInput('')
    setHintOpen(false)
  }

  const requestHint = () => {
    if (!progress) return
    const index = progress.currentStep
    void persist({ ...progress, hintsUsed: { ...progress.hintsUsed, [index]: (progress.hintsUsed[index] ?? 0) + 1 } })
    setHintOpen(true)
  }

  const startPractice = () => {
    if (!solution) return
    setFeedback(null)
    setAnswerInput('')
    beginProblem(solution.practiceProblem, progress?.task ?? selectedTask)
  }

  const resetProblem = async () => {
    setIsSaving(true)
    try {
      await resetInteractiveToolProgress(enrollmentId, lessonId)
      setProgress(null)
      setSelectedTask(progress?.task ?? config.task)
      setProblemInput('')
      setAnswerInput('')
      setFeedback(null)
      setError('')
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to reset the saved problem.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress aria-label="Loading saved solver progress" /></Box>
  if (config.subject !== 'Mathematics') return <Alert severity="info">The Step-by-Step Solver currently supports Mathematics. {config.subject} lesson configuration is saved and ready for a future subject-specific solver.</Alert>

  return <Paper elevation={0} sx={{ p: { xs: 2, sm: 3, md: 4 }, border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
    <Stack spacing={2.5}>
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
          <Box><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>Interactive Tools · {config.subject}</Typography><Typography variant="h5" sx={{ fontWeight: 750 }}>Step-by-Step Solver</Typography></Box>
          <Chip label={config.difficulty} color="primary" variant="outlined" />
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{config.instructions}</Typography>
        {config.learningObjectives.length > 0 && <Box sx={{ mt: 1.5 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>Learning objectives</Typography>{config.learningObjectives.map((objective) => <Typography key={objective} variant="body2" color="text.secondary">• {objective}</Typography>)}</Box>}
      </Box>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {learningMode === 'Demonstration' && !progress && demonstrationSolution ? <Stack spacing={1.5}>
        <Alert severity="info">Worked demonstration</Alert>
        <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}><Typography variant="caption" color="text.secondary">Example problem</Typography><Typography sx={{ fontWeight: 700 }}>{demonstrationProblem}</Typography></Paper>
        {demonstrationSolution.steps.map((demonstrationStep, index) => <Paper key={`${index}-${demonstrationStep.title}`} elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5 }}><Typography variant="caption" color="text.secondary">Step {index + 1}</Typography><Typography sx={{ fontWeight: 700 }}>{demonstrationStep.title}</Typography>{demonstrationStep.formula && <Typography sx={{ mt: 0.5, fontFamily: 'monospace' }}>{demonstrationStep.formula}</Typography>}<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{demonstrationStep.reasoning}</Typography></Paper>)}
        <Alert severity="success">Final answer: {demonstrationSolution.answer}</Alert>
        <Button variant="contained" onClick={onCompleted} sx={{ alignSelf: 'flex-start' }}>Complete lesson</Button>
      </Stack> : <>
      {!progress && <Stack spacing={1.5}>
        <TextField fullWidth multiline minRows={2} label="Enter a problem or question" placeholder="For example: 3x + 2 = 14" value={problemInput} onChange={(event) => setProblemInput(event.target.value)} inputProps={{ maxLength: 500 }} />
        {config.examples.length > 0 && <Box><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>Example problems</Typography><Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">{config.examples.map((example) => <Chip key={example} label={example} clickable onClick={() => { setProblemInput(example); setError('') }} variant="outlined" />)}</Stack></Box>}
        <Button variant="contained" onClick={() => beginProblem()} disabled={!problemInput.trim() || isSaving} startIcon={<PlayArrowIcon />} sx={{ alignSelf: 'flex-start' }}>{isSaving ? 'Saving…' : 'Start solving'}</Button>
      </Stack>}
      {progress && !solution && <Alert severity="error">The saved problem can no longer be solved. Start a new problem to continue.</Alert>}
      {progress && solution && !progress.isCompleted && step && <Stack spacing={2}>
        <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}><Typography variant="caption" color="text.secondary">Problem</Typography><Typography sx={{ fontWeight: 700 }}>{progress.problem}</Typography><Typography variant="caption" color="text.secondary">Step {progress.currentStep + 1} of {solution.steps.length}</Typography></Paper>
        <Box><Typography variant="h6" sx={{ fontWeight: 700 }}>{step.title}</Typography>{learningMode !== 'Independent' && <><Typography color="text.secondary" sx={{ mt: 0.5 }}>{step.reasoning}</Typography>{step.formula && <Paper elevation={0} sx={{ p: 1.5, mt: 1.25, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}><Typography sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{step.formula}</Typography></Paper>}</>}</Box>
        <TextField fullWidth label={step.prompt} value={answerInput} onChange={(event) => { setAnswerInput(event.target.value); setFeedback(null) }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); checkAnswer() } }} />
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="space-between" spacing={1}>{learningMode === 'Guided' && <Button startIcon={<LightbulbOutlinedIcon />} onClick={requestHint} disabled={isSaving}>Request a hint</Button>}<Button variant="contained" onClick={checkAnswer} disabled={!answerInput.trim() || isSaving}>{isSaving ? 'Saving…' : 'Check my work'}</Button></Stack>
        {learningMode === 'Guided' && hintOpen && <Alert severity="info">{step.hint}</Alert>}
        {feedback === 'retry' && <Alert severity="warning">Not quite yet. Review the reasoning, use a hint if helpful, and correct your answer before moving on.</Alert>}
        {feedback === 'correct' && <Alert severity="success">That step is correct. Continue to the next step.</Alert>}
      </Stack>}
      {progress?.isCompleted && solution && <Stack spacing={2}>
        <Alert icon={<CheckCircleOutlineIcon />} severity="success"><Typography sx={{ fontWeight: 700 }}>Solution complete</Typography><Typography variant="body2">Final answer: {solution.answer}</Typography></Alert>
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Why this is the answer</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>{solution.explanation}</Typography></Paper>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant="contained" onClick={startPractice} disabled={isSaving}>Try a similar problem</Button><Button variant="outlined" onClick={() => void resetProblem()} disabled={isSaving}>Solve another problem</Button></Stack>
      </Stack>}
      </>}
    </Stack>
  </Paper>
}

export default InteractiveToolSolver
