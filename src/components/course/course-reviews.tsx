import { useEffect, useState, type FC } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import { getPublicCourseReviews, type CourseReview } from '@/services/api'

type CourseReviewsProps = { courseId: number; rating?: number; ratingCount?: number }
type Vote = 'up' | 'down'

const formatReviewAge = (value: string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000))
  if (days === 0) return 'Today'
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'year' : 'years'} ago`
}

const CourseReviews: FC<CourseReviewsProps> = ({ courseId, rating, ratingCount }) => {
  const [reviews, setReviews] = useState<CourseReview[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [expandedReviews, setExpandedReviews] = useState<number[]>([])
  const [votes, setVotes] = useState<Record<number, Vote>>({})

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    setShowAll(false)
    setExpandedReviews([])
    setVotes({})
    getPublicCourseReviews(courseId)
      .then((data) => { if (isCurrent) setReviews(data) })
      .catch(() => { if (isCurrent) setReviews([]) })
      .finally(() => { if (isCurrent) setLoading(false) })
    return () => { isCurrent = false }
  }, [courseId])

  const averageRating = rating ?? (reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0)
  const totalRatings = ratingCount ?? reviews.length
  const visibleReviews = showAll ? reviews : reviews.slice(0, 4)
  const toggleVote = (reviewId: number, vote: Vote) => setVotes((current) => {
    const next = { ...current }
    if (next[reviewId] === vote) delete next[reviewId]
    else next[reviewId] = vote
    return next
  })

  return <Box id="course-reviews" sx={{ pt: 1 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
      <Typography component="span" aria-hidden="true" sx={{ color: '#c18120', fontSize: 20, lineHeight: 1 }}>★</Typography>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{averageRating.toFixed(1)} course rating</Typography>
      <Typography color="text.secondary" aria-hidden="true">·</Typography>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{totalRatings.toLocaleString()} ratings</Typography>
    </Stack>

    {loading ? <Typography color="text.secondary" sx={{ py: 3 }}>Loading reviews...</Typography> : reviews.length ? <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, columnGap: 3.5, rowGap: 3 }}>
        {visibleReviews.map((review) => {
          const expanded = expandedReviews.includes(review.id)
          const longReview = review.comment.length > 210
          const reviewerInitials = review.studentName.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
          return <Box key={review.id} sx={{ minWidth: 0, borderTop: 1, borderColor: 'divider', pt: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.25 }}>
              <Avatar sx={{ width: 38, height: 38, bgcolor: '#191a1c', color: '#fff' }}><PersonOutlineIcon fontSize="small" /></Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: 'text.primary' }}>{review.studentName || reviewerInitials}</Typography>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Rating value={review.rating} readOnly size="small" sx={{ color: '#c18120', fontSize: 14 }} />
                  <Typography variant="caption" color="text.secondary">{formatReviewAge(review.createdAt)}</Typography>
                </Stack>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary', whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: expanded ? 'unset' : 4, overflow: 'hidden' }}>
              {review.comment || 'Rated this learning experience.'}
            </Typography>
            {longReview && !expanded && <Button size="small" onClick={() => setExpandedReviews((current) => [...current, review.id])} sx={{ px: 0, mt: 1, textDecoration: 'underline', textTransform: 'none', fontWeight: 700 }}>Show more</Button>}
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.25 }}>Helpful?</Typography>
              <IconButton size="small" aria-label="Mark review helpful" aria-pressed={votes[review.id] === 'up'} onClick={() => toggleVote(review.id, 'up')} sx={{ color: votes[review.id] === 'up' ? 'primary.main' : 'text.primary' }}><ThumbUpAltOutlinedIcon sx={{ fontSize: 17 }} /></IconButton>
              <IconButton size="small" aria-label="Mark review not helpful" aria-pressed={votes[review.id] === 'down'} onClick={() => toggleVote(review.id, 'down')} sx={{ color: votes[review.id] === 'down' ? 'primary.main' : 'text.primary' }}><ThumbDownAltOutlinedIcon sx={{ fontSize: 17 }} /></IconButton>
            </Stack>
          </Box>
        })}
      </Box>
      {reviews.length > 4 && <Button variant="outlined" onClick={() => setShowAll((current) => !current)} sx={{ mt: 4, borderColor: '#7351a1', color: '#62428f', textTransform: 'none', fontWeight: 700 }}>{showAll ? 'Show fewer reviews' : 'Show all reviews'}</Button>}
    </> : <Typography color="text.secondary" sx={{ py: 2 }}>No learner reviews yet.</Typography>}
  </Box>
}

export default CourseReviews
