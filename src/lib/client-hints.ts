export interface ClientHintsPayload {
  platform?: string
  platformVersion?: string
  model?: string
  fullVersionList?: Array<{ brand: string; version: string }>
}

interface UserAgentData {
  getHighEntropyValues: (hints: string[]) => Promise<Record<string, unknown>>
}

const highEntropyHints = ['platform', 'platformVersion', 'model', 'fullVersionList']

const asString = (value: unknown) => typeof value === 'string' ? value : undefined

export const readClientHints = async (): Promise<ClientHintsPayload | null> => {
  const userAgentData = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData
  if (!userAgentData?.getHighEntropyValues) return null
  try {
    const values = await userAgentData.getHighEntropyValues(highEntropyHints)
    const fullVersionList = Array.isArray(values.fullVersionList)
      ? values.fullVersionList.filter((entry): entry is { brand: string; version: string } => typeof entry?.brand === 'string' && typeof entry?.version === 'string')
      : undefined
    return {
      platform: asString(values.platform),
      platformVersion: asString(values.platformVersion),
      model: asString(values.model),
      fullVersionList,
    }
  } catch {
    return null
  }
}
