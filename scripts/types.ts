export interface meta {
  title: string
  author: string
  date: Date
  tags: string[]
}

export interface post {
  to: string
  title: string
  author: string
  date: string
  tags: string[]
}

export interface content {
  contentData: string
  origin: string
}
