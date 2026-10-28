import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import ListSubheader from '@mui/material/ListSubheader'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type FC, type FormEvent, useEffect, useState } from 'react'
import {
  AccessWarningError,
  cancelAccessImport,
  confirmAccessImport,
  deleteSponsor,
  getAccessGrants,
  getAdminClassesWorkspace,
  getAdminCourseOptions,
  getSponsorPayments,
  getSponsorReport,
  getSponsors,
  grantAccess,
  markSponsorPaymentPaid,
  recordSponsorPayment,
  uploadSponsorPaymentInvoice,
  previewAccessImport,
  resetStudentOneTimePassword,
  revokeAccessGrant,
  saveSponsor,
  type AccessGrantOptions,
  type AccessGrantRecord,
  type AccessGrantReason,
  type AccessGrantResult,
  type AccessImportPreview,
  type AccessImportResult,
  type AccessTarget,
  type OneTimePasswordReset,
  type Sponsor,
  type SponsorPayment,
  type SponsorInput,
  type SponsorReport,
} from '@/services/api'
import { buildAccessCredentialsCsv, type AccessCredentialRow } from './access-credentials'

const reasons: AccessGrantReason[] = ['Scholarship', 'Staff', 'Promotion', 'Sponsored', 'Other']
const maxCsvBytes = 1024 * 1024

type TargetType = 'course' | 'class'
type ItemOption = { id: number; title: string; price: number }

const PageHeading: FC<{ title: string; description: string }> = ({ title, description }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 800 }}>{title}</Typography>
    <Typography color="text.secondary">{description}</Typography>
  </Box>
)

const targetKey = (type: TargetType, id: number) => `${type}:${id}`

const parseTargetKey = (key: string): { type: TargetType; id: number } | null => {
  const [rawType, rawId] = key.split(':')
  const type = rawType === 'course' || rawType === 'class' ? rawType : null
  const id = Number(rawId)
  if (!type || !Number.isInteger(id) || id <= 0) return null
  return { type, id }
}

const buildTarget = (key: string): AccessTarget | null => {
  const parsed = parseTargetKey(key)
  if (!parsed) return null
  return parsed.type === 'course' ? { courseId: parsed.id } : { classId: parsed.id }
}

const errorText = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong.'

const priceForTarget = (key: string, courses: ItemOption[], classes: ItemOption[]) => {
  const parsed = parseTargetKey(key)
  const item = (parsed?.type === 'class' ? classes : courses).find((option) => option.id === parsed?.id)
  return item ? item.price.toFixed(2) : ''
}

const CourseClassSelect: FC<{ id: string; value: string; courses: ItemOption[]; classes: ItemOption[]; onChange: (value: string) => void; required?: boolean; allowedKeys?: string[] | null }> = ({ id, value, courses, classes, onChange, required, allowedKeys }) => {
  const isAllowed = (key: string) => !allowedKeys || allowedKeys.includes(key)
  return (
    <FormControl sx={{ minWidth: 280, flex: 1 }} required={required}>
      <InputLabel id={`${id}-label`}>Course or class</InputLabel>
      <Select labelId={`${id}-label`} label="Course or class" value={value} onChange={(event) => onChange(String(event.target.value))}>
        <ListSubheader>Courses</ListSubheader>
        {courses.filter((item) => isAllowed(targetKey('course', item.id))).map((item) => <MenuItem key={`course-${item.id}`} value={targetKey('course', item.id)}>{item.title}</MenuItem>)}
        <ListSubheader>Classes</ListSubheader>
        {classes.filter((item) => isAllowed(targetKey('class', item.id))).map((item) => <MenuItem key={`class-${item.id}`} value={targetKey('class', item.id)}>{item.title}</MenuItem>)}
      </Select>
      {allowedKeys?.length === 0 && <FormHelperText>This sponsor has no paid course or class yet. Record and mark a payment paid first.</FormHelperText>}
    </FormControl>
  )
}

