import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type FC, type FormEvent, useState } from 'react'
import { navigateTo } from '@/lib/navigation'
import { setPasswordWithToken } from '@/services/api'

const SetPasswordPage: FC = () => {
  const token = new URLSearchParams(window.location.search).get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!token) return setError('This link is missing its access token. Ask your administrator for a new link.')
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirmation) return setError('The passwords do not match.')
    setIsSaving(true)
    try {
      await setPasswordWithToken(token, password)
      setIsDone(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to set your password.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Set your password</Typography>
          {isDone ? (
            <Stack spacing={2}>
              <Alert severity="success">Your password is set. You can now sign in.</Alert>
              <Button variant="contained" onClick={() => navigateTo('/sign-in', true)}>Go to sign in</Button>
            </Stack>
          ) : (
            <Box component="form" onSubmit={submit}>
              <Stack spacing={2}>
                <Typography color="text.secondary">Choose a password of at least 8 characters. This link works once and expires after 72 hours.</Typography>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField label="New password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required fullWidth />
                <TextField label="Confirm password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required fullWidth />
                <Button type="submit" variant="contained" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save password'}</Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

export default SetPasswordPage
