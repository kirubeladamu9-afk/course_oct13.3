import { useEffect, useState, type FC } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { getTutorClassArticleInteractions, getTutorCourseArticleInteractions, type TutorArticleInteractionReport as Report } from '@/services/api'

type Article = Report['articles'][number]

const ArticleReport: FC<{ article: Article }> = ({ article }) => {
  const flaggedCount = article.students.reduce((total, student) => total + student.helpRequests.length, 0)
  const questionCount = article.students.reduce((total, student) => total + student.helpRequests.filter((item) => item.question).length, 0)

  return <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: 1, borderColor: 'divider' }}>
    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{article.lessonTitle}</Typography>
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

  const articles = (report?.articles ?? []).filter((article) => article.students.some((student) => student.helpRequests.length > 0))
  if (!report && !error) return null

  return <Box sx={{ mb: 4 }}>
    <Typography variant="h5" sx={{ mb: 0.5 }}>Article interactions</Typography>
    <Typography color="text.secondary" sx={{ mb: 2 }}>Flagged sections and student questions from article lessons.</Typography>
    {error && <Typography color="error">{error}</Typography>}
    {report && articles.length === 0 && <Typography color="text.secondary">No help requests yet.</Typography>}
    <Stack spacing={2}>{articles.map((article) => <ArticleReport key={article.lessonId} article={article} />)}</Stack>
  </Box>
}

export default ArticleInteractionReport
