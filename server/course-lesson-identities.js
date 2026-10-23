const getLessons = (modules) => Array.isArray(modules)
  ? modules.flatMap((module) => Array.isArray(module?.lessons) ? module.lessons : [])
  : []

const getLessonIdentity = ({ title, type, curriculumTopic, platformEngineId, simulationToolId }) =>
  JSON.stringify({ title, type, curriculumTopic, platformEngineId, simulationToolId })

export const getChangedCourseLessonIds = (previousModules, nextModules) => {
  const previousLessonsById = new Map(getLessons(previousModules).map((lesson) => [String(lesson.id), lesson]))
  return [...new Set(getLessons(nextModules)
    .filter((lesson) => {
      const previousLesson = previousLessonsById.get(String(lesson.id))
      return !previousLesson || getLessonIdentity(previousLesson) !== getLessonIdentity(lesson)
    })
    .map((lesson) => String(lesson.id)))]
}

export const remapReusedCourseLessonIds = (previousModules, nextModules, progressLessonIds) => {
  const changedIds = new Set(getChangedCourseLessonIds(previousModules, nextModules))
  const staleProgressIds = new Set(progressLessonIds.map(String))
  const reusedIds = new Set([...changedIds].filter((id) => staleProgressIds.has(id)))
  if (!reusedIds.size) return nextModules

  let nextId = Math.max(
    0,
    ...getLessons(nextModules).map((lesson) => Number(lesson.id)),
    ...[...staleProgressIds].map(Number),
  ) + 1

  return nextModules.map((module) => ({
    ...module,
    lessons: (module.lessons ?? []).map((lesson) => {
      if (!reusedIds.has(String(lesson.id))) return lesson
      return { ...lesson, id: nextId++ }
    }),
  }))
}
