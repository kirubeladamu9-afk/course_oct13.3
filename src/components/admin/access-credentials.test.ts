import { describe, expect, it } from 'vitest'
import { buildAccessCredentialsCsv } from './access-credentials'

describe('buildAccessCredentialsCsv', () => {
  it('writes a header and one quoted row per account', () => {
    const csv = buildAccessCredentialsCsv([
      { name: 'Abebe Kebede', username: 'abebe3f9a1c2', temporaryPassword: 'Xk7pQ2mNa9Lr', expiresAt: '2026-11-04T10:00:00.000Z' },
    ])
    expect(csv).toBe([
      '"name","username","one_time_password","expires_at"',
      '"Abebe Kebede","abebe3f9a1c2","Xk7pQ2mNa9Lr","2026-11-04T10:00:00.000Z"',
    ].join('\r\n'))
  })

  it('neutralizes spreadsheet formula characters at the start of a cell', () => {
    const csv = buildAccessCredentialsCsv([
      { name: '=HYPERLINK("http://x")', username: '+cmd', temporaryPassword: '-secret', expiresAt: '@sum' },
    ])
    const dataRow = csv.split('\r\n')[1]
    expect(dataRow).toBe(`"'=HYPERLINK(""http://x"")","'+cmd","'-secret","'@sum"`)
  })

  it('escapes embedded double quotes', () => {
    const csv = buildAccessCredentialsCsv([{ name: 'Say "hi"', username: 'u', temporaryPassword: 'p', expiresAt: '' }])
    expect(csv.split('\r\n')[1]).toBe('"Say ""hi""","u","p",""')
  })
})
