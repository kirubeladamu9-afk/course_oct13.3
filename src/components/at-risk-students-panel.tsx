import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { alpha } from '@mui/material/styles'
import type { AtRiskStudent } from '@/services/api'

interface AtRiskStudentsPanelProps {
  students: AtRiskStudent[]
  loading: boolean
  error: string | null
  compact?: boolean
}

const getInitials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

const getPriority = (reasonCount: number) => reasonCount >= 3
  ? { label: 'High', color: 'error' as const }
  : reasonCount === 2
    ? { label: 'Medium', color: 'warning' as const }
    : { label: 'Follow up', color: 'info' as const }

const getLatestRisks = (students: AtRiskStudent[]) => [...students]
  .sort((first, second) => {
    const firstDate = first.lastActivityAt ? Date.parse(first.lastActivityAt) : Number.NEGATIVE_INFINITY
    const secondDate = second.lastActivityAt ? Date.parse(second.lastActivityAt) : Number.NEGATIVE_INFINITY
    return secondDate - firstDate
  })
  .slice(0, 5)

const AtRiskStudentsPanel = ({ students, loading, error, compact = false }: AtRiskStudentsPanelProps) => {
  const latestStudents = getLatestRisks(students)

  return (
  <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, mb: 1.5, width: compact ? '100%' : undefined, minWidth: compact ? 0 : undefined, border: 1, borderColor: 'divider', borderRadius: 3, backgroundColor: 'background.paper', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.045)' }}>
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'grid', placeItems: 'center', width: 38, height: 38, flexShrink: 0, borderRadius: 2, color: 'warning.dark', backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.12) }}>
        <WarningAmberOutlinedIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 750, lineHeight: 1.2 }}>At-Risk Students</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: 13 }}>
          Students needing attention for low engagement, poor performance, or inactivity.
        </Typography>
      </Box>
      {!loading && !error && <Chip size="small" label={`${latestStudents.length} ${latestStudents.length === 1 ? 'Student' : 'Students'}`} sx={{ fontWeight: 700, backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.1), color: 'warning.dark', border: 1, borderColor: (theme) => alpha(theme.palette.warning.main, 0.24) }} />}
    </Stack>

    {loading ? (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
        <CircularProgress size={18} aria-label="Loading at-risk students" />
        <Typography color="text.secondary" variant="body2">Checking student records...</Typography>
      </Stack>
    ) : error ? (
      <Alert severity="error">{error}</Alert>
    ) : students.length === 0 ? (
      <Typography color="text.secondary" variant="body2" sx={{ py: 1 }}>No students currently match the early-warning rules.</Typography>
    ) : (
      <Stack spacing={0.75}>
        {latestStudents.map((student) => {
          const priority = getPriority(student.reasons.length)
          const className = student.classTitle ?? 'Class enrollment'
          const progress = Math.max(0, Math.min(100, student.progressPercentage))

          return (
            <Box
              key={student.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: compact ? 'minmax(0, 1fr) auto' : { xs: 'minmax(0, 1fr) auto', md: 'minmax(180px, 1.2fr) minmax(120px, 0.9fr) minmax(220px, 1.7fr) minmax(130px, 0.8fr) auto' },
                alignItems: 'center',
                columnGap: { xs: 1, md: 1.5 },
                rowGap: { xs: 0.75, md: 0 },
                p: { xs: 1, sm: 1.25 },
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                backgroundColor: 'background.paper',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.035)',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, color: 'primary.dark', backgroundColor: 'primary.50' }}>{getInitials(student.studentName)}</Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{student.studentName}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{student.studentEmail}</Typography>
                </Box>
              </Stack>

              <Chip size="small" color={priority.color} variant="outlined" label={priority.label} sx={{ justifySelf: { xs: 'end', md: 'start' }, height: 23, fontSize: 11, fontWeight: 700, backgroundColor: (theme) => alpha(theme.palette[priority.color].main, 0.07) }} />

              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, gridColumn: compact ? '1 / -1' : { xs: '1 / -1', md: 'auto' }, color: 'text.secondary' }}>
                <SchoolOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                <Typography variant="caption" noWrap>{className}</Typography>
              </Stack>

              <Box sx={{ gridColumn: compact ? '1 / -1' : { xs: '1 / -1', md: 'auto' }, minWidth: 0 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                  <Typography variant="caption" color="text.secondary">Progress</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{progress}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 5, borderRadius: 5, backgroundColor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 5 } }} />
              </Box>

              <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' }, pt: { xs: 0, md: 0.25 }, pl: { xs: 0, md: 'calc(36px + 8px)' } }}>
                {student.reasons.map((reason) => <Chip key={reason} size="small" label={reason} sx={{ height: 22, fontSize: 10.5, color: 'warning.dark', backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.08), border: 1, borderColor: (theme) => alpha(theme.palette.warning.main, 0.2), '& .MuiChip-label': { px: 0.8 } }} />)}
              </Stack>
            </Box>
          )
        })}
      </Stack>
    )}
  </Paper>
  )
}

export default AtRiskStudentsPanel