const AccessPage: FC = () => {
  const [courses, setCourses] = useState<ItemOption[]>([])
  const [classes, setClasses] = useState<ItemOption[]>([])
  const [selectedTarget, setSelectedTarget] = useState('')
  const [sponsorPaidTargets, setSponsorPaidTargets] = useState<string[] | null>(null)
  const [reason, setReason] = useState<AccessGrantReason>('Scholarship')
  const [note, setNote] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [sponsorId, setSponsorId] = useState('')
  const [sharedError, setSharedError] = useState<string | null>(null)

  useEffect(() => {
    getAdminCourseOptions().then(setCourses).catch(() => setSharedError('Unable to load courses.'))
    getAdminClassesWorkspace().then((workspace) => setClasses(workspace.classes.map((item) => ({ id: item.id, title: item.title, price: item.price })))).catch(() => setSharedError('Unable to load classes.'))
  }, [])

  useEffect(() => {
    if (!sponsorId) {
      setSponsorPaidTargets(null)
      return
    }
    let active = true
    getSponsorPayments(Number(sponsorId)).then((payments) => {
      if (!active) return
      const keys = payments.flatMap((payment) => {
        if (payment.status !== 'paid') return []
        if (payment.courseId !== null) return [targetKey('course', payment.courseId)]
        return payment.classId !== null ? [targetKey('class', payment.classId)] : []
      })
      setSponsorPaidTargets(keys)
      setSelectedTarget((current) => keys.includes(current) ? current : '')
    }).catch(() => {
      if (active) setSponsorPaidTargets([])
    })
    return () => { active = false }
  }, [sponsorId])

  const buildOptions = (): AccessGrantOptions | null => {
    const target = buildTarget(selectedTarget)
    if (!target) {
      setSharedError('Choose a course or class.')
      return null
    }
    if (!note.trim()) {
      setSharedError('Add a note explaining this access.')
      return null
    }
    if (reason === 'Sponsored' && !sponsorId) {
      setSharedError('Choose a sponsor for sponsored access.')
      return null
    }
    if (reason === 'Sponsored' && sponsorPaidTargets && !sponsorPaidTargets.includes(selectedTarget)) {
      setSharedError('Choose a course or class this sponsor has paid for.')
      return null
    }
    setSharedError(null)
    return {
      ...target,
      reason,
      note: note.trim(),
      expiresAt: expiresAt ? new Date(`${expiresAt}T00:00:00Z`).toISOString() : undefined,
      sponsorId: sponsorId ? Number(sponsorId) : null,
    }
  }

  return (
    <Box>
      <PageHeading title="Access & Sponsors" description="Grant course or class access without payment, manage sponsors, and review or revoke granted access." />
      {sharedError && <Alert severity="error" sx={{ mb: 3 }}>{sharedError}</Alert>}
      <Stack spacing={3}>
        <AccessOptionsCard
          courses={courses}
          classes={classes}
          selectedTarget={selectedTarget}
          allowedTargets={sponsorPaidTargets}
          reason={reason}
          note={note}
          expiresAt={expiresAt}
          sponsorId={sponsorId}
          onTargetChange={setSelectedTarget}
          onReasonChange={(value) => { setReason(value); if (value !== 'Sponsored') setSponsorId('') }}
          onNoteChange={setNote}
          onExpiresAtChange={setExpiresAt}
          onSponsorIdChange={setSponsorId}
        />
        <SingleGrantCard buildOptions={buildOptions} />
        <BulkImportCard buildOptions={buildOptions} />
        <GrantsCard />
        <SponsorsCard courses={courses} classes={classes} />
      </Stack>
    </Box>
  )
}

