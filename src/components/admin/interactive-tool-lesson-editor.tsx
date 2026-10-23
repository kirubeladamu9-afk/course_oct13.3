import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { type AdminLesson, type InteractiveToolConfig } from './admin-data'

type Props = { lesson: AdminLesson; onChange: (lesson: AdminLesson) => void }

const InteractiveToolLessonEditor = ({ lesson, onChange }: Props) => {
  const config = lesson.interactiveTool!
  const updateConfig = (update: Partial<InteractiveToolConfig>) => onChange({ ...lesson, interactiveTool: { ...config, ...update } })
  const parseLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)
  const learningMode = config.learningMode ?? 'Guided'
  const exampleProblem = config.exampleProblem ?? config.examples[0] ?? ''

  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">Configure a guided, rule-based tool students can use to solve problems and check each step.</Typography>
    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Interactive Tool Configuration</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField select fullWidth label="Subject" value={config.subject} onChange={(event) => updateConfig({ subject: event.target.value as InteractiveToolConfig['subject'] })}>{['Mathematics', 'Physics', 'Chemistry', 'Biology'].map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}</TextField>
      <TextField select fullWidth label="Tool" value={config.toolType} onChange={(event) => updateConfig({ toolType: event.target.value as InteractiveToolConfig['toolType'] })}><MenuItem value="step-by-step-solver">Step-by-Step Equation Solver</MenuItem></TextField>
    </Stack>
    <Typography variant="caption" color="text.secondary">In production, show only tools compatible with the selected subject.</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField select fullWidth label="Difficulty Level" value={config.difficulty} onChange={(event) => updateConfig({ difficulty: event.target.value as InteractiveToolConfig['difficulty'] })}>{['Beginner', 'Intermediate', 'Advanced'].map((difficulty) => <MenuItem key={difficulty} value={difficulty}>{difficulty}</MenuItem>)}</TextField>
      <TextField select fullWidth label="Learning Mode" value={learningMode} onChange={(event) => updateConfig({ learningMode: event.target.value as InteractiveToolConfig['learningMode'] })}><MenuItem value="Guided">Guided — show hints and explanations</MenuItem><MenuItem value="Independent">Independent — student solves each step</MenuItem><MenuItem value="Demonstration">Demonstration — show the worked solution</MenuItem></TextField>
    </Stack>
    <TextField fullWidth label="Example Problem" value={exampleProblem} onChange={(event) => updateConfig({ exampleProblem: event.target.value, examples: event.target.value.trim() ? [event.target.value.trim()] : [] })} />
    <TextField fullWidth multiline minRows={2} label="Student instructions" value={config.instructions} onChange={(event) => updateConfig({ instructions: event.target.value })} />
    <TextField fullWidth multiline minRows={2} label="Learning objectives (one per line)" value={config.learningObjectives.join('\n')} onChange={(event) => updateConfig({ learningObjectives: parseLines(event.target.value) })} />
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Configuration preview</Typography>
      <Stack spacing={0.5}>
        <Typography variant="body2">Subject: {config.subject}</Typography>
        <Typography variant="body2">Tool: Step-by-Step Equation Solver</Typography>
        <Typography variant="body2">Difficulty: {config.difficulty}</Typography>
        <Typography variant="body2">Mode: {learningMode}</Typography>
        <Typography variant="body2">Example: {exampleProblem || 'No example problem entered'}</Typography>
      </Stack>
    </Paper>
    <Alert severity="info">The configuration preview is illustrative. Saving the lesson stores these settings; the student tool behavior depends on the selected tool's supported features.</Alert>
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Student experience preview</Typography>
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        <Box><Typography variant="overline" color="primary.main">Step-by-Step Solver</Typography><Typography variant="body2" color="text.secondary">Step 1 of 3</Typography></Box>
        <Typography variant="body2">{config.instructions || 'Solve the equation by isolating x.'}</Typography>
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{exampleProblem || '2x + 3 = 11'}</Typography>
        <Typography variant="body2">What should you do first?</Typography>
        <Stack spacing={0.75}>
          <Button variant="outlined" disabled sx={{ justifyContent: 'flex-start' }}>Subtract 3 from both sides</Button>
          <Button variant="outlined" disabled sx={{ justifyContent: 'flex-start' }}>Divide both sides by 2</Button>
          <Button variant="outlined" disabled sx={{ justifyContent: 'flex-start' }}>Add 3 to both sides</Button>
        </Stack>
        <Stack direction="row" spacing={1}><Button disabled>Get a hint</Button><Button variant="contained" disabled>Check answer</Button></Stack>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Preview only. The actual solver generates and validates steps using the selected tool's rules.</Typography>
    </Paper>
  </Stack>
}

export default InteractiveToolLessonEditor
