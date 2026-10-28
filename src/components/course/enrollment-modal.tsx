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
import CloseIcon from '@mui/icons-material/Close'
import { type FC, type FormEvent, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { type AdminCourse } from '@/components/admin/admin-data'
import { getAuthenticatedUser, getManualPaymentInfo, saveAuthenticatedUser, submitCredentials, submitManualPayment, updateAuthenticatedProfile, type ManualPaymentInfo } from '@/services/api'
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
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<ManualPaymentInfo | null>(null)
  const [paymentInfoError, setPaymentInfoError] = useState<string | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofData, setProofData] = useState<string | null>(null)
  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthenticatedUser()))
  const [submitted, setSubmitted] = useState(false)

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
    setQrImage(null)
    setProofFile(null)
    setProofData(null)
    setSubmitted(false)
    getManualPaymentInfo(course.id, classId)
      .then((info) => { if (current) setPaymentInfo(info) })
      .catch((error) => { if (current) setPaymentInfoError(error instanceof Error ? error.message : 'Payment instructions are unavailable.') })
    return () => { current = false }
  }, [classId, course.id, open])

  useEffect(() => {
    if (!paymentInfo?.configured) return
    const payload = [paymentInfo.provider, `Account name: ${paymentInfo.accountName}`, `Account number: ${paymentInfo.accountNumber}`, `Amount: ${paymentInfo.currency} ${paymentInfo.amount.toFixed(2)}`].join('\n')
    let current = true
    void QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 2, width: 260 })
      .then((dataUrl) => { if (current) setQrImage(dataUrl) })
      .catch(() => { if (current) setPaymentInfoError('We could not generate the payment QR code.') })
    return () => { current = false }
  }, [paymentInfo])

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
    setIsSubmittingAccount(true)
    try {
      if (isAuthenticated) {
        const user = await updateAuthenticatedProfile({ name, email, phone })
        saveAuthenticatedUser(user)
      } else {
        const { user } = await submitCredentials('sign-up', email, password, { name, phone })
        saveAuthenticatedUser(user)
        setIsAuthenticated(true)
      }
      setContact({ name, email, phone })
      setActiveStep(1)
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'We could not save your personal information.')
    } finally {
      setIsSubmittingAccount(false)
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
      await submitManualPayment(course.id, classId, proofData, proofFile.name)
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
        <TextField required fullWidth label="Password" name="password" type="password" autoComplete="new-password" inputProps={{ minLength: 8 }} />
        <TextField required fullWidth label="Confirm Password" name="confirmPassword" type="password" autoComplete="new-password" inputProps={{ minLength: 8 }} />
      </>}
      {accountError && <Alert severity="error">{accountError}</Alert>}
      <Button type="submit" variant="contained" size="large" disabled={isSubmittingAccount}>
        {isSubmittingAccount ? 'Saving...' : 'Continue to payment'}
      </Button>
    </Stack>
  </Box>

  const renderConfirmation = () => <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4, textAlign: 'center' }} aria-live="polite">
    <Typography variant="h4">Payment Pending Verification</Typography>
    <Typography color="text.secondary">Your payment screenshot for {paymentInfo?.title ?? course.title} has been received and is under review. Check Payment History in your dashboard for updates. Course access will be available after approval.</Typography>
    <Button variant="contained" size="large" onClick={() => navigateTo('/dashboard')}>Go to Dashboard</Button>
  </Box>

  const renderPaymentInfo = () => <Stack spacing={2.5}>
    {paymentInfoError && <Alert severity="error">{paymentInfoError}</Alert>}
    {!paymentInfo && !paymentInfoError && <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress aria-label="Loading payment information" /></Box>}
    {paymentInfo && <>
      <Box sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.default' }}>
        <Typography variant="subtitle2" color="text.secondary">Enrollment</Typography>
        <Typography variant="h6">{paymentInfo.title}</Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>{paymentInfo.currency} {paymentInfo.amount.toFixed(2)} due</Typography>
      </Box>
      {!paymentInfo.configured ? <Alert severity="warning">Business payment details have not been configured yet. Please contact support before sending a payment.</Alert> : <>
        <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1.5, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          {qrImage ? <Box component="img" src={qrImage} alt={`QR code for ${paymentInfo.provider} payment to ${paymentInfo.accountName}`} sx={{ width: 260, maxWidth: '100%', aspectRatio: '1', bgcolor: 'white', p: 1, borderRadius: 1 }} /> : <CircularProgress aria-label="Generating payment QR code" />}
          <Typography variant="body2" color="text.secondary">Scan to view the business payment details.</Typography>
        </Box>
        <Box sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Pay by {paymentInfo.provider}</Typography>
          <Typography variant="body2">Account name: {paymentInfo.accountName}</Typography>
          <Typography variant="body2">Account or phone number: {paymentInfo.accountNumber}</Typography>
          {paymentInfo.instructions && <Typography variant="body2" sx={{ mt: 1 }}>{paymentInfo.instructions}</Typography>}
        </Box>
      </>}
      <Box component="form" onSubmit={(event) => void handlePaymentSubmit(event)}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Payment screenshot</Typography>
          <Button component="label" variant="outlined" disabled={!paymentInfo.configured || isSubmittingPayment}>
            {proofFile ? 'Choose a different screenshot' : 'Upload screenshot'}
            <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void handleProofChange(event.target.files?.[0]); event.target.value = '' }} />
          </Button>
          <Typography variant="caption" color="text.secondary">JPG, PNG, or WebP · 6 MB maximum</Typography>
          {proofFile && <Typography variant="body2">Attached: {proofFile.name}</Typography>}
          {paymentError && <Alert severity="error">{paymentError}</Alert>}
          <Stack direction="row" spacing={1.5}>
            <Button fullWidth variant="outlined" onClick={() => setActiveStep(0)} disabled={isSubmittingPayment}>Back</Button>
            <Button fullWidth type="submit" variant="contained" disabled={!paymentInfo.configured || !qrImage || isSubmittingPayment}>
              {isSubmittingPayment ? 'Submitting...' : 'Submit for verification'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </>}
  </Stack>

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="enrollment-dialog-title">
    <DialogTitle id="enrollment-dialog-title" sx={{ pr: 7 }}>
      Enroll in {classId === null ? 'this course' : 'this batch'}
      <IconButton aria-label="Close enrollment" onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers sx={{ p: { xs: 2.5, sm: 4 } }}>
      {!submitted && <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label, index) => <Step key={label} completed={index < activeStep}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>}
      {submitted ? renderConfirmation() : activeStep === 0 ? renderPersonalInfo() : renderPaymentInfo()}
    </DialogContent>
  </Dialog>
}

export default EnrollmentModal
