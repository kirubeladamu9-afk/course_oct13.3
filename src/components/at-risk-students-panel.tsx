import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import SearchIcon from '@mui/icons-material/Search'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { alpha } from '@mui/material/styles'
import type { AtRiskStudent } from '@/services/api'

interface AtRiskStudentsPanelProps {
  students: AtRiskStudent[]
  loading: boolean
  error: string | null
  compact?: boolean
}

type RiskLevel = 'high' | 'medium' | 'low'
type SortKey = 'risk' | 'progress' | 'activity'

const PAGE_SIZE = 8

const riskMeta: Record<RiskLevel, { label: string; color: 'error' | 'warning' | 'success' }> = {
  high: { label: 'High risk', color: 'error' },
  medium: { label: 'Medium risk', color: 'warning' },
  low: { label: 'Low risk', color: 'success' },
}

const sortLabels: Record<SortKey, string> = {
  risk: 'Highest risk',
  progress: 'Lowest progress',
  activity: 'Most recent activity',
}

const getRiskLevel = (reasonCount: number): RiskLevel => reasonCount >= 3 ? 'high' : reasonCount === 2 ? 'medium' : 'low'

const getInitials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

const getActivityTime = (student: AtRiskStudent) => (student.lastActivityAt ? Date.parse(student.lastActivityAt) : 0) || 0