const AccessOptionsCard: FC<{
  courses: ItemOption[]
  classes: ItemOption[]
  selectedTarget: string
  allowedTargets: string[] | null
  reason: AccessGrantReason
  note: string
  expiresAt: string
  sponsorId: string
  onTargetChange: (value: string) => void
  onReasonChange: (value: AccessGrantReason) => void
  onNoteChange: (value: string) => void
  onExpiresAtChange: (value: string) => void
  onSponsorIdChange: (value: string) => void
}> = (props) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  useEffect(() => {
    getSponsors().then(setSponsors).catch(() => setSponsors([]))
  }, [])
  const selectedSponsorEndDate = sponsors.find((sponsor) => String(sponsor.id) === props.sponsorId)?.endDate ?? undefined
  const handleSponsorChange = (value: string) => {
    props.onSponsorIdChange(value)
    const endDate = sponsors.find((sponsor) => String(sponsor.id) === value)?.endDate
    if (endDate) props.onExpiresAtChange(endDate)
  }
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Access details</Typography>
        <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <CourseClassSelect id="access-target" value={props.selectedTarget} courses={props.courses} classes={props.classes} onChange={props.onTargetChange} allowedKeys={props.reason === 'Sponsored' && props.sponsorId ? props.allowedTargets : null} />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="access-reason">Reason</InputLabel>
            <Select labelId="access-reason" label="Reason" value={props.reason} onChange={(event) => props.onReasonChange(event.target.value as AccessGrantReason)}>
              {reasons.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Access ends (optional)"
            type="date"
            value={props.expiresAt}
            onChange={(event) => props.onExpiresAtChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: selectedSponsorEndDate }}
            helperText={selectedSponsorEndDate ? `Cannot be later than the sponsorship end date (${selectedSponsorEndDate}).` : undefined}
          />
          <FormControl sx={{ minWidth: 200 }} disabled={props.reason !== 'Sponsored'}>
            <InputLabel id="access-sponsor">Sponsor</InputLabel>
            <Select labelId="access-sponsor" label="Sponsor" value={props.sponsorId} onChange={(event) => handleSponsorChange(String(event.target.value))}>
              <MenuItem value="">None</MenuItem>
              {sponsors.map((sponsor) => <MenuItem key={sponsor.id} value={String(sponsor.id)}>{sponsor.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Note (required)" value={props.note} onChange={(event) => props.onNoteChange(event.target.value)} sx={{ flex: 1, minWidth: 240 }} inputProps={{ maxLength: 500 }} />
        </Stack>
      </CardContent>
    </Card>
  )
}

const formatExpiry = (iso?: string) => iso ? new Date(iso).toLocaleString() : ''

const downloadOneTimeCredentialsText = (credentials: { name: string; username: string; temporaryPassword: string; oneTimePasswordExpiresAt?: string }) => {
  const content = [
    'Student access credentials',
    '',
    `Student: ${credentials.name}`,
    `Username: ${credentials.username}`,
    `One-time password: ${credentials.temporaryPassword}`,
    `Expires: ${formatExpiry(credentials.oneTimePasswordExpiresAt)}`,
    '',
    'This password is shown only once and expires. The student must set a new password at first sign-in.',
    '',
  ].join('\r\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `access-credentials-${credentials.username}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

const CredentialNotice: FC<{ setPasswordPath?: string }> = ({ setPasswordPath }) => {
  if (!setPasswordPath) return null
  const fullLink = `${window.location.origin}${setPasswordPath}`
  return (
    <Alert severity="warning" sx={{ mt: 2 }}>
      <Typography variant="body2">
        No email service is connected to this app, so this set-password link was not emailed. Share it with the student yourself. It is single-use and expires in 72 hours: <strong style={{ wordBreak: 'break-all' }}>{fullLink}</strong>
      </Typography>
    </Alert>
  )
}

const SingleGrantCard: FC<{ buildOptions: () => AccessGrantOptions | null }> = ({ buildOptions }) => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [grade, setGrade] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [result, setResult] = useState<AccessGrantResult | null>(null)
  const [credentialNoticeOpen, setCredentialNoticeOpen] = useState(false)

  const submit = async (override: boolean) => {
    const options = buildOptions()
    if (!options) return
    if (!name.trim()) return setError('Enter the student name.')
    setIsSaving(true)
    setError(null)
    setResult(null)
    setCredentialNoticeOpen(false)
    try {
      const outcome = await grantAccess({ ...options, email: email.trim() || undefined, name: name.trim(), phone: phone.trim(), grade: grade.trim(), override })
      setResult(outcome)
      setWarnings([])
      if (outcome.status === 'granted') {
        if (outcome.username && outcome.temporaryPassword) {
          downloadOneTimeCredentialsText({ name: name.trim(), username: outcome.username, temporaryPassword: outcome.temporaryPassword, oneTimePasswordExpiresAt: outcome.oneTimePasswordExpiresAt })
          setCredentialNoticeOpen(true)
        }
        setEmail('')
        setName('')
        setPhone('')
        setGrade('')
      }
    } catch (grantError) {
      if (grantError instanceof AccessWarningError) setWarnings(grantError.warnings)
      else setError(errorText(grantError))
    } finally {
      setIsSaving(false)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit(false)
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Grant one student</Typography>
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField label="Student name" value={name} onChange={(event) => setName(event.target.value)} required sx={{ minWidth: 220 }} />
            <TextField label="Student email (optional)" type="email" value={email} onChange={(event) => setEmail(event.target.value)} sx={{ minWidth: 240 }} helperText="Leave empty to create a username account" />
            <TextField label="Phone (optional)" value={phone} onChange={(event) => setPhone(event.target.value)} sx={{ minWidth: 160 }} />
            <TextField label="Grade (optional)" value={grade} onChange={(event) => setGrade(event.target.value)} sx={{ minWidth: 120 }} />
            <Button type="submit" variant="contained" disabled={isSaving}>{isSaving ? 'Granting...' : 'Grant access'}</Button>
          </Stack>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {warnings.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }} action={<Button color="inherit" size="small" onClick={() => void submit(true)} disabled={isSaving}>Grant anyway</Button>}>
            This course or class is not open for enrollment ({warnings.join(', ')}). Grant access anyway?
          </Alert>
        )}
        {result?.status === 'skipped' && <Alert severity="info" sx={{ mt: 2 }}>{result.message ?? 'This student already has access.'}</Alert>}
        {result?.status === 'granted' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Access granted.{result.classStatus === 'waitlisted' ? ' The class is full, so the student is waitlisted and has no meeting link yet.' : ''}
          </Alert>
        )}
        {result?.status === 'granted' && <CredentialNotice setPasswordPath={result.setPasswordPath} />}
        <Snackbar
          open={credentialNoticeOpen}
          onClose={(_event, reason) => { if (reason !== 'clickaway') setCredentialNoticeOpen(false) }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="warning" variant="filled" onClose={() => setCredentialNoticeOpen(false)} sx={{ maxWidth: 560 }}>
            Username <strong>{result?.username}</strong> and one-time password <strong>{result?.temporaryPassword}</strong>. This password is shown only once and expires {formatExpiry(result?.oneTimePasswordExpiresAt)}. The student must set a new password at first sign-in. A text file with these credentials was downloaded.
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  )
}

