export interface header {
  title: string
  author: string
  date: Date
  tags: string[]
}

export interface post {
  errno: number
  to: string
  title: string
  author: string
  date: string
  tags: string[]
}

export interface initialContent {
  contentData: string
  origin: string
}

interface contentItem extends post {
  data: string
}

export interface contentList {
  [path: string]: contentItem
}
