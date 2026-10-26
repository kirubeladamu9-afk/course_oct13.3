import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useEffect, useState } from 'react'
import { toast } from '@/components/toast'
import {
  createAdminSyllabusTopic,
  deleteAdminSyllabusTopic,
  getSyllabusTopics,
  reorderAdminSyllabusTopics,
  updateAdminSyllabusTopic,
  type SyllabusTopic,
  type SyllabusTopicPayload,
} from '@/services/api'

const syllabusGrades = [6, 8, 12]
const pageSize = 10

type TopicEditor = { mode: 'create' } | { mode: 'edit'; topic: SyllabusTopic }

const emptyForm: SyllabusTopicPayload = { title: '', description: '' }

const getMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback

const SyllabusTopicsPage = () => {
  const [topics, setTopics] = useState<SyllabusTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [grade, setGrade] = useState(syllabusGrades[0])
  const [editor, setEditor] = useState<TopicEditor | null>(null)
  const [form, setForm] = useState<SyllabusTopicPayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SyllabusTopic | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getSyllabusTopics()
      .then(setTopics)
      .catch((reason) => setLoadError(getMessage(reason, 'Unable to load syllabus topics.')))
      .finally(() => setIsLoading(false))
  }, [])

  const gradeTopics = topics.filter((topic) => topic.grade === grade)
  const normalizedSearch = search.trim().toLowerCase()
  const matchingTopics = normalizedSearch ? gradeTopics.filter((topic) => [topic.title, topic.description].join(' ').toLowerCase().includes(normalizedSearch)) : gradeTopics
  const pageCount = Math.max(1, Math.ceil(matchingTopics.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleTopics = matchingTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const canReorder = !normalizedSearch

  const replaceGradeTopics = (nextTopics: SyllabusTopic[]) => {
    setTopics((current) => [...current.filter((topic) => topic.grade !== grade), ...nextTopics])
  }

  const openCreate = () => {
    setForm(emptyForm)
    setFormError(null)
    setEditor({ mode: 'create' })
  }

  const openEdit = (topic: SyllabusTopic) => {
    setForm({ title: topic.title, description: topic.description })
    setFormError(null)
    setEditor({ mode: 'edit', topic })
  }

  const saveTopic = async () => {
    if (!editor) return
    const payload = { title: form.title.trim(), description: form.description.trim() }
    setIsSaving(true)
    setFormError(null)
    try {
      if (editor.mode === 'create') {
        const created = await createAdminSyllabusTopic(grade, payload)
        setTopics((current) => [...current, created])
        toast.add({ type: 'success', title: 'Topic added', description: `${created.title} was added to Grade ${grade}.` })
      } else {
        const updated = await updateAdminSyllabusTopic(editor.topic.id, payload)
        setTopics((current) => current.map((topic) => topic.id === updated.id ? updated : topic))
        toast.add({ type: 'success', title: 'Topic saved', description: `${updated.title} was updated.` })
      }
      setEditor(null)
    } catch (reason) {
      setFormError(getMessage(reason, 'Unable to save the topic.'))
    } finally {
      setIsSaving(false)
    }
  }

  const deleteTopic = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteAdminSyllabusTopic(deleteTarget.id)
      setTopics((current) => current.filter((topic) => topic.id !== deleteTarget.id))
      toast.add({ type: 'success', title: 'Topic deleted', description: `${deleteTarget.title} was removed.` })
      setDeleteTarget(null)
    } catch (reason) {
      toast.add({ type: 'error', title: 'Unable to delete topic', description: getMessage(reason, 'Try again.') })
    } finally {
      setIsDeleting(false)
    }
  }

  const moveTopic = async (topic: SyllabusTopic, offset: -1 | 1) => {
    const index = gradeTopics.indexOf(topic)
    const targetIndex = index + offset
    if (targetIndex < 0 || targetIndex >= gradeTopics.length) return
    const reordered = [...gradeTopics]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
    setIsReordering(true)
    try {
      replaceGradeTopics(await reorderAdminSyllabusTopics(grade, reordered.map((topic) => topic.id)))
    } catch (reason) {
      toast.add({ type: 'error', title: 'Unable to reorder topics', description: getMessage(reason, 'Try again.') })
    } finally {
      setIsReordering(false)
    }
  }

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress aria-label="Loading syllabus topics" /></Box>
  if (loadError) return <Alert severity="error">{loadError}</Alert>

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" sx={{ mb: 0.75 }}>Syllabus Topics</Typography>
        <Typography color="text.secondary">The official Ministry exam topics for each grade. Every Ministry Exam Prep class at a grade is measured against this list.</Typography>
      </Box>

      <Tabs value={grade} onChange={(_, nextGrade: number) => { setGrade(nextGrade); setPage(1) }} aria-label="Syllabus grade">
        {syllabusGrades.map((gradeLevel) => <Tab key={gradeLevel} value={gradeLevel} label={`Grade ${gradeLevel} (${topics.filter((topic) => topic.grade === gradeLevel).length})`} />)}
      </Tabs>

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <TextField size="small" type="search" placeholder="Filter topics" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} sx={{ width: 320, maxWidth: '100%' }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add topic</Button>
      </Stack>
      <Typography color="text.secondary" variant="body2">
        {normalizedSearch
          ? `${matchingTopics.length} of ${gradeTopics.length} topics match. Clear the filter to reorder.`
          : `${gradeTopics.length} official ${gradeTopics.length === 1 ? 'topic' : 'topics'} for Grade ${grade}`}
      </Typography>

      {gradeTopics.length === 0 && (
        <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>No official topics yet</Typography>
          <Typography color="text.secondary" variant="body2">Add the Grade {grade} syllabus topics in the order they should appear.</Typography>
        </Paper>
      )}

      {gradeTopics.length > 0 && matchingTopics.length === 0 && (
        <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>No topics match &ldquo;{search.trim()}&rdquo;</Typography>
        </Paper>
      )}

      {visibleTopics.map((topic) => (
        <Paper key={topic.id} elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography color="text.secondary" sx={{ minWidth: 28, fontWeight: 700 }}>{gradeTopics.indexOf(topic) + 1}</Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>{topic.title}</Typography>
            {topic.description && <Typography variant="body2" color="text.secondary">{topic.description}</Typography>}
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Move up"><span><IconButton aria-label={`Move ${topic.title} up`} disabled={!canReorder || gradeTopics.indexOf(topic) === 0 || isReordering} onClick={() => void moveTopic(topic, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
            <Tooltip title="Move down"><span><IconButton aria-label={`Move ${topic.title} down`} disabled={!canReorder || gradeTopics.indexOf(topic) === gradeTopics.length - 1 || isReordering} onClick={() => void moveTopic(topic, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
            <Tooltip title="Edit topic"><IconButton aria-label={`Edit ${topic.title}`} onClick={() => openEdit(topic)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Delete topic"><IconButton aria-label={`Delete ${topic.title}`} color="error" onClick={() => setDeleteTarget(topic)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
          </Stack>
        </Paper>
      ))}

      {matchingTopics.length > pageSize && (
        <Stack alignItems="center">
          <Pagination count={pageCount} page={currentPage} onChange={(_, nextPage) => setPage(nextPage)} color="primary" />
        </Stack>
      )}

      <Dialog open={editor !== null} onClose={() => !isSaving && setEditor(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editor?.mode === 'edit' ? 'Edit topic' : `Add Grade ${grade} topic`}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField required fullWidth label="Short title" placeholder="Newton's Third Law" value={form.title} inputProps={{ maxLength: 200 }} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <TextField fullWidth multiline minRows={3} label="Description (optional)" value={form.description} inputProps={{ maxLength: 1000 }} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditor(null)} disabled={isSaving}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveTopic()} disabled={isSaving || !form.title.trim()}>{isSaving ? 'Saving...' : 'Save topic'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteTarget !== null} onClose={() => !isDeleting && setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete topic?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">&ldquo;{deleteTarget?.title}&rdquo; will be removed from the official list. Lessons tagged with it will stop counting toward syllabus coverage.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void deleteTopic()} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default SyllabusTopicsPage
