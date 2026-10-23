import { type FC } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { type AdminLesson, type ArticleVocabularyEntry } from './admin-data'

type Props = { lesson: AdminLesson; onChange: (lesson: AdminLesson) => void }

const ArticleVocabularyEditor: FC<Props> = ({ lesson, onChange }) => {
  const entries = lesson.articleVocabulary ?? []
  const updateEntries = (next: ArticleVocabularyEntry[]) => onChange({ ...lesson, articleVocabulary: next })
  const updateEntry = (index: number, patch: Partial<ArticleVocabularyEntry>) => updateEntries(entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, ...patch } : entry))

  return <Box>
    <Typography variant="body2" sx={{ fontWeight: 700 }}>Vocabulary</Typography>
    <Typography variant="caption" color="text.secondary">Students can look up these words while reading. Only words you add here show a meaning.</Typography>
    <Stack spacing={1.5} sx={{ mt: 1.5 }}>
      {entries.map((entry, index) => <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
        <TextField size="small" label="Word" required value={entry.word} error={!entry.word.trim()} onChange={(event) => updateEntry(index, { word: event.target.value })} sx={{ minWidth: { sm: 150 } }} />
        <TextField size="small" label="Definition" required fullWidth multiline minRows={1} value={entry.definition} error={!entry.definition.trim()} onChange={(event) => updateEntry(index, { definition: event.target.value })} />
        <TextField size="small" label="Example sentence (optional)" fullWidth multiline minRows={1} value={entry.example} onChange={(event) => updateEntry(index, { example: event.target.value })} />
        <IconButton color="error" aria-label={`Remove vocabulary word ${entry.word || index + 1}`} onClick={() => updateEntries(entries.filter((_, entryIndex) => entryIndex !== index))}><DeleteOutlineIcon /></IconButton>
      </Stack>)}
      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => updateEntries([...entries, { word: '', definition: '', example: '' }])} sx={{ alignSelf: 'flex-start' }}>Add word</Button>
    </Stack>
  </Box>
}

export default ArticleVocabularyEditor
