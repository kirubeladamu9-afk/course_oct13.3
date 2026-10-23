import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { FC } from 'react'
import { MentorCardItem } from '@/components/mentor'
import { data as mentorData } from '@/components/home/mentors.data'
import { navigateTo } from '@/lib/navigation'

const valueCards = [
  { title: 'Built for steady progress', description: 'Learn at a pace that works for you with practical content, live support, and explanations that make difficult ideas easier to understand.', icon: <SchoolOutlinedIcon fontSize="small" />, color: '#168c7d', background: '#e4f6f1' },
  { title: 'Learners come first', description: 'Whether you are exploring a new subject or preparing for your next milestone, CourseSpace keeps learning welcoming and useful.', icon: <MailOutlineIcon fontSize="small" />, color: '#2782b4', background: '#e8f3fb' },
]

const cardSx = { border: 1, borderColor: 'divider', borderRadius: 3, boxShadow: '0 8px 26px rgba(15, 60, 70, .055)', transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 32px rgba(15, 60, 70, .1)' } }

const AboutPage: FC = () => <Box component="main" sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8fbfb', color: 'text.primary' }}>
  <Box sx={{ position: 'relative', overflow: 'hidden', color: 'common.white', background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(120deg, #102b3f 0%, #0b514b 100%)' : 'linear-gradient(120deg, #102b3f 0%, #12685d 68%, #168276 100%)' }}>
    <Box aria-hidden="true" sx={{ position: 'absolute', width: 440, height: 440, borderRadius: '50%', right: { xs: -240, md: -90 }, top: -225, border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 0 0 48px rgba(255,255,255,.035), 0 0 0 96px rgba(255,255,255,.025)' }} />
    <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 6, md: 9 } }}>
      <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
        <Grid item xs={12} md={12} lg={7}>
          <Chip icon={<AutoAwesomeOutlinedIcon />} label="ABOUT COURSESPACE" size="small" sx={{ mb: 2.5, px: 0.5, color: 'common.white', backgroundColor: 'rgba(255,255,255,.12)', '& .MuiChip-icon': { color: '#b9f0dd' }, fontWeight: 700, letterSpacing: '.06em' }} />
          <Typography component="h1" sx={{ maxWidth: 700, mb: 2, fontSize: { xs: '2.5rem', sm: '3.25rem', md: '4rem' }, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.045em' }}>Learning that meets you where you are.</Typography>
          <Typography sx={{ maxWidth: 590, mb: 3.5, color: 'rgba(255,255,255,.78)', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.7 }}>CourseSpace helps learners build practical skills through clear courses, supportive tutors, and relaxed practice.</Typography>
        </Grid>
        <Grid item xs={12} md={5} lg={5} sx={{ display: { xs: 'none', lg: 'block' }, position: 'relative', minHeight: { xs: 220, sm: 280, md: 360 } }}>
          <Box component="img" src="/images/about-study-group-banner.webp" alt="Students studying together around a laptop" sx={{ position: 'relative', top: 84, right: '56%', height: '100%', width: 'auto', maxWidth: 'none' }} />
        </Grid>
      </Grid>
    </Container>
  </Box>

  <Container maxWidth="lg" sx={{ py: { xs: 6, md: 7 } }}>
    <Grid container spacing={3}>
      {valueCards.map(({ title, description, icon, color, background }) => <Grid key={title} item xs={12} md={6}>
        <Card elevation={0} sx={cardSx}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 3.25 } }}>
            <Box sx={{ display: 'grid', placeItems: 'center', width: 42, height: 42, mb: 2.5, borderRadius: 2, color, backgroundColor: background }}>{icon}</Box>
            <Typography variant="h6" sx={{ fontWeight: 750 }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: .75, lineHeight: 1.7 }}>{description}</Typography>
          </CardContent>
        </Card>
      </Grid>)}
    </Grid>
  </Container>


  <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
    <Box sx={{ mb: 3.5, textAlign: 'center' }}>
      <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: .9 }}>OUR TUTORS</Typography>
      <Typography component="h2" variant="h4" sx={{ mt: .25, fontWeight: 800 }}>Meet our tutors</Typography>
    </Box>
    <Grid container spacing={0}>
      {mentorData.map((item) => <Grid key={item.id} item xs={12} sm={6} md={4}>
        <MentorCardItem item={item} />
      </Grid>)}
    </Grid>
  </Container>

  <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 8 } }}>
    <Paper elevation={0} sx={{ p: { xs: 3, sm: 4, md: 4.5 }, border: 1, borderColor: 'divider', borderRadius: 3.5, boxShadow: '0 10px 35px rgba(15, 60, 70, .055)', background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #143b3a, #173032)' : 'linear-gradient(145deg, #e9f8f4, #f3fbf8)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" spacing={2.5}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 750 }}>Ready to start learning?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .75 }}>Browse our courses or get in touch and we will help you find the right next step.</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexShrink: 0 }}>
          <Button variant="contained" onClick={() => navigateTo('/courses')} endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: 6, fontWeight: 700, boxShadow: 'none' }}>Browse courses</Button>
          <Button variant="outlined" href="/contact-us" endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: 6, fontWeight: 700 }}>Contact us</Button>
        </Stack>
      </Stack>
    </Paper>
  </Container>
</Box>

export default AboutPage
