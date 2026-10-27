import { useEffect, useState, type FC } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { getTutorClassArticleInteractions, getTutorCourseArticleInteractions, type TutorArticleInteractionReport as Report } from '@/services/api'

type Article = Report['articles'][number]

const statusChip = (status: 'correct' | 'incorrect' | 'skipped' | undefined) => {
  if (status === 'correct') return <Chip size="small" color="success" label="Correct" />
  if (status === 'incorrect') return <Chip size="small" color="error" label="Incorrect" />
  if (status === 'skipped') return <Chip size="small" color="default" label="Skipped" />
  return <Chip size="small" variant="outlined" label="No response yet" />
}

const CheckpointReport: FC<{ article: Article }> = ({ article }) => {
  if (article.checkpoints.length === 0) return null
  return <Stack spacing={1.5} sx={{ mb: 2 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Pause &amp; Check responses</Typography>
    {article.checkpoints.map((checkpoint, index) => {
      const responses = article.students.map((student) => ({ student, response: student.checkpointResponses.find((item) => item.checkpointId === checkpoint.id) }))
      const count = (status: 'correct' | 'incorrect' | 'skipped') => responses.filter((item) => item.response?.status === status).length
      const noResponse = responses.filter((item) => !item.response).length
      return <Box key={checkpoint.id} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{index + 1}. {checkpoint.question}</Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
          <Chip size="small" color="success" variant="outlined" label={`${count('correct')} correct`} />
          <Chip size="small" color="error" variant="outlined" label={`${count('incorrect')} incorrect`} />
          <Chip size="small" variant="outlined" label={`${count('skipped')} skipped`} />
          <Chip size="small" variant="outlined" label={`${noResponse} no response yet`} />
        </Stack>
        <Stack spacing={1}>
          {responses.map(({ student, response }) => <Stack key={student.enrollmentId} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{student.studentName}</Typography>
              {response?.selectedOption !== null && response?.selectedOption !== undefined && <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>Chose: {checkpoint.options[response.selectedOption] ?? 'Unknown option'}</Typography>}
            </Box>
            {statusChip(response?.status)}
          </Stack>)}
        </Stack>
      </Box>
    })}
  </Stack>
}

const ArticleReport: FC<{ article: Article }> = ({ article }) => {
  const flaggedCount = article.students.reduce((total, student) => total + student.helpRequests.length, 0)
  const questionCount = article.students.reduce((total, student) => total + student.helpRequests.filter((item) => item.question).length, 0)

  return <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: 1, borderColor: 'divider' }}>
    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{article.lessonTitle}</Typography>
    <CheckpointReport article={article} />
    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
      <Chip size="small" color={flaggedCount ? 'info' : 'default'} label={`${flaggedCount} flagged section${flaggedCount === 1 ? '' : 's'}`} />
      <Chip size="small" color={questionCount ? 'info' : 'default'} label={`${questionCount} question${questionCount === 1 ? '' : 's'}`} />
    </Stack>

    <Stack spacing={1.5}>
      {article.students.flatMap((student) => student.helpRequests.map((request) => <Box key={`${student.enrollmentId}-${request.sectionIndex}`} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{student.studentName} · {request.sectionTitle}</Typography>
        <Typography variant="caption" color="text.secondary">Flagged {new Date(request.flaggedAt).toLocaleString()}</Typography>
        <Typography variant="body2" sx={{ mt: 0.75 }}>{request.question ? request.question : 'No question submitted.'}</Typography>
      </Box>))}
    </Stack>
  </Paper>
}

const ArticleInteractionReport: FC<{ target: { type: 'course' | 'class'; id: number } }> = ({ target }) => {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setReport(null)
    setError('')
    const request = target.type === 'course' ? getTutorCourseArticleInteractions(target.id) : getTutorClassArticleInteractions(target.id)
    request
      .then((result) => { if (active) setReport(result) })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load article interactions.') })
    return () => { active = false }
  }, [target.type, target.id])

  const articles = (report?.articles ?? []).filter((article) => article.checkpoints.length > 0 || article.students.some((student) => student.helpRequests.length > 0))
  if (!report && !error) return null

  return <Box sx={{ mb: 4 }}>
    <Typography variant="h5" sx={{ mb: 0.5 }}>Article interactions</Typography>
    <Typography color="text.secondary" sx={{ mb: 2 }}>Pause &amp; Check responses, flagged sections, and student questions from article lessons. A missing response is not counted as a misunderstanding.</Typography>
    {error && <Typography color="error">{error}</Typography>}
    {report && articles.length === 0 && <Typography color="text.secondary">No article interactions yet.</Typography>}
    <Stack spacing={2}>{articles.map((article) => <ArticleReport key={article.lessonId} article={article} />)}</Stack>
  </Box>
}

export default ArticleInteractionReport
