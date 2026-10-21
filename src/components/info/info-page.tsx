import Box from '@mui/material/Box'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import AboutPage from './about-page'
import ContactPage from './contact-page'

interface InfoPageProps {
  kind: 'about' | 'contact'
  darkMode: boolean
  onToggleDarkMode: () => void
}

const InfoPage: React.FC<InfoPageProps> = ({ kind, darkMode, onToggleDarkMode }) => (
  <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
    <Header darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
    {kind === 'about' ? <AboutPage /> : <ContactPage />}
    <Footer />
  </Box>
)

export default InfoPage
