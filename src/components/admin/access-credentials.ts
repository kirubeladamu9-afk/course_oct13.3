export interface AccessCredentialRow {
  name: string
  username: string
  temporaryPassword: string
  expiresAt: string
}

const spreadsheetFormulaStart = /^[=+\-@\t\r]/

const neutralizeSpreadsheetCell = (value: string) => spreadsheetFormulaStart.test(value) ? `'${value}` : value

const csvCell = (value: string) => `"${neutralizeSpreadsheetCell(value).replace(/"/g, '""')}"`

export const buildAccessCredentialsCsv = (rows: AccessCredentialRow[]) => [
  ['name', 'username', 'one_time_password', 'expires_at'].map(csvCell).join(','),
  ...rows.map((row) => [row.name, row.username, row.temporaryPassword, row.expiresAt].map(csvCell).join(',')),
].join('\r\n')
