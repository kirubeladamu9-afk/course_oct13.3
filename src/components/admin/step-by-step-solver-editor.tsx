import { Box, Button, IconButton, Paper, Stack, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { type AdminLesson, type StepByStepSolverFollowUp, type StepByStepSolverProblem, type StepByStepSolverStep } from './admin-data'

type Props = { lesson: AdminLesson; onChange: (lesson: AdminLesson) => void }

const StepByStepSolverEditor = ({ lesson, onChange }: Props) => {
  const config = lesson.stepByStepSolver ?? { problems: [] }
  const updateProblems = (problems: StepByStepSolverProblem[]) => onChange({ ...lesson, stepByStepSolver: { ...config, problems } })
  const updateProblem = (problemId: number, update: Partial<StepByStepSolverProblem>) => updateProblems(config.problems.map((problem) => problem.id === problemId ? { ...problem, ...update } : problem))
  const addProblem = () => updateProblems([...config.problems, { id: Math.max(0, ...config.problems.map((problem) => problem.id)) + 1, prompt: '', steps: [{ id: 1, instruction: '', explanation: '', hint: '', correctiveFeedback: '', correctAnswer: '' }], followUpQuestions: [{ id: 1, prompt: '', correctAnswer: '', explanation: '', correctiveFeedback: '' }] }])
  const updateStep = (problem: StepByStepSolverProblem, stepId: number, update: Partial<StepByStepSolverStep>) => updateProblem(problem.id, { steps: problem.steps.map((step) => step.id === stepId ? { ...step, ...update } : step) })
  const updateFollowUp = (problem: StepByStepSolverProblem, questionId: number, update: Partial<StepByStepSolverFollowUp>) => updateProblem(problem.id, { followUpQuestions: problem.followUpQuestions.map((question) => question.id === questionId ? { ...question, ...update } : question) })

  return <Stack spacing={2}>
    <Box><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Worked problems</Typography><Typography variant="body2" color="text.secondary">Add each solution step in reveal order. Correct answers stay hidden until a learner checks or reveals that step.</Typography></Box>
    {config.problems.map((problem, problemIndex) => <Paper key={problem.id} elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider' }}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Problem {problemIndex + 1}</Typography><IconButton size="small" color="error" onClick={() => updateProblems(config.problems.filter((item) => item.id !== problem.id))} aria-label={`Delete problem ${problemIndex + 1}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Stack>
        <TextField fullWidth multiline minRows={2} label="Problem" value={problem.prompt} onChange={(event) => updateProblem(problem.id, { prompt: event.target.value })} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Ordered solution steps</Typography>
        {problem.steps.map((step, stepIndex) => <Paper key={step.id} elevation={0} sx={{ p: 1.25, border: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Stack spacing={1}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="body2" sx={{ fontWeight: 600 }}>Step {stepIndex + 1}</Typography><IconButton size="small" color="error" disabled={problem.steps.length === 1} onClick={() => updateProblem(problem.id, { steps: problem.steps.filter((item) => item.id !== step.id) })} aria-label={`Delete step ${stepIndex + 1}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Stack>
            <TextField fullWidth size="small" label="Step instruction" value={step.instruction} onChange={(event) => updateStep(problem, step.id, { instruction: event.target.value })} />
            <TextField fullWidth size="small" label="Correct answer for this step" value={step.correctAnswer} onChange={(event) => updateStep(problem, step.id, { correctAnswer: event.target.value })} />
            <TextField fullWidth multiline minRows={2} size="small" label="Explanation shown after reveal" value={step.explanation} onChange={(event) => updateStep(problem, step.id, { explanation: event.target.value })} />
            <TextField fullWidth size="small" label="Hint" value={step.hint} onChange={(event) => updateStep(problem, step.id, { hint: event.target.value })} />
            <TextField fullWidth size="small" label="Corrective feedback for an incorrect answer" value={step.correctiveFeedback} onChange={(event) => updateStep(problem, step.id, { correctiveFeedback: event.target.value })} />
          </Stack>
        </Paper>)}
        <Button size="small" startIcon={<AddIcon />} onClick={() => updateProblem(problem.id, { steps: [...problem.steps, { id: Math.max(0, ...problem.steps.map((step) => step.id)) + 1, instruction: '', explanation: '', hint: '', correctiveFeedback: '', correctAnswer: '' }] })}>Add solution step</Button>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Follow-up practice problems</Typography>
        {problem.followUpQuestions.map((question, questionIndex) => <Paper key={question.id} elevation={0} sx={{ p: 1.25, border: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Stack spacing={1}><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="body2" sx={{ fontWeight: 600 }}>Practice problem {questionIndex + 1}</Typography><IconButton size="small" color="error" disabled={problem.followUpQuestions.length === 1} onClick={() => updateProblem(problem.id, { followUpQuestions: problem.followUpQuestions.filter((item) => item.id !== question.id) })} aria-label={`Delete follow-up problem ${questionIndex + 1}`}><DeleteOutlineIcon fontSize="small" /></IconButton></Stack>
            <TextField fullWidth size="small" label="Problem" value={question.prompt} onChange={(event) => updateFollowUp(problem, question.id, { prompt: event.target.value })} />
            <TextField fullWidth size="small" label="Correct answer" value={question.correctAnswer} onChange={(event) => updateFollowUp(problem, question.id, { correctAnswer: event.target.value })} />
            <TextField fullWidth multiline minRows={2} size="small" label="Explanation after correct answer" value={question.explanation} onChange={(event) => updateFollowUp(problem, question.id, { explanation: event.target.value })} />
            <TextField fullWidth size="small" label="Corrective feedback for an incorrect answer" value={question.correctiveFeedback} onChange={(event) => updateFollowUp(problem, question.id, { correctiveFeedback: event.target.value })} />
          </Stack>
        </Paper>)}
        <Button size="small" startIcon={<AddIcon />} onClick={() => updateProblem(problem.id, { followUpQuestions: [...problem.followUpQuestions, { id: Math.max(0, ...problem.followUpQuestions.map((item) => item.id)) + 1, prompt: '', correctAnswer: '', explanation: '', correctiveFeedback: '' }] })}>Add follow-up problem</Button>
      </Stack>
    </Paper>)}
    <Button variant="outlined" startIcon={<AddIcon />} onClick={addProblem} sx={{ alignSelf: 'flex-start' }}>Add worked problem</Button>
  </Stack>
}

export default StepByStepSolverEditor
