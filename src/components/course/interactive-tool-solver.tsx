import { useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { type InteractiveToolConfig, type InteractiveToolSession } from '@/components/admin/admin-data'
import { getInteractiveToolProgress, requestInteractiveToolHint, resetInteractiveToolProgress, startInteractiveToolSession, startSimilarInteractiveToolProblem, submitInteractiveToolAnswer } from '@/services/api'

type Props = { config: InteractiveToolConfig; enrollmentId: number; lessonId: number; onCompleted: () => void }

const InteractiveToolSolver = ({ config, enrollmentId, lessonId, onCompleted }: Props) => {
  const [session, setSession] = useState<InteractiveToolSession | null>(null)
  const [problemInput, setProblemInput] = useState(config.exampleProblem ?? config.examples[0] ?? '')
  const [answerInput, setAnswerInput] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [hint, setHint] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const learningMode = config.learningMode ?? 'Guided'
  const isWordProblemTool = config.toolType === 'word-problems'

  useEffect(() => {
    let active = true
    void getInteractiveToolProgress(enrollmentId, lessonId)
      .then((saved) => {
        if (!active) return
        setSession(saved)
        if (saved?.isCompleted) onCompleted()
        else if (saved) setProblemInput(saved.problem)
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load saved solver session.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [enrollmentId, lessonId, onCompleted])

  const beginProblem = async (problem = problemInput) => {
    setIsSaving(true)
    setError('')
    setFeedback(null)
    setHint('')
    try {
      const started = await startInteractiveToolSession(enrollmentId, lessonId, problem)
      setSession(started)
      setProblemInput(started.problem)
      setAnswerInput('')
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Unable to start this problem.')
    } finally {
      setIsSaving(false)
    }
  }

  const checkAnswer = async () => {
    if (!session || !answerInput.trim()) return
    setIsSaving(true)
    setError('')
    setHint('')
    try {
      const result = await submitInteractiveToolAnswer(enrollmentId, lessonId, session.sessionId, answerInput)
      setSession(result.session)
      setFeedback({ type: result.isCorrect ? 'success' : 'error', message: result.feedback })
      if (result.isCorrect) setAnswerInput('')
      if (result.session.isCompleted) onCompleted()
    } catch (answerError) {
      setError(answerError instanceof Error ? answerError.message : 'Unable to check this step.')
    } finally {
      setIsSaving(false)
    }
  }

  const showHint = async () => {
    if (!session) return
    setIsSaving(true)
    setError('')
    try {
      const result = await requestInteractiveToolHint(enrollmentId, lessonId, session.sessionId)
      setHint(result.hint)
    } catch (hintError) {
      setError(hintError instanceof Error ? hintError.message : 'Unable to load a hint.')
    } finally {
      setIsSaving(false)
    }
  }

  const trySimilarProblem = async () => {
    if (!session) return
    setIsSaving(true)
    setError('')
    setFeedback(null)
    setHint('')
    try {
      const next = await startSimilarInteractiveToolProblem(enrollmentId, lessonId, session.sessionId)
      setSession(next)
      setProblemInput(next.problem)
      setAnswerInput('')
    } catch (similarError) {
      setError(similarError instanceof Error ? similarError.message : 'Unable to start a similar problem.')
    } finally {
      setIsSaving(false)
    }
  }

  const resetProblem = async () => {
    setIsSaving(true)
    setError('')
    try {
      await resetInteractiveToolProgress(enrollmentId, lessonId)
      setSession(null)
      setProblemInput(config.exampleProblem ?? config.examples[0] ?? '')
      setAnswerInput('')
      setFeedback(null)
      setHint('')
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to reset the saved problem.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress aria-label="Loading saved solver session" /></Box>

  return <Paper elevation={0} sx={{ p: { xs: 2, sm: 3, md: 4 }, border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
    <Stack spacing={2.5}>
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
          <Box><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>Guided Step-by-Step Solver · {config.subject}</Typography><Typography variant="h5" sx={{ fontWeight: 750 }}>{isWordProblemTool ? 'Word Problems' : 'Step-by-Step Solver'}</Typography></Box>
          <Stack direction="row" spacing={1}><Chip label={config.difficulty} color="primary" variant="outlined" /><Chip label={learningMode} variant="outlined" /></Stack>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{config.instructions}</Typography>
        {config.learningObjectives.length > 0 && <Box sx={{ mt: 1.5 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>Learning objectives</Typography>{config.learningObjectives.map((objective) => <Typography key={objective} variant="body2" color="text.secondary">• {objective}</Typography>)}</Box>}
      </Box>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {!session && <Stack spacing={1.5}>
        <TextField fullWidth multiline minRows={2} label="Enter a problem or use the teacher's example" placeholder="Type a supported problem" value={problemInput} onChange={(event) => setProblemInput(event.target.value)} inputProps={{ maxLength: 500 }} />
        {config.examples.length > 0 && <Box><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>Teacher examples</Typography><Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">{config.examples.map((example) => <Chip key={example} label={example} clickable onClick={() => { setProblemInput(example); setError('') }} variant="outlined" />)}</Stack></Box>}
        <Button variant="contained" onClick={() => void beginProblem()} disabled={!problemInput.trim() || isSaving} startIcon={<PlayArrowIcon />} sx={{ alignSelf: 'flex-start' }}>{isSaving ? 'Starting…' : 'Start solving'}</Button>
      </Stack>}
      {session && !session.isCompleted && session.step && <Stack spacing={2}>
        <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}><Typography variant="caption" color="text.secondary">Problem</Typography><Typography sx={{ fontWeight: 700 }}>{session.problem}</Typography><Typography variant="caption" color="text.secondary">Step {session.currentStep + 1} of {session.totalSteps}</Typography></Paper>
        <Box><Typography variant="h6" sx={{ fontWeight: 700 }}>{session.step.title}</Typography>{session.step.reasoning && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{session.step.reasoning}</Typography>}</Box>
        <TextField fullWidth label={session.step.prompt} value={answerInput} onChange={(event) => { setAnswerInput(event.target.value); setFeedback(null) }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void checkAnswer() } }} inputProps={{ maxLength: 500 }} />
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="space-between" spacing={1}>{learningMode === 'Guided' && <Button startIcon={<LightbulbOutlinedIcon />} onClick={() => void showHint()} disabled={isSaving}>Get a hint</Button>}<Button variant="contained" onClick={() => void checkAnswer()} disabled={!answerInput.trim() || isSaving}>{isSaving ? 'Checking…' : 'Check answer'}</Button></Stack>
        {hint && <Alert severity="info">{hint}</Alert>}
        {feedback && <Alert severity={feedback.type}>{feedback.message}</Alert>}
      </Stack>}
      {session?.isCompleted && session.result && <Stack spacing={2}>
        <Alert icon={<CheckCircleOutlineIcon />} severity="success"><Typography sx={{ fontWeight: 700 }}>Solution complete</Typography><Typography variant="body2">Final answer: {session.result.finalAnswer}</Typography></Alert>
        {learningMode === 'Guided' && <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Explanation</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>{session.result.explanation}</Typography></Paper>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant="contained" onClick={() => void trySimilarProblem()} disabled={isSaving}>Try a similar problem</Button><Button variant="outlined" onClick={() => void resetProblem()} disabled={isSaving}>Solve another problem</Button></Stack>
      </Stack>}
    </Stack>
  </Paper>
}

export default InteractiveToolSolver
