const allowedTags = new Set(['A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'FIGCAPTION', 'FIGURE', 'FONT', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'I', 'IFRAME', 'IMG', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUP', 'TABLE', 'TBODY', 'TD', 'TH', 'THEAD', 'TR', 'U', 'UL', 'VIDEO'])
const blockedTags = new Set(['SCRIPT', 'STYLE', 'SVG', 'MATH', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'LINK', 'META'])

const safeLink = (value: string) => /^(https?:|mailto:)/i.test(value.trim())
const safeImage = (value: string) => /^data:image\/(?:webp|png|jpeg|gif);base64,/i.test(value) || /^https:\/\//i.test(value)
const safeVideoEmbed = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ((url.hostname === 'www.youtube-nocookie.com' && url.pathname.startsWith('/embed/')) || (url.hostname === 'player.vimeo.com' && url.pathname.startsWith('/video/')))
  } catch {
    return false
  }
}

const safeStyle = (value: string) => value.split(';').flatMap((declaration) => {
  const [rawProperty, ...rawValue] = declaration.split(':')
  const property = rawProperty.trim().toLowerCase()
  const content = rawValue.join(':').trim()
  if (!content || /url\s*\(|expression\s*\(|javascript:/i.test(content)) return []
  if (property === 'color' || property === 'background-color') return /^(#[\da-f]{3,8}|rgba?\([\d.%\s,]+\)|[a-z]{3,20})$/i.test(content) ? [`${property}:${content}`] : []
  if (property === 'font-family') return /^[\w\s,"'-]+$/.test(content) ? [`${property}:${content}`] : []
  if (property === 'font-size') return /^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/i.test(content) ? [`${property}:${content}`] : []
  if (property === 'text-align') return /^(left|right|center|justify)$/i.test(content) ? [`${property}:${content}`] : []
  if (property === 'margin-left') return /^\d+(?:\.\d+)?(?:px|em|rem|%)$/i.test(content) ? [`${property}:${content}`] : []
  if (property === 'text-decoration') return /^(underline|line-through|none)$/i.test(content) ? [`${property}:${content}`] : []
  if (property === 'font-weight') return /^(bold|normal|[1-9]00)$/i.test(content) ? [`${property}:${content}`] : []
  if (property === 'font-style') return /^(italic|normal)$/i.test(content) ? [`${property}:${content}`] : []
  return []
}).join(';')

const copySafeNode = (node: Node, target: Node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    target.appendChild(document.createTextNode(node.textContent ?? ''))
    return
  }
  if (!(node instanceof Element)) return
  const tag = node.tagName.toUpperCase()
  if (blockedTags.has(tag)) return
  if (!allowedTags.has(tag)) {
    node.childNodes.forEach((child) => copySafeNode(child, target))
    return
  }
  if (tag === 'DIV' && node.hasAttribute('data-checkpoint-id')) {
    const checkpointId = node.getAttribute('data-checkpoint-id') ?? ''
    if (!/^\d+$/.test(checkpointId)) return
    const marker = document.createElement('div')
    marker.setAttribute('data-checkpoint-id', checkpointId)
    marker.setAttribute('contenteditable', 'false')
    marker.textContent = node.textContent ?? ''
    target.appendChild(marker)
    return
  }
  if (tag === 'IFRAME' && !safeVideoEmbed(node.getAttribute('src') ?? '')) return
  if (tag === 'IMG' && !safeImage(node.getAttribute('src') ?? '')) return

  const clean = document.createElement(tag.toLowerCase())
  if (tag === 'A') {
    const href = node.getAttribute('href') ?? ''
    if (safeLink(href)) {
      clean.setAttribute('href', href)
      clean.setAttribute('target', '_blank')
      clean.setAttribute('rel', 'noopener noreferrer')
    }
  }
  if (tag === 'IMG') {
    clean.setAttribute('src', node.getAttribute('src') ?? '')
    clean.setAttribute('alt', node.getAttribute('alt') ?? '')
    clean.setAttribute('loading', 'lazy')
  }
  if (tag === 'IFRAME') {
    clean.setAttribute('src', node.getAttribute('src') ?? '')
    clean.setAttribute('title', node.getAttribute('title') || 'Embedded video')
    clean.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share')
    clean.setAttribute('allowfullscreen', '')
    clean.setAttribute('loading', 'lazy')
  }
  if (tag === 'FONT') {
    const face = node.getAttribute('face') ?? ''
    const color = node.getAttribute('color') ?? ''
    const size = node.getAttribute('size') ?? ''
    if (/^[\w\s,"'-]+$/.test(face)) clean.setAttribute('face', face)
    if (/^(#[\da-f]{3,8}|[a-z]{3,20})$/i.test(color)) clean.setAttribute('color', color)
    if (/^[1-7]$/.test(size)) clean.setAttribute('size', size)
  }
  if (node.hasAttribute('style')) {
    const style = safeStyle(node.getAttribute('style') ?? '')
    if (style) clean.setAttribute('style', style)
  }
  if (tag === 'TD' || tag === 'TH') {
    for (const attribute of ['colspan', 'rowspan']) {
      const value = node.getAttribute(attribute)
      if (value && /^[1-9]\d?$/.test(value)) clean.setAttribute(attribute, value)
    }
  }
  node.childNodes.forEach((child) => copySafeNode(child, clean))
  target.appendChild(clean)
}

export const sanitizeArticleHtml = (html: string) => {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const clean = document.createElement('div')
  parsed.body.childNodes.forEach((child) => copySafeNode(child, clean))
  return clean.innerHTML
}

export const getArticleWordCount = (html: string) => {
  const parsed = new DOMParser().parseFromString(sanitizeArticleHtml(html), 'text/html')
  return (parsed.body.textContent ?? '').trim().split(/\s+/).filter(Boolean).length
}
