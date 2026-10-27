export interface ArticleCheckpoint {
  id: number
  question: string
  options: string[]
  correctOption: number
  explanation: string
}

export type LearnerArticleCheckpoint = Pick<ArticleCheckpoint, 'id' | 'question' | 'options'>

export type ArticleFragment = { type: 'html'; html: string } | { type: 'checkpoint'; id: number }

const markerPattern = /<div data-checkpoint-id="(\d+)"[^>]*>[\s\S]*?<\/div>/g

const escapeText = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)

export const getCheckpointLabel = (question: string) => question.trim() ? `Pause & Check: ${question.trim()}` : 'Pause & Check'

export const getCheckpointMarkerHtml = (id: number, question: string) => `<div data-checkpoint-id="${id}" contenteditable="false">${escapeText(getCheckpointLabel(question))}</div>`

export const splitArticleFragments = (html: string): ArticleFragment[] => {
  const fragments: ArticleFragment[] = []
  let cursor = 0
  for (const match of html.matchAll(markerPattern)) {
    const index = match.index ?? 0
    if (index > cursor) fragments.push({ type: 'html', html: html.slice(cursor, index) })
    fragments.push({ type: 'checkpoint', id: Number(match[1]) })
    cursor = index + match[0].length
  }
  if (cursor < html.length) fragments.push({ type: 'html', html: html.slice(cursor) })
  return fragments
}

export const getCheckpointIdsInOrder = (html: string) => splitArticleFragments(html).flatMap((fragment) => fragment.type === 'checkpoint' ? [fragment.id] : [])
