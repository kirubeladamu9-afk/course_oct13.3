import Bowser from 'bowser'

const chromiumBrowsers = new Set(['Chrome', 'Chromium', 'Microsoft Edge', 'Opera', 'Samsung Internet for Android'])
const clientHintBrands = { Chrome: 'Google Chrome', 'Microsoft Edge': 'Microsoft Edge', Opera: 'Opera', 'Samsung Internet for Android': 'Samsung Internet' }
const hiddenWindowsVersionBrowsers = new Set(['Firefox', 'Safari'])
const desktopOperatingSystems = new Set(['Windows', 'macOS', 'Linux', 'Chrome OS'])
const appleModels = new Set(['iPhone', 'iPad'])

const controlCharacters = /[\u0000-\u001f\u007f]/g
const versionPattern = /^\d{1,4}(\.\d{1,4}){0,3}$/
const platformPattern = /^[A-Za-z][A-Za-z ]{0,31}$/
const displayTextPattern = /^[\p{L}\p{N} ._()+/-]+$/u
const nicknamePattern = /^[\p{L}\p{N} ._'’-]+$/u
const maxUserAgentLength = 512
const maxNicknameLength = 40

const sanitizeText = (value, maxLength, pattern) => {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text || text.length > maxLength || !pattern.test(text)) return null
  return text
}

export const sanitizeClientHints = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const fullVersionList = Array.isArray(value.fullVersionList)
    ? value.fullVersionList.slice(0, 16).flatMap((entry) => {
      const brand = sanitizeText(entry?.brand, 64, displayTextPattern)
      const version = sanitizeText(entry?.version, 32, versionPattern)
      return brand && version ? [{ brand, version }] : []
    })
    : []
  return {
    platform: sanitizeText(value.platform, 32, platformPattern),
    platformVersion: sanitizeText(value.platformVersion, 32, versionPattern),
    model: sanitizeText(value.model, 64, displayTextPattern),
    fullVersionList,
  }
}

export const parseNickname = (value) => {
  if (value === null || value === '') return { ok: true, value: null }
  if (typeof value !== 'string') return { ok: false }
  const text = value.trim().replace(/\s+/g, ' ')
  if (!text) return { ok: true, value: null }
  if (text.length > maxNicknameLength || !nicknamePattern.test(text)) return { ok: false }
  return { ok: true, value: text }
}

const majorVersion = (version) => (version ? String(version).split('.')[0] : null)

const deviceTypeFor = (parsed) => {
  const type = parsed.platform.type
  if (type === 'desktop' || type === 'mobile' || type === 'tablet') return type
  return desktopOperatingSystems.has(parsed.os.name) ? 'desktop' : 'unknown'
}

const browserVersionFor = (browserName, parsedVersion, clientHints) => {
  const brand = clientHintBrands[browserName]
  const fullVersion = brand ? clientHints?.fullVersionList.find((entry) => entry.brand === brand)?.version : null
  return fullVersion ?? majorVersion(parsedVersion)
}

const osVersionFor = (osName, parsedVersion, browserName, clientHints) => {
  const hintPlatform = clientHints?.platform
  const hintVersion = clientHints?.platformVersion ?? null
  if (osName === 'Windows') {
    if (hiddenWindowsVersionBrowsers.has(browserName)) return '10 or 11'
    if (!chromiumBrowsers.has(browserName) || hintPlatform !== 'Windows' || !hintVersion) return null
    return Number(hintVersion.split('.')[0]) >= 13 ? '11' : '10'
  }
  if (osName === 'macOS') return hintPlatform === 'macOS' ? hintVersion : null
  if (osName === 'Android') return hintPlatform === 'Android' ? hintVersion : null
  if (osName === 'iOS') return parsedVersion && versionPattern.test(parsedVersion) ? parsedVersion : null
  return null
}

export const buildClientMetadata = (rawUserAgent, clientHints = null) => {
  const userAgent = String(rawUserAgent ?? '').replace(controlCharacters, '').slice(0, maxUserAgentLength)
  const parsed = userAgent ? Bowser.getParser(userAgent).getResult() : { browser: {}, os: {}, platform: {} }
  const browser = parsed.browser.name || 'Unknown'
  const os = parsed.os.name || 'Unknown'
  const isIosDevice = os === 'iOS' && appleModels.has(parsed.platform.model)
  const isAndroid = os === 'Android'
  return {
    userAgent,
    browser,
    browserVersion: browserVersionFor(browser, parsed.browser.version, clientHints),
    os,
    osVersion: osVersionFor(os, parsed.os.version, browser, clientHints),
    deviceType: deviceTypeFor(parsed),
    deviceVendor: parsed.platform.vendor || null,
    deviceModel: isIosDevice ? parsed.platform.model : isAndroid ? clientHints?.model ?? null : null,
  }
}

const isLocalNetworkAddress = (ip) => {
  const address = ip.startsWith('::ffff:') ? ip.slice(7) : ip
  if (address === '::1' || /^fe80:/i.test(address) || /^f[cd][0-9a-f]{2}:/i.test(address)) return true
  const octets = address.split('.').map(Number)
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false
  const [first, second] = octets
  return first === 10 || first === 127 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168) || (first === 169 && second === 254)
}

export const displayClientIp = (ip, formatPublicIp) => isLocalNetworkAddress(ip) ? 'Local network' : formatPublicIp(ip)
