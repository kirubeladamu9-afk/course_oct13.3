import { useEffect, useState, type ReactNode } from 'react'
import type { Theme } from '@mui/material/styles'
import { Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'

interface OverviewCourse {
  id: number
  title: string
  category: string
  level: string
  tutor: string
  progress: number
}

interface OverviewClass {
  id: number
  title: string
  category: string
  level: string
  tutor: string
  progress: number
}

interface OverviewSession {
  title: string
  courseTitle: string
  startsAt: string
}

interface LearningSlide {
  key: string
  kind: 'course' | 'class'
  id: number
  title: string
  meta: string
  progress: number
}

interface OverviewMetricProps {
  label: string
  value: string
  detail: string
  icon: ReactNode
  tone: 'teal' | 'blue' | 'amber' | 'violet'
}

const metricTones = {
  teal: { color: '#0b8877', background: 'rgba(11, 136, 119, .1)' },
  blue: { color: '#4279c5', background: 'rgba(66, 121, 197, .1)' },
  amber: { color: '#bd791b', background: 'rgba(189, 121, 27, .12)' },
  violet: { color: '#855dc3', background: 'rgba(133, 93, 195, .11)' },
}

const OverviewMetric = ({ label, value, detail, icon, tone }: OverviewMetricProps) => (
  <Paper elevation={0} sx={{ p: { xs: 1.75, sm: 2.25 }, border: 1, borderColor: 'divider', borderRadius: 3.5, minWidth: 0 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Box sx={{ display: 'grid', placeItems: 'center', width: 36, height: 36, flexShrink: 0, borderRadius: 2.25, color: metricTones[tone].color, bgcolor: metricTones[tone].background }}>{icon}</Box>
    </Stack>
    <Typography variant="h4" sx={{ mt: 1.25, fontWeight: 800, letterSpacing: '-.04em' }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{detail}</Typography>
  </Paper>
)

interface StudentDashboardOverviewProps {
  displayName: string
  courses: OverviewCourse[]
  classes: OverviewClass[]
  lessonCount: number
  averageQuizScore: number | null
  quizCount: number
  quizAverageNeedsAttention: boolean
  learningStreak: number
  enrollmentCount: number
  session?: OverviewSession
  readiness?: ReactNode
  onOpenCourse: (courseId: number) => void
  onOpenClass: (classId: number) => void
  onSelectView: (view: 'calendar' | 'courses' | 'classes') => void
  children: ReactNode
}

const heroGradient = (theme: Theme) => theme.palette.mode === 'dark' ? 'linear-gradient(120deg, #103b39 0%, #145d53 58%, #147b68 100%)' : 'linear-gradient(120deg, #123e3a 0%, #17675c 58%, #168773 100%)'

const LearningCompleteBanner = ({ lessonCount, averageQuizScore, learningStreak }: { lessonCount: number; averageQuizScore: number | null; learningStreak: number }) => <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5, md: 4 }, mb: 2.25, borderRadius: { xs: 3.5, md: 4.5 }, color: '#fff', background: heroGradient }}>
  <Chip size="small" icon={<CheckCircleOutlineRoundedIcon />} label="ALL CAUGHT UP" sx={{ color: '#e6fff8', bgcolor: 'rgba(255,255,255,.13)', '& .MuiChip-icon': { color: 'inherit' }, fontWeight: 700, letterSpacing: '.04em' }} />
  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={3}>
    <Box>
      <Typography variant="h4" sx={{ mt: 2, fontSize: { xs: '1.55rem', sm: '2rem' }, fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.2 }}>Every course and class is complete</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4 }} sx={{ mt: 3 }}>
        {[
          { label: 'Lessons completed', value: String(lessonCount) },
          { label: 'Learning streak', value: `${learningStreak} ${learningStreak === 1 ? 'day' : 'days'}` },
          { label: 'Quiz average', value: averageQuizScore === null ? '—' : `${averageQuizScore}%` },
        ].map((stat) => <Box key={stat.label}>
          <Typography sx={{ fontSize: { xs: '1.9rem', sm: '2.4rem' }, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.03em' }}>{stat.value}</Typography>
          <Typography variant="body2" sx={{ mt: .5, color: 'rgba(255,255,255,.72)' }}>{stat.label}</Typography>
        </Box>)}
      </Stack>
    </Box>
    <Box aria-hidden="true" sx={{ display: { xs: 'none', md: 'grid' }, placeItems: 'center', width: 116, height: 116, flexShrink: 0, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }}>
      <CheckCircleOutlineRoundedIcon sx={{ fontSize: 64, color: '#b8f0d9' }} />
    </Box>
  </Stack>
</Paper>

const StudentDashboardOverview = ({ displayName, courses, classes, lessonCount, averageQuizScore, quizCount, quizAverageNeedsAttention, learningStreak, enrollmentCount, session, readiness, onOpenCourse, onOpenClass, onSelectView, children }: StudentDashboardOverviewProps) => {
  const learningItems: LearningSlide[] = [
    ...courses.map((course) => ({ key: `course-${course.id}`, kind: 'course' as const, id: course.id, title: course.title, meta: `${course.category} · ${course.level} · with ${course.tutor}`, progress: course.progress })),
    ...classes.map((classItem) => ({ key: `class-${classItem.id}`, kind: 'class' as const, id: classItem.id, title: classItem.title, meta: `${classItem.category} · ${classItem.level} · with ${classItem.tutor}`, progress: classItem.progress })),
  ]
  const incompleteItems = learningItems.filter((item) => item.progress < 100)
  const slideCount = incompleteItems.length
  const [slideIndex, setSlideIndex] = useState(0)
  useEffect(() => {
    if (slideCount < 2) return
    const timer = window.setInterval(() => setSlideIndex((index) => (index + 1) % slideCount), 6000)
    return () => window.clearInterval(timer)
  }, [slideCount])
  const activeSlide = slideCount ? incompleteItems[slideIndex % slideCount] : undefined
  const featuredLearning = activeSlide
  const featuredClass = activeSlide?.kind === 'class' ? activeSlide : undefined
  const featuredCourse = activeSlide?.kind === 'course' ? activeSlide : undefined

  return <Box sx={{ maxWidth: 1260, mx: 'auto', pb: 2 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-end' }} spacing={2.5} sx={{ mb: 3 }}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={.75} sx={{ mb: .75, color: 'primary.main' }}>
          <AutoAwesomeOutlinedIcon sx={{ fontSize: 17 }} />
          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.5, lineHeight: 1.5 }}>YOUR LEARNING SPACE</Typography>
        </Stack>
        <Typography component="h1" sx={{ fontSize: { xs: '1.9rem', sm: '2.4rem' }, fontWeight: 800, letterSpacing: '-.055em', lineHeight: 1.1 }}>
          Welcome back, {displayName}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: .8 }}>Small steps add up. Keep building your momentum.</Typography>
      </Box>
      <Button variant="outlined" startIcon={<CalendarMonthOutlinedIcon />} endIcon={<ArrowForwardRoundedIcon />} onClick={() => onSelectView('calendar')} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' }, borderRadius: 2.5, px: 2 }}>
        View schedule
      </Button>
    </Stack>

    {enrollmentCount > 0 && !activeSlide ? <LearningCompleteBanner lessonCount={lessonCount} averageQuizScore={averageQuizScore} learningStreak={learningStreak} /> : <Paper elevation={0} sx={{ position: 'relative', overflow: 'hidden', mb: 2.25, borderRadius: { xs: 3.5, md: 4.5 }, color: '#fff', background: heroGradient }}>
      <Box aria-hidden="true" sx={{ position: 'absolute', width: 420, height: 420, right: { xs: -250, md: 70 }, top: -280, borderRadius: '50%', border: '1px solid rgba(255,255,255,.11)', boxShadow: '0 0 0 42px rgba(255,255,255,.035), 0 0 0 84px rgba(255,255,255,.025)' }} />
      <Stack key={activeSlide?.key} direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={3} sx={{ position: 'relative', p: { xs: 2.5, sm: 3.5, md: 4 }, animation: 'learningSlideIn .5s ease', '@keyframes learningSlideIn': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } } }}>
        <Box sx={{ flex: 1, minWidth: 0, maxWidth: 650 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Chip size="small" icon={<SchoolOutlinedIcon />} label={featuredLearning ? featuredClass ? 'PICK UP YOUR CLASS' : 'PICK UP WHERE YOU LEFT OFF' : 'YOUR LEARNING PLAN'} sx={{ color: '#e6fff8', bgcolor: 'rgba(255,255,255,.13)', '& .MuiChip-icon': { color: 'inherit' }, fontWeight: 700, letterSpacing: '.04em' }} />
          </Stack>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.55rem', sm: '2rem' }, fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.2 }}>
            {featuredLearning?.title ?? 'Your next chapter starts here'}
          </Typography>
          <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.76)', maxWidth: 540 }}>
            {featuredLearning ? featuredLearning.meta : 'Explore your learning plan and find a course to get started.'}
          </Typography>
          {featuredLearning && <Box sx={{ mt: 3, maxWidth: 480 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: .8 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)' }}>{featuredClass ? 'Class progress' : 'Course progress'}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{featuredLearning.progress}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={featuredLearning.progress} sx={{ height: 8, borderRadius: 5, bgcolor: 'rgba(255,255,255,.22)', '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: '#b8f0d9' } }} />
          </Box>}
          <Button variant="contained" endIcon={<PlayArrowRoundedIcon />} onClick={() => featuredCourse ? onOpenCourse(featuredCourse.id) : featuredClass ? onOpenClass(featuredClass.id) : onSelectView('courses')} sx={{ mt: 2.5, borderRadius: 2.5, px: 2.25, color: '#12463e', bgcolor: '#fff', fontWeight: 800, boxShadow: 'none', '&:hover': { bgcolor: '#e8f8f2', boxShadow: 'none' } }}>
            {featuredLearning ? featuredClass ? 'Continue class' : 'Continue learning' : 'Browse courses'}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' }, alignItems: 'center', minWidth: { md: 190 }, pr: { md: 2 } }}>
          <Box sx={{ width: 148, height: 148, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `conic-gradient(#b8f0d9 ${featuredLearning?.progress ?? 0}%, rgba(255,255,255,.17) 0)` }}>
            <Box sx={{ width: 128, height: 128, borderRadius: '50%', display: 'grid', placeItems: 'center', alignContent: 'center', gap: .25, bgcolor: '#17665b', border: '1px solid rgba(255,255,255,.16)' }}>
              <CheckCircleOutlineRoundedIcon sx={{ color: '#b8f0d9', fontSize: 25 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{featuredLearning?.progress ?? 0}%</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.72)' }}>completed</Typography>
            </Box>
          </Box>
        </Box>
      </Stack>
    </Paper>}

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 1.25, sm: 1.75 }, mb: 2.25 }}>
      <OverviewMetric label="Active learning" value={String(courses.length + classes.length)} detail={`${courses.length} courses · ${classes.length} classes`} icon={<MenuBookOutlinedIcon fontSize="small" />} tone="teal" />
      <OverviewMetric label="Lessons completed" value={String(lessonCount)} detail="Keep the streak going" icon={<CheckCircleOutlineRoundedIcon fontSize="small" />} tone="blue" />
      <OverviewMetric label="Quiz average" value={averageQuizScore === null ? '—' : `${averageQuizScore}%`} detail={quizAverageNeedsAttention ? 'One or more quizzes need review' : quizCount ? `From ${quizCount} completed ${quizCount === 1 ? 'quiz' : 'quizzes'}` : 'No completed quizzes yet'} icon={quizAverageNeedsAttention ? <WarningAmberOutlinedIcon fontSize="small" /> : <QuizOutlinedIcon fontSize="small" />} tone={quizAverageNeedsAttention ? 'amber' : 'violet'} />
      <OverviewMetric label="Learning streak" value={`${learningStreak} ${learningStreak === 1 ? 'day' : 'days'}`} detail="Your learning habit is growing" icon={<LocalFireDepartmentOutlinedIcon fontSize="small" />} tone="amber" />
    </Box>

    {readiness}

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.55fr) minmax(280px, .9fr)' }, gap: 2.25, alignItems: 'start' }}>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.75 }, border: 1, borderColor: 'divider', borderRadius: 3.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
          <Box><Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>Your courses</Typography><Typography variant="body2" color="text.secondary">A quick look at what you’re learning</Typography></Box>
          <Button size="small" endIcon={<ArrowForwardRoundedIcon />} onClick={() => onSelectView('courses')} sx={{ flexShrink: 0 }}>See all</Button>
        </Stack>
        {courses.length ? <Stack spacing={1}>
          {courses.slice(0, 3).map((course) => <Box component="button" type="button" key={course.id} onClick={() => onOpenCourse(course.id)} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, p: 1.4, border: 1, borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper', cursor: 'pointer', textAlign: 'left', font: 'inherit', transition: 'border-color .18s, transform .18s', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' } }}>
            <Box sx={{ display: 'grid', placeItems: 'center', width: 42, height: 42, flexShrink: 0, borderRadius: 2.25, color: 'primary.main', bgcolor: 'action.hover' }}><MenuBookOutlinedIcon /></Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 750 }}>{course.title}</Typography>
              <Typography noWrap variant="caption" color="text.secondary">{course.category} · {course.level}</Typography>
              <LinearProgress variant="determinate" value={course.progress} sx={{ mt: 1, height: 5, borderRadius: 4 }} />
            </Box>
            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{course.progress}%</Typography>
          </Box>)}
        </Stack> : <Box sx={{ p: 2.5, textAlign: 'center', borderRadius: 2.5, bgcolor: 'action.hover' }}>
          <MenuBookOutlinedIcon color="primary" />
          <Typography sx={{ mt: .75, fontWeight: 700 }}>Your courses will appear here</Typography>
          <Typography variant="body2" color="text.secondary">Browse the catalog when you’re ready to start.</Typography>
        </Box>}
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.75 }, border: 1, borderColor: 'divider', borderRadius: 3.5, minHeight: 240 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
          <Box><Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>Coming up</Typography><Typography variant="body2" color="text.secondary">Your next live learning session</Typography></Box>
          <Box sx={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 2.25, color: 'primary.main', bgcolor: 'action.hover' }}><CalendarMonthOutlinedIcon /></Box>
        </Stack>
        {session ? <>
          <Box sx={{ p: 1.75, borderRadius: 2.75, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(32, 150, 128, .14)' : 'rgba(18, 135, 115, .07)' }}>
            <Chip size="small" label="LIVE SESSION" color="primary" variant="outlined" sx={{ mb: 1.25, fontSize: 10, fontWeight: 800, letterSpacing: '.08em' }} />
            <Typography sx={{ fontWeight: 800, lineHeight: 1.35 }}>{session.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: .35 }}>{session.courseTitle}</Typography>
            <Stack direction="row" alignItems="center" spacing={.75} sx={{ mt: 1.25, color: 'text.secondary' }}>
              <AccessTimeRoundedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption">{new Date(session.startsAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Typography>
            </Stack>
          </Box>
          <Button fullWidth variant="outlined" endIcon={<ArrowForwardRoundedIcon />} onClick={() => onSelectView('calendar')} sx={{ mt: 1.5, borderRadius: 2.25 }}>Open calendar</Button>
        </> : <>
          <Box sx={{ p: 2.25, borderRadius: 2.75, bgcolor: 'action.hover', textAlign: 'center' }}>
            <CalendarMonthOutlinedIcon color="primary" />
            <Typography sx={{ mt: .75, fontWeight: 700 }}>Nothing scheduled yet</Typography>
            <Typography variant="body2" color="text.secondary">New live sessions will show up here.</Typography>
          </Box>
          <Button fullWidth variant="outlined" endIcon={<ArrowForwardRoundedIcon />} onClick={() => onSelectView('classes')} sx={{ mt: 1.5, borderRadius: 2.25 }}>View my classes</Button>
        </>}
      </Paper>
    </Box>

    <Paper elevation={0} sx={{ mt: 2.25, p: { xs: 2, sm: 2.75 }, border: 1, borderColor: 'divider', borderRadius: 3.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
        <Box><Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>Your classes</Typography><Typography variant="body2" color="text.secondary">Continue learning with your enrolled classes</Typography></Box>
        <Button size="small" endIcon={<ArrowForwardRoundedIcon />} onClick={() => onSelectView('classes')} sx={{ flexShrink: 0 }}>See all</Button>
      </Stack>
      {classes.length ? <Stack spacing={1}>
        {classes.slice(0, 3).map((classItem) => <Box component="button" type="button" key={classItem.id} onClick={() => onOpenClass(classItem.id)} sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, p: 1.4, border: 1, borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper', cursor: 'pointer', textAlign: 'left', font: 'inherit', transition: 'border-color .18s, transform .18s', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' } }}>
          <Box sx={{ display: 'grid', placeItems: 'center', width: 42, height: 42, flexShrink: 0, borderRadius: 2.25, color: 'primary.main', bgcolor: 'action.hover' }}><SchoolOutlinedIcon /></Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 750 }}>{classItem.title}</Typography>
            <Typography noWrap variant="caption" color="text.secondary">with {classItem.tutor}</Typography>
            <LinearProgress variant="determinate" value={classItem.progress} sx={{ mt: 1, height: 5, borderRadius: 4 }} />
          </Box>
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{classItem.progress}%</Typography>
        </Box>)}
      </Stack> : <Box sx={{ p: 2.5, textAlign: 'center', borderRadius: 2.5, bgcolor: 'action.hover' }}>
        <SchoolOutlinedIcon color="primary" />
        <Typography sx={{ mt: .75, fontWeight: 700 }}>Your classes will appear here</Typography>
        <Typography variant="body2" color="text.secondary">Browse available classes when you’re ready to join.</Typography>
      </Box>}
    </Paper>

    <Box sx={{ mt: 4, mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'primary.main', mb: .5 }}><AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} /><Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.3 }}>Keep your momentum</Typography></Stack>
      <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-.03em' }}>Your next wins are waiting</Typography>
      <Typography variant="body2" color="text.secondary">Practice, celebrate progress, and keep moving toward your goals.</Typography>
    </Box>
    {children}
  </Box>
}

export default StudentDashboardOverview
