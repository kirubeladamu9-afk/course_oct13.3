export interface Course {
  id: number | string
  title: string
  cover: string
  rating: number
  ratingCount: number
  price: number
  category: string
  description?: string
  level?: string
  lessonTypes?: string[]
}
