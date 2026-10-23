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
import HomeOurMentors from '@/components/home/mentors'
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

  <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
    <Box sx={{ maxWidth: 700, mx: 'auto', mb: { xs: 4, md: 6 }, textAlign: 'center' }}>
      <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1 }}>LEARNING THAT MOVES YOU FORWARD</Typography>
      <Typography component="h2" variant="h3" sx={{ mt: .75, fontWeight: 800, letterSpacing: '-.035em', fontSize: { xs: '2rem', md: '2.75rem' } }}>Built for modern learning</Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>We bring clear courses, experienced tutors, and flexible practice together to help every learner make steady progress.</Typography>
    </Box>

    <Grid container spacing={2} alignItems="center" sx={{ mb: { xs: 4, md: 5 } }}>
      <Grid item xs={12} sm={4}>
        <Box component="img" src="/images/home-feature.png" alt="Student learning with a notebook" sx={{ display: 'block', width: '100%', height: { xs: 210, sm: 190, md: 220 }, borderRadius: 3, objectFit: 'cover' }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Box component="img" src="/images/about-study-group-banner.webp" alt="Students learning together around a laptop" sx={{ display: 'block', width: '100%', height: { xs: 230, sm: 230, md: 270 }, borderRadius: 3, objectFit: 'cover' }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Box component="img" src="/images/home-testimonial.png" alt="Student sharing their learning experience" sx={{ display: 'block', width: '100%', height: { xs: 210, sm: 190, md: 220 }, borderRadius: 3, objectFit: 'cover' }} />
      </Grid>
    </Grid>

    <Typography component="p" sx={{ maxWidth: 790, mx: 'auto', mb: { xs: 4, md: 5 }, textAlign: 'center', fontSize: { xs: '1.1rem', md: '1.35rem' }, lineHeight: 1.6 }}>
      Our mission is to make quality learning accessible, supportive, and practical for students wherever they are.
    </Typography>

    <Paper elevation={0} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, p: { xs: 2.5, md: 3 }, border: 1, borderColor: 'divider', borderRadius: 3, backgroundColor: 'background.paper' }}>
      {[{ value: '500+', label: 'Students' }, { value: '20+', label: 'Quality courses' }, { value: '10+', label: 'Experienced tutors' }].map((stat, index) => <Box key={stat.label} sx={{ py: { xs: 1.5, sm: 1 }, textAlign: 'center', borderRight: { sm: index < 2 ? 1 : 0 }, borderBottom: { xs: index < 2 ? 1 : 0, sm: 0 }, borderColor: 'divider' }}>
        <Typography sx={{ fontSize: { xs: '1.6rem', md: '1.9rem' }, fontWeight: 800 }}>{stat.value}</Typography>
        <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
      </Box>)}
    </Paper>

    <Grid container spacing={{ xs: 4, md: 7 }} alignItems="center" sx={{ mt: { xs: 6, md: 9 }, pb: { xs: 4, md: 6 }, borderBottom: 1, borderColor: 'divider' }}>
      <Grid item xs={12} md={6}>
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: .8 }}>A CLEAR PATH FORWARD</Typography>
        <Typography component="h3" variant="h4" sx={{ mt: .5, fontWeight: 800 }}>Learning designed for real progress</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.75 }}>Build confidence through practical lessons that break big ideas into manageable steps. Learn at your own pace and keep your progress moving forward.</Typography>
        <Stack spacing={1.25} sx={{ mt: 2.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>Flexible courses that fit your schedule</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>Practice that turns knowledge into confidence</Typography>
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box component="img" src="/images/courses/annie-spratt-QckxruozjRg-unsplash.jpg" alt="Learners working together on computers" sx={{ display: 'block', width: '100%', height: { xs: 240, md: 330 }, borderRadius: 3, objectFit: 'cover' }} />
      </Grid>
    </Grid>

    <Grid container spacing={{ xs: 4, md: 7 }} alignItems="center" sx={{ mt: { xs: 4, md: 6 } }}>
      <Grid item xs={12} md={6}>
        <Box component="img" src="/images/contact-support-banner.webp" alt="Support professional ready to help a learner" sx={{ display: 'block', width: '100%', height: { xs: 240, md: 330 }, borderRadius: 3, objectFit: 'cover' }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: .8 }}>SUPPORT THAT GROWS WITH YOU</Typography>
        <Typography component="h3" variant="h4" sx={{ mt: .5, fontWeight: 800 }}>Guidance at every step</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.75 }}>Learning feels easier when you have the right support. Our tutors make space for questions, explain challenging topics, and help learners stay motivated.</Typography>
        <Stack spacing={1.25} sx={{ mt: 2.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>Experienced tutors who meet you where you are</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>A welcoming place to ask, explore, and improve</Typography>
        </Stack>
      </Grid>
    </Grid>
  </Container>

  <HomeOurMentors autoplay />

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
