import { useMemo, useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

export interface DataColumn<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => ReactNode
  collapsible?: boolean
}

interface Props<T extends { id: number | string }> {
  rows: T[]
  columns: DataColumn<T>[]
  searchPlaceholder?: string
  searchKeys?: Array<keyof T>
  rowClick?: (row: T) => void
  actions?: (row: T) => ReactNode
}

const AdminDataTable = <T extends { id: number | string }>({ rows, columns, searchPlaceholder = 'Search records', searchKeys, rowClick, actions }: Props<T>) => {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [sortKey, setSortKey] = useState<keyof T>(columns[0].key)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedIds, setExpandedIds] = useState<Array<T['id']>>([])
  const theme = useTheme()
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const collapseEnabled = narrow && columns.some((column) => column.collapsible)
  const visibleColumns = collapseEnabled ? columns.filter((column) => !column.collapsible) : columns
  const collapsedColumns = collapseEnabled ? columns.filter((column) => column.collapsible) : []
  const columnCount = visibleColumns.length + (collapseEnabled ? 1 : 0) + (actions ? 1 : 0)

  const toggleExpanded = (id: T['id']) => {
    setExpandedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const filteredRows = useMemo(
    () => rows.filter((row) => (searchKeys ?? Object.keys(row) as Array<keyof T>).some((key) => String(row[key]).toLowerCase().includes(query.toLowerCase()))),
    [query, rows, searchKeys],
  )

  const sortedRows = useMemo(
    () => [...filteredRows].sort((first, second) => {
      const firstValue = String(first[sortKey])
      const secondValue = String(second[sortKey])
      const result = firstValue.localeCompare(secondValue, undefined, { numeric: true })
      return sortDirection === 'asc' ? result : -result
    }),
    [filteredRows, sortDirection, sortKey],
  )

  const visibleRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(0)
          }}
          size="small"
          sx={{ width: { xs: '100%', sm: 320 } }}
          placeholder={searchPlaceholder}
          inputProps={{ 'aria-label': searchPlaceholder }}
        />
      </Box>
      <TableContainer>
        <Table sx={{ minWidth: collapseEnabled ? 0 : 720 }}>
          <TableHead>
            <TableRow>
              {collapseEnabled && <TableCell padding="checkbox" aria-label="Show details" />}
              {visibleColumns.map((column) => (
                <TableCell key={String(column.key)}>
                  <TableSortLabel
                    active={sortKey === column.key}
                    direction={sortKey === column.key ? sortDirection : 'asc'}
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              {actions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length > 0 ? visibleRows.flatMap((row) => {
              const expanded = expandedIds.includes(row.id)
              const mainRow = <TableRow key={String(row.id)} hover onClick={() => rowClick?.(row)} sx={{ cursor: rowClick ? 'pointer' : 'default' }}>
                {collapseEnabled && <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                  <IconButton size="small" aria-label={expanded ? 'Hide details' : 'Show details'} aria-expanded={expanded} onClick={() => toggleExpanded(row.id)}>
                    {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </TableCell>}
                {visibleColumns.map((column) => (
                  <TableCell key={String(column.key)}>
                    {column.render ? column.render(row[column.key], row) : String(row[column.key])}
                  </TableCell>
                ))}
                {actions && <TableCell align="right" onClick={(event) => event.stopPropagation()}>{actions(row)}</TableCell>}
              </TableRow>
              if (!expanded) return [mainRow]
              const detailsRow = <TableRow key={`${String(row.id)}-details`}>
                <TableCell colSpan={columnCount} sx={{ bgcolor: 'action.hover' }}>
                  <Stack spacing={1}>
                    {collapsedColumns.map((column) => (
                      <Box key={String(column.key)}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{column.label}</Typography>
                        <Box>{column.render ? column.render(row[column.key], row) : String(row[column.key])}</Box>
                      </Box>
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
              return [mainRow, detailsRow]
            }) : (
              <TableRow>
                <TableCell colSpan={columnCount}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No records found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sortedRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value))
          setPage(0)
        }}
      />
    </Paper>
  )
}

export default AdminDataTable