const formatLastActivity = (value: string | null) => {
  if (!value) return 'No activity'
  const days = Math.floor((Date.now() - Date.parse(value)) / 86_400_000)
  if (Number.isNaN(days)) return 'No activity'
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

const sortStudents = (students: AtRiskStudent[], sortBy: SortKey) => [...students].sort((first, second) => {
  if (sortBy === 'progress') return first.progressPercentage - second.progressPercentage
  if (sortBy === 'activity') return getActivityTime(second) - getActivityTime(first)
  return second.reasons.length - first.reasons.length || first.progressPercentage - second.progressPercentage
})

const StudentRow = ({ student }: { student: AtRiskStudent }) => {
  const [expanded, setExpanded] = useState(false)
  const level = getRiskLevel(student.reasons.length)
  const { color } = riskMeta[level]
  const progress = Math.max(0, Math.min(100, student.progressPercentage))
  const className = student.classTitle ?? 'Class enrollment'
  const detailsId = `at-risk-details-${student.id}`

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderLeft: 4, borderLeftColor: `${color}.main`, borderRadius: 2.5, backgroundColor: 'background.paper', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.035)' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 1.25, md: 2 }, px: { xs: 1.25, md: 1.75 }, py: 1.25 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: '1 1 220px', minWidth: 0 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, color: `${color}.dark`, backgroundColor: (theme) => alpha(theme.palette[color].main, 0.12) }}>{getInitials(student.studentName)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{student.studentName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{student.studentEmail}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center" sx={{ flex: '1 1 220px', minWidth: 0 }}>
          <Chip size="small" label={riskMeta[level].label} color={color} variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: 11 }} />
          {student.reasons.slice(0, 2).map((reason) => <Chip key={reason} size="small" label={reason} sx={{ height: 22, fontSize: 11, color: `${color}.dark`, backgroundColor: (theme) => alpha(theme.palette[color].main, 0.08) }} />)}
          {student.reasons.length > 2 && <Typography variant="caption" color="text.secondary">+{student.reasons.length - 2}</Typography>}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ width: { xs: '45%', md: 100 }, flexShrink: 0 }}>
          Last active<Box component="span" sx={{ display: 'block', color: 'text.primary', fontWeight: 600 }}>{formatLastActivity(student.lastActivityAt)}</Box>
        </Typography>

        <Box sx={{ width: { xs: '45%', md: 120 }, flexShrink: 0 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
            <Typography variant="caption" color="text.secondary">Progress</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>{progress}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 5, borderRadius: 5, backgroundColor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 5 } }} />
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0, ml: 'auto' }}>
          <IconButton size="small" href={`mailto:${student.studentEmail}`} aria-label={`Email ${student.studentName}`}>
            <MailOutlineIcon fontSize="small" />
          </IconButton>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={detailsId}
            endIcon={<KeyboardArrowDownIcon sx={{ transition: 'transform 150ms', transform: expanded ? 'rotate(180deg)' : 'none' }} />}
            sx={{ fontWeight: 700, whiteSpace: 'nowrap', borderRadius: 2 }}
          >
            {expanded ? 'Hide' : 'Details'}
          </Button>
        </Stack>
      </Box>

      {expanded && (
        <Box id={detailsId} sx={{ mx: { xs: 1.25, md: 1.75 }, mb: 1.25, p: 1.5, borderRadius: 2, backgroundColor: 'action.hover', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Class</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{className}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Last activity</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.lastActivityAt ? new Date(student.lastActivityAt).toLocaleDateString() : 'No activity recorded'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">All risk factors</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.reasons.join(', ')}</Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}

const AtRiskStudentsPanel = ({ students, loading, error, compact = false }: AtRiskStudentsPanelProps) => {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [classFilter, setClassFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('risk')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => setVisibleCount(PAGE_SIZE), [search, riskFilter, classFilter, sortBy])

  const classOptions = useMemo(
    () => Array.from(new Set(students.map((student) => student.classTitle).filter((title): title is string => Boolean(title)))).sort(),
    [students],
  )

  const levelCounts = useMemo(
    () => students.reduce<Record<RiskLevel, number>>((counts, student) => {
      counts[getRiskLevel(student.reasons.length)] += 1
      return counts
    }, { high: 0, medium: 0, low: 0 }),
    [students],
  )

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matches = students.filter((student) => {
      if (riskFilter !== 'all' && getRiskLevel(student.reasons.length) !== riskFilter) return false
      if (classFilter !== 'all' && student.classTitle !== classFilter) return false
      if (!query) return true
      return [student.studentName, student.studentEmail, student.classTitle ?? '', ...student.reasons]
        .some((value) => value.toLowerCase().includes(query))
    })
    return sortStudents(matches, sortBy)
  }, [students, search, riskFilter, classFilter, sortBy])

  const visibleStudents = filteredStudents.slice(0, visibleCount)

  const renderContent = () => {
    if (loading) {
      return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
          <CircularProgress size={18} aria-label="Loading at-risk students" />
          <Typography color="text.secondary" variant="body2">Checking student records...</Typography>
        </Stack>
      )
    }
    if (error) return <Alert severity="error">{error}</Alert>
    if (students.length === 0) return <Typography color="text.secondary" variant="body2" sx={{ py: 1 }}>No students currently match the early-warning rules.</Typography>
    if (filteredStudents.length === 0) return <Typography color="text.secondary" variant="body2" sx={{ py: 1 }}>No students match these filters.</Typography>

    return (
      <>
        <Stack spacing={1}>
          {visibleStudents.map((student) => <StudentRow key={student.id} student={student} />)}
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary">Showing {visibleStudents.length} of {filteredStudents.length}</Typography>
          {visibleCount < filteredStudents.length && (
            <Button size="small" variant="outlined" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} sx={{ fontWeight: 700, borderRadius: 2 }}>Load more</Button>
          )}
        </Stack>
      </>
    )
  }

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
        {!loading && !error && <Chip size="small" label={`${students.length} ${students.length === 1 ? 'Student' : 'Students'}`} sx={{ fontWeight: 700, backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.1), color: 'warning.dark', border: 1, borderColor: (theme) => alpha(theme.palette.warning.main, 0.24) }} />}
      </Stack>

      {!loading && !error && students.length > 0 && (
        <>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1.25 }}>
            <TextField
              size="small"
              placeholder="Search name, email, class, or risk factor"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              inputProps={{ 'aria-label': 'Search at-risk students' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ flex: 1, minWidth: 0 }}
            />
            <TextField select size="small" label="Class" value={classFilter} onChange={(event) => setClassFilter(event.target.value)} sx={{ minWidth: { md: 180 } }}>
              <MenuItem value="all">All classes</MenuItem>
              {classOptions.map((title) => <MenuItem key={title} value={title}>{title}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Sort by" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} sx={{ minWidth: { md: 190 } }}>
              {(Object.keys(sortLabels) as SortKey[]).map((key) => <MenuItem key={key} value={key}>{sortLabels[key]}</MenuItem>)}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
            {(['all', 'high', 'medium', 'low'] as const).map((level) => {
              const active = riskFilter === level
              const count = level === 'all' ? students.length : levelCounts[level]
              const label = level === 'all' ? 'All' : riskMeta[level].label
              return (
                <Chip
                  key={level}
                  size="small"
                  clickable
                  aria-pressed={active}
                  label={`${label} · ${count}`}
                  color={level === 'all' ? 'primary' : riskMeta[level].color}
                  variant={active ? 'filled' : 'outlined'}
                  onClick={() => setRiskFilter(level)}
                  sx={{ fontWeight: 700 }}
                />
              )
            })}
          </Stack>
        </>
      )}

      {renderContent()}
    </Paper>
  )
}

export default AtRiskStudentsPanel
