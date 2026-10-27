import { useState, type FC } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { type LearnerArticleCheckpoint } from '@/lib/article-checkpoints'
import { type ArticleCheckpointResponse, type ArticleHelpRequest } from '@/services/api'

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
      {helpRequest.teacherReply && <Box sx={{ p: 1.5, borderRadius: 1, backgroundColor: 'action.hover' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Reply from your teacher</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.7 }}>{helpRequest.teacherReply}</Typography>
      </Box>}
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

export const ArticleCheckpointCard: FC<{
  checkpoint: LearnerArticleCheckpoint
  response?: ArticleCheckpointResponse
  blocking: boolean
  saving: boolean
  onAnswer: (selectedOption: number) => void
  onSkip: () => void
  onContinue: () => void
}> = ({ checkpoint, response, blocking, saving, onAnswer, onSkip, onContinue }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  return <Paper elevation={0} sx={{ my: 3, p: { xs: 2, sm: 2.5 }, border: 1, borderColor: 'divider', borderLeft: 4, borderLeftColor: 'primary.main', borderRadius: 1.5, backgroundColor: 'background.paper' }}>
    <Stack spacing={2}>
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, letterSpacing: 1, lineHeight: 1.5 }}>Pause &amp; Check</Typography>
      <Typography sx={{ fontWeight: 700, lineHeight: 1.6 }}>{checkpoint.question}</Typography>
      {!response ? <>
        <RadioGroup aria-label={`Answer options for ${checkpoint.question}`} value={selectedOption ?? ''} onChange={(event) => setSelectedOption(Number(event.target.value))}>
          {checkpoint.options.map((option, index) => <FormControlLabel key={index} value={index} control={<Radio size="small" />} label={option} disabled={saving} />)}
        </RadioGroup>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="contained" disabled={selectedOption === null || saving} onClick={() => { if (selectedOption !== null) onAnswer(selectedOption) }}>Check Answer</Button>
          <Button color="inherit" disabled={saving} onClick={onSkip}>Skip for now</Button>
        </Stack>
      </> : <>
        {response.status === 'skipped' && <Alert severity="info">You skipped this check.</Alert>}
        {response.status === 'correct' && <Alert severity="success">Correct.</Alert>}
        {response.status === 'incorrect' && <Alert severity="warning">Not quite. The correct answer is: {checkpoint.options[response.correctOption ?? 0]}</Alert>}
        {response.explanation && <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{response.explanation}</Typography>}
        {blocking && <Button variant="contained" onClick={onContinue} sx={{ alignSelf: 'flex-start' }}>Continue Reading</Button>}
      </>}
    </Stack>
  </Paper>
}
