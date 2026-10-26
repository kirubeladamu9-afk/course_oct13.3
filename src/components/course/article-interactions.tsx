import { useState, type FC } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { type LearnerArticleCheckpoint } from '@/components/admin/admin-data'
import { type ArticleCheckpointAnswer, type ArticleHelpRequest } from '@/services/api'

export const ArticleCheckpointCard: FC<{ checkpoint: LearnerArticleCheckpoint; answer?: ArticleCheckpointAnswer; saving: boolean; onAnswer: (values: { selectedOption?: number; skip?: boolean }) => void }> = ({ checkpoint, answer, saving, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const answered = answer !== undefined && !answer.skipped
  const chosenOption = answer ? answer.selectedOption : selectedOption

  return <Paper elevation={0} role="group" aria-label="Pause and check" sx={{ p: { xs: 2.5, md: 3 }, mt: 3, border: 1, borderColor: 'primary.main', borderRadius: 2 }}>
    <Stack spacing={2}>
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, letterSpacing: 1 }}>Pause &amp; check</Typography>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{checkpoint.question}</Typography>
      <Stack spacing={1}>
        {checkpoint.options.map((option, index) => {
          const isCorrect = answered && answer?.correctOption === index
          const isWrongChoice = answered && chosenOption === index && !isCorrect
          return <Button
            key={index}
            aria-pressed={chosenOption === index}
            variant={chosenOption === index ? 'contained' : 'outlined'}
            color={isCorrect ? 'success' : isWrongChoice ? 'error' : 'inherit'}
            disabled={saving}
            onClick={() => { if (!answer) setSelectedOption(index) }}
            sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
          >
            {option}
          </Button>
        })}
      </Stack>
      {!answer && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="contained" disabled={selectedOption === null || saving} onClick={() => selectedOption !== null && onAnswer({ selectedOption })}>Check answer</Button>
        <Button variant="text" color="inherit" disabled={saving} onClick={() => onAnswer({ skip: true })}>Skip for now</Button>
      </Stack>}
      {answered && <Paper elevation={0} role="status" sx={{ p: 2, backgroundColor: (theme) => answer?.selectedOption === answer?.correctOption ? theme.palette.success.light : theme.palette.error.light }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{answer?.selectedOption === answer?.correctOption ? 'Correct' : `Not quite. The correct answer is ${checkpoint.options[answer?.correctOption ?? 0]}.`}</Typography>
        {answer?.explanation && <Typography variant="body2">{answer.explanation}</Typography>}
      </Paper>}
      {answer?.skipped && <Typography variant="body2" color="text.secondary">You skipped this check.</Typography>}
    </Stack>
  </Paper>
}

export const ArticleSectionHelp: FC<{ sectionTitle: string; helpRequest?: ArticleHelpRequest; saving: boolean; onFlag: () => void; onAskQuestion: (question: string) => void }> = ({ sectionTitle, helpRequest, saving, onFlag, onAskQuestion }) => {
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)

  if (!helpRequest) return <Box sx={{ mb: 3 }}>
    <Button variant="outlined" color="inherit" startIcon={<HelpOutlineIcon />} disabled={saving} onClick={onFlag} aria-label={`I need help with ${sectionTitle}`}>I need help with this section</Button>
  </Box>

  return <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Chip size="small" color="info" label="Flagged for your teacher" />
        {!helpRequest.question && !isAsking && <Button size="small" disabled={saving} onClick={() => setIsAsking(true)}>Ask a question</Button>}
      </Stack>
      {helpRequest.question && <Typography variant="body2" color="text.secondary">Your question: {helpRequest.question}</Typography>}
      {!helpRequest.question && isAsking && <>
        <TextField size="small" multiline minRows={2} fullWidth label="Your question for the teacher" value={question} onChange={(event) => setQuestion(event.target.value)} inputProps={{ maxLength: 1000 }} />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled={!question.trim() || saving} onClick={() => onAskQuestion(question.trim())}>Send question</Button>
          <Button color="inherit" onClick={() => setIsAsking(false)}>Cancel</Button>
        </Stack>
      </>}
    </Stack>
  </Paper>
}
