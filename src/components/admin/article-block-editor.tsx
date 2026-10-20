import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
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
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { type FC, type ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/components/toast'
import { sanitizeArticleHtml } from '@/lib/article-content'
import { type AdminLesson } from './admin-data'

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
  const selectionRef = useRef<Range | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [headerError, setHeaderError] = useState<string | null>(null)
  const initialHtml = useMemo(() => initialArticleHtml(lesson), [lesson.id])

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
    onChange({ ...lesson, articleBody, articleBlocks: undefined })
    saveSelection()
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
  const separators = <Box aria-hidden="true" sx={{ width: 1, height: 22, mx: 0.25, bgcolor: 'divider', flexShrink: 0 }} />

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
      <Stack direction="row" alignItems="center" spacing={0.25} sx={{ minWidth: 0, p: 0.5, flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden', borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.default', scrollbarWidth: 'thin', '& > *': { flexShrink: 0 }, '&::-webkit-scrollbar': { height: 5 }, '&::-webkit-scrollbar-thumb': { borderRadius: 4, backgroundColor: 'divider' } }} onMouseUp={saveSelection}>
        <FormControl size="small" sx={{ minWidth: 96 }}><Select value="p" inputProps={{ 'aria-label': 'Paragraph style' }} onChange={(event) => runCommand('formatBlock', `<${event.target.value}>`)} sx={{ height: 30, fontSize: 11 }}><MenuItem value="p">Paragraph</MenuItem><MenuItem value="h1">Heading 1</MenuItem><MenuItem value="h2">Heading 2</MenuItem><MenuItem value="h3">Heading 3</MenuItem><MenuItem value="blockquote">Quote</MenuItem><MenuItem value="pre">Code block</MenuItem></Select></FormControl>
        <FormControl size="small" sx={{ minWidth: 102 }}><Select value="Arial" inputProps={{ 'aria-label': 'Font family' }} onChange={(event) => runCommand('fontName', event.target.value)} sx={{ height: 30, fontSize: 11 }}><MenuItem value="Arial">Arial</MenuItem><MenuItem value="Georgia">Georgia</MenuItem><MenuItem value="Times New Roman">Times New Roman</MenuItem><MenuItem value="Verdana">Verdana</MenuItem><MenuItem value="monospace">Monospace</MenuItem></Select></FormControl>
        <FormControl size="small" sx={{ minWidth: 62 }}><Select value="3" inputProps={{ 'aria-label': 'Font size' }} onChange={(event) => runCommand('fontSize', event.target.value)} sx={{ height: 30, fontSize: 11 }}>{[['2', '10 pt'], ['3', '12 pt'], ['4', '14 pt'], ['5', '18 pt'], ['6', '24 pt'], ['7', '36 pt']].map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl>
        {separators}
        {toolbarButton('Bold', <FormatBoldIcon fontSize="small" />, () => runCommand('bold'))}
        {toolbarButton('Italic', <FormatItalicIcon fontSize="small" />, () => runCommand('italic'))}
        {toolbarButton('Underline', <FormatUnderlinedIcon fontSize="small" />, () => runCommand('underline'))}
        {toolbarButton('Strikethrough', <StrikethroughSIcon fontSize="small" />, () => runCommand('strikeThrough'))}
        <Tooltip title="Text color"><Box component="label" sx={{ display: 'inline-flex', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', color: 'text.secondary' }}><FormatColorTextIcon fontSize="small" /><input aria-label="Text color" type="color" defaultValue="#17324d" onMouseDown={saveSelection} onChange={(event) => runCommand('foreColor', event.target.value)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} /></Box></Tooltip>
        <Tooltip title="Highlight color"><Box component="label" sx={{ display: 'inline-flex', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', color: 'text.secondary' }}><FormatColorFillIcon fontSize="small" /><input aria-label="Highlight color" type="color" defaultValue="#fff2a8" onMouseDown={saveSelection} onChange={(event) => runCommand('hiliteColor', event.target.value)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} /></Box></Tooltip>
        {separators}
        {toolbarButton('Align left', <FormatAlignLeftIcon fontSize="small" />, () => runCommand('justifyLeft'))}
        {toolbarButton('Align center', <FormatAlignCenterIcon fontSize="small" />, () => runCommand('justifyCenter'))}
        {toolbarButton('Align right', <FormatAlignRightIcon fontSize="small" />, () => runCommand('justifyRight'))}
        {toolbarButton('Justify', <FormatAlignJustifyIcon fontSize="small" />, () => runCommand('justifyFull'))}
        {toolbarButton('Numbered list', <FormatListNumberedIcon fontSize="small" />, () => runCommand('insertOrderedList'))}
        {toolbarButton('Bulleted list', <FormatListBulletedIcon fontSize="small" />, () => runCommand('insertUnorderedList'))}
        {toolbarButton('Decrease indent', <FormatIndentDecreaseIcon fontSize="small" />, () => runCommand('outdent'))}
        {toolbarButton('Increase indent', <FormatIndentIncreaseIcon fontSize="small" />, () => runCommand('indent'))}
        {separators}
        {toolbarButton('Insert hyperlink', <InsertLinkOutlinedIcon fontSize="small" />, insertLink)}
        {toolbarButton('Insert equation', <FunctionsIcon fontSize="small" />, insertEquation)}
        {toolbarButton('Insert table', <TableChartOutlinedIcon fontSize="small" />, insertTable)}
        {toolbarButton('Insert image', <ImageOutlinedIcon fontSize="small" />, () => imageInputRef.current?.click())}
        <input ref={imageInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload inline lesson image" onChange={(event) => { const [file] = Array.from(event.target.files ?? []); void insertInlineImage(file); event.target.value = '' }} />
        {toolbarButton('Embed video', <VideoLibraryOutlinedIcon fontSize="small" />, insertVideo)}
        {toolbarButton('Insert code block', <CodeOutlinedIcon fontSize="small" />, insertCode)}
        {separators}
        {toolbarButton('Undo', <UndoOutlinedIcon fontSize="small" />, () => runCommand('undo'))}
        {toolbarButton('Redo', <RedoOutlinedIcon fontSize="small" />, () => runCommand('redo'))}
      </Stack>
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Article content editor"
        aria-multiline="true"
        onInput={updateArticle}
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
          '& figure img': { display: 'block', width: '100%', maxHeight: 560, objectFit: 'contain', mx: 'auto', borderRadius: 1.5 },
          '& figcaption': { mt: 1, color: 'text.secondary', fontSize: 13, outline: 0 },
          '& iframe': { width: '100%', maxWidth: 760, minHeight: 220, border: 0, borderRadius: 1.5 },
          '& table': { width: '100%', borderCollapse: 'collapse', my: 2 },
          '& td, & th': { minWidth: 80, border: 1, borderColor: 'divider', p: 1, textAlign: 'left' },
          '& pre': { p: 2, overflowX: 'auto', borderRadius: 1.5, backgroundColor: 'action.hover', fontFamily: 'monospace', lineHeight: 1.5 },
          '& blockquote': { mx: 0, my: 2, pl: 2, borderLeft: 3, borderColor: 'primary.main', color: 'text.secondary' },
        }}
      />
    </Paper>
  </Stack>
}

export default ArticleBlockEditor
