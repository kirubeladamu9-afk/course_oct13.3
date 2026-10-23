import { describe, expect, it } from 'vitest'
import { remapReusedCourseLessonIds } from './course-lesson-identities.js'

describe('remapReusedCourseLessonIds', () => {
  it('assigns a fresh ID when a new lesson reuses a completed lesson ID', () => {
    const previousModules = [{ id: 1, lessons: [{ id: 1, title: 'Completed activity' }] }]
    const nextModules = [{ id: 1, lessons: [{ id: 1, title: 'Completed activity' }, { id: 2, title: 'New activity' }] }]

    const result = remapReusedCourseLessonIds(previousModules, nextModules, [2])

    expect(result[0].lessons).toEqual([
      { id: 1, title: 'Completed activity' },
      { id: 3, title: 'New activity' },
    ])
  })

  it('remaps a replaced lesson when it keeps an ID with stale progress', () => {
    const previousModules = [{ id: 1, lessons: [{ id: 2, title: 'Old activity', type: 'simulation' }] }]
    const nextModules = [{ id: 1, lessons: [{ id: 2, title: 'Magnets', type: 'simulation', platformEngineId: 'magnet-lab' }] }]

    const result = remapReusedCourseLessonIds(previousModules, nextModules, [2])

    expect(result[0].lessons[0]).toEqual({ id: 3, title: 'Magnets', type: 'simulation', platformEngineId: 'magnet-lab' })
  })

  it('preserves existing lesson IDs and does not change lessons without stale progress', () => {
    const previousModules = [{ id: 1, lessons: [{ id: 1, title: 'Existing activity' }] }]
    const nextModules = [{ id: 1, lessons: [{ id: 1, title: 'Existing activity' }, { id: 2, title: 'New activity' }] }]

    expect(remapReusedCourseLessonIds(previousModules, nextModules, [1])).toBe(nextModules)
  })
})
