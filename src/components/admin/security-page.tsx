import { useEffect, useMemo, useState, type FC } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AdminDataTable, { type DataColumn } from './admin-data-table'
import { forceLogoutUser, forcePasswordReset, getAdminSecurity, revokeAdminSession, setAdminAccountLock, type AdminSecurityData } from '@/services/api'

type SecurityView = 'logins' | 'sessions' | 'accounts' | 'alerts' | 'audit'
type SecurityTableRow = {
  id: string
  kind: SecurityView
  activity: string
  account: string
  email: string
  details: string
  status: string
  role: string
  location: string
  clientIp: string
  occurredAt: string
  sessionId?: string
  userId?: number
  accountLocked?: boolean
}

const dateText = (value: string) => value ? new Date(value).toLocaleString() : '—'
const locationText = (city: string | null, country: string | null) => [city, country].filter(Boolean).join(', ') || 'Unavailable'
const stateText = (value: unknown) => value === null || value === undefined ? '—' : typeof value === 'string' ? value : JSON.stringify(value)
const viewLabels: Record<SecurityView, string> = { logins: 'Login history', sessions: 'Active sessions', accounts: 'Accounts', alerts: 'Security alerts', audit: 'Audit history' }

const SecurityPage: FC = () => {
  const [data, setData] = useState<AdminSecurityData | null>(null)
  const [view, setView] = useState<SecurityView>('logins')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = async () => {
    setLoading(true)
    try { setData(await getAdminSecurity()); setError(null) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load security data.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void reload() }, [])

  const perform = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true)
    try { await action(); await reload(); setError(null) }
    catch (reason) { setError(reason instanceof Error ? reason.message : successMessage) }
    finally { setBusy(false) }
  }

  const rows = useMemo<SecurityTableRow[]>(() => {
    if (!data) return []
    if (view === 'logins') return data.loginEvents.map((event) => ({
      id: `login-${event.id}`,
      kind: 'logins',
      activity: 'Sign-in',
      account: event.userName ?? 'Unknown account',
      email: event.email ?? '—',
      details: `${event.browser} · ${event.os} · ${event.deviceType} · ${event.reason.replace(/_/g, ' ')}`,
      status: event.succeeded ? 'Success' : 'Failed',
      role: '—',
      location: locationText(event.city ?? null, event.country ?? null),
      clientIp: event.clientIp,
      occurredAt: event.createdAt,
    }))
    if (view === 'sessions') return data.sessions.map((session) => ({
      id: session.id,
      kind: 'sessions',
      activity: 'Active session',
      account: session.userName,
      email: session.email,
      details: `${session.browser} · ${session.os} · ${session.deviceType}`,
      status: 'Active',
      role: session.role,
      location: locationText(session.city, session.country),
      clientIp: session.clientIp,
      occurredAt: session.lastActiveAt,
      sessionId: session.sessionId,
      userId: session.userId,
    }))
    if (view === 'accounts') return data.users.map((user) => ({
      id: `account-${user.id}`,
      kind: 'accounts',
      activity: 'Account',
      account: user.name,
      email: user.email,
      details: user.status,
      status: user.accountLocked ? 'Locked' : user.mustResetPassword ? 'Reset required' : 'Unlocked',
      role: user.role,
      location: '—',
      clientIp: '—',
      occurredAt: '—',
      userId: user.id,
      accountLocked: user.accountLocked,
    }))
    if (view === 'alerts') return data.alerts.map((alert) => ({
      id: `alert-${alert.id}`,
      kind: 'alerts',
      activity: alert.type.replace(/_/g, ' '),
      account: alert.userName ?? 'Unknown account',
      email: alert.email ?? '—',
      details: alert.message,
      status: 'Review',
      role: '—',
      location: locationText(String(alert.metadata?.city ?? '') || null, String(alert.metadata?.country ?? '') || null),
      clientIp: '—',
      occurredAt: alert.createdAt,
      userId: alert.userId,
    }))
    return data.auditLog.map((entry) => ({
      id: `audit-${entry.id}`,
      kind: 'audit',
      activity: entry.action.replace(/_/g, ' '),
      account: entry.targetName ?? 'Deleted account',
      email: '—',
      details: `Before: ${stateText(entry.beforeState)} · After: ${stateText(entry.afterState)}`,
      status: 'Recorded',
      role: '—',
      location: '—',
      clientIp: entry.clientIp,
      occurredAt: entry.createdAt,
    }))
  }, [data, view])

  const columns: DataColumn<SecurityTableRow>[] = [
    { key: 'activity', label: 'Activity' },
    { key: 'account', label: 'Account' },
    { key: 'email', label: 'Email' },
    { key: 'details', label: 'Details' },
    { key: 'status', label: 'Status', render: (value, row) => <Chip size="small" label={String(value)} color={row.status === 'Failed' || row.status === 'Locked' ? 'error' : row.status === 'Success' || row.status === 'Active' || row.status === 'Unlocked' ? 'success' : 'default'} /> },
    { key: 'role', label: 'Role' },
    { key: 'location', label: 'Approx. location' },
    { key: 'clientIp', label: 'IP' },
    { key: 'occurredAt', label: 'Time', render: (value) => dateText(String(value)) },
  ]

  const actions = (row: SecurityTableRow) => row.kind === 'sessions' && row.sessionId
    ? <Button size="small" color="error" disabled={busy} onClick={() => void perform(() => revokeAdminSession(row.sessionId as string), 'Session revoked.')}>Revoke</Button>
    : row.kind === 'accounts' && row.userId !== undefined
      ? <Stack direction="row" spacing={0.5} justifyContent="flex-end"><Button size="small" color={row.accountLocked ? 'success' : 'error'} disabled={busy} onClick={() => void perform(() => setAdminAccountLock(row.userId as number, !row.accountLocked), 'Account lock updated.')}>{row.accountLocked ? 'Unlock' : 'Lock'}</Button><Button size="small" disabled={busy} onClick={() => void perform(() => forceLogoutUser(row.userId as number), 'Sessions revoked.')}>Force logout</Button><Button size="small" disabled={busy} onClick={() => void perform(() => forcePasswordReset(row.userId as number), 'Password reset required.')}>Require reset</Button></Stack>
      : null

  return <>
    <Box sx={{ mb: 3 }}><Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>Security</Typography><Typography color="text.secondary">Review sign-ins, sessions, accounts, alerts, and administrator actions in one place.</Typography></Box>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading || !data ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading security data" /></Box> : <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
          <Box><Typography variant="h6" sx={{ fontWeight: 800 }}>{viewLabels[view]}</Typography><Typography variant="body2" color="text.secondary">{rows.length} records · Filter, sort, or change category.</Typography></Box>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}><Select value={view} inputProps={{ 'aria-label': 'Security category' }} onChange={(event) => setView(event.target.value as SecurityView)}>{Object.entries(viewLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl>
        </Stack>
      </Paper>
      <AdminDataTable rows={rows} columns={columns} searchPlaceholder={`Filter ${viewLabels[view].toLowerCase()}`} searchKeys={['activity', 'account', 'email', 'details', 'status', 'role', 'location', 'clientIp']} actions={actions} />
    </Stack>}
  </>
}

export default SecurityPage
