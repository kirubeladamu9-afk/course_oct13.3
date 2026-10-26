import { type SecuritySession } from '@/services/api'

export type SessionDetails = Pick<SecuritySession, 'deviceType' | 'deviceVendor' | 'deviceModel' | 'browser' | 'browserVersion' | 'os' | 'osVersion' | 'nickname'>

export const notAvailableLabel = 'Not available'
export const hiddenDetailTooltip = 'Browsers hide this detail from websites unless they share it, so it cannot be shown for this session.'

const deviceTypeLabels: Record<string, string> = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' }

const knownValue = (value: string | null | undefined) => value && value !== 'Unknown' ? value : null

export const describeDevice = (session: SessionDetails): string | null => {
  if (session.deviceModel) {
    const vendor = session.deviceVendor
    const needsVendor = vendor && vendor !== 'Apple' && !session.deviceModel.toLowerCase().startsWith(vendor.toLowerCase())
    return `${needsVendor ? `${vendor} ` : ''}${session.deviceModel}`
  }
  if (session.os === 'macOS') return 'Mac'
  return deviceTypeLabels[session.deviceType] ?? null
}

export const describeBrowser = (session: SessionDetails) => ({
  name: knownValue(session.browser),
  version: session.browserVersion || null,
})

export const describeOs = (session: SessionDetails) => ({
  name: knownValue(session.os),
  version: session.osVersion || null,
})
