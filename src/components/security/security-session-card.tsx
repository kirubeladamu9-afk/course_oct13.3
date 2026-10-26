import { useState, type FC } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { SessionDetailValue, SessionDeviceValue } from './session-details'
import { describeBrowser, describeOs } from '@/lib/security-sessions'
import { type SecuritySession } from '@/services/api'

interface Props {
  session: SecuritySession
  busy: boolean
  lastActiveText: string
  onRevoke: () => void
  onRename: (nickname: string) => Promise<void>
}

const SecuritySessionCard: FC<Props> = ({ session, busy, lastActiveText, onRevoke, onRename }) => {
  const theme = useTheme()
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState(session.nickname ?? '')
  const [saving, setSaving] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const browser = describeBrowser(session)
  const os = describeOs(session)
  const location = [session.city, session.country].filter(Boolean).join(', ') || 'Location unavailable'

  const cancelEditing = () => {
    setEditing(false)
    setNickname(session.nickname ?? '')
    setRenameError(null)
  }

  const save = async () => {
    setSaving(true)
    setRenameError(null)
    try {
      await onRename(nickname.trim())
      setEditing(false)
    } catch (reason) {
      setRenameError(reason instanceof Error ? reason.message : 'Unable to save the device name.')
    } finally {
      setSaving(false)
    }
  }

  return <Card variant="outlined">
    <CardContent sx={{ '&:last-child': { pb: 2 } }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main' }}><ComputerOutlinedIcon /></Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <SessionDeviceValue session={session} />
              {session.isCurrent && <Chip label="This device" color="primary" size="small" />}
            </Stack>
            <Typography variant="caption" color="text.secondary">Last active {lastActiveText}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {narrow && <IconButton size="small" aria-label={expanded ? 'Hide session details' : 'Show session details'} aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>}
          <Button color="error" onClick={onRevoke} disabled={busy}>Sign out</Button>
        </Stack>
      </Stack>
      {(!narrow || expanded) && <Box sx={{ mt: 2, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' } }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Browser</Typography>
          <SessionDetailValue name={browser.name} detail={browser.version} />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>OS</Typography>
          <SessionDetailValue name={os.name} detail={os.version} />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>IP and location</Typography>
          <Typography variant="body2">{session.clientIp}</Typography>
          <Typography variant="caption" color="text.secondary">{location} (approximate)</Typography>
        </Box>
      </Box>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-start' }} sx={{ mt: 1.5 }}>
        {editing ? <>
          <TextField size="small" label="Device name" value={nickname} onChange={(event) => setNickname(event.target.value)} inputProps={{ maxLength: 40 }} error={Boolean(renameError)} helperText={renameError ?? 'Shown on this session to you and to administrators.'} />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => void save()} disabled={saving}>Save</Button>
            <Button onClick={cancelEditing} disabled={saving}>Cancel</Button>
          </Stack>
        </> : <Button size="small" onClick={() => setEditing(true)} disabled={busy}>{session.nickname ? 'Rename device' : 'Name this device'}</Button>}
      </Stack>
    </CardContent>
  </Card>
}

export default SecuritySessionCard