const accessImportTemplateCsv = 'name,email,guardian_email,phone,grade\r\n'

const BulkImportCard: FC<{ buildOptions: () => AccessGrantOptions | null }> = ({ buildOptions }) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<AccessImportPreview | null>(null)
  const [results, setResults] = useState<AccessImportResult[] | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [credentialRows, setCredentialRows] = useState<AccessCredentialRow[]>([])
  const [credentialsDownloaded, setCredentialsDownloaded] = useState(false)

  const downloadTemplate = () => {
    const blob = new Blob(['\uFEFF', accessImportTemplateCsv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'access-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadCredentials = () => {
    const blob = new Blob(['\uFEFF', buildAccessCredentialsCsv(credentialRows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'access-credentials.csv'
    link.click()
    URL.revokeObjectURL(url)
    setCredentialRows([])
    setCredentialsDownloaded(true)
  }

  const chooseFile = (selected: File | null) => {
    setError(null)
    setResults(null)
    setPreview(null)
    setWarnings([])
    if (selected && selected.size > maxCsvBytes) {
      setFile(null)
      setError('The CSV file must be 1 MB or smaller.')
      return
    }
    setFile(selected)
  }

  const runPreview = async () => {
    if (!file) return setError('Choose a CSV file first.')
    const options = buildOptions()
    if (!options) return
    setIsBusy(true)
    setError(null)
    setResults(null)
    try {
      setPreview(await previewAccessImport(await file.text(), options))
    } catch (previewError) {
      setError(errorText(previewError))
    } finally {
      setIsBusy(false)
    }
  }

  const apply = async (override: boolean) => {
    if (!preview) return
    setIsBusy(true)
    setError(null)
    try {
      const outcome = await confirmAccessImport(preview.batchId, override)
      const newCredentials = outcome.results.flatMap((result): AccessCredentialRow[] => result.username && result.temporaryPassword
        ? [{ name: result.name, username: result.username, temporaryPassword: result.temporaryPassword, expiresAt: result.oneTimePasswordExpiresAt ?? '' }]
        : [])
      if (newCredentials.length > 0) {
        setCredentialRows((previous) => [...previous, ...newCredentials])
        setCredentialsDownloaded(false)
      }
      setResults(outcome.results)
      setPreview(null)
      setWarnings([])
      setFile(null)
    } catch (applyError) {
      if (applyError instanceof AccessWarningError) setWarnings(applyError.warnings)
      else setError(errorText(applyError))
    } finally {
      setIsBusy(false)
    }
  }

  const cancel = async () => {
    if (!preview) return
    await cancelAccessImport(preview.batchId).catch(() => undefined)
    setPreview(null)
    setWarnings([])
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Bulk add from CSV</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Columns: name, email or guardian email, phone, grade. Files up to 1 MB. Nothing is created until you confirm the preview.
        </Typography>
        <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} useFlexGap sx={{ alignItems: { md: 'center' }, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={downloadTemplate}>Download template</Button>
          <Button component="label" variant="outlined">
            {file ? file.name : 'Choose CSV file'}
            <input hidden type="file" accept=".csv,text/csv" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
          </Button>
          <Button variant="contained" onClick={() => void runPreview()} disabled={isBusy || !file}>Preview</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {preview && (
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
              {(['new', 'existing', 'duplicate', 'invalid', 'overflow'] as const).map((status) => (
                <Chip key={status} label={`${status}: ${preview.summary[status]}`} color={status === 'new' ? 'success' : status === 'existing' ? 'info' : 'warning'} variant="outlined" />
              ))}
            </Stack>
            {preview.targetIssues.length > 0 && <Alert severity="warning" sx={{ mb: 2 }}>This course or class is not open ({preview.targetIssues.join(', ')}). Applying requires confirmation.</Alert>}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preview.rows.map((row) => (
                  <TableRow key={row.row}>
                    <TableCell>{row.row}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {warnings.length > 0 && <Alert severity="warning" sx={{ mt: 2 }}>Warnings: {warnings.join(', ')}</Alert>}
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => void apply(warnings.length > 0)} disabled={isBusy || (preview.summary.new + preview.summary.existing === 0)}>
                {warnings.length > 0 ? 'Apply anyway' : 'Confirm and apply'}
              </Button>
              <Button onClick={() => void cancel()} disabled={isBusy}>Cancel</Button>
            </Stack>
          </Box>
        )}
        {results && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Import results</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Outcome</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.row}>
                    <TableCell>{result.row}</TableCell>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.outcome}</TableCell>
                    <TableCell>
                      {result.message ?? (result.username ? `Username ${result.username}. The one-time password is in the credentials file.` : result.setPasswordPath ? `Set-password link, not emailed (no email service is connected): ${window.location.origin}${result.setPasswordPath}` : '')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        {credentialRows.length > 0 && (
          <Alert severity="warning" sx={{ mt: 3 }} action={<Button color="inherit" size="small" onClick={downloadCredentials}>Download</Button>}>
            {credentialRows.length} username {credentialRows.length === 1 ? 'account needs' : 'accounts need'} a one-time password. Passwords are stored only as hashes, so this file is the only copy and can be downloaded once.
          </Alert>
        )}
        {credentialRows.length === 0 && credentialsDownloaded && (
          <Alert severity="info" sx={{ mt: 3 }}>The credentials file was downloaded. Use New password in Granted access to issue a new one if needed.</Alert>
        )}
      </CardContent>
    </Card>
  )
}

const GrantsCard: FC = () => {
  const [grants, setGrants] = useState<AccessGrantRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [resettingUserId, setResettingUserId] = useState<number | null>(null)
  const [issuedPassword, setIssuedPassword] = useState<OneTimePasswordReset | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const currentPage = Math.min(page, Math.max(0, Math.ceil(grants.length / rowsPerPage) - 1))
  const visibleGrants = grants.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage)

  const load = () => getAccessGrants().then(setGrants).catch((loadError) => setError(errorText(loadError)))
  useEffect(() => {
    void load()
  }, [])

  const revoke = async (grant: AccessGrantRecord) => {
    if (!window.confirm(`Revoke access to ${grant.item} for ${grant.studentName}? This takes effect immediately.`)) return
    try {
      await revokeAccessGrant(grant.id)
      await load()
    } catch (revokeError) {
      setError(errorText(revokeError))
    }
  }

  const issueNewPassword = async (grant: AccessGrantRecord) => {
    if (!window.confirm(`Issue a new one-time password for ${grant.studentName}? Their current password and active sessions stop working.`)) return
    setResettingUserId(grant.userId)
    setError(null)
    try {
      setIssuedPassword(await resetStudentOneTimePassword(grant.userId))
    } catch (resetError) {
      setError(errorText(resetError))
    } finally {
      setResettingUserId(null)
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Granted access</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Seat</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Access</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grants.length === 0 && <TableRow><TableCell colSpan={8}>No granted access yet.</TableCell></TableRow>}
              {visibleGrants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell>{grant.studentName}<br /><Typography variant="caption" color="text.secondary">{grant.email}</Typography></TableCell>
                  <TableCell>{grant.item}</TableCell>
                  <TableCell>{grant.source === 'sponsored' ? `Sponsored${grant.sponsorName ? ` (${grant.sponsorName})` : ''}` : 'Free grant'}</TableCell>
                  <TableCell>{grant.grantReason}</TableCell>
                  <TableCell>{grant.classStatus ?? 'Course'}</TableCell>
                  <TableCell>{grant.expiresAt ?? 'No expiry'}</TableCell>
                  <TableCell>{grant.accessStatus}</TableCell>
                  <TableCell align="right">
                    {grant.usernameAccount && <Button size="small" disabled={resettingUserId === grant.userId} onClick={() => void issueNewPassword(grant)}>New password</Button>}
                    {grant.accessStatus === 'active' && <Button color="error" size="small" onClick={() => void revoke(grant)}>Revoke</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          component="div"
          count={grants.length}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0) }}
        />
      </CardContent>
      <Dialog open={issuedPassword !== null} onClose={() => setIssuedPassword(null)} maxWidth="xs" fullWidth>
        <DialogTitle>New one-time password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>Username <strong>{issuedPassword?.username}</strong></Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>One-time password <strong>{issuedPassword?.temporaryPassword}</strong></Typography>
          <Typography variant="body2" color="text.secondary">Shown only once. Expires {formatExpiry(issuedPassword?.oneTimePasswordExpiresAt)}. The student must set a new password at first sign-in.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssuedPassword(null)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

const emptySponsorForm = { name: '', contact: '', notes: '', seatLimit: '', endDate: '' }

const invoiceFileTypes = ['application/pdf', 'image/png', 'image/jpeg']
const maxInvoiceFileBytes = 5 * 1024 * 1024
const invoiceFileError = (file: File) => invoiceFileTypes.includes(file.type) && file.size <= maxInvoiceFileBytes ? null : 'Choose a PDF, PNG, or JPEG invoice of 5 MB or smaller.'
const emptyPaymentForm = { amount: '', reference: '', target: '', invoice: null as File | null }

const SponsorsCard: FC<{ courses: ItemOption[]; classes: ItemOption[] }> = ({ courses, classes }) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [form, setForm] = useState(emptySponsorForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<SponsorReport | null>(null)
  const [paymentSponsor, setPaymentSponsor] = useState<Sponsor | null>(null)
  const [payments, setPayments] = useState<SponsorPayment[]>([])
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const currentPage = Math.min(page, Math.max(0, Math.ceil(sponsors.length / rowsPerPage) - 1))
  const visibleSponsors = sponsors.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage)
  const todayTime = Date.parse(new Date().toISOString().slice(0, 10))
  const expiringSponsors = sponsors.filter((sponsor) => {
    if (!sponsor.endDate) return false
    const daysLeft = (Date.parse(sponsor.endDate) - todayTime) / 86_400_000
    return daysLeft > 0 && daysLeft <= 30
  })

  const load = () => getSponsors().then(setSponsors).catch((loadError) => setError(errorText(loadError)))
  useEffect(() => {
    void load()
  }, [])

  const edit = (sponsor: Sponsor) => {
    setEditingId(sponsor.id)
    setForm({ name: sponsor.name, contact: sponsor.contact, notes: sponsor.notes, seatLimit: sponsor.seatLimit === null ? '' : String(sponsor.seatLimit), endDate: sponsor.endDate ?? '' })
  }

  const reset = () => {
    setEditingId(null)
    setForm(emptySponsorForm)
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input: SponsorInput = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      notes: form.notes.trim(),
      seatLimit: form.seatLimit === '' ? null : Number(form.seatLimit),
      endDate: form.endDate || null,
    }
    try {
      await saveSponsor(editingId, input)
      reset()
      await load()
    } catch (saveError) {
      setError(errorText(saveError))
    }
  }

  const remove = async (sponsor: Sponsor) => {
    if (!window.confirm(`Delete sponsor ${sponsor.name}?`)) return
    try {
      await deleteSponsor(sponsor.id)
      await load()
    } catch (deleteError) {
      setError(errorText(deleteError))
    }
  }

  const openReport = async (sponsor: Sponsor) => {
    try {
      setReport(await getSponsorReport(sponsor.id))
    } catch (reportError) {
      setError(errorText(reportError))
    }
  }

  const loadPayments = async (sponsorId: number) => setPayments(await getSponsorPayments(sponsorId))

  const openPayments = async (sponsor: Sponsor) => {
    setPaymentSponsor(sponsor)
    setPaymentError(null)
    try {
      await loadPayments(sponsor.id)
    } catch (loadError) {
      setPaymentError(errorText(loadError))
    }
  }

  const recordPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!paymentSponsor) return
    const form = event.currentTarget
    const invoice = paymentForm.invoice
    const target = parseTargetKey(paymentForm.target)
    const fileError = invoice ? invoiceFileError(invoice) : null
    if (!target) return setPaymentError('Choose a course or class.')
    if (fileError) return setPaymentError(fileError)
    let paymentId: number
    try {
      paymentId = await recordSponsorPayment(paymentSponsor.id, {
        amountCents: Math.round(Number(paymentForm.amount) * 100),
        reference: paymentForm.reference.trim(),
        courseId: target.type === 'course' ? target.id : null,
        classId: target.type === 'class' ? target.id : null
      })
    } catch (saveError) {
      return setPaymentError(errorText(saveError))
    }
    setPaymentForm(emptyPaymentForm)
    form.reset()
    setPaymentError(null)
    try {
      if (invoice) await uploadSponsorPaymentInvoice(paymentId, invoice)
    } catch (uploadError) {
      setPaymentError(`Payment recorded, but the invoice was not saved: ${errorText(uploadError)}`)
    }
    await loadPayments(paymentSponsor.id)
    await load()
  }

  const attachInvoice = async (payment: SponsorPayment, file: File) => {
    if (!paymentSponsor) return
    const fileError = invoiceFileError(file)
    if (fileError) return setPaymentError(fileError)
    try {
      await uploadSponsorPaymentInvoice(payment.id, file)
      setPaymentError(null)
      await loadPayments(paymentSponsor.id)
    } catch (uploadError) {
      setPaymentError(errorText(uploadError))
    }
  }

  const markPaid = async (payment: SponsorPayment) => {
    if (!paymentSponsor) return
    try {
      await markSponsorPaymentPaid(payment.id)
      await loadPayments(paymentSponsor.id)
      await load()
    } catch (markError) {
      setPaymentError(errorText(markError))
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Sponsors</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={save}>
          <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} useFlexGap sx={{ flexWrap: 'wrap', mb: 3 }}>
            <TextField label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <TextField label="Contact" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} />
            <TextField label="Seat limit (optional)" type="number" value={form.seatLimit} onChange={(event) => setForm({ ...form, seatLimit: event.target.value })} inputProps={{ min: 0, step: 1 }} />
            <TextField label="Sponsorship ends (optional)" type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} InputLabelProps={{ shrink: true }} helperText="Students lose access on this date unless extended." />
            <TextField label="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} sx={{ flex: 1, minWidth: 200 }} />
            <Button type="submit" variant="contained">{editingId === null ? 'Add sponsor' : 'Save sponsor'}</Button>
            {editingId !== null && <Button onClick={reset}>Cancel</Button>}
          </Stack>
        </Box>
        {expiringSponsors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {expiringSponsors.map((sponsor) => (
              <Box key={sponsor.id}>
                {sponsor.name} ends {sponsor.endDate}. {sponsor.seatsUsed} {sponsor.seatsUsed === 1 ? 'student' : 'students'} will lose access unless the sponsorship is extended.
              </Box>
            ))}
          </Alert>
        )}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Seats used</TableCell>
                <TableCell>Seats remaining</TableCell>
                <TableCell>Sponsorship ends</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sponsors.length === 0 && <TableRow><TableCell colSpan={6}>No sponsors yet.</TableCell></TableRow>}
              {visibleSponsors.map((sponsor) => (
                <TableRow key={sponsor.id}>
                  <TableCell>{sponsor.name}</TableCell>
                  <TableCell>{sponsor.contact}</TableCell>
                  <TableCell>{sponsor.seatsUsed}{sponsor.seatLimit === null ? '' : ` / ${sponsor.seatLimit}`}</TableCell>
                  <TableCell>{sponsor.seatsRemaining ?? 'Unlimited'}</TableCell>
                  <TableCell>{sponsor.endDate ?? 'No end date'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => void openPayments(sponsor)}>Payments</Button>
                    <Button size="small" onClick={() => void openReport(sponsor)}>Report</Button>
                    <Button size="small" onClick={() => edit(sponsor)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => void remove(sponsor)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          component="div"
          count={sponsors.length}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0) }}
        />
      </CardContent>
      <Dialog open={report !== null} onClose={() => setReport(null)} maxWidth="lg" fullWidth>
        <DialogTitle>{report?.sponsor.name} report</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Access</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Live attendance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report?.students.length === 0 && <TableRow><TableCell colSpan={5}>No sponsored students yet.</TableCell></TableRow>}
              {report?.students.map((row) => (
                <TableRow key={row.enrollmentId}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.item}</TableCell>
                  <TableCell>{row.accessStatus}</TableCell>
                  <TableCell>{row.progressPercentage}%</TableCell>
                  <TableCell>{row.liveSessionsAttended} / {row.liveSessionsTotal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          {report && <Button component="a" href={`/api/admin/sponsors/${report.sponsor.id}/report.csv`}>Download CSV</Button>}
          <Button onClick={() => setReport(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={paymentSponsor !== null} onClose={() => setPaymentSponsor(null)} maxWidth="md" fullWidth>
        <DialogTitle>{paymentSponsor?.name} payments</DialogTitle>
        <DialogContent>
          {paymentError && <Alert severity="error" sx={{ mb: 2 }}>{paymentError}</Alert>}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Paid on</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 && <TableRow><TableCell colSpan={7}>No payments recorded yet.</TableCell></TableRow>}
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.item ?? 'Not linked'}</TableCell>
                  <TableCell>${(payment.amountCents / 100).toFixed(2)}</TableCell>
                  <TableCell>{payment.reference || '-'}</TableCell>
                  <TableCell>{payment.hasInvoice ? <Button size="small" component="a" href={`/api/admin/sponsor-payments/${payment.id}/invoice`}>{payment.invoiceName}</Button> : 'None'}</TableCell>
                  <TableCell>{payment.status === 'paid' ? 'Paid' : 'Pending'}</TableCell>
                  <TableCell>{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell align="right">
                    {payment.status === 'pending' && (
                      <>
                        <Button size="small" component="label">
                          {payment.hasInvoice ? 'Replace invoice' : 'Attach invoice'}
                          <input hidden type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => {
                            const file = event.target.files?.[0]
                            event.target.value = ''
                            if (file) void attachInvoice(payment, file)
                          }} />
                        </Button>
                        <Button size="small" disabled={!payment.hasInvoice} onClick={() => void markPaid(payment)}>Mark paid</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box component="form" onSubmit={recordPayment} sx={{ mt: 3 }}>
            <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <CourseClassSelect id="sponsor-payment-target" required value={paymentForm.target} courses={courses} classes={classes} onChange={(value) => setPaymentForm({ ...paymentForm, target: value, amount: priceForTarget(value, courses, classes) })} />
              <TextField label="Amount ($)" type="number" value={paymentForm.amount} InputProps={{ readOnly: true }} helperText="Set to the selected course or class price" required />
              <TextField label="Reference (optional)" value={paymentForm.reference} onChange={(event) => setPaymentForm({ ...paymentForm, reference: event.target.value })} inputProps={{ maxLength: 200 }} />
              <Button component="label" variant="outlined">
                {paymentForm.invoice ? paymentForm.invoice.name : 'Choose paid invoice (optional)'}
                <input hidden type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setPaymentForm({ ...paymentForm, invoice: event.target.files?.[0] ?? null })} />
              </Button>
              <Button type="submit" variant="contained" disabled={!paymentForm.target}>Record payment</Button>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentSponsor(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default AccessPage
