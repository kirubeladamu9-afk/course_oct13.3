import { useEffect, useState, type FC } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { getTutorClassArticleInteractions, getTutorCourseArticleInteractions, type TutorArticleInteractionReport as Report } from '@/services/api'

type Article = Report['articles'][number]
type Student = Article['students'][number]

const getCheckpointStatus = (student: Student, checkpoint: Article['checkpoints'][number]) => {
  const answer = student.answers.find((item) => item.checkpointId === checkpoint.id)
  if (!answer) return { label: 'Unanswered', color: 'default' as const }
  if (answer.skipped) return { label: 'Skipped', color: 'default' as const }
  if (answer.selectedOption === checkpoint.correctOption) return { label: `Correct: ${checkpoint.options[answer.selectedOption ?? 0]}`, color: 'success' as const }
  return { label: `Incorrect: ${checkpoint.options[answer.selectedOption ?? 0] ?? ''}`, color: 'error' as const }
}

const ArticleReport: FC<{ article: Article }> = ({ article }) => {
  const flaggedCount = article.students.reduce((total, student) => total + student.helpRequests.length, 0)
  const questionCount = article.students.reduce((total, student) => total + student.helpRequests.filter((item) => item.question).length, 0)
  const unansweredCount = article.students.reduce((total, student) => total + article.checkpoints.filter((checkpoint) => !student.answers.some((answer) => answer.checkpointId === checkpoint.id)).length, 0)

  return <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: 1, borderColor: 'divider' }}>
    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{article.lessonTitle}</Typography>
    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
      <Chip size="small" label={`${article.checkpoints.length} checkpoint${article.checkpoints.length === 1 ? '' : 's'}`} />
      <Chip size="small" label={`${unansweredCount} unanswered`} />
      <Chip size="small" color={flaggedCount ? 'info' : 'default'} label={`${flaggedCount} flagged section${flaggedCount === 1 ? '' : 's'}`} />
      <Chip size="small" color={questionCount ? 'info' : 'default'} label={`${questionCount} question${questionCount === 1 ? '' : 's'}`} />
    </Stack>

    {article.checkpoints.length > 0 && <Stack spacing={2} sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Checkpoint answers</Typography>
      {article.checkpoints.map((checkpoint) => <Box key={checkpoint.id}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{checkpoint.question}</Typography>
        <Stack spacing={0.75}>
          {article.students.map((student) => {
            const status = getCheckpointStatus(student, checkpoint)
            return <Stack key={student.enrollmentId} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Typography variant="body2">{student.studentName}</Typography>
              <Chip size="small" color={status.color} variant={status.color === 'default' ? 'outlined' : 'filled'} label={status.label} sx={{ maxWidth: '100%' }} />
            </Stack>
          })}
        </Stack>
      </Box>)}
    </Stack>}

    {article.students.some((student) => student.helpRequests.length > 0) && <>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Flagged sections and questions</Typography>
      <Stack spacing={1.5}>
        {article.students.flatMap((student) => student.helpRequests.map((request) => <Box key={`${student.enrollmentId}-${request.sectionIndex}`} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{student.studentName} · {request.sectionTitle}</Typography>
          <Typography variant="caption" color="text.secondary">Flagged {new Date(request.flaggedAt).toLocaleString()}</Typography>
          <Typography variant="body2" sx={{ mt: 0.75 }}>{request.question ? request.question : 'No question submitted.'}</Typography>
        </Box>))}
      </Stack>
    </>}
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
    <Typography color="text.secondary" sx={{ mb: 2 }}>Checkpoint answers, unanswered checkpoints, flagged sections, and student questions from article lessons.</Typography>
    {error && <Typography color="error">{error}</Typography>}
    {report && articles.length === 0 && <Typography color="text.secondary">No article checkpoints or help requests yet.</Typography>}
    <Stack spacing={2}>{articles.map((article) => <ArticleReport key={article.lessonId} article={article} />)}</Stack>
  </Box>
}

export default ArticleInteractionReport
