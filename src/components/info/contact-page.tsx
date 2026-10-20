import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import FaqOutlinedIcon from '@mui/icons-material/QuizOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FC, type FormEvent } from 'react'
import { navigateTo } from '@/lib/navigation'

const emailAddress = 'support@coursesharp.com'
const contactHeroImage = 'https://cdn.builder.io/api/v1/image/assets%2Fffcc5cd454334db882704c40d4112930%2F3829696dded5442a84658efe8230a144?format=webp&width=800&height=1200'
const officeAddress = 'Bole, Addis Ababa, Ethiopia'
const subjects = ['Course enrollment & payments', 'Technical support', 'Account & profile issues', 'General inquiry']
const faqs = [
  { question: 'How do I enroll in a course?', answer: 'Browse the course catalog, open a course to review its details, and choose Enroll to get started.', action: 'Browse courses', href: '/courses' },
  { question: 'Where can I get help with a payment?', answer: 'Email our support team with your course name and payment question. We will help you review the next steps.', action: 'Email support', href: `mailto:${emailAddress}?subject=Payment%20support` },
  { question: 'I need help with my account. What should I do?', answer: 'Send us a message with the email address on your account. Please do not include your password.', action: 'Contact support', href: `mailto:${emailAddress}?subject=Account%20support` },
]

