import { useEffect, useState, type FC } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { getTutorClassArticleInteractions, getTutorCourseArticleInteractions, type TutorArticleInteractionReport as Report } from '@/services/api'

type Article = Report['articles'][number]
type Student = Article['students'][number]
type ArticleTab = 'overview' | 'responses' | 'help'

const statusChip = (status: 'correct' | 'incorrect' | 'skipped' | undefined) => {
  if (status === 'correct') return <Chip size="small" color="success" label="Correct" />
  if (status === 'incorrect') return <Chip size="small" color="error" label="Incorrect" />
  if (status === 'skipped') return <Chip size="small" color="default" label="Skipped" />
  return <Chip size="small" variant="outlined" label="No response yet" />
}

const countResponses = (student: Student, status: 'correct' | 'incorrect' | 'skipped') =>
  student.checkpointResponses.filter((item) => item.status === status).length

const needsReview = (student: Student) => countResponses(student, 'incorrect') + countResponses(student, 'skipped') >= 2

const reviewChip = (student: Student) => needsReview(student)
  ? <Chip size="small" color="warning" label="Needs review" />
  : <Chip size="small" color="success" variant="outlined" label="On track" />

const initialsOf = (name: string) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

const OverviewTable: FC<{ article: Article; selectedId: number | null; onSelect: (enrollmentId: number) => void }> = ({ article, selectedId, onSelect }) => (
  <Table size="small" sx={{ minWidth: 640 }}>
    <TableHead>
      <TableRow>
        {['Student', 'Total Questions', 'Correct', 'Incorrect', 'Skipped', 'Help Requests', 'Status'].map((heading) => (
          <TableCell key={heading} sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}>{heading}</TableCell>
        ))}
      </TableRow>
    </TableHead>
    <TableBody>
      {article.students.map((student) => (
        <TableRow key={student.enrollmentId} hover selected={student.enrollmentId === selectedId} onClick={() => onSelect(student.enrollmentId)} sx={{ cursor: 'pointer' }}>
          <TableCell sx={{ fontWeight: 600 }}>{student.studentName}</TableCell>
          <TableCell>{article.checkpoints.length}</TableCell>
          <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>{countResponses(student, 'correct')}</TableCell>
          <TableCell sx={{ color: countResponses(student, 'incorrect') ? 'error.main' : 'text.primary', fontWeight: countResponses(student, 'incorrect') ? 600 : 400 }}>{countResponses(student, 'incorrect')}</TableCell>
          <TableCell>{countResponses(student, 'skipped')}</TableCell>
          <TableCell>{student.helpRequests.length}</TableCell>
          <TableCell>{reviewChip(student)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

const ResponsesTable: FC<{ article: Article }> = ({ article }) => (
  <Stack spacing={2}>
    <Stack spacing={0.5}>
      {article.checkpoints.map((checkpoint, index) => (
        <Typography key={checkpoint.id} variant="body2" sx={{ overflowWrap: 'anywhere' }}><strong>Q{index + 1}.</strong> {checkpoint.question}</Typography>
      ))}
    </Stack>
    <Table size="small" sx={{ minWidth: 480 }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Student</TableCell>
          {article.checkpoints.map((checkpoint, index) => (
            <TableCell key={checkpoint.id} sx={{ fontWeight: 700, color: 'text.secondary' }}>Q{index + 1}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {article.students.map((student) => (
          <TableRow key={student.enrollmentId}>
            <TableCell sx={{ fontWeight: 600 }}>{student.studentName}</TableCell>
            {article.checkpoints.map((checkpoint) => {
              const response = student.checkpointResponses.find((item) => item.checkpointId === checkpoint.id)
              return (
                <TableCell key={checkpoint.id}>
                  {statusChip(response?.status)}
                  {response?.selectedOption !== null && response?.selectedOption !== undefined && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, overflowWrap: 'anywhere' }}>
                      Chose: {checkpoint.options[response.selectedOption] ?? 'Unknown option'}
                    </Typography>
                  )}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Stack>
)

const HelpRequestsList: FC<{ article: Article }> = ({ article }) => {
  const requests = article.students
    .flatMap((student) => student.helpRequests.map((request) => ({ student, request })))
    .sort((first, second) => new Date(second.request.flaggedAt).getTime() - new Date(first.request.flaggedAt).getTime())

  if (requests.length === 0) return <Typography color="text.secondary">No help requests yet.</Typography>

  return (
    <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />} spacing={1.5}>
      {requests.map(({ student, request }) => (
        <Box key={`${student.enrollmentId}-${request.sectionIndex}-${request.flaggedAt}`}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{student.studentName}</Typography>
            <Chip size="small" color="info" variant="outlined" label={request.sectionTitle} />
          </Stack>
          <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{request.question ? request.question : 'No question submitted.'}</Typography>
          <Typography variant="caption" color="text.secondary">Flagged {new Date(request.flaggedAt).toLocaleString()}</Typography>
        </Box>
      ))}
    </Stack>
  )
}

const StudentDetails: FC<{ article: Article; student: Student | undefined }> = ({ article, student }) => {
  if (!student) return null
  const total = article.checkpoints.length

  return (
    <Box sx={{ p: { xs: 2, md: 2.5 }, borderTop: { xs: 1, lg: 0 }, borderLeft: { lg: 1 }, borderColor: 'divider', backgroundColor: 'background.default' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>{initialsOf(student.studentName)}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{student.studentName}</Typography>
          <Typography variant="caption" color="text.secondary">{total} question{total === 1 ? '' : 's'} · {student.helpRequests.length} help request{student.helpRequests.length === 1 ? '' : 's'}</Typography>
        </Box>
      </Stack>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Responses</Typography>
      <Stack spacing={1} sx={{ mb: 2.5 }}>
        {total === 0 && <Typography variant="body2" color="text.secondary">No Pause &amp; Check questions.</Typography>}
        {article.checkpoints.map((checkpoint, index) => {
          const response = student.checkpointResponses.find((item) => item.checkpointId === checkpoint.id)
          return (
            <Box key={checkpoint.id} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.paper' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>Q{index + 1}. {checkpoint.question}</Typography>
                {statusChip(response?.status)}
              </Stack>
              {response?.selectedOption !== null && response?.selectedOption !== undefined && (
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>Chose: {checkpoint.options[response.selectedOption] ?? 'Unknown option'}</Typography>
              )}
            </Box>
          )
        })}
      </Stack>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Help requests</Typography>
      {student.helpRequests.length === 0 && <Typography variant="body2" color="text.secondary">No help requests.</Typography>}
      <Stack spacing={1}>
        {student.helpRequests.map((request) => (
          <Box key={`${request.sectionIndex}-${request.flaggedAt}`} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.paper' }}>
            <Chip size="small" color="info" variant="outlined" label={request.sectionTitle} sx={{ mb: 0.75 }} />
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{request.question ? request.question : 'No question submitted.'}</Typography>
            <Typography variant="caption" color="text.secondary">{new Date(request.flaggedAt).toLocaleString()}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

const ArticleReport: FC<{ article: Article }> = ({ article }) => {
  const [tab, setTab] = useState<ArticleTab>('overview')
  const [selectedId, setSelectedId] = useState<number | null>(article.students[0]?.enrollmentId ?? null)
  const selectedStudent = article.students.find((student) => student.enrollmentId === selectedId) ?? article.students[0]
  const helpCount = article.students.reduce((total, student) => total + student.helpRequests.length, 0)

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: { xs: 2, md: 2.5 }, pt: { xs: 2, md: 2.5 } }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>{article.lessonTitle}</Typography>
        <Tabs value={tab} onChange={(_, value: ArticleTab) => setTab(value)} sx={{ minHeight: 40, borderBottom: 1, borderColor: 'divider' }}>
          <Tab value="overview" label="Overview" sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }} />
          <Tab value="responses" label="Student Responses" sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }} />
          <Tab value="help" label={`Help Requests (${helpCount})`} sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 300px' } }}>
        <Box sx={{ minWidth: 0, p: { xs: 2, md: 2.5 }, overflowX: 'auto' }}>
          {article.students.length === 0 && <Typography color="text.secondary">No students enrolled.</Typography>}
          {article.students.length > 0 && tab === 'overview' && <OverviewTable article={article} selectedId={selectedStudent?.enrollmentId ?? null} onSelect={setSelectedId} />}
          {article.students.length > 0 && tab === 'responses' && <ResponsesTable article={article} />}
          {article.students.length > 0 && tab === 'help' && <HelpRequestsList article={article} />}
        </Box>
        {article.students.length > 0 && <StudentDetails article={article} student={selectedStudent} />}
      </Box>
    </Paper>
  )
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
    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Article Lesson Interaction Report</Typography>
    <Typography color="text.secondary" sx={{ mb: 0.5 }}>Student responses, skipped questions, and help requests for the article lesson.</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>A missing response is not counted as a misunderstanding.</Typography>
    {error && <Typography color="error">{error}</Typography>}
    {report && articles.length === 0 && <Typography color="text.secondary">No article interactions yet.</Typography>}
    <Stack spacing={2}>{articles.map((article) => <ArticleReport key={article.lessonId} article={article} />)}</Stack>
  </Box>
}

export default ArticleInteractionReport
