import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Chip, LinearProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import { type StepByStepSolverLearnerConfig, type StepByStepSolverSession } from '@/components/admin/admin-data'
import { answerStepByStepSolverFollowUp, checkStepByStepSolverAnswer, getStepByStepSolverState, requestStepByStepSolverHint, revealStepByStepSolverStep, startStepByStepSolver } from '@/services/api'

type Props = { config: StepByStepSolverLearnerConfig; enrollmentId: number; lessonId: number; onCompleted: () => void }

const StepByStepSolverLesson = ({ config, enrollmentId, lessonId, onCompleted }: Props) => {
  const [session, setSession] = useState<StepByStepSolverSession | null>(null)
  const [completedProblemIds, setCompletedProblemIds] = useState<number[]>([])
  const [answer, setAnswer] = useState('')
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<number, string>>({})
  const [hint, setHint] = useState('')
  const [feedback, setFeedback] = useState('')
  const [feedbackSeverity, setFeedbackSeverity] = useState<'success' | 'warning'>('warning')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const completionNotified = useRef(false)
  const onCompletedRef = useRef(onCompleted)
  useEffect(() => { onCompletedRef.current = onCompleted }, [onCompleted])
  const notifyCompletion = useCallback(() => {
    if (completionNotified.current) return
    completionNotified.current = true
    onCompletedRef.current()
  }, [])

  const recordSession = (next: StepByStepSolverSession) => {
    setSession(next)
    if (!next.completed) return
    const finished = completedProblemIds.includes(next.problemId) ? completedProblemIds : [...completedProblemIds, next.problemId]
    setCompletedProblemIds(finished)
    if (config.problems.length > 0 && config.problems.every((problem) => finished.includes(problem.id))) notifyCompletion()
  }

  useEffect(() => {
    let active = true
    void getStepByStepSolverState(enrollmentId, lessonId).then((state) => {
      if (!active) return
      setSession(state.session)
      const finished = state.completedProblemIds ?? []
      setCompletedProblemIds(finished)
      if (state.problems.length > 0 && state.problems.every((problem) => finished.includes(problem.id))) notifyCompletion()
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Unable to load solver progress.')
    }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [enrollmentId, lessonId, notifyCompletion])

  const startProblem = async (problemId: number) => {
    setIsSaving(true)
    setError('')
    setFeedback('')
    setHint('')
    try {
      const next = await startStepByStepSolver(enrollmentId, lessonId, problemId)
      setSession(next)
      setAnswer('')
      setFollowUpAnswers({})
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start this problem.')
    } finally {
      setIsSaving(false)
    }
  }

  const submitAnswer = async () => {
    if (!session || !answer.trim()) return
    setIsSaving(true)
    setError('')
    setFeedback('')
    try {
      const result = await checkStepByStepSolverAnswer(enrollmentId, lessonId, session.sessionId, answer)
      recordSession(result.session)
      setFeedback(result.feedback)
      setFeedbackSeverity(result.correct ? 'success' : 'warning')
      if (result.correct) {
        setAnswer('')
        setHint('')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to check this answer.')
    } finally {
      setIsSaving(false)
    }
  }

  const revealStep = async () => {
    if (!session) return
    setIsSaving(true)
    setError('')
    try {
      const next = await revealStepByStepSolverStep(enrollmentId, lessonId, session.sessionId)
      setSession(next)
      setAnswer('')
      setHint('')
      setFeedback('This step is now revealed. Review the explanation before continuing.')
      setFeedbackSeverity('success')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to reveal this step.')
    } finally {
      setIsSaving(false)
    }
  }

  const requestHint = async () => {
    if (!session) return
    setIsSaving(true)
    setError('')
    try {
      const result = await requestStepByStepSolverHint(enrollmentId, lessonId, session.sessionId)
      setHint(result.hint)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load a hint.')
    } finally {
      setIsSaving(false)
    }
  }

  const submitFollowUp = async (questionId: number) => {
    if (!session || !followUpAnswers[questionId]?.trim()) return
    setIsSaving(true)
    setError('')
    try {
      const result = await answerStepByStepSolverFollowUp(enrollmentId, lessonId, session.sessionId, questionId, followUpAnswers[questionId])
      recordSession(result.session)
      setFeedback(result.feedback)
      setFeedbackSeverity(result.correct ? 'success' : 'warning')
      if (result.correct) setFollowUpAnswers((current) => ({ ...current, [questionId]: '' }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to check this practice answer.')
    } finally {
      setIsSaving(false)
    }
  }

  const allProblemsComplete = config.problems.length > 0 && config.problems.every((problem) => completedProblemIds.includes(problem.id))
  const progress = session ? Math.round(((session.revealedSteps.length + Object.values(session.followUpResults).filter((result) => result.correct).length) / (session.totalSteps + session.followUpQuestions.length)) * 100) : 0

  if (isLoading) return <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}><Typography color="text.secondary">Loading your saved solver progress…</Typography></Paper>

  return <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: 1, borderColor: 'divider' }}>
    <Stack spacing={2.5}>
      <Box><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>Step-by-Step Solver</Typography><Typography variant="h5" sx={{ fontWeight: 750 }}>Work through each step</Typography><Typography color="text.secondary" variant="body2">Check your answer to unlock the next step, or reveal the worked solution when you need it.</Typography></Box>
      {error && <Alert severity="error">{error}</Alert>}
      {!session && <Stack spacing={1}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Choose a worked problem</Typography>{config.problems.map((problem) => { const isFinished = completedProblemIds.includes(problem.id); return <Button key={problem.id} variant="outlined" color={isFinished ? 'success' : 'primary'} disabled={isSaving || isFinished} startIcon={isFinished ? <CheckCircleOutlineIcon /> : undefined} onClick={() => void startProblem(problem.id)} sx={{ justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none' }}>{isFinished ? `${problem.prompt} (complete)` : problem.prompt}</Button> })}</Stack>}
      {session && <>
        <Box><Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}><Typography variant="caption" sx={{ fontWeight: 700 }}>Problem progress</Typography><Typography variant="caption" color="text.secondary">{progress}%</Typography></Stack><LinearProgress variant="determinate" value={progress} /></Box>
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}><Typography variant="overline" color="text.secondary">Worked problem</Typography><Typography variant="h6">{session.problem}</Typography></Paper>
        {session.revealedSteps.map((step) => <Paper key={step.index} elevation={0} sx={{ p: 2, border: 1, borderColor: 'success.light' }}><Stack spacing={0.75}><Stack direction="row" spacing={1} alignItems="center"><CheckCircleOutlineIcon color="success" fontSize="small" /><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Step {step.index + 1}</Typography></Stack><Typography>{step.instruction}</Typography><Typography sx={{ fontWeight: 700 }}>Answer: {step.correctAnswer}</Typography><Typography color="text.secondary" variant="body2">{step.explanation}</Typography></Stack></Paper>)}
        {session.activeStep && <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'primary.main' }}><Stack spacing={1.5}><Chip size="small" label={`Step ${session.activeStep.index + 1} of ${session.totalSteps}`} color="primary" sx={{ alignSelf: 'flex-start' }} /><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{session.activeStep.instruction}</Typography><TextField fullWidth label="Your answer" value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void submitAnswer() }} disabled={isSaving} /><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant="contained" onClick={() => void submitAnswer()} disabled={isSaving || !answer.trim()}>Check answer</Button><Button variant="outlined" startIcon={<LightbulbOutlinedIcon />} onClick={() => void requestHint()} disabled={isSaving}>Show hint</Button><Button variant="text" onClick={() => void revealStep()} disabled={isSaving}>Reveal this step</Button></Stack>{hint && <Alert severity="info">Hint: {hint}</Alert>}</Stack></Paper>}
        {!session.activeStep && <Stack spacing={1.5}><Typography variant="h6">Try a similar problem</Typography>{session.followUpQuestions.map((question, index) => {
          const result = session.followUpResults[question.id]
          return <Paper key={question.id} elevation={0} sx={{ p: 2, border: 1, borderColor: result?.correct ? 'success.light' : 'divider' }}><Stack spacing={1}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Practice {index + 1}: {question.prompt}</Typography>{result ? <Alert severity={result.correct ? 'success' : 'error'}>{result.feedback}</Alert> : null}{!result?.correct && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><TextField fullWidth size="small" label="Your answer" value={followUpAnswers[question.id] ?? ''} onChange={(event) => setFollowUpAnswers((current) => ({ ...current, [question.id]: event.target.value }))} disabled={isSaving} /><Button variant="contained" onClick={() => void submitFollowUp(question.id)} disabled={isSaving || !followUpAnswers[question.id]?.trim()}>Check</Button></Stack>}</Stack></Paper>
        })}{session.completed && <Alert severity={allProblemsComplete ? 'success' : 'info'}>{allProblemsComplete ? 'All problems complete. Your progress has been saved.' : 'This problem is complete. Choose another problem to finish the lesson.'}</Alert>}</Stack>}
        <Button variant="text" onClick={() => { setSession(null); setFeedback(''); setHint('') }} disabled={isSaving}>Choose another problem</Button>
        {feedback && session.activeStep && <Alert severity={feedbackSeverity}>{feedback}</Alert>}
      </>}
    </Stack>
  </Paper>
}

export default StepByStepSolverLesson
