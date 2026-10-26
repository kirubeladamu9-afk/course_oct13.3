import { type FC } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { getArticleSectionTitles } from '@/lib/article-sections'
import { type AdminLesson, type ArticleCheckpoint } from './admin-data'

const maxOptions = 4

type Props = { lesson: AdminLesson; onChange: (lesson: AdminLesson) => void }

const ArticleCheckpointEditor: FC<Props> = ({ lesson, onChange }) => {
  const checkpoints = lesson.articleCheckpoints ?? []
  const sectionTitles = getArticleSectionTitles(lesson.articleBody ?? '')
  const updateCheckpoints = (next: ArticleCheckpoint[]) => onChange({ ...lesson, articleCheckpoints: next })
  const updateCheckpoint = (index: number, patch: Partial<ArticleCheckpoint>) => updateCheckpoints(checkpoints.map((checkpoint, checkpointIndex) => checkpointIndex === index ? { ...checkpoint, ...patch } : checkpoint))
  const updateOption = (checkpoint: ArticleCheckpoint, index: number, option: string) => ({ options: checkpoint.options.map((current, optionIndex) => optionIndex === index ? option : current) })
  const nextId = Math.max(0, ...checkpoints.map((checkpoint) => checkpoint.id)) + 1

  return <Box>
    <Typography variant="body2" sx={{ fontWeight: 700 }}>Pause &amp; Check</Typography>
    <Typography variant="caption" color="text.secondary">Add multiple-choice questions after a Heading 2 section. Students can answer or skip them before continuing.</Typography>
    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
      {checkpoints.map((checkpoint, index) => <Stack key={checkpoint.id} spacing={1.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
          <TextField select size="small" label="After section" value={checkpoint.afterSectionIndex} onChange={(event) => updateCheckpoint(index, { afterSectionIndex: Number(event.target.value) })} sx={{ minWidth: { sm: 240 } }}>
            {sectionTitles.map((title, sectionIndex) => <MenuItem key={sectionIndex} value={sectionIndex}>{title}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Question" required fullWidth value={checkpoint.question} error={!checkpoint.question.trim()} onChange={(event) => updateCheckpoint(index, { question: event.target.value })} />
          <IconButton color="error" aria-label={`Remove checkpoint ${index + 1}`} onClick={() => updateCheckpoints(checkpoints.filter((_, checkpointIndex) => checkpointIndex !== index))}><DeleteOutlineIcon /></IconButton>
        </Stack>
        {checkpoint.options.map((option, optionIndex) => <Stack key={optionIndex} direction="row" alignItems="center" spacing={1}>
          <Radio checked={checkpoint.correctOption === optionIndex} onChange={() => updateCheckpoint(index, { correctOption: optionIndex })} inputProps={{ 'aria-label': `Option ${optionIndex + 1} is correct` }} />
          <TextField size="small" label={`Option ${optionIndex + 1}`} required fullWidth value={option} error={!option.trim()} onChange={(event) => updateCheckpoint(index, updateOption(checkpoint, optionIndex, event.target.value))} />
          <IconButton disabled={checkpoint.options.length <= 2} aria-label={`Remove option ${optionIndex + 1}`} onClick={() => updateCheckpoint(index, { options: checkpoint.options.filter((_, currentIndex) => currentIndex !== optionIndex), correctOption: checkpoint.correctOption > optionIndex ? checkpoint.correctOption - 1 : Math.min(checkpoint.correctOption, checkpoint.options.length - 2) })}><DeleteOutlineIcon /></IconButton>
        </Stack>)}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Button size="small" startIcon={<AddIcon />} disabled={checkpoint.options.length >= maxOptions} onClick={() => updateCheckpoint(index, { options: [...checkpoint.options, ''] })}>Add option</Button>
          <Typography variant="caption" color="text.secondary">Select the circle beside the correct option.</Typography>
        </Stack>
        <TextField size="small" label="Explanation shown after answering" fullWidth multiline minRows={1} value={checkpoint.explanation} onChange={(event) => updateCheckpoint(index, { explanation: event.target.value })} />
      </Stack>)}
      <Button variant="outlined" startIcon={<AddIcon />} disabled={!sectionTitles.length} onClick={() => updateCheckpoints([...checkpoints, { id: nextId, afterSectionIndex: 0, question: '', options: ['', ''], correctOption: 0, explanation: '' }])} sx={{ alignSelf: 'flex-start' }}>Add checkpoint</Button>
    </Stack>
  </Box>
}

export default ArticleCheckpointEditor
