import { useEffect, useMemo, useState, type FC } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AdminDataTable, { type DataColumn } from './admin-data-table'
import { getAdminSecurity, revokeAdminSession, type AdminSecurityData } from '@/services/api'
import { SessionDetailValue, SessionDeviceValue } from '@/components/security/session-details'
import { describeBrowser, describeDevice, describeOs, notAvailableLabel, type SessionDetails } from '@/lib/security-sessions'

type SessionRow = {
  id: string
  account: string
  email: string
  nickname: string
  device: string
  browser: string
  os: string
  session: SessionDetails
  role: string
  location: string
  clientIp: string
  lastActiveAt: string
}

const dateText = (value: string) => value ? new Date(value).toLocaleString() : '—'
const locationText = (city: string | null, country: string | null) => [city, country].filter(Boolean).join(', ') || 'Unavailable'

const columns: DataColumn<SessionRow>[] = [
  { key: 'account', label: 'Account' },
  { key: 'email', label: 'Email', collapsible: true },
  { key: 'device', label: 'Device', collapsible: true, render: (_, row) => <SessionDeviceValue session={row.session} /> },
  { key: 'browser', label: 'Browser', collapsible: true, render: (_, row) => { const browser = describeBrowser(row.session); return <SessionDetailValue name={browser.name} detail={browser.version} /> } },
  { key: 'os', label: 'OS', collapsible: true, render: (_, row) => { const os = describeOs(row.session); return <SessionDetailValue name={os.name} detail={os.version} /> } },
  { key: 'role', label: 'Role', collapsible: true },
  { key: 'location', label: 'Approx. location', collapsible: true },
  { key: 'clientIp', label: 'IP', collapsible: true },
  { key: 'lastActiveAt', label: 'Last active', collapsible: true, render: (value) => dateText(String(value)) },
]

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

  const revoke = async (sessionId: string) => {
    setBusy(true)
    try { await revokeAdminSession(sessionId); await reload(); setError(null) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Session could not be revoked.') }
    finally { setBusy(false) }
  }

  const rows = useMemo<SessionRow[]>(() => (data?.sessions ?? []).map((session) => {
    const browser = describeBrowser(session)
    const os = describeOs(session)
    return {
      id: session.sessionId,
      account: session.userName,
      email: session.email,
      nickname: session.nickname ?? '',
      device: describeDevice(session) ?? notAvailableLabel,
      browser: [browser.name, browser.version].filter(Boolean).join(' ') || notAvailableLabel,
      os: [os.name, os.version].filter(Boolean).join(' ') || notAvailableLabel,
      session,
      role: session.role,
      location: locationText(session.city, session.country),
      clientIp: session.clientIp,
      lastActiveAt: session.lastActiveAt,
    }
  }), [data])

  return <>
    <Box sx={{ mb: 3 }}><Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>Security</Typography><Typography color="text.secondary">Review and sign out active sessions.</Typography></Box>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading || !data ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading security data" /></Box> : <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Active sessions</Typography>
        <Typography variant="body2" color="text.secondary">{rows.length} records</Typography>
      </Paper>
      <AdminDataTable rows={rows} columns={columns} searchPlaceholder="Filter active sessions" searchKeys={['account', 'email', 'nickname', 'device', 'browser', 'os', 'role', 'location', 'clientIp']} actions={(row) => <Button size="small" color="error" disabled={busy} onClick={() => void revoke(row.id)}>Revoke</Button>} />
    </Stack>}
  </>
}

export default SecurityPage
