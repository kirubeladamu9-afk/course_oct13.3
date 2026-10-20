import { type FC, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { getStudentReviews, submitStudentReview, type StudentReviewData } from '@/services/api'

type StudentReviewsProps = { targetType: 'course' | 'class'; targetId: number }

const StudentReviews: FC<StudentReviewsProps> = ({ targetType, targetId }) => {
  const [data, setData] = useState<StudentReviewData | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadReviews = async () => {
    setLoading(true)
    try {
      const result = await getStudentReviews(targetType, targetId)
      setData(result)
      setRating(result.ownReview?.rating ?? null)
      setComment(result.ownReview?.comment ?? '')
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadReviews() }, [targetType, targetId])

  const submit = async () => {
    if (rating === null) return
    setSaving(true)
    setError(null)
    try {
      await submitStudentReview(targetType, targetId, rating, comment)
      await loadReviews()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save your review.')
    } finally {
      setSaving(false)
    }
  }

  const averageRating = data?.reviews.length ? data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length : 0

  return <Box>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><Typography variant="h5">Learner reviews</Typography><Rating value={averageRating} precision={0.1} readOnly /><Typography variant="body2" color="text.secondary">{data?.reviews.length ? `${averageRating.toFixed(1)} (${data.reviews.length})` : 'No reviews yet'}</Typography></Stack>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Only learners who have started an enrolled course or class can leave a review.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} aria-label="Loading reviews" /></Box> : <Stack spacing={2}>
      {data?.canReview && <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{data.ownReview ? 'Update your review' : 'Share your experience'}</Typography>
        <Rating value={rating} onChange={(_, nextRating) => setRating(nextRating)} aria-label="Your rating" />
        <TextField fullWidth multiline minRows={3} maxRows={6} label="Review (optional)" value={comment} onChange={(event) => setComment(event.target.value)} inputProps={{ maxLength: 1000 }} helperText={`${comment.length}/1000`} sx={{ mt: 1.5, mb: 1.5 }} />
        <Button variant="contained" onClick={() => void submit()} disabled={saving || rating === null}>{saving ? 'Saving…' : data.ownReview ? 'Update review' : 'Submit review'}</Button>
      </Paper>}
      {data?.ownReview?.isHidden && <Alert severity="info">Your review is hidden from the catalog while it is being reviewed by an administrator.</Alert>}
      {data?.reviews.length ? data.reviews.map((review) => <Paper key={review.id} elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2.5 }}><Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}><Typography sx={{ fontWeight: 700 }}>{review.studentName}</Typography><Rating value={review.rating} readOnly size="small" /></Stack>{review.comment && <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{review.comment}</Typography>}<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{new Date(review.createdAt).toLocaleDateString()}</Typography></Paper>) : <Typography color="text.secondary">{data?.canReview ? 'No reviews yet. Be the first to share your experience.' : 'No learner reviews yet.'}</Typography>}
    </Stack>}
  </Box>
}

export default StudentReviews