const ContactPage: FC = () => {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('fullName') ?? '')
    const email = String(formData.get('email') ?? '')
    const body = `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`
    window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return <Box component="main" sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8fbfb', color: 'text.primary' }}>
    <Box sx={{ position: 'relative', overflow: 'hidden', backgroundColor: '#e8f7f4' }}>
      <Box component="img" src={contactHeroImage} alt="" aria-hidden="true" sx={{ display: { xs: 'none', sm: 'block' }, position: 'absolute', top: 0, right: 0, height: '100%', width: 'auto', maxWidth: 'none' }} />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, minHeight: { xs: 'auto', sm: 300, md: 300 }, py: { xs: 3, sm: 0 }, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, alignItems: 'center', gap: { xs: 2, sm: 1.5, md: 2 } }}>
        <Box sx={{ position: 'relative', zIndex: 1, py: { md: 2 }, maxWidth: { sm: 390 } }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.1 }}>GET IN TOUCH</Typography>
          <Typography component="h1" sx={{ mt: .75, mb: 1, fontSize: { xs: '2.25rem', sm: '2.4rem', md: '2.6rem' }, lineHeight: 1.05, letterSpacing: '-.045em', fontWeight: 800 }}>Contact Us</Typography>
          <Typography sx={{ maxWidth: 450, color: 'text.secondary', lineHeight: 1.65, fontSize: { xs: '.9rem', sm: '.82rem', md: '.9rem' } }}>We’d love to hear from you! Whether you have a question, need support, or just want to say hello — we’re here to help.</Typography>
          <Stack direction="row" spacing={{ xs: 2, sm: 2.5 }} sx={{ mt: { xs: 2.5, sm: 2.25 } }}>
            <Stack direction="row" spacing={.75} alignItems="center"><MenuBookOutlinedIcon color="primary" fontSize="small" /><Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>Better Learning<br />Together</Typography></Stack>
            <Stack direction="row" spacing={.75} alignItems="center"><FavoriteBorderRoundedIcon color="primary" fontSize="small" /><Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>Your Success<br />Matters</Typography></Stack>
          </Stack>
        </Box>
        <Box component="img" src={contactHeroImage} alt="Smiling student holding books with learning illustrations" sx={{ display: { xs: 'block', sm: 'none' }, width: '100%', maxHeight: 180, objectFit: 'contain', objectPosition: 'right center', mt: -1 }} />
      </Container>
    </Box>

    <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 3 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: { xs: 1.25, sm: 1.5 } }}>
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, boxShadow: '0 8px 26px rgba(15, 60, 70, .055)', transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 32px rgba(15, 60, 70, .1)' } }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 1.75, md: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 1.75, md: 2 } } }}><Box sx={{ display: 'grid', placeItems: 'center', width: 42, height: 42, mb: 1.5, borderRadius: 2, color: '#168c7d', backgroundColor: '#e4f6f1' }}><PhoneOutlinedIcon fontSize="small" /></Box><Typography variant="subtitle1" sx={{ fontWeight: 750 }}>Phone</Typography><Link href="tel:+25121297831" underline="hover" color="text.primary" sx={{ display: 'inline-block', mt: .5, fontSize: '.9rem', fontWeight: 650 }}>+251 212 97831</Link><Typography display="block" variant="caption" color="text.secondary" sx={{ mt: .75 }}>Mon – Fri, 8:00 AM – 5:00 PM (EAT)</Typography></CardContent>
        </Card>
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, boxShadow: '0 8px 26px rgba(15, 60, 70, .055)', transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 32px rgba(15, 60, 70, .1)' } }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 1.75, md: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 1.75, md: 2 } } }}><Box sx={{ display: 'grid', placeItems: 'center', width: 42, height: 42, mb: 1.5, borderRadius: 2, color: '#2782b4', backgroundColor: '#e8f3fb' }}><EmailOutlinedIcon fontSize="small" /></Box><Typography variant="subtitle1" sx={{ fontWeight: 750 }}>Email</Typography><Link href={`mailto:${emailAddress}`} underline="hover" color="primary.main" sx={{ display: 'inline-block', mt: .5, fontSize: '.9rem', fontWeight: 650 }}>{emailAddress}</Link><Typography display="block" variant="caption" color="text.secondary" sx={{ mt: .75 }}>We usually reply within 24 hours.</Typography></CardContent>
        </Card>
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, boxShadow: '0 8px 26px rgba(15, 60, 70, .055)', transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 32px rgba(15, 60, 70, .1)' } }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 1.75, md: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 1.75, md: 2 } } }}><Box sx={{ display: 'grid', placeItems: 'center', width: 42, height: 42, mb: 1.5, borderRadius: 2, color: '#7455b5', backgroundColor: '#f0ebfa' }}><LocationOnOutlinedIcon fontSize="small" /></Box><Typography variant="subtitle1" sx={{ fontWeight: 750 }}>Office Address</Typography><Typography sx={{ mt: .5, fontSize: '.9rem', fontWeight: 600 }}>{officeAddress}</Typography><Typography display="block" variant="caption" color="text.secondary" sx={{ mt: .75 }}>Near Bole International Airport</Typography></CardContent>
        </Card>
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, boxShadow: '0 8px 26px rgba(15, 60, 70, .055)', transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 32px rgba(15, 60, 70, .1)' } }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 1.75, md: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 1.75, md: 2 } } }}><Box sx={{ display: 'grid', placeItems: 'center', width: 42, height: 42, mb: 1.5, borderRadius: 2, color: '#b27c12', backgroundColor: '#fff4dc' }}><ChatBubbleOutlineRoundedIcon fontSize="small" /></Box><Typography variant="subtitle1" sx={{ fontWeight: 750 }}>Live Chat</Typography><Typography sx={{ mt: .5, fontSize: '.9rem', fontWeight: 600 }}>Live chat isn’t available yet.</Typography><Link href={`mailto:${emailAddress}?subject=Support%20request`} underline="hover" color="text.secondary" sx={{ display: 'inline-block', mt: .75, fontSize: '.8rem' }}>Email our support team instead</Link></CardContent>
        </Card>
      </Box>
    </Container>

    <Container maxWidth="lg" sx={{ pb: { xs: 4, md: 5 } }}>
      <Paper elevation={0} sx={{ p: { xs: 1.75, sm: 2.25, md: 2.75 }, border: 1, borderColor: 'divider', borderRadius: 3.5, boxShadow: '0 10px 35px rgba(15, 60, 70, .055)' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.65fr .85fr' }, gap: { xs: 2.5, sm: 2.5 } }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: .5, md: 1 }, minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: .9 }}>SEND US A MESSAGE</Typography>
            <Typography component="h2" variant="h4" sx={{ mt: .25, fontWeight: 800, letterSpacing: '-.035em' }}>Let’s Talk</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mt: .5, mb: 2.5 }}>Fill out the form below and we’ll get back to you as soon as possible.</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
              <TextField required fullWidth name="fullName" label="Full Name" autoComplete="name" />
              <TextField required fullWidth name="email" type="email" label="Email Address" autoComplete="email" />
            </Stack>
            <FormControl fullWidth required sx={{ mb: 1.5 }}>
              <InputLabel id="contact-subject-label">Subject</InputLabel>
              <Select labelId="contact-subject-label" id="contact-subject" value={subject} label="Subject" onChange={(event) => setSubject(event.target.value)}>
                {subjects.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField required fullWidth multiline minRows={5} name="message" label="Message" value={message} onChange={(event) => setMessage(event.target.value.slice(0, 1000))} inputProps={{ maxLength: 1000 }} />
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1.5} sx={{ mt: 1.75 }}>
              <Button type="submit" variant="contained" endIcon={<SendRoundedIcon />} sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, px: 2.75, py: 1.1, borderRadius: 6, fontWeight: 700, boxShadow: 'none' }}>Send Message</Button>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>{message.length}/1000</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>Your email app will open with your message ready to send.</Typography>
          </Box>

          <Stack spacing={1.5}>
            <Card elevation={0} sx={{ flex: 1, borderRadius: 3, background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #143b3a, #173032)' : 'linear-gradient(145deg, #e9f8f4, #f3fbf8)' }}>
              <CardContent sx={{ p: 2.5 }}><Box sx={{ display: 'grid', placeItems: 'center', width: 48, height: 48, mb: 1.75, borderRadius: 2.5, color: 'primary.main', backgroundColor: 'rgba(255,255,255,.65)' }}><FaqOutlinedIcon /></Box><Typography variant="h6" sx={{ fontWeight: 750 }}>Need Quick Help?</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .75, mb: 2, lineHeight: 1.6 }}>Check common questions for quick answers to enrollment, payment, and account questions.</Typography><Button component="a" href="#contact-faq" variant="outlined" endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: 5, fontWeight: 700 }}>View FAQ</Button></CardContent>
            </Card>
            <Card elevation={0} sx={{ flex: 1, borderRadius: 3, background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #143b3a, #173032)' : 'linear-gradient(145deg, #e9f8f4, #f3fbf8)' }}>
              <CardContent sx={{ p: 2.5 }}><Typography variant="subtitle1" sx={{ mb: 1.25, fontWeight: 750 }}>We’re Here to Help</Typography><Stack spacing={1.15}>{['Course enrollment & payments', 'Technical support', 'Account and profile issues', 'General inquiries'].map((item) => <Stack key={item} direction="row" spacing={1} alignItems="center"><CheckCircleRoundedIcon sx={{ color: 'primary.main', fontSize: 17 }} /><Typography variant="body2" color="text.secondary">{item}</Typography></Stack>)}</Stack></CardContent>
            </Card>
          </Stack>
        </Box>
      </Paper>
    </Container>

    <Container maxWidth="lg" sx={{ pb: { xs: 4, md: 5 } }}>
      <Paper elevation={0} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '.8fr 1.2fr' }, overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 3.5, boxShadow: '0 10px 35px rgba(15, 60, 70, .055)' }}>
        <Box sx={{ p: { xs: 2.5, md: 3.25 }, alignSelf: 'center' }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: .9 }}>OUR LOCATION</Typography>
          <Typography component="h2" variant="h5" sx={{ mt: .25, fontWeight: 800 }}>Visit Our Office</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: .75, lineHeight: 1.7 }}>We’re located in Bole, Addis Ababa. Feel free to stop by or reach out to us anytime.</Typography>
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 2 }}><LocationOnOutlinedIcon color="primary" fontSize="small" sx={{ mt: .15 }} /><Box><Typography variant="body2" sx={{ fontWeight: 700 }}>{officeAddress}</Typography><Typography variant="caption" color="text.secondary">Near Bole International Airport</Typography></Box></Stack>
          <Button component="a" href="https://www.google.com/maps/search/?api=1&query=Bole%2C%20Addis%20Ababa%2C%20Ethiopia" target="_blank" rel="noreferrer" variant="outlined" endIcon={<ArrowForwardRoundedIcon />} sx={{ mt: 2, borderRadius: 5, fontWeight: 700 }}>Get Directions</Button>
        </Box>
        <Box component="iframe" title="Map showing Bole, Addis Ababa" src="https://maps.google.com/maps?q=Bole%2C%20Addis%20Ababa%2C%20Ethiopia&z=14&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" sx={{ display: 'block', width: '100%', height: { xs: 230, sm: 320 }, minHeight: { sm: 320 }, border: 0 }} />
      </Paper>
    </Container>

    <Container maxWidth="lg" id="contact-faq" sx={{ pb: { xs: 5, md: 7 }, scrollMarginTop: 24 }}>
      <Box sx={{ mb: 2.5, textAlign: 'center' }}><Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: .9 }}>FAQ</Typography><Typography component="h2" variant="h4" sx={{ mt: .25, fontWeight: 800 }}>Common questions</Typography></Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>{faqs.map((faq) => <Paper key={faq.question} elevation={0} sx={{ p: { xs: 2, sm: 2.25 }, border: 1, borderColor: 'divider', borderRadius: 2.5, backgroundColor: 'background.paper' }}><Typography variant="subtitle1" sx={{ fontWeight: 750 }}>{faq.question}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .75, lineHeight: 1.65 }}>{faq.answer}</Typography><Link href={faq.href} onClick={faq.href === '/courses' ? (event) => { event.preventDefault(); navigateTo('/courses') } : undefined} underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: .5, mt: 1.25, fontSize: '.875rem', fontWeight: 700 }}>{faq.action}<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} /></Link></Paper>)}</Box>
    </Container>
  </Box>
}

export default ContactPage
