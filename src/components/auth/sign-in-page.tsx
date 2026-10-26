import { useEffect, useState, type FC, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { StyledButton } from '@/components/styled-button'
import { navigateTo } from '@/lib/navigation'
import { toast } from '@/components/toast'
import { AuthFlowError, saveAuthenticatedUser, submitCredentials } from '@/services/api'

interface SignInPageProps {
  mode: 'sign-in' | 'sign-up'
}

const SignInPage: FC<SignInPageProps> = ({ mode }) => {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const isSignUp = mode === 'sign-up'
  const turnstileSiteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!captchaRequired || !turnstileSiteKey) return
    const renderWidget = () => {
      const turnstile = (window as Window & { turnstile?: { render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => void } }).turnstile
      const container = document.getElementById('sign-in-turnstile')
      if (turnstile && container && !container.hasChildNodes()) turnstile.render(container, { sitekey: turnstileSiteKey, callback: setCaptchaToken, 'expired-callback': () => setCaptchaToken('') })
    }
    if ((window as Window & { turnstile?: unknown }).turnstile) renderWidget()
    else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = renderWidget
      document.head.appendChild(script)
    }
  }, [captchaRequired, turnstileSiteKey])

  const resetCaptcha = () => {
    setCaptchaToken('')
    const turnstile = (window as Window & { turnstile?: { reset: () => void } }).turnstile
    turnstile?.reset()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    const formData = new FormData(event.currentTarget)
    setIsSubmitting(true)

    try {
      const { user } = await submitCredentials(mode, String(formData.get('email')), String(formData.get('password')), undefined, { captchaToken, twoFactorCode })
      setCaptchaRequired(false)
      setTwoFactorRequired(false)
      setTwoFactorCode('')
      if (!isSignUp) {
        saveAuthenticatedUser(user)
        setIsRedirecting(true)
        window.setTimeout(() => navigateTo(user.mustResetPassword ? '/security' : user.role === 'admin' ? '/admin' : user.role === 'tutor' ? '/tutor' : '/dashboard'), 400)
        return
      }
      toast.add({
        title: 'Account created',
        description: 'You can now sign in to Coursesharp.',
        type: 'success',
      })
    } catch (error) {
      if (error instanceof AuthFlowError) {
        setCaptchaRequired(error.captchaRequired)
        setTwoFactorRequired(error.twoFactorRequired)
        if (error.captchaRequired) resetCaptcha()
      }
      toast.add({
        title: 'Unable to complete your request',
        description: error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
        priority: 'high',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return <Box sx={{ background: 'var(--app-auth-backdrop)', backgroundColor: 'background.default', height: 'calc(100vh - 88px)', minHeight: 0, display: 'flex', alignItems: 'center', overflow: 'hidden', boxSizing: 'border-box', py: 'clamp(0.5rem, 3vh, 2rem)' }}>
    <Container maxWidth="lg" sx={{ maxHeight: '100%', display: 'flex', alignItems: 'center', px: { xs: 2, sm: 2, md: 3 } }}>
      <Paper elevation={8} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' }, width: '100%', boxSizing: 'border-box', maxWidth: 840, maxHeight: '100%', minHeight: 0, mx: 'auto', overflow: 'hidden', borderRadius: { xs: 3, md: 5 } }}>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: { xs: 1.5, sm: 3, md: 4 }, pb: { xs: 3, sm: 4, md: 5 }, color: 'common.white', background: 'var(--app-auth-panel)', minHeight: 0 }}>
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: 1.2, color: 'rgba(255,255,255,0.72)' }}>Coursesharp learning platform</Typography>
            <Typography component="h2" sx={{ mt: { xs: 1, md: 5 }, fontSize: { xs: '1.9rem', md: 'clamp(2.25rem, 4.2vw, 3.5rem)' }, lineHeight: 0.98, letterSpacing: '-0.06em', fontWeight: 700 }}>
              Learn with
              <br />
              confidence.
            </Typography>
            <Typography sx={{ mt: { xs: 1, md: 2 }, maxWidth: 330, color: 'rgba(255,255,255,0.72)', lineHeight: 1.45 }}>
              Build practical skills with focused courses, supportive tutors, and relaxed practice that keeps you moving forward.
            </Typography>
          </Box>
          <Box component="img" src="/images/home-hero.png" alt="Learner studying with Coursesharp" sx={{ display: 'block', flex: 'none', width: '80%', alignSelf: 'center', height: { md: 'min(36vh, 340px)' }, mt: { xs: 1, md: 0 }, position: { md: 'relative' }, top: { md: 40 }, objectFit: 'cover', objectPosition: 'bottom' }} />
        </Box>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0, p: { xs: 2, sm: 2.5, md: 4 }, backgroundColor: 'background.paper' }}>
          {isRedirecting ? (
            <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }} aria-live="polite">
              <CircularProgress aria-label="Signing in" />
              <Typography>Signing you in...</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-end', md: 'space-between' }, gap: 1, mb: { xs: 1.5, sm: 2, md: 5 } }}>
                <Typography sx={{ display: { xs: 'none', md: 'block' }, fontSize: '1.25rem', fontWeight: 700, '& span': { color: 'primary.main' } }}>Course<span>sharp</span></Typography>
                <Typography variant="body2" color="text.secondary">{isSignUp ? 'Already learning with us?' : 'Secure account access'}</Typography>
              </Box>
              <Box sx={{ maxWidth: 430, width: '100%', mx: 'auto', flex: 1 }}>
                <Typography component="h1" variant="h2" sx={{ mb: 0.75, fontSize: { xs: '2rem', md: '3rem' }, letterSpacing: '-0.05em' }}>{isSignUp ? 'Sign Up' : 'Sign In'}</Typography>
                <Typography color="text.secondary" sx={{ mb: { xs: 1.5, md: 2.5 } }}>{isSignUp ? 'Create your Coursesharp account.' : 'Welcome back to Coursesharp.'}</Typography>
                <Box sx={{ display: 'grid', gap: { xs: 1.25, md: 1.5 } }}>
                  <TextField required fullWidth label="Email" name="email" type="email" autoComplete="email" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999 } }} />
                  <TextField
                    required
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    inputProps={isSignUp ? { minLength: 8 } : undefined}
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton type="button" onClick={() => setShowPassword((visible) => !visible)} edge="end" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {!isSignUp && twoFactorRequired && <TextField required label="Authenticator or backup code" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} autoComplete="one-time-code" inputProps={{ inputMode: 'numeric' }} />}
                  {!isSignUp && captchaRequired && (turnstileSiteKey ? <Box id="sign-in-turnstile" sx={{ minHeight: 65, display: 'flex', alignItems: 'center' }} /> : <Typography role="status" variant="caption" color="text.secondary">Human verification is not configured. Please contact support.</Typography>)}
                  {!isSignUp && <Typography variant="body2" sx={{ mt: -0.75, color: 'text.secondary' }}>
                    Forgot your password? <Link href="mailto:support@coursesharp.com" underline="hover">Contact support@coursesharp.com</Link> for help.
                  </Typography>}
                  <Box sx={{ mt: { xs: 0.25, md: 0.5 }, '& button': { width: '100%', justifyContent: 'center', borderRadius: 999, py: 1.1 } }}>
                    <StyledButton type="submit" color="primary" disabled={isSubmitting || Boolean(captchaRequired && turnstileSiteKey && !captchaToken) || Boolean(twoFactorRequired && !twoFactorCode)}>{isSignUp ? 'Sign Up' : 'Sign In'}</StyledButton>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: { xs: 1.5, sm: 2, md: 5 } }}>
                <Typography variant="caption" color="text.secondary">© {new Date().getFullYear()} Coursesharp</Typography>
                <Link href="/contact-us" onClick={(event) => { event.preventDefault(); navigateTo('/contact-us') }} underline="hover" variant="caption" color="text.secondary">Contact Us</Link>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  </Box>
}

export default SignInPage
