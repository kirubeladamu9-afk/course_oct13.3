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
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
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
  getSponsorReport,
  getSponsors,
  grantAccess,
  previewAccessImport,
  revokeAccessGrant,
  saveSponsor,
  type AccessGrantOptions,
  type AccessGrantRecord,
  type AccessGrantReason,
  type AccessGrantResult,
  type AccessImportPreview,
  type AccessImportResult,
  type AccessTarget,
  type Sponsor,
  type SponsorInput,
  type SponsorReport,
} from '@/services/api'

const reasons: AccessGrantReason[] = ['Scholarship', 'Staff', 'Promotion', 'Sponsored', 'Other']
const maxCsvBytes = 1024 * 1024

type TargetType = 'course' | 'class'
type ItemOption = { id: number; title: string }

const PageHeading: FC<{ title: string; description: string }> = ({ title, description }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 800 }}>{title}</Typography>
    <Typography color="text.secondary">{description}</Typography>
  </Box>
)

const buildTarget = (type: TargetType, id: string): AccessTarget | null => {
  const numeric = Number(id)
  if (!id || !Number.isInteger(numeric) || numeric <= 0) return null
  return type === 'course' ? { courseId: numeric } : { classId: numeric }
}

const errorText = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong.'

const AccessPage: FC = () => {
  const [courses, setCourses] = useState<ItemOption[]>([])
  const [classes, setClasses] = useState<ItemOption[]>([])
  const [targetType, setTargetType] = useState<TargetType>('course')
  const [targetId, setTargetId] = useState('')
  const [reason, setReason] = useState<AccessGrantReason>('Scholarship')
  const [note, setNote] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [sponsorId, setSponsorId] = useState('')
  const [sharedError, setSharedError] = useState<string | null>(null)

  useEffect(() => {
    getAdminCourseOptions().then(setCourses).catch(() => setSharedError('Unable to load courses.'))
    getAdminClassesWorkspace().then((workspace) => setClasses(workspace.classes.map((item) => ({ id: item.id, title: item.title })))).catch(() => setSharedError('Unable to load classes.'))
  }, [])

  const buildOptions = (): AccessGrantOptions | null => {
    const target = buildTarget(targetType, targetId)
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
    if (reason !== 'Sponsored' && sponsorId) {
      setSharedError('Sponsors can only be used with the Sponsored reason.')
      return null
    }
    setSharedError(null)
    return {
      ...target,
      reason,
      note: note.trim(),
      expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : undefined,
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
          targetType={targetType}
          targetId={targetId}
          reason={reason}
          note={note}
          expiresAt={expiresAt}
          sponsorId={sponsorId}
          onTargetTypeChange={(value) => { setTargetType(value); setTargetId('') }}
          onTargetIdChange={setTargetId}
          onReasonChange={setReason}
          onNoteChange={setNote}
          onExpiresAtChange={setExpiresAt}
          onSponsorIdChange={setSponsorId}
        />
        <SingleGrantCard buildOptions={buildOptions} />
        <BulkImportCard buildOptions={buildOptions} />
        <GrantsCard />
        <SponsorsCard />
      </Stack>
    </Box>
  )
}

const AccessOptionsCard: FC<{
  courses: ItemOption[]
  classes: ItemOption[]
  targetType: TargetType
  targetId: string
  reason: AccessGrantReason
  note: string
  expiresAt: string
  sponsorId: string
  onTargetTypeChange: (value: TargetType) => void
  onTargetIdChange: (value: string) => void
  onReasonChange: (value: AccessGrantReason) => void
  onNoteChange: (value: string) => void
  onExpiresAtChange: (value: string) => void
  onSponsorIdChange: (value: string) => void
}> = (props) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  useEffect(() => {
    getSponsors().then(setSponsors).catch(() => setSponsors([]))
  }, [])
  const items = props.targetType === 'course' ? props.courses : props.classes
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Access details</Typography>
        <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="access-target-type">Item type</InputLabel>
            <Select labelId="access-target-type" label="Item type" value={props.targetType} onChange={(event) => props.onTargetTypeChange(event.target.value as TargetType)}>
              <MenuItem value="course">Course</MenuItem>
              <MenuItem value="class">Class</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 280, flex: 1 }}>
            <InputLabel id="access-target-item">Course or class</InputLabel>
            <Select labelId="access-target-item" label="Course or class" value={props.targetId} onChange={(event) => props.onTargetIdChange(String(event.target.value))}>
              {items.map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.title}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="access-reason">Reason</InputLabel>
            <Select labelId="access-reason" label="Reason" value={props.reason} onChange={(event) => props.onReasonChange(event.target.value as AccessGrantReason)}>
              {reasons.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Expires on (optional)" type="date" value={props.expiresAt} onChange={(event) => props.onExpiresAtChange(event.target.value)} InputLabelProps={{ shrink: true }} />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="access-sponsor">Sponsor</InputLabel>
            <Select labelId="access-sponsor" label="Sponsor" value={props.sponsorId} onChange={(event) => props.onSponsorIdChange(String(event.target.value))}>
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

const CredentialNotice: FC<{ username?: string; temporaryPassword?: string; setPasswordPath?: string }> = ({ username, temporaryPassword, setPasswordPath }) => {
  if (!username && !setPasswordPath) return null
  const fullLink = setPasswordPath ? `${window.location.origin}${setPasswordPath}` : ''
  return (
    <Alert severity="warning" sx={{ mt: 2 }}>
      {username && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          Username <strong>{username}</strong> and temporary password <strong>{temporaryPassword}</strong>. This password is shown only once. The student must change it at first sign-in.
        </Typography>
      )}
      {fullLink && (
        <Typography variant="body2">
          Send this single-use link to the student within 72 hours: <strong style={{ wordBreak: 'break-all' }}>{fullLink}</strong>
        </Typography>
      )}
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

  const submit = async (override: boolean) => {
    const options = buildOptions()
    if (!options) return
    if (!name.trim()) return setError('Enter the student name.')
    setIsSaving(true)
    setError(null)
    setResult(null)
    try {
      const outcome = await grantAccess({ ...options, email: email.trim() || undefined, name: name.trim(), phone: phone.trim(), grade: grade.trim(), override })
      setResult(outcome)
      setWarnings([])
      if (outcome.status === 'granted') {
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
        {result?.status === 'granted' && <CredentialNotice username={result.username} temporaryPassword={result.temporaryPassword} setPasswordPath={result.setPasswordPath} />}
      </CardContent>
    </Card>
  )
}

const BulkImportCard: FC<{ buildOptions: () => AccessGrantOptions | null }> = ({ buildOptions }) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<AccessImportPreview | null>(null)
  const [results, setResults] = useState<AccessImportResult[] | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

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
                      {result.message ?? (result.username ? `Username ${result.username}, temporary password ${result.temporaryPassword} (shown once)` : result.setPasswordPath ? `${window.location.origin}${result.setPasswordPath}` : '')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

const GrantsCard: FC = () => {
  const [grants, setGrants] = useState<AccessGrantRecord[]>([])
  const [error, setError] = useState<string | null>(null)

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
              {grants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell>{grant.studentName}<br /><Typography variant="caption" color="text.secondary">{grant.email}</Typography></TableCell>
                  <TableCell>{grant.item}</TableCell>
                  <TableCell>{grant.source === 'sponsored' ? `Sponsored${grant.sponsorName ? ` (${grant.sponsorName})` : ''}` : 'Free grant'}</TableCell>
                  <TableCell>{grant.grantReason}</TableCell>
                  <TableCell>{grant.classStatus ?? 'Course'}</TableCell>
                  <TableCell>{grant.expiresAt ?? 'No expiry'}</TableCell>
                  <TableCell>{grant.accessStatus}</TableCell>
                  <TableCell align="right">
                    {grant.accessStatus === 'active' && <Button color="error" size="small" onClick={() => void revoke(grant)}>Revoke</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  )
}

const emptySponsorForm = { name: '', contact: '', notes: '', seatLimit: '', endDate: '' }

const SponsorsCard: FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [form, setForm] = useState(emptySponsorForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<SponsorReport | null>(null)

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
            <TextField label="Agreement ends (optional)" type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} sx={{ flex: 1, minWidth: 200 }} />
            <Button type="submit" variant="contained">{editingId === null ? 'Add sponsor' : 'Save sponsor'}</Button>
            {editingId !== null && <Button onClick={reset}>Cancel</Button>}
          </Stack>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Seats used</TableCell>
                <TableCell>Seats remaining</TableCell>
                <TableCell>Ends</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sponsors.length === 0 && <TableRow><TableCell colSpan={6}>No sponsors yet.</TableCell></TableRow>}
              {sponsors.map((sponsor) => (
                <TableRow key={sponsor.id}>
                  <TableCell>{sponsor.name}</TableCell>
                  <TableCell>{sponsor.contact}</TableCell>
                  <TableCell>{sponsor.seatsUsed}{sponsor.seatLimit === null ? '' : ` / ${sponsor.seatLimit}`}</TableCell>
                  <TableCell>{sponsor.seatsRemaining ?? 'Unlimited'}</TableCell>
                  <TableCell>{sponsor.endDate ?? 'Open'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => void openReport(sponsor)}>Report</Button>
                    <Button size="small" onClick={() => edit(sponsor)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => void remove(sponsor)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
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
    </Card>
  )
}

export default AccessPage
