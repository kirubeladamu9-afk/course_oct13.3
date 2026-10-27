import AddIcon from '@mui/icons-material/Add'
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import CloseIcon from '@mui/icons-material/Close'
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter'
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify'
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft'
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill'
import FormatColorTextIcon from '@mui/icons-material/FormatColorText'
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease'
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import FunctionsIcon from '@mui/icons-material/Functions'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import InsertLinkOutlinedIcon from '@mui/icons-material/InsertLinkOutlined'
import RedoOutlinedIcon from '@mui/icons-material/RedoOutlined'
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined'
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { type FC, type ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/components/toast'
import { sanitizeArticleHtml } from '@/lib/article-content'
import { type ArticleCheckpoint, getCheckpointIdsInOrder, getCheckpointLabel, getCheckpointMarkerHtml } from '@/lib/article-checkpoints'
import { getArticleSectionTitles } from '@/lib/article-sections'
import { type AdminLesson } from './admin-data'
import { ArticleCheckpointDialog, ArticleCheckpointList, ArticleHelpSettings } from './article-checkpoint-editor'

type Props = { lesson: AdminLesson; onChange: (lesson: AdminLesson) => void; readImage: (file: File) => Promise<string> }

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)

const initialArticleHtml = (lesson: AdminLesson) => {
  if (lesson.articleBody && /<[^>]+>/.test(lesson.articleBody)) return sanitizeArticleHtml(lesson.articleBody)
  if (lesson.articleBlocks?.length) return lesson.articleBlocks.map((block) => {
    if (block.type === 'image') return block.imageUrl ? `<figure><img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.caption || 'Article image')}"/><figcaption>${escapeHtml(block.caption)}</figcaption></figure><p><br></p>` : ''
    if (block.type === 'heading') return `<h2>${escapeHtml(block.text)}</h2>`
    return `<p>${escapeHtml(block.text).replace(/\n/g, '<br>')}</p>`
  }).join('')
  return (lesson.articleBody ?? '').split(/\n+/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('') || '<p><br></p>'
}

const syncCheckpoints = (articleBody: string, checkpoints: ArticleCheckpoint[] = []) => getCheckpointIdsInOrder(articleBody).flatMap((id) => {
  const checkpoint = checkpoints.find((item) => item.id === id)
  return checkpoint ? [checkpoint] : []
})

const getVideoEmbedUrl = (value: string) => {
  try {
    const url = new URL(value)
    if (url.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`
    if (url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com') {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (url.hostname === 'www.youtube-nocookie.com' && url.pathname.startsWith('/embed/')) return url.href
    if (url.hostname === 'vimeo.com' || url.hostname === 'www.vimeo.com') {
      const segments = url.pathname.split('/').filter(Boolean)
      const id = segments[segments.length - 1]
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
    }
    if (url.hostname === 'player.vimeo.com' && url.pathname.startsWith('/video/')) return url.href
  } catch {
    return null
  }
  return null
}

const ArticleBlockEditor: FC<Props> = ({ lesson, onChange, readImage }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorWrapperRef = useRef<HTMLDivElement>(null)
  const selectionRef = useRef<Range | null>(null)
  const selectedMediaRef = useRef<HTMLElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [headerError, setHeaderError] = useState<string | null>(null)
  const [toolbarTab, setToolbarTab] = useState(0)
  const [mediaDeletePosition, setMediaDeletePosition] = useState<{ top: number; left: number } | null>(null)
  const [checkpointDialog, setCheckpointDialog] = useState<{ checkpoint: ArticleCheckpoint; isNew: boolean } | null>(null)
  const initialHtml = useMemo(() => initialArticleHtml(lesson), [lesson.id])
  const sectionTitles = useMemo(() => /<h2\b/i.test(lesson.articleBody ?? '') ? getArticleSectionTitles(lesson.articleBody ?? '') : [], [lesson.articleBody])
  const orderedCheckpoints = useMemo(() => syncCheckpoints(lesson.articleBody ?? '', lesson.articleCheckpoints), [lesson.articleBody, lesson.articleCheckpoints])

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml
  }, [initialHtml])

  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) selectionRef.current = selection.getRangeAt(0).cloneRange()
  }

  const restoreSelection = () => {
    editorRef.current?.focus()
    if (!selectionRef.current) return
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(selectionRef.current)
  }

  const updateArticle = () => {
    if (!editorRef.current) return
    const articleBody = sanitizeArticleHtml(editorRef.current.innerHTML)
    onChange({ ...lesson, articleBody, articleBlocks: undefined, articleCheckpoints: syncCheckpoints(articleBody, lesson.articleCheckpoints) })
    saveSelection()
  }

  const findCheckpointMarker = (id: number) => editorRef.current?.querySelector(`[data-checkpoint-id="${id}"]`) ?? null

  const insertCheckpoint = () => {
    const editor = editorRef.current
    if (!editor) return
    const id = Date.now()
    const template = document.createElement('template')
    template.innerHTML = `${getCheckpointMarkerHtml(id, '')}<p><br></p>`
    let block: Node | null = selectionRef.current?.startContainer ?? null
    while (block && block.parentNode !== editor) block = block.parentNode
    if (block) (block as ChildNode).after(template.content)
    else editor.append(template.content)
    const newCheckpoint: ArticleCheckpoint = { id, question: '', options: ['', ''], correctOption: 0, explanation: '' }
    const articleBody = sanitizeArticleHtml(editor.innerHTML)
    onChange({ ...lesson, articleBody, articleBlocks: undefined, articleCheckpoints: syncCheckpoints(articleBody, [...(lesson.articleCheckpoints ?? []), newCheckpoint]) })
    setCheckpointDialog({ checkpoint: newCheckpoint, isNew: true })
  }

  const saveCheckpoint = (checkpoint: ArticleCheckpoint) => {
    const marker = findCheckpointMarker(checkpoint.id)
    if (marker) marker.textContent = getCheckpointLabel(checkpoint.question)
    const existing = lesson.articleCheckpoints ?? []
    const checkpoints = existing.some((item) => item.id === checkpoint.id) ? existing.map((item) => item.id === checkpoint.id ? checkpoint : item) : [...existing, checkpoint]
    const articleBody = editorRef.current ? sanitizeArticleHtml(editorRef.current.innerHTML) : lesson.articleBody ?? ''
    onChange({ ...lesson, articleBody, articleBlocks: undefined, articleCheckpoints: syncCheckpoints(articleBody, checkpoints) })
    setCheckpointDialog(null)
  }

  const cancelCheckpoint = () => {
    if (checkpointDialog?.isNew) {
      findCheckpointMarker(checkpointDialog.checkpoint.id)?.remove()
      updateArticle()
    }
    setCheckpointDialog(null)
  }

  const moveCheckpoint = (id: number, direction: -1 | 1) => {
    const marker = findCheckpointMarker(id)
    if (!marker) return
    if (direction < 0 && marker.previousElementSibling) marker.previousElementSibling.before(marker)
    if (direction > 0 && marker.nextElementSibling) marker.nextElementSibling.after(marker)
    updateArticle()
  }

  const deleteCheckpoint = (id: number) => {
    findCheckpointMarker(id)?.remove()
    updateArticle()
  }

  const selectArticleMedia = (media: HTMLImageElement | HTMLIFrameElement) => {
    const wrapper = editorWrapperRef.current
    if (!wrapper) return
    const mediaRect = media.getBoundingClientRect()
    const wrapperRect = wrapper.getBoundingClientRect()
    selectedMediaRef.current = media
    setMediaDeletePosition({ top: mediaRect.top - wrapperRect.top + wrapper.scrollTop + 6, left: mediaRect.right - wrapperRect.left + wrapper.scrollLeft - 34 })
  }

  const deleteSelectedMedia = () => {
    const media = selectedMediaRef.current
    if (!media) return
    const figure = media.closest('figure')
    if (figure) figure.remove()
    else media.remove()
    selectedMediaRef.current = null
    selectionRef.current = null
    setMediaDeletePosition(null)
    updateArticle()
  }

  const runCommand = (command: string, value?: string) => {
    restoreSelection()
    document.execCommand(command, false, value)
    updateArticle()
  }

  const insertHtml = (html: string) => {
    restoreSelection()
    document.execCommand('insertHTML', false, sanitizeArticleHtml(html))
    updateArticle()
  }

  const setHeaderImage = async (file: File) => {
    setHeaderError(null)
    try {
      onChange({ ...lesson, articleHeaderImageUrl: await readImage(file) })
    } catch (error) {
      setHeaderError(error instanceof Error ? error.message : 'This image could not be read.')
    }
  }

  const insertInlineImage = async (file?: File) => {
    if (!file) return
    try {
      const imageUrl = await readImage(file)
      insertHtml(`<figure><img src="${escapeHtml(imageUrl)}" alt=""/><figcaption>Write an image caption</figcaption></figure><p><br></p>`)
    } catch (error) {
      toast.add({ title: 'Unable to add image', description: error instanceof Error ? error.message : 'This image could not be read.', type: 'error' })
    }
  }

  const insertLink = () => {
    const url = window.prompt('Enter the link URL')?.trim()
    if (!url) return
    runCommand('createLink', url)
  }

  const insertEquation = () => {
    const equation = window.prompt('Enter a mathematical expression')?.trim()
    if (equation) insertHtml(`<span style="font-family:serif;font-size:1.1em">${escapeHtml(equation)}</span>`)
  }

  const insertTable = () => {
    const headings = Array.from({ length: 3 }, (_, index) => `<th><p>Header ${index + 1}</p></th>`).join('')
    const rows = Array.from({ length: 2 }, () => `<tr>${Array.from({ length: 3 }, () => '<td><p><br></p></td>').join('')}</tr>`).join('')
    insertHtml(`<table><thead><tr>${headings}</tr></thead><tbody>${rows}</tbody></table><p><br></p>`)
  }

  const insertVideo = () => {
    const input = window.prompt('Paste a YouTube or Vimeo video URL')?.trim()
    if (!input) return
    const src = getVideoEmbedUrl(input)
    if (!src) {
      toast.add({ title: 'Unsupported video link', description: 'Use a YouTube or Vimeo video URL.', type: 'error' })
      return
    }
    insertHtml(`<figure><iframe src="${escapeHtml(src)}" title="Embedded lesson video" width="100%" height="360" allowfullscreen></iframe><figcaption>Video caption</figcaption></figure><p><br></p>`)
  }

  const insertCode = () => {
    const language = window.prompt('Code language (optional)')?.trim()
    if (language === null) return
    insertHtml(`<pre><code>${language ? `// ${escapeHtml(language)}\n` : ''}Write or paste code here…</code></pre><p><br></p>`)
  }

  const toolbarButton = (label: string, icon: ReactElement, action: () => void) => <Tooltip key={label} title={label}><IconButton size="small" aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={action} sx={{ width: 30, height: 30, p: 0.5, borderRadius: 1, color: 'text.secondary' }}>{icon}</IconButton></Tooltip>
  const separators = <Box aria-hidden="true" sx={{ width: 1, height: 22, mx: 0.5, bgcolor: 'divider', flexShrink: 0 }} />

  return <Stack spacing={1.5}>
    <Paper elevation={0} sx={{ p: { xs: 1.25, sm: 1.75 }, border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.paper' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        {lesson.articleHeaderImageUrl && <Box component="img" src={lesson.articleHeaderImageUrl} alt="Lesson header preview" sx={{ width: { xs: '100%', sm: 190 }, height: 96, objectFit: 'cover', borderRadius: 1.5 }} />}
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Optional header image</Typography><Typography variant="caption" color="text.secondary">Shown above the lesson content; separate from images inserted in the document.</Typography></Box>
        <Stack direction="row" spacing={0.75}>
          <Button component="label" size="small" variant="outlined" startIcon={<AddPhotoAlternateOutlinedIcon />}>{lesson.articleHeaderImageUrl ? 'Replace header image' : 'Choose header image'}<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const [file] = Array.from(event.target.files ?? []); if (file) void setHeaderImage(file); event.target.value = '' }} /></Button>
          {lesson.articleHeaderImageUrl && <IconButton size="small" color="error" aria-label="Remove header image" onClick={() => onChange({ ...lesson, articleHeaderImageUrl: undefined })}><DeleteOutlineIcon fontSize="small" /></IconButton>}
        </Stack>
      </Stack>
      {headerError && <Alert severity="error" sx={{ mt: 1.5 }}>{headerError}</Alert>}
    </Paper>

    <Paper elevation={0} sx={{ overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.paper' }}>
      <Tabs value={toolbarTab} onChange={(_, value: number) => setToolbarTab(value)} aria-label="Article formatting tools" variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ minHeight: 40, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.default', '& .MuiTab-root': { minHeight: 40, minWidth: 72, px: 1.5, fontSize: 12, textTransform: 'none' } }}>
        <Tab id="article-toolbar-tab-0" aria-controls="article-toolbar-panel-0" label="Text" />
        <Tab id="article-toolbar-tab-1" aria-controls="article-toolbar-panel-1" label="Layout" />
        <Tab id="article-toolbar-tab-2" aria-controls="article-toolbar-panel-2" label="Insert" />
        <Tab id="article-toolbar-tab-3" aria-controls="article-toolbar-panel-3" label="History" />
      </Tabs>
      <Box role="tabpanel" id={`article-toolbar-panel-${toolbarTab}`} aria-labelledby={`article-toolbar-tab-${toolbarTab}`} onMouseUp={saveSelection} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 42, p: 0.75, flexWrap: 'wrap' }}>
        {toolbarTab === 0 && <>
          <FormControl size="small" sx={{ width: 100, minWidth: 0 }}><Select value="p" inputProps={{ 'aria-label': 'Paragraph style' }} onChange={(event) => runCommand('formatBlock', `<${event.target.value}>`)} sx={{ width: '100%', height: 30, minWidth: 0, fontSize: 11, '& .MuiSelect-select': { py: 0.5, pl: 0.75, pr: '18px !important' }, '& .MuiSelect-icon': { right: 1, width: 16 } }}><MenuItem value="p">Paragraph</MenuItem><MenuItem value="h1">Heading 1</MenuItem><MenuItem value="h2">Heading 2</MenuItem><MenuItem value="h3">Heading 3</MenuItem><MenuItem value="blockquote">Quote</MenuItem><MenuItem value="pre">Code block</MenuItem></Select></FormControl>
          <FormControl size="small" sx={{ width: 88, minWidth: 0 }}><Select value="Arial" inputProps={{ 'aria-label': 'Font family' }} onChange={(event) => runCommand('fontName', event.target.value)} sx={{ width: '100%', height: 30, minWidth: 0, fontSize: 11, '& .MuiSelect-select': { py: 0.5, pl: 0.75, pr: '18px !important' }, '& .MuiSelect-icon': { right: 1, width: 16 } }}><MenuItem value="Arial">Arial</MenuItem><MenuItem value="Georgia">Georgia</MenuItem><MenuItem value="Times New Roman">Times New Roman</MenuItem><MenuItem value="Verdana">Verdana</MenuItem><MenuItem value="monospace">Monospace</MenuItem></Select></FormControl>
          <FormControl size="small" sx={{ width: 64, minWidth: 0 }}><Select value="3" inputProps={{ 'aria-label': 'Font size' }} onChange={(event) => runCommand('fontSize', event.target.value)} sx={{ width: '100%', height: 30, minWidth: 0, fontSize: 11, '& .MuiSelect-select': { py: 0.5, pl: 0.75, pr: '18px !important' }, '& .MuiSelect-icon': { right: 1, width: 16 } }}>{[['2', '10 pt'], ['3', '12 pt'], ['4', '14 pt'], ['5', '18 pt'], ['6', '24 pt'], ['7', '36 pt']].map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl>
          {separators}
          {toolbarButton('Bold', <FormatBoldIcon fontSize="small" />, () => runCommand('bold'))}
          {toolbarButton('Italic', <FormatItalicIcon fontSize="small" />, () => runCommand('italic'))}
          {toolbarButton('Underline', <FormatUnderlinedIcon fontSize="small" />, () => runCommand('underline'))}
          {toolbarButton('Strikethrough', <StrikethroughSIcon fontSize="small" />, () => runCommand('strikeThrough'))}
          <Tooltip title="Text color"><Box component="label" sx={{ display: 'inline-flex', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', color: 'text.secondary' }}><FormatColorTextIcon fontSize="small" /><input aria-label="Text color" type="color" defaultValue="#17324d" onMouseDown={saveSelection} onChange={(event) => runCommand('foreColor', event.target.value)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} /></Box></Tooltip>
          <Tooltip title="Highlight color"><Box component="label" sx={{ display: 'inline-flex', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', color: 'text.secondary' }}><FormatColorFillIcon fontSize="small" /><input aria-label="Highlight color" type="color" defaultValue="#fff2a8" onMouseDown={saveSelection} onChange={(event) => runCommand('hiliteColor', event.target.value)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} /></Box></Tooltip>
        </>}
        {toolbarTab === 1 && <>
          {toolbarButton('Align left', <FormatAlignLeftIcon fontSize="small" />, () => runCommand('justifyLeft'))}
          {toolbarButton('Align center', <FormatAlignCenterIcon fontSize="small" />, () => runCommand('justifyCenter'))}
          {toolbarButton('Align right', <FormatAlignRightIcon fontSize="small" />, () => runCommand('justifyRight'))}
          {toolbarButton('Justify', <FormatAlignJustifyIcon fontSize="small" />, () => runCommand('justifyFull'))}
          {separators}
          {toolbarButton('Numbered list', <FormatListNumberedIcon fontSize="small" />, () => runCommand('insertOrderedList'))}
          {toolbarButton('Bulleted list', <FormatListBulletedIcon fontSize="small" />, () => runCommand('insertUnorderedList'))}
          {toolbarButton('Decrease indent', <FormatIndentDecreaseIcon fontSize="small" />, () => runCommand('outdent'))}
          {toolbarButton('Increase indent', <FormatIndentIncreaseIcon fontSize="small" />, () => runCommand('indent'))}
        </>}
        {toolbarTab === 2 && <>
          {toolbarButton('Insert hyperlink', <InsertLinkOutlinedIcon fontSize="small" />, insertLink)}
          {toolbarButton('Insert equation', <FunctionsIcon fontSize="small" />, insertEquation)}
          {toolbarButton('Insert table', <TableChartOutlinedIcon fontSize="small" />, insertTable)}
          {toolbarButton('Insert image', <ImageOutlinedIcon fontSize="small" />, () => imageInputRef.current?.click())}
          <input ref={imageInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload inline lesson image" onChange={(event) => { const [file] = Array.from(event.target.files ?? []); void insertInlineImage(file); event.target.value = '' }} />
          {toolbarButton('Embed video', <VideoLibraryOutlinedIcon fontSize="small" />, insertVideo)}
          {toolbarButton('Insert code block', <CodeOutlinedIcon fontSize="small" />, insertCode)}
          {separators}
          <Button size="small" variant="outlined" color="inherit" startIcon={<AddIcon />} onMouseDown={(event) => event.preventDefault()} onClick={insertCheckpoint} sx={{ textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}>Add Pause &amp; Check</Button>
        </>}
        {toolbarTab === 3 && <>
          {toolbarButton('Undo', <UndoOutlinedIcon fontSize="small" />, () => runCommand('undo'))}
          {toolbarButton('Redo', <RedoOutlinedIcon fontSize="small" />, () => runCommand('redo'))}
        </>}
      </Box>
      <Box ref={editorWrapperRef} onFocusCapture={(event) => { if (event.target instanceof HTMLIFrameElement) selectArticleMedia(event.target) }} sx={{ position: 'relative' }}>
        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label="Article content editor"
          aria-multiline="true"
          onInput={updateArticle}
          onClick={(event) => {
            const target = event.target
            const checkpointMarker = target instanceof Element ? target.closest('[data-checkpoint-id]') : null
            if (checkpointMarker) {
              const checkpoint = lesson.articleCheckpoints?.find((item) => item.id === Number(checkpointMarker.getAttribute('data-checkpoint-id')))
              if (checkpoint) setCheckpointDialog({ checkpoint, isNew: false })
              return
            }
            if (target instanceof HTMLImageElement || target instanceof HTMLIFrameElement) selectArticleMedia(target)
            else {
              selectedMediaRef.current = null
              setMediaDeletePosition(null)
            }
          }}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onBlur={saveSelection}
          onPaste={(event) => {
            const html = event.clipboardData.getData('text/html')
            if (!html) return
            event.preventDefault()
            insertHtml(html)
          }}
          sx={{
            minHeight: { xs: 360, md: 520 },
            p: { xs: 2, sm: 3.5, md: 5 },
            outline: 0,
            color: 'text.primary',
            fontFamily: 'Arial, sans-serif',
            fontSize: 15,
            lineHeight: 1.8,
            overflowWrap: 'anywhere',
            '&:empty:before': { content: '"Start writing your lesson…"', color: 'text.disabled', pointerEvents: 'none' },
            '& h1, & h2, & h3, & h4, & h5, & h6': { lineHeight: 1.3, mt: 2.5, mb: 1 },
            '& p': { my: 1.25 },
            '& figure': { mx: 0, my: 3, textAlign: 'center' },
            '& figure img': { display: 'block', width: '100%', maxHeight: 560, objectFit: 'contain', mx: 'auto', borderRadius: 1.5, cursor: 'pointer' },
            '& figcaption': { mt: 1, color: 'text.secondary', fontSize: 13, outline: 0 },
            '& iframe': { width: '100%', maxWidth: 760, minHeight: 220, border: 0, borderRadius: 1.5, cursor: 'pointer' },
            '& table': { width: '100%', borderCollapse: 'collapse', my: 2 },
            '& td, & th': { minWidth: 80, border: 1, borderColor: 'divider', p: 1, textAlign: 'left' },
            '& pre': { p: 2, overflowX: 'auto', borderRadius: 1.5, backgroundColor: 'action.hover', fontFamily: 'monospace', lineHeight: 1.5 },
            '& blockquote': { mx: 0, my: 2, pl: 2, borderLeft: 3, borderColor: 'primary.main', color: 'text.secondary' },
            '& [data-checkpoint-id]': { my: 2, px: 2, py: 1.25, borderLeft: 4, borderColor: 'primary.main', borderRadius: 1.5, backgroundColor: 'action.hover', color: 'primary.dark', fontWeight: 700, fontSize: 14, cursor: 'pointer', userSelect: 'none' },
          }}
        />
        {mediaDeletePosition && <IconButton aria-label="Delete selected image or video" title="Delete embedded media" onMouseDown={(event) => event.preventDefault()} onClick={deleteSelectedMedia} sx={{ position: 'absolute', top: mediaDeletePosition.top, left: mediaDeletePosition.left, zIndex: 2, width: 30, height: 30, color: 'common.white', backgroundColor: 'error.main', boxShadow: 2, '&:hover': { backgroundColor: 'error.dark' } }}><CloseIcon fontSize="small" /></IconButton>}
      </Box>
    </Paper>
    <ArticleCheckpointList checkpoints={orderedCheckpoints} onEdit={(id) => { const checkpoint = lesson.articleCheckpoints?.find((item) => item.id === id); if (checkpoint) setCheckpointDialog({ checkpoint, isNew: false }) }} onMove={moveCheckpoint} onDelete={deleteCheckpoint} />
    <ArticleHelpSettings sectionTitles={sectionTitles} disabledSections={lesson.articleHelpDisabledSections ?? []} onChange={(disabledSections) => onChange({ ...lesson, articleHelpDisabledSections: disabledSections })} />
    {checkpointDialog && <ArticleCheckpointDialog key={checkpointDialog.checkpoint.id} checkpoint={checkpointDialog.checkpoint} onSave={saveCheckpoint} onCancel={cancelCheckpoint} />}
  </Stack>
}

export default ArticleBlockEditor
