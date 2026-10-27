import AddIcon from '@mui/icons-material/Add'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type FC, useState } from 'react'
import { type ArticleCheckpoint } from '@/lib/article-checkpoints'

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6

export const ArticleCheckpointDialog: FC<{ checkpoint: ArticleCheckpoint; onSave: (checkpoint: ArticleCheckpoint) => void; onCancel: () => void }> = ({ checkpoint, onSave, onCancel }) => {
  const [draft, setDraft] = useState(checkpoint)
  const options = draft.options.map((option) => option.trim())
  const canSave = draft.question.trim() !== '' && options.length >= MIN_OPTIONS && options.every(Boolean) && draft.correctOption < options.length

  const updateOption = (index: number, value: string) => setDraft((current) => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? value : option) }))
  const removeOption = (index: number) => setDraft((current) => ({
    ...current,
    options: current.options.filter((_, optionIndex) => optionIndex !== index),
    correctOption: current.correctOption === index ? 0 : current.correctOption > index ? current.correctOption - 1 : current.correctOption,
  }))

  return <Dialog open onClose={onCancel} fullWidth maxWidth="sm">
    <DialogTitle>Pause &amp; Check question</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <TextField required fullWidth multiline minRows={2} label="Question" value={draft.question} onChange={(event) => setDraft((current) => ({ ...current, question: event.target.value }))} inputProps={{ maxLength: 500 }} />
        <RadioGroup aria-label="Answer options" value={draft.correctOption} onChange={(event) => setDraft((current) => ({ ...current, correctOption: Number(event.target.value) }))}>
          <Stack spacing={1}>
            {draft.options.map((option, index) => <Stack key={index} direction="row" spacing={1} alignItems="center">
              <Radio value={index} size="small" inputProps={{ 'aria-label': `Mark option ${index + 1} as correct` }} />
              <TextField required fullWidth size="small" label={`Option ${index + 1}`} value={option} onChange={(event) => updateOption(index, event.target.value)} inputProps={{ maxLength: 300 }} />
              <IconButton aria-label={`Remove option ${index + 1}`} disabled={draft.options.length <= MIN_OPTIONS} onClick={() => removeOption(index)}><DeleteOutlineIcon fontSize="small" /></IconButton>
            </Stack>)}
          </Stack>
        </RadioGroup>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">Select the radio button beside the correct answer.</Typography>
          <Button size="small" startIcon={<AddIcon />} disabled={draft.options.length >= MAX_OPTIONS} onClick={() => setDraft((current) => ({ ...current, options: [...current.options, ''] }))}>Add option</Button>
        </Stack>
        <TextField fullWidth multiline minRows={2} label="Explanation (optional)" helperText="Shown to students after they check their answer." value={draft.explanation} onChange={(event) => setDraft((current) => ({ ...current, explanation: event.target.value }))} inputProps={{ maxLength: 1000 }} />
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button color="inherit" onClick={onCancel}>Cancel</Button>
      <Button variant="contained" disabled={!canSave} onClick={() => onSave({ ...draft, question: draft.question.trim(), options, explanation: draft.explanation.trim() })}>Save question</Button>
    </DialogActions>
  </Dialog>
}

export const ArticleCheckpointList: FC<{ checkpoints: ArticleCheckpoint[]; onEdit: (id: number) => void; onMove: (id: number, direction: -1 | 1) => void; onDelete: (id: number) => void }> = ({ checkpoints, onEdit, onMove, onDelete }) => <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.paper' }}>
  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Pause &amp; Check questions</Typography>
  <Typography variant="caption" color="text.secondary">Place the cursor in the article and use Insert &gt; Add Pause &amp; Check. Students see each question where it appears in the article.</Typography>
  {checkpoints.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>No questions yet.</Typography>}
  <Stack spacing={1} sx={{ mt: 1.5 }}>
    {checkpoints.map((checkpoint, index) => <Stack key={checkpoint.id} direction="row" alignItems="center" spacing={1} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1.5, minWidth: 0 }}>
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{index + 1}. {checkpoint.question || 'Untitled question'}</Typography>
      <IconButton size="small" aria-label={`Move question ${index + 1} up`} disabled={index === 0} onClick={() => onMove(checkpoint.id, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton>
      <IconButton size="small" aria-label={`Move question ${index + 1} down`} disabled={index === checkpoints.length - 1} onClick={() => onMove(checkpoint.id, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton>
      <IconButton size="small" aria-label={`Edit question ${index + 1}`} onClick={() => onEdit(checkpoint.id)}><EditOutlinedIcon fontSize="small" /></IconButton>
      <IconButton size="small" color="error" aria-label={`Delete question ${index + 1}`} onClick={() => onDelete(checkpoint.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
    </Stack>)}
  </Stack>
</Paper>

export const ArticleHelpSettings: FC<{ sectionTitles: string[]; disabledSections: number[]; onChange: (disabledSections: number[]) => void }> = ({ sectionTitles, disabledSections, onChange }) => <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.paper' }}>
  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>I Need Help sections</Typography>
  <Typography variant="caption" color="text.secondary">Students can flag each Heading 2 section. Turn off sections that should not accept requests.</Typography>
  {sectionTitles.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Add a Heading 2 to create sections students can flag.</Typography>}
  <Stack spacing={0.5} sx={{ mt: 1 }}>
    {sectionTitles.map((title, index) => <FormControlLabel key={index} control={<Switch size="small" checked={!disabledSections.includes(index)} onChange={(event) => onChange(event.target.checked ? disabledSections.filter((item) => item !== index) : [...disabledSections, index])} />} label={<Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{title}</Typography>} sx={{ mx: 0, alignItems: 'center' }} />)}
  </Stack>
</Paper>
