export type LessonType = 'video' | 'article' | 'interactive' | 'interactiveTool' | 'simulation' | 'quiz' | 'practice' | 'live'
export type InteractiveToolSubject = 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'Other'
export type InteractiveToolDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type InteractiveToolTask = 'Automatic' | 'Equation solving' | 'Arithmetic' | 'Geometry'

export interface InteractiveToolConfig {
  subject: InteractiveToolSubject
  toolType: 'step-by-step-solver'
  instructions: string
  examples: string[]
  difficulty: InteractiveToolDifficulty
  learningObjectives: string[]
  task: InteractiveToolTask
}

export interface InteractiveToolProgress {
  problem: string
  task: InteractiveToolTask
  currentStep: number
  answers: Record<number, string>
  attempts: Record<number, number>
  hintsUsed: Record<number, number>
  isCompleted: boolean
}

export type SimulationRule = 'pendulum-period' | 'osmosis-movement' | 'neutralization' | 'projectile-range' | 'linear'

export interface SimulationVariable {
  id: number
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  unit: string
}

export interface SimulationConfig {
  scenarioName: string
  overview: string
  variables: SimulationVariable[]
  rule: SimulationRule
  calculation: string
  outputLabel: string
  outputUnit: string
  observationPrompt: string
  expectedObservation: string
  acceptedObservations: string[]
}

export interface InteractiveHotspot {
  id: number
  left: string
  top: string
  label: string
  explanation: string
}

export interface LessonResource {
  id: number
  name: string
  url?: string
}

export interface QuizQuestion {
  id: number
  question: string
  topic: string
  options: string[]
  correctOption: number
  questionImage?: string
  optionImages?: Array<string | undefined>
  explanation?: string
  explanationImage?: string
}

export interface PracticeQuestion {
  id: number
  question: string
  topic: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export type ArticleContentBlock =
  | { type: 'text'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'image'; marker?: string; imageUrl?: string; caption: string }

export interface AdminLesson {
  id: number
  title: string
  type: LessonType
  duration: number | null
  videoUrl?: string
  thumbnailUrl?: string
  resources: LessonResource[]
  articleBody?: string
  articleBlocks?: ArticleContentBlock[]
  articleHeaderImageUrl?: string
  baseImageUrl?: string
  interactiveHotspots?: InteractiveHotspot[]
  interactiveTool?: InteractiveToolConfig
  simulation?: SimulationConfig
  simulationToolId?: string
  platformEngineId?: string
  curriculumTopic?: string
  quizQuestions?: QuizQuestion[]
  practiceQuestions?: PracticeQuestion[]
  passThreshold?: number
  meetingUrl?: string
  recurringDays?: string[]
  sessionTime?: string
  sessionDuration?: number
  scheduledAt?: string
  endsAt?: string
  dateOverridden?: boolean
  estimatedDuration?: number
  syllabusTopicIds?: number[]
}

export interface AdminCourse {
  id: number
  title: string
  category: string
  level: string
  tutor: string
  status: 'Published' | 'Draft'
  students: number
  price: number
  cover: string
  rating?: number
  ratingCount?: number
  description: string
  longDescription: string
  learningOutcomes: string[]
  requirements: string[]
  certificate: boolean
  updatedAt: string
  modules: AdminModule[]
}

export interface AdminModule {
  id: number
  title: string
  lessons: AdminLesson[]
}

let lastGeneratedLessonId = 0

export const getNextLessonId = (modules: AdminModule[]) => {
  const currentMaximum = Math.max(0, ...modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)))
  lastGeneratedLessonId = Math.max(lastGeneratedLessonId + 1, Date.now() * 1000, currentMaximum + 1)
  return lastGeneratedLessonId
}

export interface AssignedCourse {
  id: number
  title: string
  category: string
  students: number
}

export interface AssignedClass {
  id: number
  title: string
}

export interface AdminTutor {
  id: number
  name: string
  email: string
  phone: string
  bio: string
  status: 'Active' | 'Inactive'
  createdAt: string
  assignedCourses: AssignedCourse[]
  assignedClasses: AssignedClass[]
  assignedCourseIds?: number[]
  specialty?: string
  courses?: number
}

export type Tutor = AdminTutor

export interface AdminUser {
  id: number
  accountId?: number
  accountType?: 'user' | 'tutor'
  name: string
  email: string
  role: 'Student' | 'Tutor' | 'Admin'
  joined: string
  status: 'Active' | 'Suspended'
}

export const tutors: Tutor[] = [
  { id: 1, name: 'Maya Chen', email: 'maya@example.com', phone: '', bio: '', status: 'Active', createdAt: 'Jul 12, 2025', assignedCourses: [], assignedClasses: [], specialty: 'Data Science', courses: 4 },
  { id: 2, name: 'Leon Kennedy', email: 'leon@example.com', phone: '', bio: '', status: 'Active', createdAt: 'Jun 24, 2025', assignedCourses: [], assignedClasses: [], specialty: 'Cloud Engineering', courses: 3 },
  { id: 3, name: 'Jhon Dwirian', email: 'jhon@example.com', phone: '', bio: '', status: 'Inactive', createdAt: 'May 09, 2025', assignedCourses: [], assignedClasses: [], specialty: 'Frontend Development', courses: 2 },
  { id: 4, name: 'Rizki Known', email: 'rizki@example.com', phone: '', bio: '', status: 'Active', createdAt: 'Apr 18, 2025', assignedCourses: [], assignedClasses: [], specialty: 'Product Design', courses: 5 },
]

export const users: AdminUser[] = [
  { id: 1, name: 'Ava Johnson', email: 'ava@example.com', role: 'Student', joined: 'Aug 18, 2025', status: 'Active' },
  { id: 2, name: 'Maya Chen', email: 'maya@example.com', role: 'Tutor', joined: 'Jul 12, 2025', status: 'Active' },
  { id: 3, name: 'Noah Williams', email: 'noah@example.com', role: 'Student', joined: 'Jun 24, 2025', status: 'Active' },
  { id: 4, name: 'Jhon Dwirian', email: 'jhon@example.com', role: 'Tutor', joined: 'May 09, 2025', status: 'Suspended' },
]
