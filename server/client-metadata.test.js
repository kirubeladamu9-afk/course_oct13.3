import { describe, expect, it } from 'vitest'
import { buildClientMetadata, displayClientIp, parseNickname, sanitizeClientHints } from './client-metadata.js'

const chromeWindowsUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const firefoxWindowsUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0'
const iphoneSafariUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const androidChromeUa = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
const macChromeUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const chromeFullVersions = [{ brand: 'Chromium', version: '124.0.6367.91' }, { brand: 'Google Chrome', version: '124.0.6367.91' }]

describe('buildClientMetadata', () => {
  it('shows Windows 11 for Chromium when client hints report platform version 13 or higher', () => {
    const metadata = buildClientMetadata(chromeWindowsUa, { platform: 'Windows', platformVersion: '15.0.0', fullVersionList: chromeFullVersions })
    expect(metadata).toMatchObject({ browser: 'Chrome', browserVersion: '124.0.6367.91', os: 'Windows', osVersion: '11', deviceType: 'desktop' })
  })

  it('shows Windows 10 for Chromium when client hints report a lower platform version', () => {
    const metadata = buildClientMetadata(chromeWindowsUa, { platform: 'Windows', platformVersion: '10.0.0', fullVersionList: [] })
    expect(metadata).toMatchObject({ osVersion: '10', browserVersion: '124' })
  })

  it('leaves the Windows version unknown for Chromium without client hints', () => {
    expect(buildClientMetadata(chromeWindowsUa).osVersion).toBeNull()
  })

  it('shows Windows 10 or 11 for Firefox on Windows and uses the major browser version', () => {
    expect(buildClientMetadata(firefoxWindowsUa)).toMatchObject({ browser: 'Firefox', browserVersion: '128', osVersion: '10 or 11' })
  })

  it('reports the iPhone model and iOS version from the user agent without client hints', () => {
    expect(buildClientMetadata(iphoneSafariUa)).toMatchObject({ os: 'iOS', osVersion: '17.5', deviceType: 'mobile', deviceVendor: 'Apple', deviceModel: 'iPhone' })
  })

  it('uses the Android version and model only from client hints', () => {
    expect(buildClientMetadata(androidChromeUa, { platform: 'Android', platformVersion: '14.0.0', model: 'Pixel 7', fullVersionList: [] })).toMatchObject({ osVersion: '14.0.0', deviceModel: 'Pixel 7', deviceType: 'mobile' })
    expect(buildClientMetadata(androidChromeUa)).toMatchObject({ osVersion: null, deviceModel: null })
  })

  it('uses the macOS version from client hints because the user agent string is frozen', () => {
    expect(buildClientMetadata(macChromeUa, { platform: 'macOS', platformVersion: '14.5.0', fullVersionList: [] })).toMatchObject({ os: 'macOS', osVersion: '14.5.0', deviceModel: null })
  })

  it('handles an empty user agent without throwing', () => {
    expect(buildClientMetadata('')).toMatchObject({ browser: 'Unknown', os: 'Unknown', deviceType: 'unknown', userAgent: '' })
  })
})

describe('sanitizeClientHints', () => {
  it('drops values with unexpected characters or lengths', () => {
    const hints = sanitizeClientHints({ platform: 'Windows<script>', platformVersion: 'abc', model: 'x'.repeat(65), fullVersionList: [{ brand: 'Google Chrome', version: '124.0.1' }, { brand: 'Bad', version: '1;drop' }] })
    expect(hints).toEqual({ platform: null, platformVersion: null, model: null, fullVersionList: [{ brand: 'Google Chrome', version: '124.0.1' }] })
  })

  it('ignores non-object payloads', () => {
    expect(sanitizeClientHints('Windows')).toBeNull()
    expect(sanitizeClientHints(['Windows'])).toBeNull()
  })
})

describe('parseNickname', () => {
  it('trims and collapses whitespace in a valid nickname', () => {
    expect(parseNickname('  Dad’s   ThinkPad ')).toEqual({ ok: true, value: 'Dad’s ThinkPad' })
  })

  it('clears the nickname for an empty value', () => {
    expect(parseNickname('   ')).toEqual({ ok: true, value: null })
  })

  it('rejects markup and overlong nicknames', () => {
    expect(parseNickname('<img src=x>').ok).toBe(false)
    expect(parseNickname('a'.repeat(41)).ok).toBe(false)
    expect(parseNickname(42).ok).toBe(false)
  })
})

describe('displayClientIp', () => {
  const formatPublic = (ip) => `public:${ip}`

  it('labels private and loopback addresses as local network', () => {
    for (const ip of ['192.168.1.5', '10.0.0.4', '172.16.9.1', '127.0.0.1', '169.254.1.1', '::1', 'fd12:3456::1', 'fe80::1', '::ffff:10.0.0.4']) {
      expect(displayClientIp(ip, formatPublic)).toBe('Local network')
    }
  })

  it('formats public addresses with the provided formatter', () => {
    expect(displayClientIp('8.8.8.8', formatPublic)).toBe('public:8.8.8.8')
    expect(displayClientIp('172.32.0.1', formatPublic)).toBe('public:172.32.0.1')
  })
})
