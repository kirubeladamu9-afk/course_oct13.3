import { MenuItem, Stack, TextField, Typography } from '@mui/material'
import { type AdminLesson, type InteractiveToolConfig } from './admin-data'

type Props = { lesson: AdminLesson; onChange: (lesson: AdminLesson) => void }

const InteractiveToolLessonEditor = ({ lesson, onChange }: Props) => {
  const config = lesson.interactiveTool!
  const updateConfig = (update: Partial<InteractiveToolConfig>) => onChange({ ...lesson, interactiveTool: { ...config, ...update } })
  const parseLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean)

  return <Stack spacing={1.75}>
    <Typography variant="body2" color="text.secondary">Configure a guided, rule-based tool students can use to solve problems and check each step.</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField select fullWidth label="Subject" value={config.subject} onChange={(event) => updateConfig({ subject: event.target.value as InteractiveToolConfig['subject'] })}>{['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Other'].map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}</TextField>
      <TextField select fullWidth label="Tool type" value={config.toolType} onChange={(event) => updateConfig({ toolType: event.target.value as InteractiveToolConfig['toolType'] })}><MenuItem value="step-by-step-solver">Step-by-Step Solver</MenuItem></TextField>
    </Stack>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField select fullWidth label="Mathematics task" value={config.task} onChange={(event) => updateConfig({ task: event.target.value as InteractiveToolConfig['task'] })}>{['Automatic', 'Equation solving', 'Arithmetic', 'Geometry'].map((task) => <MenuItem key={task} value={task}>{task}</MenuItem>)}</TextField>
      <TextField select fullWidth label="Difficulty" value={config.difficulty} onChange={(event) => updateConfig({ difficulty: event.target.value as InteractiveToolConfig['difficulty'] })}>{['Beginner', 'Intermediate', 'Advanced'].map((difficulty) => <MenuItem key={difficulty} value={difficulty}>{difficulty}</MenuItem>)}</TextField>
    </Stack>
    <TextField fullWidth multiline minRows={2} label="Student instructions" value={config.instructions} onChange={(event) => updateConfig({ instructions: event.target.value })} />
    <TextField fullWidth multiline minRows={3} label="Example problems (one per line)" value={config.examples.join('\n')} onChange={(event) => updateConfig({ examples: parseLines(event.target.value) })} />
    <TextField fullWidth multiline minRows={2} label="Learning objectives (one per line)" value={config.learningObjectives.join('\n')} onChange={(event) => updateConfig({ learningObjectives: parseLines(event.target.value) })} />
  </Stack>
}

export default InteractiveToolLessonEditor
