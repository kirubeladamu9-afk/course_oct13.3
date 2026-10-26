import { useEffect, useState, type FC } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Badge from '@mui/material/Badge'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { toast } from '@/components/toast'
import SecuritySessionCard from '@/components/security/security-session-card'
import { navigateTo } from '@/lib/navigation'
import { changePassword, clearAuthenticatedUser, getAdminSecurityAlerts, getAuthenticatedUser, getSecurityAlerts, getSecurityLoginHistory, getSecuritySessions, revokeSecuritySession, saveAuthenticatedUser, updateSecuritySessionNickname, signOutEverywhere, type LoginEvent, type SecurityAlert, type SecuritySession } from '@/services/api'

const formatLocation = (city: string | null, country: string | null) => [city, country].filter(Boolean).join(', ') || 'Location unavailable'
const formatDate = (value: string) => new Date(value).toLocaleString()

export const SecurityNotifications: FC<{ admin?: boolean }> = ({ admin = false }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const open = Boolean(anchor)
  const showAlerts = async (element: HTMLElement) => {
    setAnchor(element)
    try { setAlerts(admin ? await getAdminSecurityAlerts() : await getSecurityAlerts()) } catch { setAlerts([]) }
  }
  return <>
    <Tooltip title="Security notifications">
      <IconButton aria-label="Security notifications" onClick={(event) => { void showAlerts(event.currentTarget) }}>
        <Badge color="error" variant="dot" invisible={alerts.length === 0}><NotificationsNoneOutlinedIcon fontSize="small" /></Badge>
      </IconButton>
    </Tooltip>
    <Menu anchorEl={anchor} open={open} onClose={() => setAnchor(null)} PaperProps={{ sx: { width: 340, maxWidth: 'calc(100vw - 32px)', maxHeight: 420 } }}>
      <Box sx={{ px: 2, py: 1 }}><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Security alerts</Typography></Box>
      <Divider />
      {!alerts.length ? <MenuItem disabled>No recent security alerts</MenuItem> : alerts.slice(0, 5).map((alert) => <MenuItem key={alert.id} onClick={() => { setAnchor(null); navigateTo(admin ? '/admin/security' : '/security') }} sx={{ alignItems: 'flex-start', whiteSpace: 'normal' }}><Box><Typography variant="body2">{alert.message}</Typography><Typography variant="caption" color="text.secondary">{formatDate(alert.createdAt)}</Typography></Box></MenuItem>)}
      <Divider />
      <MenuItem onClick={() => { setAnchor(null); navigateTo(admin ? '/admin/security' : '/security') }}>Open Security</MenuItem>
    </Menu>
  </>
}

