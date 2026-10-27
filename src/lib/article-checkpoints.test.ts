import { describe, expect, it } from 'vitest'
import { getCheckpointIdsInOrder, getCheckpointMarkerHtml, splitArticleFragments } from './article-checkpoints'

describe('article checkpoint markers', () => {
  it('splits article HTML at each checkpoint marker in document order', () => {
    const html = `<h2>Gravity</h2><p>First.</p>${getCheckpointMarkerHtml(11, 'What pulls planets?')}<p>Second.</p>${getCheckpointMarkerHtml(12, '')}`

    expect(splitArticleFragments(html)).toEqual([
      { type: 'html', html: '<h2>Gravity</h2><p>First.</p>' },
      { type: 'checkpoint', id: 11 },
      { type: 'html', html: '<p>Second.</p>' },
      { type: 'checkpoint', id: 12 },
    ])
    expect(getCheckpointIdsInOrder(html)).toEqual([11, 12])
  })

  it('escapes question text inside the marker label', () => {
    expect(getCheckpointMarkerHtml(3, '<b>x</b>')).toBe('<div data-checkpoint-id="3" contenteditable="false">Pause &amp; Check: &lt;b&gt;x&lt;/b&gt;</div>')
  })
})
