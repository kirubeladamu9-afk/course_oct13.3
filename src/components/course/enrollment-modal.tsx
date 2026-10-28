import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined'
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { type FC, type FormEvent, useEffect, useState } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { type AdminCourse } from '@/components/admin/admin-data'
import { getAuthenticatedUser, getManualPaymentInfo, saveAuthenticatedUser, submitManualPayment, type ManualPaymentInfo } from '@/services/api'
import { navigateTo } from '@/lib/navigation'

interface EnrollmentModalProps {
  course: Pick<AdminCourse, 'id' | 'title' | 'price'>
  classId?: number | null
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}

const steps = ['Personal Info', 'Payment Info']
const maximumProofSize = 6 * 1024 * 1024

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(new Error('We could not read this image.'))
  reader.readAsDataURL(file)
})

const EnrollmentModal: FC<EnrollmentModalProps> = ({ course, classId = null, open, onClose, onSubmitted }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmSignupPassword, setConfirmSignupPassword] = useState('')
  const [paymentInfo, setPaymentInfo] = useState<ManualPaymentInfo | null>(null)
  const [paymentInfoError, setPaymentInfoError] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofData, setProofData] = useState<string | null>(null)
  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthenticatedUser()))
  const [submitted, setSubmitted] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (!open) return
    let current = true
    const user = getAuthenticatedUser()
    setIsAuthenticated(Boolean(user))
    setContact({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' })
    setActiveStep(0)
    setAccountError(null)
    setPaymentError(null)
    setPaymentInfo(null)
    setPaymentInfoError(null)
    setCopyFeedback(null)
    setProofFile(null)
    setProofData(null)
    setSignupPassword('')
    setConfirmSignupPassword('')
    setSubmitted(false)
    getManualPaymentInfo(course.id, classId)
      .then((info) => { if (current) setPaymentInfo(info) })
      .catch((error) => { if (current) setPaymentInfoError(error instanceof Error ? error.message : 'Payment instructions are unavailable.') })
    return () => { current = false }
  }, [classId, course.id, open])

  const handlePersonalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('fullName') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const phone = String(formData.get('phone') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!name || !email || !phone) {
      setAccountError('Enter your name, email, and phone number to continue.')
      return
    }
    if (!isAuthenticated && password !== String(formData.get('confirmPassword') ?? '')) {
      setAccountError('The passwords do not match.')
      return
    }

    setAccountError(null)
    setContact({ name, email, phone })
    if (!isAuthenticated) {
      setSignupPassword(password)
      setConfirmSignupPassword(String(formData.get('confirmPassword') ?? ''))
    }
    setActiveStep(1)
  }

  const handleCopyAccount = async (provider: string, accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopyFeedback(`${provider} account copied.`)
    } catch {
      setCopyFeedback('Copy failed. Please select the account number and copy it manually.')
    }
  }

  const handleProofChange = async (file: File | undefined) => {
    setPaymentError(null)
    if (!file) {
      setProofFile(null)
      setProofData(null)
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > maximumProofSize) {
      setProofFile(null)
      setProofData(null)
      setPaymentError('Choose a JPG, PNG, or WebP screenshot no larger than 6 MB.')
      return
    }
    try {
      setProofData(await readFileAsDataUrl(file))
      setProofFile(file)
    } catch (error) {
      setProofFile(null)
      setProofData(null)
      setPaymentError(error instanceof Error ? error.message : 'We could not read this image.')
    }
  }

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!paymentInfo?.configured) {
      setPaymentError('Payment details are not available yet. Please contact support before sending money.')
      return
    }
    if (!proofFile || !proofData) {
      setPaymentError('Attach a screenshot of your completed payment to continue.')
      return
    }
    setPaymentError(null)
    setIsSubmittingPayment(true)
    try {
      const result = await submitManualPayment(course.id, classId, proofData, proofFile.name, contact, signupPassword)
      saveAuthenticatedUser(result.user)
      setIsAuthenticated(true)
      setSubmitted(true)
      onSubmitted?.()
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'We could not submit your payment for review.')
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const renderPersonalInfo = () => <Box component="form" onSubmit={(event) => void handlePersonalSubmit(event)}>
    <Stack spacing={2}>
      <TextField required fullWidth label="Full Name" name="fullName" autoComplete="name" value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} />
      <TextField required fullWidth label="Email" name="email" type="email" autoComplete="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} />
      <TextField required fullWidth label="Phone" name="phone" type="tel" autoComplete="tel" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} />
      {!isAuthenticated && <>
        <TextField required fullWidth label="Password" name="password" type="password" autoComplete="new-password" inputProps={{ minLength: 8 }} value={signupPassword} onChange={(event) => setSignupPassword(event.target.value)} />
        <TextField required fullWidth label="Confirm Password" name="confirmPassword" type="password" autoComplete="new-password" inputProps={{ minLength: 8 }} value={confirmSignupPassword} onChange={(event) => setConfirmSignupPassword(event.target.value)} />
        <Typography variant="caption" color="text.secondary">Your account will be created after you submit your payment proof.</Typography>
      </>}
      {accountError && <Alert severity="error">{accountError}</Alert>}
      <Button type="submit" variant="contained" size="large">
        Continue to payment
      </Button>
    </Stack>
  </Box>

  const renderConfirmation = () => <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4, textAlign: 'center' }} aria-live="polite">
    <Typography variant="h4">Payment Pending Verification</Typography>
    <Typography color="text.secondary">Your payment screenshot for {paymentInfo?.title ?? course.title} has been received and is under review. Check Payment History in your dashboard for updates. Course access will be available after approval.</Typography>
    <Button variant="contained" size="large" onClick={() => navigateTo('/dashboard')}>Go to Dashboard</Button>
  </Box>

  const renderPaymentInfo = () => <Stack spacing={{ xs: 2, sm: 2.5 }}>
    {paymentInfoError && <Alert severity="error">{paymentInfoError}</Alert>}
    {!paymentInfo && !paymentInfoError && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress aria-label="Loading payment information" /></Box>}
    {paymentInfo && <>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2, p: { xs: 2, sm: 2.5 }, border: 1, borderColor: 'rgba(13, 148, 136, 0.2)', borderRadius: 3, bgcolor: 'rgba(13, 148, 136, 0.04)' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'grid', placeItems: 'center', flexShrink: 0, width: 44, height: 44, borderRadius: 2, color: '#0f766e', bgcolor: 'rgba(13, 148, 136, 0.12)' }}><SchoolOutlinedIcon /></Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 700 }}>{classId === null ? 'COURSE ENROLLMENT' : 'CLASS ENROLLMENT'}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3, overflowWrap: 'anywhere' }}>{paymentInfo.title}</Typography>
          </Box>
        </Stack>
        <Box sx={{ flexShrink: 0, minWidth: { sm: 150 }, px: 2, py: 1.25, textAlign: { xs: 'left', sm: 'right' }, borderRadius: 2, bgcolor: 'rgba(13, 148, 136, 0.09)' }}>
          <Typography variant="caption" color="text.secondary">Total amount</Typography>
          <Typography variant="h5" sx={{ color: '#0f766e', fontWeight: 800, lineHeight: 1.2 }}>{paymentInfo.currency} {paymentInfo.amount.toFixed(2)}</Typography>
        </Box>
      </Box>

      <Box>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.75 }}>
          <Box sx={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 2, color: '#047857', bgcolor: 'rgba(16, 185, 129, 0.12)' }}><QrCode2OutlinedIcon /></Box>
          <Typography variant="h6" sx={{ fontWeight: 750 }}>Scan to Pay</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Open your mobile banking or payment app and scan the QR code to complete your payment.</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' }, gap: { xs: 2, md: 2.5 } }}>
          <Box sx={{ display: 'grid', alignContent: 'start', justifyItems: 'center', gap: 1.5, p: { xs: 2, sm: 2.5 }, border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 8px 24px rgba(15, 118, 110, 0.06)' }}>
            <Typography variant="subtitle2" sx={{ alignSelf: 'start', fontWeight: 700 }}>Business payment QR</Typography>
            <Box sx={{ display: 'grid', placeItems: 'center', width: '100%', minHeight: { xs: 240, sm: 280 }, borderRadius: 2, bgcolor: '#f8fafc' }}>
              <Box component="img" src="/images/payment-qr.webp" alt="QR code for business payment" sx={{ display: 'block', width: 'min(100%, 286px)', aspectRatio: '1', objectFit: 'contain', bgcolor: 'white' }} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>Scan with any supported bank or mobile money app.</Typography>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 2.5 }, border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.035)', boxShadow: '0 8px 24px rgba(15, 118, 110, 0.06)' }}>
            <Typography variant="subtitle1" sx={{ mb: 1.25, fontWeight: 750 }}>Payment details</Typography>
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
              {paymentInfo.paymentMethods.map((method) => {
                const copied = copyFeedback === `${method.provider} account copied.`
                return <Box key={method.provider} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 1.25, py: 1.35 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.35, color: 'text.secondary' }}>
                      {method.provider === 'Telebirr' ? <PhoneIphoneOutlinedIcon fontSize="small" /> : <AccountBalanceOutlinedIcon fontSize="small" />}
                      <Typography variant="body2">{method.provider}</Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ pl: 3.5, fontWeight: 700, overflowWrap: 'anywhere' }}>{method.accountNumber}</Typography>
                  </Box>
                  <Button size="small" variant="text" aria-label={`Copy ${method.provider} account number`} startIcon={copied ? <CheckOutlinedIcon /> : <ContentCopyOutlinedIcon />} onClick={() => void handleCopyAccount(method.provider, method.accountNumber)} sx={{ minWidth: 0, color: '#0f766e' }}>{copied ? 'Copied' : 'Copy'}</Button>
                </Box>
              })}
            </Stack>
            {copyFeedback && <Typography variant="caption" role="status" sx={{ display: 'block', mt: 0.75, color: copyFeedback.startsWith('Copy failed') ? 'error.main' : '#047857' }}>{copyFeedback}</Typography>}
            <Alert icon={<InfoOutlinedIcon />} severity="info" sx={{ mt: 1.5, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.08)', color: 'text.primary', '& .MuiAlert-icon': { color: '#2563eb' } }}>
              Please include the exact amount ({paymentInfo.currency} {paymentInfo.amount.toFixed(2)}) when paying.
            </Alert>
            {paymentInfo.instructions && <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>{paymentInfo.instructions}</Typography>}
          </Box>
        </Box>
      </Box>

      <Box component="form" onSubmit={(event) => void handlePaymentSubmit(event)}>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2, p: { xs: 2, sm: 2.25 }, border: 1, borderStyle: 'dashed', borderColor: 'rgba(99, 102, 241, 0.35)', borderRadius: 3, bgcolor: 'rgba(99, 102, 241, 0.035)' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ display: 'grid', placeItems: 'center', flexShrink: 0, width: 44, height: 44, borderRadius: 2, color: '#4f46e5', bgcolor: 'rgba(99, 102, 241, 0.12)' }}><CloudUploadOutlinedIcon /></Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>Payment screenshot</Typography>
                <Typography variant="body2" color="text.secondary">After paying, upload a screenshot as proof.</Typography>
              </Box>
            </Stack>
            <Button component="label" variant="outlined" disabled={!paymentInfo.configured || isSubmittingPayment} startIcon={<CloudUploadOutlinedIcon />} sx={{ flexShrink: 0, px: 2, py: 1.1, borderColor: '#4f46e5', color: '#4338ca', bgcolor: 'background.paper', '&:hover': { borderColor: '#4338ca', bgcolor: 'rgba(99, 102, 241, 0.06)' } }}>
              {proofFile ? 'Choose another image' : 'Upload screenshot'}
              <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void handleProofChange(event.target.files?.[0]); event.target.value = '' }} />
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary">Supported formats: JPG, PNG, or WebP. Maximum file size: 6 MB.</Typography>
          {proofFile && <Typography variant="body2" sx={{ color: '#047857', overflowWrap: 'anywhere' }}>Attached: {proofFile.name}</Typography>}
          {paymentError && <Alert severity="error">{paymentError}</Alert>}
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Button fullWidth variant="outlined" size="large" onClick={() => setActiveStep(0)} disabled={isSubmittingPayment} sx={{ minHeight: 48, borderRadius: 2, color: 'text.secondary', borderColor: 'divider' }}>Back</Button>
            <Button fullWidth type="submit" variant="contained" size="large" disabled={!paymentInfo.configured || isSubmittingPayment} sx={{ minHeight: 48, borderRadius: 2, fontWeight: 700, bgcolor: '#0f8f78', boxShadow: '0 8px 18px rgba(15, 143, 120, 0.2)', '&:hover': { bgcolor: '#0f766e', boxShadow: '0 10px 22px rgba(15, 143, 120, 0.26)' } }}>
              {isSubmittingPayment ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6 }}><CheckOutlinedIcon sx={{ fontSize: 15 }} /> Your payment is secure and protected.</Typography>
        </Stack>
      </Box>
    </>}
  </Stack>

  return <Dialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="md" aria-labelledby="enrollment-dialog-title" PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 }, maxHeight: { sm: 'min(92vh, 960px)' } } }}>
    <DialogTitle id="enrollment-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: { xs: 2, sm: 2.5 }, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'grid', placeItems: 'center', flexShrink: 0, width: 44, height: 44, borderRadius: 2, color: '#0f766e', bgcolor: 'rgba(13, 148, 136, 0.12)' }}><SchoolOutlinedIcon /></Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25 }}>Enroll in {classId === null ? 'this course' : 'this class'}</Typography>
        <Typography variant="body2" color="text.secondary">Complete your payment to get full access.</Typography>
      </Box>
      <IconButton aria-label="Close enrollment" onClick={onClose} sx={{ alignSelf: 'flex-start', mt: -0.25 }}><CloseIcon /></IconButton>
    </DialogTitle>
    <DialogContent dividers sx={{ p: { xs: 2, sm: 3, md: 4 }, overflowY: 'auto' }}>
      {!submitted && <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: { xs: 2.5, sm: 3.5 }, '& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed': { color: '#0f8f78' }, '& .MuiStepLabel-label.Mui-active': { color: '#0f766e', fontWeight: 700 }, '& .MuiStepConnector-line': { borderColor: 'rgba(15, 143, 120, 0.35)' } }}>
        {steps.map((label, index) => <Step key={label} completed={index < activeStep}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>}
      {submitted ? renderConfirmation() : activeStep === 0 ? renderPersonalInfo() : renderPaymentInfo()}
    </DialogContent>
  </Dialog>
}

export default EnrollmentModal
