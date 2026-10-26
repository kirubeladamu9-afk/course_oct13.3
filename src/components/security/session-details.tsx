import { type FC } from 'react'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { describeDevice, hiddenDetailTooltip, notAvailableLabel, type SessionDetails } from '@/lib/security-sessions'

const NotAvailable: FC = () => (
  <Tooltip title={hiddenDetailTooltip}>
    <Typography component="span" variant="body2" color="text.disabled" tabIndex={0}>{notAvailableLabel}</Typography>
  </Tooltip>
)

export const SessionDetailValue: FC<{ name: string | null; detail?: string | null }> = ({ name, detail }) => {
  if (!name) return <NotAvailable />
  return <Stack spacing={0.25}>
    <Typography variant="body2">{name}</Typography>
    {detail !== undefined && (detail ? <Typography variant="caption" color="text.secondary">{detail}</Typography> : <NotAvailable />)}
  </Stack>
}

export const SessionDeviceValue: FC<{ session: SessionDetails }> = ({ session }) => {
  const device = describeDevice(session)
  if (!session.nickname && !device) return <NotAvailable />
  return <Typography variant="body2">
    {session.nickname && <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>{session.nickname}</Typography>}
    {session.nickname && device && <Typography component="span" variant="body2" color="text.secondary"> · </Typography>}
    {device && <Typography component="span" variant="body2" color={session.nickname ? 'text.secondary' : 'text.primary'}>{device}</Typography>}
  </Typography>
}
