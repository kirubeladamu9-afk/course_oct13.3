import { describe, expect, it } from 'vitest'
import { describeBrowser, describeDevice, describeOs, type SessionDetails } from './security-sessions'

const session = (overrides: Partial<SessionDetails> = {}): SessionDetails => ({
  deviceType: 'desktop',
  deviceVendor: null,
  deviceModel: null,
  browser: 'Chrome',
  browserVersion: '124.0.6367.91',
  os: 'Windows',
  osVersion: '11',
  nickname: null,
  ...overrides,
})

describe('session display rules', () => {
  it('shows Windows 11 for a Chrome session on Windows 11', () => {
    expect(describeOs(session())).toEqual({ name: 'Windows', version: '11' })
  })

  it('shows iPhone with its iOS version and no invented model', () => {
    const iphone = session({ deviceType: 'mobile', deviceVendor: 'Apple', deviceModel: 'iPhone', browser: 'Safari', browserVersion: '17', os: 'iOS', osVersion: '17.5' })
    expect(describeDevice(iphone)).toBe('iPhone')
    expect(describeOs(iphone)).toEqual({ name: 'iOS', version: '17.5' })
  })

  it('leaves Chromium Windows version unknown when hints are missing', () => {
    expect(describeOs(session({ osVersion: null }))).toEqual({ name: 'Windows', version: null })
  })

  it('treats unknown browsers and systems as not available', () => {
    expect(describeBrowser(session({ browser: 'Unknown', browserVersion: null }))).toEqual({ name: null, version: null })
    expect(describeOs(session({ os: 'Unknown', osVersion: null }))).toEqual({ name: null, version: null })
  })

  it('labels Mac and device types without guessing a model', () => {
    expect(describeDevice(session({ os: 'macOS', osVersion: '14.5.0' }))).toBe('Mac')
    expect(describeDevice(session({ deviceType: 'tablet', os: 'Linux', osVersion: null }))).toBe('Tablet')
    expect(describeDevice(session({ deviceType: 'unknown', os: 'Unknown' }))).toBeNull()
  })

  it('shows the model only when it is present and adds a vendor for non-Apple devices', () => {
    expect(describeDevice(session({ deviceType: 'mobile', deviceVendor: 'Google', deviceModel: 'Pixel 7', os: 'Android', osVersion: '14.0.0' }))).toBe('Google Pixel 7')
    expect(describeDevice(session({ deviceType: 'mobile', deviceVendor: 'Samsung', deviceModel: 'Samsung SM-S918B', os: 'Android' }))).toBe('Samsung SM-S918B')
  })
})
