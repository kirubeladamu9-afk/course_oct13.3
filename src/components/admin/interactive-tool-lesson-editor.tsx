import { Alert, Box, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { previewInteractiveTool } from '@/services/api'
import { type AdminLesson, type InteractiveToolConfig, type InteractiveToolType } from './admin-data'

type Props = { lesson: AdminLesson; onChange: (lesson: AdminLesson) => void }
type Preview = { solvable: boolean; message?: string; finalAnswer?: string; steps?: number; topic?: string }

const toolsBySubject: Record<InteractiveToolConfig['subject'], InteractiveToolType[]> = {
  Mathematics: ['step-by-step-solver', 'word-problems'],
  Physics: ['step-by-step-solver', 'word-problems'],
  Chemistry: ['step-by-step-solver', 'word-problems'],
  Biology: ['step-by-step-solver', 'word-problems'],
  Other: [],
}
const toolLabels: Record<InteractiveToolType, string> = { 'step-by-step-solver': 'Step-by-Step Solver', 'word-problems': 'Word Problems' }
const exampleFor = (subject: InteractiveToolConfig['subject'], tool: InteractiveToolType) => ({
  Mathematics: { 'step-by-step-solver': '2x + 3 = 11', 'word-problems': 'A number increased by 3 is 11. What is the number?' },
  Physics: { 'step-by-step-solver': 'Distance = 120, time = 2, find speed.', 'word-problems': 'A car travels 120 meters in 2 seconds. Find its speed.' },
  Chemistry: { 'step-by-step-solver': 'H2 + O2 -> H2O', 'word-problems': 'How many moles are in 18 g of H2O?' },
  Biology: { 'step-by-step-solver': 'Aa × aa', 'word-problems': 'Cross Aa with aa. Find the genotype ratio.' },
  Other: { 'step-by-step-solver': '', 'word-problems': '' },
})[subject][tool]

const InteractiveToolLessonEditor = ({ lesson, onChange }: Props) => {
  const config = lesson.interactiveTool!
  const updateConfig = (update: Partial<InteractiveToolConfig>) => onChange({ ...lesson, interactiveTool: { ...config, ...update } })
  const parseLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)
  const toolOptions = toolsBySubject[config.subject]
  const learningMode = config.learningMode === 'Practice' ? 'Practice' : 'Guided'
  const exampleProblem = config.exampleProblem ?? config.examples[0] ?? ''
  const [preview, setPreview] = useState<Preview | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    let current = true
    if (!exampleProblem.trim() || !toolOptions.includes(config.toolType)) {
      setPreview({ solvable: false, message: 'Choose a supported subject, tool, and example problem.' })
      setIsChecking(false)
      return () => { current = false }
    }
    setIsChecking(true)
    const timer = window.setTimeout(() => {
      void previewInteractiveTool({ subject: config.subject, toolType: config.toolType, difficulty: config.difficulty, problem: exampleProblem })
        .then((result) => { if (current) setPreview(result) })
        .catch((error) => { if (current) setPreview({ solvable: false, message: error instanceof Error ? error.message : 'Unable to check this problem.' }) })
        .finally(() => { if (current) setIsChecking(false) })
    }, 300)
    return () => { current = false; window.clearTimeout(timer) }
  }, [config.subject, config.toolType, config.difficulty, exampleProblem, toolOptions])

  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">Configure a rule-based solver students can use to work through problems one step at a time.</Typography>
    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Solver Configuration</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField select fullWidth label="Subject" value={config.subject} onChange={(event) => {
        const subject = event.target.value as InteractiveToolConfig['subject']
        const compatibleTools = toolsBySubject[subject]
        const toolType = compatibleTools[0] ?? 'step-by-step-solver'
        const exampleProblem = exampleFor(subject, toolType)
        updateConfig({ subject, toolType, exampleProblem, examples: exampleProblem ? [exampleProblem] : [] })
      }}>{['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Other'].map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}</TextField>
      <TextField select fullWidth label="Tool" value={toolOptions.includes(config.toolType) ? config.toolType : ''} onChange={(event) => {
        const toolType = event.target.value as InteractiveToolType
        const exampleProblem = exampleFor(config.subject, toolType)
        updateConfig({ toolType, exampleProblem, examples: exampleProblem ? [exampleProblem] : [] })
      }} disabled={!toolOptions.length}>{toolOptions.map((tool) => <MenuItem key={tool} value={tool}>{toolLabels[tool]}</MenuItem>)}</TextField>
    </Stack>
    {!toolOptions.length && <Alert severity="info">No rule-based solver is available for Other yet. Choose a subject with a supported solver topic.</Alert>}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField select fullWidth label="Difficulty" value={config.difficulty} onChange={(event) => updateConfig({ difficulty: event.target.value as InteractiveToolConfig['difficulty'] })}>{['Beginner', 'Intermediate', 'Advanced'].map((difficulty) => <MenuItem key={difficulty} value={difficulty}>{difficulty}</MenuItem>)}</TextField>
      <TextField select fullWidth label="Mode" value={learningMode} onChange={(event) => updateConfig({ learningMode: event.target.value as InteractiveToolConfig['learningMode'] })}><MenuItem value="Guided">Guided — hints and explanations</MenuItem><MenuItem value="Practice">Practice — solve independently</MenuItem></TextField>
    </Stack>
    <TextField fullWidth multiline minRows={2} label="Example problem" value={exampleProblem} onChange={(event) => updateConfig({ exampleProblem: event.target.value, examples: event.target.value.trim() ? [event.target.value.trim()] : [] })} />
    <TextField fullWidth multiline minRows={2} label="Student instructions" value={config.instructions} onChange={(event) => updateConfig({ instructions: event.target.value })} />
    <TextField fullWidth multiline minRows={2} label="Learning objectives (one per line)" value={config.learningObjectives.join('\n')} onChange={(event) => updateConfig({ learningObjectives: parseLines(event.target.value) })} />
    <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5 }} aria-live="polite">
      {isChecking && <CircularProgress size={18} aria-label="Checking example problem" />}
      {!isChecking && preview?.solvable && <Box><Typography sx={{ fontWeight: 700 }}>Solvable: {preview.finalAnswer}, {preview.steps} {preview.steps === 1 ? 'step' : 'steps'}</Typography><Typography variant="caption" color="text.secondary">{preview.topic}</Typography></Box>}
      {!isChecking && preview && !preview.solvable && <Typography color="error.main" variant="body2">{preview.message}</Typography>}
    </Paper>
  </Stack>
}

export default InteractiveToolLessonEditor
