import React, { FC, useState } from 'react'
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'
import IconButton, { iconButtonClasses } from '@mui/material/IconButton'
import ArrowForward from '@mui/icons-material/ArrowForward'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import { type AdminCourse } from '@/components/admin/admin-data'
import { Course } from '@/interfaces/course'
import { getCourse } from '@/services/api'
import { navigateTo } from '@/lib/navigation'

interface Props {
  item: Course
  onOpen?: (item: Course) => void
}

const CourseCardItem: FC<Props> = ({ item, onOpen }) => {
  const [courseDetails, setCourseDetails] = useState<Pick<AdminCourse, 'longDescription' | 'learningOutcomes' | 'requirements'> | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [hasRequestedDetails, setHasRequestedDetails] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const loadCourseDetails = () => {
    if (hasRequestedDetails) return
    setHasRequestedDetails(true)
    setIsLoadingDetails(true)
    void getCourse(item.id)
      .then(({ longDescription, learningOutcomes, requirements }) => setCourseDetails({ longDescription, learningOutcomes, requirements }))
      .catch(() => setCourseDetails(null))
      .finally(() => setIsLoadingDetails(false))
  }

  return (
    <Box
      sx={{
        width: '100%',
        px: 1,
        py: 4,
      }}
    >
      <Box
        className="course-card"
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
          borderRadius: 4,
          position: 'relative',
          transition: (theme) => theme.transitions.create(['box-shadow']),
          '&:hover': {
            boxShadow: 2,
            [`& .${iconButtonClasses.root}`]: {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: 2,
            },
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            lineHeight: 0,
            overflow: 'hidden',
            aspectRatio: '16 / 9',
            borderRadius: 3,
            mb: 2,
            '& .course-cover-image': {
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 3,
            },
          }}
        >
          <img className="course-cover-image" src={item.cover} width={760} height={760} alt={'Course ' + item.title} loading="lazy" />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography component="h2" variant="h5" sx={{ mb: 2, height: 56, overflow: 'hidden', fontSize: '1.2rem' }}>
            {item.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating name="rating-course" value={item.rating} max={5} sx={{ color: '#ffce31', mr: 1 }} readOnly />
            <Typography component="span" variant="body2" color="text.secondary">
              {item.ratingCount ? `(${item.ratingCount})` : 'No reviews yet'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" color="primary.main">
              {'$' + item.price}
            </Typography>
            <Typography variant="h6">/ course</Typography>
          </Box>
          <IconButton
            color="primary"
            aria-label={`Open ${item.title} course`}
            onClick={() => onOpen ? onOpen(item) : navigateTo(`/courses/${item.id}`)}
            sx={{ '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' } }}
          >
            <ArrowForward />
          </IconButton>
        </Box>
        <Button fullWidth variant="text" endIcon={isDetailsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => {
          const shouldOpen = !isDetailsOpen
          setIsDetailsOpen(shouldOpen)
          if (shouldOpen) loadCourseDetails()
        }} aria-expanded={isDetailsOpen} sx={{ mt: 1, justifyContent: 'space-between', textTransform: 'none' }}>Course details</Button>
        <Collapse in={isDetailsOpen} unmountOnExit>
          <Box sx={{ pt: 1.5, maxHeight: 420, overflowY: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>Description</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.55 }}>{courseDetails?.longDescription || item.description || 'Full course details are available on the course page.'}</Typography>
            {isLoadingDetails && <Typography variant="caption" color="text.secondary">Loading course details…</Typography>}
            {!!courseDetails?.learningOutcomes.length && <Box sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>What you’ll learn</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.secondary' }}>{courseDetails.learningOutcomes.map((outcome) => <Typography component="li" variant="body2" key={outcome} sx={{ mb: 0.5, lineHeight: 1.5 }}>{outcome}</Typography>)}</Box>
            </Box>}
            {!!courseDetails?.requirements.length && <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>Requirements</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.secondary' }}>{courseDetails.requirements.map((requirement) => <Typography component="li" variant="body2" key={requirement} sx={{ mb: 0.5, lineHeight: 1.5 }}>{requirement}</Typography>)}</Box>
            </Box>}
          </Box>
        </Collapse>
      </Box>
    </Box>
  )
}

export default CourseCardItem