const AccountSecurity: FC = () => {
  const [sessions, setSessions] = useState<SecuritySession[]>([])
  const [history, setHistory] = useState<LoginEvent[]>([])
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'password' | 'sessions' | 'alerts' | 'history'>('password')

  const user = getAuthenticatedUser()
  const currentSessions = sessions.filter((session) => session.isCurrent)
  const updatePassword = async () => {
    if (newPassword.length < 8 || newPassword.length > 128 || newPassword !== confirmPassword) {
      setPasswordMessage('Use a password between 8 and 128 characters and make sure both entries match.')
      return
    }
    setBusy(true)
    try {
      await changePassword(currentPassword, newPassword)
      if (user) saveAuthenticatedUser({ ...user, mustResetPassword: false })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password updated. Other active sessions have been signed out.')
      toast.add({ title: 'Password updated', description: 'Other active sessions have been signed out.', type: 'success' })
    } catch (reason) { setPasswordMessage(reason instanceof Error ? reason.message : 'Unable to change your password.') }
    finally { setBusy(false) }
  }

  const reload = async () => {
    setLoading(true)
    try {
      const [nextSessions, nextHistory, nextAlerts] = await Promise.all([getSecuritySessions(), getSecurityLoginHistory(), getSecurityAlerts()])
      setSessions(nextSessions)
      setHistory(nextHistory)
      setAlerts(nextAlerts)
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load account security information.')
    } finally { setLoading(false) }
  }
  useEffect(() => { void reload() }, [])

  const revoke = async (session: SecuritySession) => {
    setBusy(true)
    try {
      await revokeSecuritySession(session.sessionId)
      if (session.isCurrent) {
        clearAuthenticatedUser()
        navigateTo('/sign-in', true)
      } else await reload()
      toast.add({ title: 'Session signed out', description: 'The selected device session has been revoked.', type: 'success' })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign out this session.') }
    finally { setBusy(false) }
  }

  const signOutAll = async () => {
    setBusy(true)
    try { await signOutEverywhere(); navigateTo('/sign-in', true) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign out all sessions.') }
    finally { setBusy(false) }
  }

  return <>
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
      <Box><Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>Account security</Typography><Typography color="text.secondary">Review your devices, sign-in activity, and account protection.</Typography></Box>
      <Button variant="outlined" color="error" onClick={() => void signOutAll()} disabled={busy}>Sign out everywhere</Button>
    </Stack>
    {user?.mustResetPassword && <Alert severity="warning" sx={{ mb: 2 }}>An administrator requires a password change before you can use the rest of your account.</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {passwordMessage && <Alert severity={passwordMessage.startsWith('Password updated') ? 'success' : 'error'} sx={{ mb: 2 }}>{passwordMessage}</Alert>}
    {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}><CircularProgress aria-label="Loading security information" /></Box> : <Stack spacing={2.5}>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: -1, borderBottom: 1, borderColor: 'divider', minHeight: 44, '& .MuiTab-root': { minHeight: 44, px: 2, textTransform: 'none', fontWeight: 700 } }}>
        <Tab value="password" label="Change password" />
        <Tab value="sessions" label="Active sessions" />
        <Tab value="alerts" label="Recent security alerts" />
        <Tab value="history" label="Recent sign-in history" />
      </Tabs>
      {tab === 'password' && <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: 1, borderColor: 'divider', borderRadius: 3 }}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Change password</Typography>
        <Stack spacing={1.5} sx={{ maxWidth: 520 }}><TextField label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /><TextField label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} inputProps={{ minLength: 8, maxLength: 128 }} /><TextField label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} inputProps={{ minLength: 8, maxLength: 128 }} /><Button variant="contained" onClick={() => void updatePassword()} disabled={busy || !currentPassword || !newPassword || !confirmPassword}>Update password</Button></Stack>
      </Paper>}
      {tab === 'sessions' && <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: 1, borderColor: 'divider', borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>Active sessions</Typography><Chip label={`${currentSessions.length} ${currentSessions.length === 1 ? 'device' : 'devices'}`} size="small" variant="outlined" /></Stack>
        {currentSessions.length ? <Stack spacing={1.5}>{currentSessions.map((session) => <SecuritySessionCard key={session.sessionId} session={session} busy={busy} lastActiveText={formatDate(session.lastActiveAt)} onRevoke={() => void revoke(session)} onRename={async (nickname) => { await updateSecuritySessionNickname(session.sessionId, nickname); await reload() }} />)}</Stack> : <Typography color="text.secondary">No active sessions found.</Typography>}
      </Paper>}
      {tab === 'alerts' && <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: 1, borderColor: 'divider', borderRadius: 3 }}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Recent security alerts</Typography>
        {alerts.length ? <Stack divider={<Divider flexItem />}>{alerts.map((alert) => <Box key={alert.id} sx={{ py: 1.25 }}><Typography variant="body2">{alert.message}</Typography><Typography variant="caption" color="text.secondary">Location details are approximate · {formatDate(alert.createdAt)}</Typography></Box>)}</Stack> : <Typography color="text.secondary">No recent security alerts.</Typography>}
      </Paper>}
      {tab === 'history' && <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: 1, borderColor: 'divider', borderRadius: 3 }}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Recent sign-in history</Typography>
        {history.length ? <Stack divider={<Divider flexItem />}>{history.map((event) => <Box key={event.id} sx={{ py: 1.25 }}><Stack direction="row" spacing={1} alignItems="center"><Chip size="small" label={event.succeeded ? 'Successful' : 'Failed'} color={event.succeeded ? 'success' : 'error'} variant="outlined" /><Typography variant="body2" sx={{ fontWeight: 600 }}>{event.browser} on {event.os} · {event.deviceType}</Typography></Stack><Typography variant="body2" color="text.secondary">Location is approximate: {formatLocation(event.city, event.country)} · IP {event.clientIp}</Typography><Typography variant="caption" color="text.secondary">{formatDate(event.createdAt)} · {event.reason.replace(/_/g, ' ')}</Typography></Box>)}</Stack> : <Typography color="text.secondary">No sign-in activity recorded.</Typography>}
      </Paper>}
    </Stack>}
  </>
}

export default AccountSecurity
