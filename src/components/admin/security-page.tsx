import { useEffect, useState, type FC } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AdminDataTable, { type DataColumn } from './admin-data-table'
import { forceLogoutUser, forcePasswordReset, getAdminSecurity, revokeAdminSession, setAdminAccountLock, type AdminSecurityData, type LoginEvent, type SecurityAlert, type SecuritySession } from '@/services/api'

type SecurityUser = AdminSecurityData['users'][number]
type AdminSession = AdminSecurityData['sessions'][number]
type AuditEntry = AdminSecurityData['auditLog'][number]

const dateText = (value: string) => new Date(value).toLocaleString()
const locationText = (city: string | null, country: string | null) => [city, country].filter(Boolean).join(', ') || 'Unavailable'

const SecurityPage: FC = () => {
  const [data, setData] = useState<AdminSecurityData | null>(null)
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

  const loginColumns: DataColumn<LoginEvent>[] = [
    { key: 'userName', label: 'Account' },
    { key: 'email', label: 'Email' },
    { key: 'succeeded', label: 'Result', render: (value) => <Chip size="small" label={value ? 'Success' : 'Failed'} color={value ? 'success' : 'error'} /> },
    { key: 'reason', label: 'Reason', render: (value) => String(value).replaceAll('_', ' ') },
    { key: 'browser', label: 'Device', render: (_, row) => `${row.browser} · ${row.os} · ${row.deviceType}` },
    { key: 'country', label: 'Approx. location', render: (_, row) => locationText(row.city ?? null, row.country ?? null) },
    { key: 'clientIp', label: 'IP' },
    { key: 'createdAt', label: 'Time', render: (value) => dateText(String(value)) },
  ]
  const sessionColumns: DataColumn<AdminSession>[] = [
    { key: 'userName', label: 'Account' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'browser', label: 'Device', render: (_, row) => `${row.browser} · ${row.os} · ${row.deviceType}` },
    { key: 'country', label: 'Approx. location', render: (_, row) => locationText(row.city ?? null, row.country ?? null) },
    { key: 'clientIp', label: 'IP' },
    { key: 'lastActiveAt', label: 'Last active', render: (value) => dateText(String(value)) },
  ]
  const accountColumns: DataColumn<SecurityUser>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status', render: (_, row) => <Stack direction="row" spacing={0.5}><Chip size="small" label={row.status} /><Chip size="small" label={row.accountLocked ? 'Locked' : 'Unlocked'} color={row.accountLocked ? 'error' : 'success'} /></Stack> },
  ]
  const alertColumns: DataColumn<SecurityAlert>[] = [
    { key: 'userName', label: 'Account' },
    { key: 'email', label: 'Email' },
    { key: 'type', label: 'Type', render: (value) => String(value).replaceAll('_', ' ') },
    { key: 'message', label: 'Alert' },
    { key: 'createdAt', label: 'Time', render: (value) => dateText(String(value)) },
  ]
  const auditColumns: DataColumn<AuditEntry>[] = [
    { key: 'actorName', label: 'Admin' },
    { key: 'action', label: 'Action', render: (value) => String(value).replaceAll('_', ' ') },
    { key: 'targetName', label: 'Account' },
    { key: 'clientIp', label: 'IP' },
    { key: 'createdAt', label: 'Time', render: (value) => dateText(String(value)) },
  ]

  return <>
    <Box sx={{ mb: 3 }}><Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>Security</Typography><Typography color="text.secondary">Review sign-ins, manage active sessions, and investigate security alerts.</Typography></Box>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading || !data ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading security data" /></Box> : <Stack spacing={3}>
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}><Box sx={{ p: 2 }}><Typography variant="h6" sx={{ fontWeight: 800 }}>Login history</Typography><Typography variant="body2" color="text.secondary">Successful and failed attempts, including approximate location.</Typography></Box><AdminDataTable rows={data.loginEvents} columns={loginColumns} searchPlaceholder="Filter login events" searchKeys={['userName', 'email', 'reason', 'clientIp', 'country', 'city', 'browser', 'os']} /></Paper>
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}><Box sx={{ p: 2 }}><Typography variant="h6" sx={{ fontWeight: 800 }}>Active sessions</Typography><Typography variant="body2" color="text.secondary">Session tokens are never displayed.</Typography></Box><AdminDataTable rows={data.sessions} columns={sessionColumns} searchPlaceholder="Filter sessions" searchKeys={['userName', 'email', 'role', 'clientIp', 'country', 'city', 'browser', 'os']} actions={(session) => <Button size="small" color="error" disabled={busy} onClick={() => void perform(() => revokeAdminSession(session.sessionId), 'Session revoked.')}>Revoke session</Button>} /></Paper>
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}><Box sx={{ p: 2 }}><Typography variant="h6" sx={{ fontWeight: 800 }}>Accounts</Typography><Typography variant="body2" color="text.secondary">Lock or unlock accounts, sign out all devices, or require a password reset.</Typography></Box><AdminDataTable rows={data.users} columns={accountColumns} searchPlaceholder="Filter accounts" searchKeys={['name', 'email', 'role', 'status']} actions={(user) => <Stack direction="row" spacing={0.5}><Button size="small" color={user.accountLocked ? 'success' : 'error'} disabled={busy} onClick={() => void perform(() => setAdminAccountLock(user.id, !user.accountLocked), 'Account lock updated.')}>{user.accountLocked ? 'Unlock' : 'Lock'}</Button><Button size="small" disabled={busy} onClick={() => void perform(() => forceLogoutUser(user.id), 'Sessions revoked.')}>Force logout</Button><Button size="small" disabled={busy} onClick={() => void perform(() => forcePasswordReset(user.id), 'Password reset required.')}>Require reset</Button></Stack>} /></Paper>
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}><Box sx={{ p: 2 }}><Typography variant="h6" sx={{ fontWeight: 800 }}>Security alerts</Typography></Box><AdminDataTable rows={data.alerts} columns={alertColumns} searchPlaceholder="Filter security alerts" searchKeys={['userName', 'email', 'type', 'message']} /></Paper>
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}><Box sx={{ p: 2 }}><Typography variant="h6" sx={{ fontWeight: 800 }}>Administrator audit log</Typography></Box><AdminDataTable rows={data.auditLog} columns={auditColumns} searchPlaceholder="Filter audit history" searchKeys={['actorName', 'targetName', 'action', 'clientIp']} /></Paper>
    </Stack>}
  </>
}

export default SecurityPage
