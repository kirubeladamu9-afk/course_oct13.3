import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import ContactPage from './contact-page'

interface InfoPageProps {
  kind: 'about' | 'contact'
  darkMode: boolean
  onToggleDarkMode: () => void
}

const InfoPage: React.FC<InfoPageProps> = ({ kind, darkMode, onToggleDarkMode }) => (
  <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
    <Header darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
    {kind === 'about' ? <Box component="main" sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 } }}>
      <Box sx={{ maxWidth: 720, mb: 5 }}><Chip label="About CourseSpace" color="primary" variant="outlined" sx={{ mb: 2 }} /><Typography variant="h2" sx={{ fontSize: { xs: '2.4rem', md: '3.8rem' }, mb: 1.5 }}>Learning that meets you where you are.</Typography><Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>CourseSpace helps learners build practical skills through clear courses, supportive tutors, and relaxed practice.</Typography></Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}><Card elevation={0} sx={{ flex: 1, border: 1, borderColor: 'divider' }}><CardContent sx={{ p: 3 }}><SchoolOutlinedIcon color="primary" sx={{ mb: 2, fontSize: 36 }} /><Typography variant="h5" sx={{ mb: 1 }}>Built for steady progress</Typography><Typography color="text.secondary">Learn at a pace that works for you with practical content, live support, and explanations that make difficult ideas easier to understand.</Typography></CardContent></Card><Card elevation={0} sx={{ flex: 1, border: 1, borderColor: 'divider' }}><CardContent sx={{ p: 3 }}><MailOutlineIcon color="primary" sx={{ mb: 2, fontSize: 36 }} /><Typography variant="h5" sx={{ mb: 1 }}>Learners come first</Typography><Typography color="text.secondary">Whether you are exploring a new subject or preparing for your next milestone, CourseSpace keeps learning welcoming and useful.</Typography></CardContent></Card></Stack>
    </Box> : <ContactPage />}
    <Footer />
  </Box>
)

export default InfoPage
