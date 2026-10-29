import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type FC, useEffect, useMemo, useState } from 'react'
import AdminDataTable, { type DataColumn } from './admin-data-table'
import { getAdminPayments, getAdminSponsorPayments, getPendingManualPayments, reviewManualPayment, type AdminPayment, type PendingManualPayment } from '@/services/api'

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  if (['Published', 'Approved', 'Active', 'Paid'].includes(status)) return 'success'
  if (['Pending', 'Pending Verification', 'Draft', 'Waitlisted'].includes(status)) return 'warning'
  if (['Rejected', 'Declined', 'Suspended', 'Refunded', 'Failed'].includes(status)) return 'error'
  return 'default'
}

const StatusChip: FC<{ status: string }> = ({ status }) => <Chip label={status} color={statusColor(status)} size="small" />

type PaymentTypeFilter = 'All' | 'Course' | 'Class' | 'Book' | 'Sponsor'
type HistoryRow = Omit<AdminPayment, 'id'> & { id: string }

const PageHeading: FC<{ title: string; description: string }> = ({ title, description }) => (
  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
  </Box>
)

const PaymentsPage: FC = () => {
  const [payments, setPayments] = useState<HistoryRow[]>([])
  const [pendingPayments, setPendingPayments] = useState<PendingManualPayment[]>([])
  const [paymentType, setPaymentType] = useState<PaymentTypeFilter>('All')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingQueue, setIsLoadingQueue] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [queueError, setQueueError] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const [proofPayment, setProofPayment] = useState<PendingManualPayment | null>(null)
  const [decliningPayment, setDecliningPayment] = useState<PendingManualPayment | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const loadPayments = async () => {
    try {
      const [paymentRecords, sponsorRecords] = await Promise.all([getAdminPayments(), getAdminSponsorPayments()])
      setPayments([
        ...paymentRecords.map((payment): HistoryRow => ({ ...payment, id: `payment-${payment.id}` })),
        ...sponsorRecords.map((payment): HistoryRow => ({
          id: `sponsor-${payment.id}`,
          student: payment.sponsor,
          course: payment.course,
          type: 'Sponsor',
          amount: payment.amount,
          currency: payment.currency,
          date: payment.date,
          status: payment.status,
          reviewNote: null,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load payments.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadQueue = async () => {
    try {
      setPendingPayments(await getPendingManualPayments())
      setQueueError(null)
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : 'Unable to load pending payments.')
    } finally {
      setIsLoadingQueue(false)
    }
  }

  useEffect(() => {
    void loadPayments()
    void loadQueue()
  }, [])

  const filteredPayments = useMemo(() => paymentType === 'All' ? payments : payments.filter((payment) => payment.type === paymentType), [paymentType, payments])

  const columns: DataColumn<HistoryRow>[] = [
    { key: 'student', label: 'Student / sponsor' },
    { key: 'course', label: 'Item' },
    { key: 'amount', label: 'Amount', render: (value, row) => `${row.currency} ${Number(value).toFixed(2)}` },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (value) => <StatusChip status={String(value)} /> },
    { key: 'reviewNote', label: 'Review note' },
  ]

  const handleReview = async (payment: PendingManualPayment, decision: 'approve' | 'decline', reason = '') => {
    setReviewingId(payment.id)
    setActionError(null)
    try {
      await reviewManualPayment(payment.id, decision, reason)
      setPendingPayments((current) => current.filter((item) => item.id !== payment.id))
      void loadPayments()
      setDecliningPayment(null)
      setDeclineReason('')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to review this payment.')
    } finally {
      setReviewingId(null)
    }
  }

  return <>
    <PageHeading title="Payments & verification" description="Review manual course and class payments, then approve access or decline the submission." />
    <Typography variant="h5" sx={{ mb: 2 }}>Pending Payments</Typography>
    {actionError && <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 2 }}>{actionError}</Alert>}
    {isLoadingQueue ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress aria-label="Loading pending payments" /></Box> : queueError ? <Paper elevation={0} sx={{ p: 3, mb: 4, border: 1, borderColor: 'divider' }}><Typography color="error">{queueError}</Typography></Paper> : pendingPayments.length ? <Stack spacing={2} sx={{ mb: 5 }}>
      {pendingPayments.map((payment) => <Card key={payment.id} variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
              <Box><Typography variant="caption" color="text.secondary">Student</Typography><Typography sx={{ fontWeight: 700 }}>{payment.student}</Typography><Typography variant="body2" color="text.secondary">{payment.email} · {payment.phone || 'No phone provided'}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Course / class</Typography><Typography sx={{ fontWeight: 700 }}>{payment.course}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Amount due</Typography><Typography sx={{ fontWeight: 700 }}>{payment.currency} {payment.amount.toFixed(2)}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Submitted</Typography><Typography>{new Date(payment.submittedAt).toLocaleString()}</Typography></Box>
            </Box>
            <Divider />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Button variant="outlined" onClick={() => setProofPayment(payment)}>View payment proof</Button>
              <Button variant="contained" disabled={reviewingId === payment.id} onClick={() => void handleReview(payment, 'approve')}>{reviewingId === payment.id ? 'Reviewing...' : 'Approve'}</Button>
              <Button variant="outlined" color="error" disabled={reviewingId === payment.id} onClick={() => { setDecliningPayment(payment); setDeclineReason('') }}>Decline</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>)}
    </Stack> : <Paper elevation={0} sx={{ p: 3, mb: 5, border: 1, borderColor: 'divider' }}><Typography color="text.secondary">There are no payments awaiting verification.</Typography></Paper>}

    <Typography variant="h5" sx={{ mb: 2 }}>Payment history</Typography>
    {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading payments" /></Box> : loadError ? <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}><Typography color="error">{loadError}</Typography></Paper> : <>
      <FormControl size="small" sx={{ minWidth: 170, mb: 2 }}><InputLabel>Payment type</InputLabel><Select label="Payment type" value={paymentType} onChange={(event) => setPaymentType(event.target.value as PaymentTypeFilter)}><MenuItem value="All">All payment types</MenuItem><MenuItem value="Course">Course</MenuItem><MenuItem value="Class">Class</MenuItem><MenuItem value="Book">Book</MenuItem><MenuItem value="Sponsor">Sponsor</MenuItem></Select></FormControl>
      <AdminDataTable key={paymentType} rows={filteredPayments} columns={columns} searchPlaceholder="Search payments" />
    </>}

    <Dialog open={Boolean(proofPayment)} onClose={() => setProofPayment(null)} fullWidth maxWidth="xl" aria-labelledby="payment-proof-dialog-title">
      <DialogTitle id="payment-proof-dialog-title">Payment proof · {proofPayment?.student}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, bgcolor: 'grey.100' }}>
        {proofPayment && <Box component="img" src={`/api/admin/pending-payments/${proofPayment.id}/proof`} alt={`Payment proof submitted by ${proofPayment.student}`} sx={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />}
      </DialogContent>
    </Dialog>

    <Dialog open={Boolean(decliningPayment)} onClose={() => setDecliningPayment(null)} fullWidth maxWidth="sm" aria-labelledby="decline-payment-title">
      <DialogTitle id="decline-payment-title">Decline payment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">{decliningPayment?.student} will see the declined status and this optional reason in payment history.</Typography>
          <TextField label="Reason (optional)" value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} multiline minRows={3} inputProps={{ maxLength: 500 }} />
          {actionError && <Alert severity="error">{actionError}</Alert>}
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button onClick={() => setDecliningPayment(null)}>Cancel</Button>
            <Button color="error" variant="contained" disabled={!decliningPayment || reviewingId === decliningPayment?.id} onClick={() => decliningPayment && void handleReview(decliningPayment, 'decline', declineReason)}>{reviewingId === decliningPayment?.id ? 'Declining...' : 'Confirm decline'}</Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  </>
}

export default PaymentsPage
