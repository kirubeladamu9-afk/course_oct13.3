import { useState, type FC } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { type ArticleHelpRequest } from '@/services/api'

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
