import { type FC, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { getAdminReviews, setAdminReviewHidden, type AdminReview } from '@/services/api'

const ReviewsPage: FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null)

  const loadReviews = async () => {
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
    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading learner reviews" /></Box> : reviews.length === 0 ? <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}><Typography variant="h6">No learner reviews yet</Typography><Typography color="text.secondary">Reviews submitted by enrolled learners will appear here.</Typography></Paper> : <Stack spacing={1.5}>{reviews.map((review) => <Paper key={`${review.targetType}-${review.id}`} elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', opacity: review.isHidden ? 0.72 : 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1.5}>
        <Box sx={{ minWidth: 0 }}><Typography variant="subtitle1" sx={{ fontWeight: 750 }}>{review.targetTitle}</Typography><Typography variant="body2" color="text.secondary">{review.targetType === 'course' ? 'Course' : 'Class'} · {review.studentName || review.studentEmail} · {review.studentEmail}</Typography></Box>
        <Stack direction="row" alignItems="center" spacing={1}><Rating value={review.rating} readOnly size="small" /><Typography variant="body2">{review.rating}/5</Typography></Stack>
      </Stack>
      {review.comment && <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}>{review.comment}</Typography>}
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 2 }}><Typography variant="caption" color="text.secondary">{new Date(review.createdAt).toLocaleString()} · {review.isHidden ? 'Hidden' : 'Visible'}</Typography><Button size="small" variant={review.isHidden ? 'outlined' : 'text'} color={review.isHidden ? 'primary' : 'error'} disabled={busyReviewId === `${review.targetType}-${review.id}`} onClick={() => void toggleVisibility(review)}>{busyReviewId === `${review.targetType}-${review.id}` ? 'Saving…' : review.isHidden ? 'Restore review' : 'Hide review'}</Button></Stack>
    </Paper>)}</Stack>}
  </>
}

export default ReviewsPage
