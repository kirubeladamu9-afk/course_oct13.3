import { type FC, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { getStudentReviews, submitStudentReview, type StudentReviewData } from '@/services/api'

type StudentReviewsProps = { targetType: 'course' | 'class'; targetId: number; instructorName: string }

const formatReviewAge = (value: string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000))
  if (days === 0) return 'Today'
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'year' : 'years'} ago`
}

const StudentReviews: FC<StudentReviewsProps> = ({ targetType, targetId, instructorName }) => {
  const [data, setData] = useState<StudentReviewData | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)
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

  useEffect(() => { void loadReviews(); setShowAll(false) }, [targetType, targetId])

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
  const visibleReviews = showAll ? data?.reviews ?? [] : (data?.reviews ?? []).slice(0, 4)
  const instructorInitials = instructorName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const itemLabel = targetType === 'course' ? 'course' : 'class'

  return <Box>
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
      <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 700 }}>{instructorInitials}</Avatar>
      <Box><Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>Instructor</Typography><Typography variant="h6" sx={{ fontWeight: 750 }}>{instructorName}</Typography></Box>
    </Stack>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
      {data?.reviews.length ? <><Rating value={averageRating} precision={0.1} readOnly size="small" /><Typography variant="subtitle1" sx={{ fontWeight: 750 }}>{averageRating.toFixed(1)} {itemLabel} rating · {data.reviews.length.toLocaleString()} {data.reviews.length === 1 ? 'rating' : 'ratings'}</Typography></> : <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>No {itemLabel} ratings yet</Typography>}
    </Stack>
    <Divider sx={{ mb: 2 }} />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} aria-label="Loading reviews" /></Box> : <>
      {data?.ownReview?.isHidden && <Alert severity="info" sx={{ mb: 2 }}>Your review is hidden from the catalog while it is being reviewed by an administrator.</Alert>}
      {visibleReviews.length ? <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>{visibleReviews.map((review) => <Paper key={review.id} elevation={0} sx={{ minWidth: 0, minHeight: 142, p: 2, border: 1, borderColor: 'divider', borderRadius: 2.5, backgroundColor: 'background.paper' }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'text.primary', fontSize: 13, fontWeight: 700 }}>{review.studentName.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>{review.studentName}</Typography><Stack direction="row" spacing={0.75} alignItems="center"><Rating value={review.rating} readOnly size="small" sx={{ fontSize: 14 }} /><Typography variant="caption" color="text.secondary">{formatReviewAge(review.createdAt)}</Typography></Stack></Box>
        </Stack>
        <Typography variant="body2" sx={{ minHeight: 40, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{review.comment || 'Rated this learning experience.'}</Typography>
      </Paper>)}</Box> : <Typography color="text.secondary" sx={{ py: 2 }}>{data?.canReview ? 'No reviews yet. Be the first to share your experience.' : 'No learner reviews yet.'}</Typography>}
      {(data?.reviews.length ?? 0) > 4 && <Button variant="outlined" size="small" onClick={() => setShowAll((current) => !current)} sx={{ mt: 2 }}>{showAll ? 'Show fewer reviews' : 'Show all reviews'}</Button>}
      {data?.canReview && <>
        <Divider sx={{ my: 3 }} />
        <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{data.ownReview ? 'Update your review' : 'Share your experience'}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Only learners who have started this {itemLabel} can leave a review.</Typography>
          <Rating value={rating} onChange={(_, nextRating) => setRating(nextRating)} aria-label="Your rating" />
          <TextField fullWidth multiline minRows={3} maxRows={6} label="Review (optional)" value={comment} onChange={(event) => setComment(event.target.value)} inputProps={{ maxLength: 1000 }} helperText={`${comment.length}/1000`} sx={{ mt: 1.5, mb: 1.5 }} />
          <Button variant="contained" onClick={() => void submit()} disabled={saving || rating === null}>{saving ? 'Saving…' : data.ownReview ? 'Update review' : 'Submit review'}</Button>
        </Paper>
      </>}
    </>}
  </Box>
}

export default StudentReviews
