import { describe, expect, it } from 'vitest'
import { generateVerificationCode, hashVerificationCode, isValidEmailAddress } from './enrollment-verification.js'

describe('enrollment verification helpers', () => {
  it('generates six-digit numeric codes', () => {
    for (let index = 0; index < 200; index += 1) {
      expect(generateVerificationCode()).toMatch(/^\d{6}$/)
    }
  })

  it('binds code hashes to the email and enrollment target', () => {
    const hash = hashVerificationCode('student@example.com', 'course:4', '123456')
    expect(hash).toBe(hashVerificationCode('student@example.com', 'course:4', '123456'))
    expect(hash).not.toBe(hashVerificationCode('other@example.com', 'course:4', '123456'))
    expect(hash).not.toBe(hashVerificationCode('student@example.com', 'class:4', '123456'))
    expect(hash).not.toBe(hashVerificationCode('student@example.com', 'course:4', '654321'))
  })

  it('rejects malformed email addresses', () => {
    expect(isValidEmailAddress('student@example.com')).toBe(true)
    expect(isValidEmailAddress('student@example')).toBe(false)
    expect(isValidEmailAddress('student example@mail.com')).toBe(false)
  })
})
