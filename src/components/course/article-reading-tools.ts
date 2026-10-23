import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

export type ReadAloudStatus = 'idle' | 'playing' | 'paused'

interface ReadingSegment {
  block: HTMLElement
  start: number
  end: number
  text: string
}

interface HighlightRegistry {
  set: (name: string, highlight: unknown) => void
  delete: (name: string) => void
}

type HighlightConstructor = new (range: Range) => unknown

const HIGHLIGHT_NAME = 'article-read-aloud'
const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, div'
const SENTENCE_PATTERN = /[^.!?]+(?:[.!?]+["'”’)\]]*)?|[.!?]+/g
const WORD_PATTERN = /^[\p{L}\p{M}'’-]+$/u

export const normalizeWord = (word: string) => word.trim().toLowerCase().replace(/^['’-]+|['’-]+$/g, '')

export const isSingleWord = (text: string) => WORD_PATTERN.test(text)

const isWordCharacter = (character: string | undefined) => Boolean(character && /[\p{L}\p{M}'’-]/u.test(character))

const caretAt = (x: number, y: number): { node: Node; offset: number } | null => {
  const range = document.caretRangeFromPoint?.(x, y)
  if (range) return { node: range.startContainer, offset: range.startOffset }
  const position = document.caretPositionFromPoint?.(x, y)
  return position ? { node: position.offsetNode, offset: position.offset } : null
}

export const getWordAtPoint = (x: number, y: number): string | null => {
  const caret = caretAt(x, y)
  if (!caret || caret.node.nodeType !== Node.TEXT_NODE) return null
  const text = caret.node.textContent ?? ''
  let start = caret.offset
  let end = caret.offset
  while (start > 0 && isWordCharacter(text[start - 1])) start -= 1
  while (end < text.length && isWordCharacter(text[end])) end += 1
  const word = text.slice(start, end).replace(/^['’-]+|['’-]+$/g, '')
  return word || null
}

const sentencesOf = (text: string) => Array.from(text.matchAll(SENTENCE_PATTERN), (match) => {
  const leading = match[0].length - match[0].trimStart().length
  return { start: (match.index ?? 0) + leading, text: match[0].trim() }
}).filter((sentence) => sentence.text)

const collectSegments = (root: HTMLElement): ReadingSegment[] => Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR))
  .filter((block) => !block.querySelector(BLOCK_SELECTOR))
  .flatMap((block) => sentencesOf(block.textContent ?? '').map((sentence) => ({
    block,
    start: sentence.start,
    end: sentence.start + sentence.text.length,
    text: sentence.text,
  })))

const rangeWithin = (root: HTMLElement, start: number, end: number) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let offset = 0
  let started = false
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0
    if (!started && start < offset + length) {
      range.setStart(node, start - offset)
      started = true
    }
    if (started && end <= offset + length) {
      range.setEnd(node, end - offset)
      return range
    }
    offset += length
  }
  return null
}

const highlightRegistry = () => typeof CSS === 'undefined' ? undefined : (CSS as unknown as { highlights?: HighlightRegistry }).highlights

const highlightSegment = (segment: ReadingSegment) => {
  const registry = highlightRegistry()
  const Highlight = (globalThis as unknown as { Highlight?: HighlightConstructor }).Highlight
  const range = rangeWithin(segment.block, segment.start, segment.end)
  if (!registry || !Highlight || !range) return
  registry.set(HIGHLIGHT_NAME, new Highlight(range))
  segment.block.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

const clearHighlight = () => highlightRegistry()?.delete(HIGHLIGHT_NAME)

export const useReadAloud = (rootRef: RefObject<HTMLElement | null>, resetKey: unknown) => {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  const [status, setStatus] = useState<ReadAloudStatus>('idle')
  const [rate, setRate] = useState(1)
  const segmentsRef = useRef<ReadingSegment[]>([])
  const indexRef = useRef(0)
  const sessionRef = useRef(0)

  const stop = useCallback(() => {
    sessionRef.current += 1
    if (supported) window.speechSynthesis.cancel()
    clearHighlight()
    setStatus('idle')
  }, [supported])

  const speakFrom = useCallback((session: number, index: number, speed: number) => {
    const segment = segmentsRef.current[index]
    if (!segment) {
      stop()
      return
    }
    indexRef.current = index
    const utterance = new SpeechSynthesisUtterance(segment.text)
    utterance.rate = speed
    utterance.onstart = () => {
      if (session === sessionRef.current) highlightSegment(segment)
    }
    utterance.onend = () => {
      if (session === sessionRef.current) speakFrom(session, index + 1, speed)
    }
    utterance.onerror = (event) => {
      if (session === sessionRef.current && event.error !== 'interrupted' && event.error !== 'canceled') stop()
    }
    window.speechSynthesis.speak(utterance)
  }, [stop])

  const play = useCallback(() => {
    const root = rootRef.current
    if (!supported || !root) return
    segmentsRef.current = collectSegments(root)
    if (!segmentsRef.current.length) return
    sessionRef.current += 1
    window.speechSynthesis.cancel()
    setStatus('playing')
    speakFrom(sessionRef.current, 0, rate)
  }, [rootRef, supported, speakFrom, rate])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    setStatus('playing')
  }, [])

  const changeRate = useCallback((next: number) => {
    setRate(next)
    if (status === 'idle') return
    sessionRef.current += 1
    window.speechSynthesis.cancel()
    setStatus('playing')
    speakFrom(sessionRef.current, indexRef.current, next)
  }, [speakFrom, status])

  useEffect(() => stop, [resetKey, stop])

  return { supported, status, rate, setRate: changeRate, play, pause, resume, stop }
}
