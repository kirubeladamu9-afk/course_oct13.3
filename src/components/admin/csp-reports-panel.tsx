import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { type FC, useEffect, useState } from 'react'
import { getAdminCspReports, type AdminCspReport } from '@/services/api'

const CspReportsPanel: FC = () => {
  const [reports, setReports] = useState<AdminCspReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminCspReports()
      .then(setReports)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load blocked sources.'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, mt: 3, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
      <Typography variant="h6">Blocked sources</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Pages that tried to load content from a source that is not on the approved list.
      </Typography>
      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress aria-label="Loading blocked sources" /></Box>
        : error ? <Alert severity="error">{error}</Alert>
        : reports.length === 0 ? <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No reports yet.</Typography>
        : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Page</TableCell>
                  <TableCell>Blocked source</TableCell>
                  <TableCell>Rule</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow hover key={report.id}>
                    <TableCell>{new Date(report.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{report.documentUrl || '—'}</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{report.blockedUrl || '—'}</TableCell>
                    <TableCell>{report.violatedDirective || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
    </Paper>
  )
}

export default CspReportsPanel
