import { type FC, useEffect, useState } from 'react'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { getAdminReviews, setAdminReviewHidden, type AdminReview } from '@/services/api'

const formatReviewAge = (value: string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000))
  if (days === 0) return 'Today'
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'year' : 'years'} ago`
}

const ReviewsPage: FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'course' | 'class'>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const filteredReviews = reviews.filter((review) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [review.targetTitle, review.studentName, review.studentEmail, review.comment].some((value) => value.toLowerCase().includes(query))
    const matchesType = typeFilter === 'all' || review.targetType === typeFilter
    const matchesVisibility = visibilityFilter === 'all' || (visibilityFilter === 'hidden' ? review.isHidden : !review.isHidden)
    return matchesSearch && matchesType && matchesVisibility
  })
  const pageCount = Math.max(1, Math.ceil(filteredReviews.length / pageSize))
  const visibleReviews = filteredReviews.slice((page - 1) * pageSize, page * pageSize)

  const loadReviews = async () => {
    setPage(1)
    setLoading(true)
    try {
      setReviews(await getAdminReviews())
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadReviews() }, [])

  const toggleVisibility = async (review: AdminReview) => {
    setBusyReviewId(`${review.targetType}-${review.id}`)
    try {
      await setAdminReviewHidden(review.targetType, review.id, !review.isHidden)
      await loadReviews()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update the review.')
    } finally {
      setBusyReviewId(null)
    }
  }

  return <>
    <Box sx={{ mb: 3 }}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, letterSpacing: 1.1 }}>Admin workspace</Typography><Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-.035em' }}>Learner reviews</Typography><Typography color="text.secondary">Review learner feedback and hide or restore reviews shown in catalogs.</Typography></Box>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 1.5, mb: 2.5 }}>
      <TextField label="Search reviews" placeholder="Course, reviewer, email, or comment" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} size="small" />
      <FormControl size="small"><InputLabel id="review-type-filter-label">Type</InputLabel><Select labelId="review-type-filter-label" label="Type" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value as typeof typeFilter); setPage(1) }}><MenuItem value="all">All types</MenuItem><MenuItem value="course">Courses</MenuItem><MenuItem value="class">Classes</MenuItem></Select></FormControl>
      <FormControl size="small"><InputLabel id="review-visibility-filter-label">Visibility</InputLabel><Select labelId="review-visibility-filter-label" label="Visibility" value={visibilityFilter} onChange={(event) => { setVisibilityFilter(event.target.value as typeof visibilityFilter); setPage(1) }}><MenuItem value="all">All reviews</MenuItem><MenuItem value="visible">Visible</MenuItem><MenuItem value="hidden">Hidden</MenuItem></Select></FormControl>
    </Box>
    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading learner reviews" /></Box> : reviews.length === 0 ? <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}><Typography variant="h6">No learner reviews yet</Typography><Typography color="text.secondary">Reviews submitted by enrolled learners will appear here.</Typography></Paper> : filteredReviews.length === 0 ? <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}><Typography variant="h6">No matching reviews</Typography><Typography color="text.secondary">Try adjusting your search or filters.</Typography></Paper> : <><Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>{visibleReviews.map((review) => <Paper key={`${review.targetType}-${review.id}`} elevation={0} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 210, p: 2, border: 1, borderColor: 'divider', opacity: review.isHidden ? 0.72 : 1 }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.25} sx={{ minWidth: 0 }}>
        <Avatar sx={{ width: 38, height: 38, flexShrink: 0, bgcolor: 'text.primary', color: 'background.paper' }}><PersonOutlineOutlinedIcon fontSize="small" /></Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 750, overflowWrap: 'anywhere' }}>{review.studentName || review.studentEmail}</Typography>
          <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={0.75}>
            <Rating value={review.rating} readOnly size="small" sx={{ fontSize: 15 }} />
            <Typography variant="caption" color="text.secondary">{formatReviewAge(review.createdAt)}</Typography>
          </Stack>
        </Box>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, overflowWrap: 'anywhere' }}>{review.targetType === 'course' ? 'Course' : 'Class'} · {review.targetTitle} · {review.studentEmail}</Typography>
      <Typography variant="body2" sx={{ mt: 1.5, minHeight: 40, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.55 }}>{review.comment || 'Rated this learning experience.'}</Typography>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5} sx={{ mt: 'auto', pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">{new Date(review.createdAt).toLocaleDateString()} · {review.isHidden ? 'Hidden' : 'Visible'}</Typography>
        <Button size="small" variant="text" color={review.isHidden ? 'primary' : 'error'} disabled={busyReviewId === `${review.targetType}-${review.id}`} onClick={() => void toggleVisibility(review)}>{busyReviewId === `${review.targetType}-${review.id}` ? 'Saving…' : review.isHidden ? 'Unhide review' : 'Hide review'}</Button>
      </Stack>
    </Paper>)}</Box>{pageCount > 1 && <Stack alignItems="center" sx={{ mt: 3 }}><Pagination count={pageCount} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" aria-label="Review pages" /></Stack>}</>}
  </>
}

export default ReviewsPage
