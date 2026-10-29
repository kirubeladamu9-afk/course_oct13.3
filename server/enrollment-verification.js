import { createHash, randomInt } from 'node:crypto'
import nodemailer from 'nodemailer'

export const verificationCodeLifetimeMinutes = 10
export const verificationResendCooldownSeconds = 30
export const verificationMaxIncorrectAttempts = 5
export const verifiedEnrollmentWindowMinutes = 30
export const verificationIpMaxRequests = 5
export const verificationIpWindowMinutes = 10

export const isValidEmailAddress = (email) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const generateVerificationCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0')

export const hashVerificationCode = (email, targetKey, code) => createHash('sha256').update(`${email}|${targetKey}|${code}`).digest('hex')

let transporter = null

const getTransporter = () => {
  const user = process.env.GMAIL_ADDRESS
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) throw new Error('Gmail sender credentials are not configured.')
  transporter ??= nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
  return { transporter, from: user }
}

export const sendEnrollmentVerificationEmail = async ({ to, code }) => {
  const { transporter: mailer, from } = getTransporter()
  await mailer.sendMail({
    from: `CourseSharp <${from}>`,
    to,
    subject: 'Your CourseSharp verification code',
    text: `Your CourseSharp verification code is ${code}. It expires in ${verificationCodeLifetimeMinutes} minutes.`,
    html: `<p>Your CourseSharp verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;">${code}</p><p>This code expires in ${verificationCodeLifetimeMinutes} minutes.</p>`,
  })
}
