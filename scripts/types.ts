export interface header {
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

export interface initialContent {
  contentData: string
  origin: string
}

export interface contentList {
  [path: string]: object
}

export interface req {
  readonly url: string
}

export interface res {
  readonly setHeader: Function
  readonly writeHeader: Function
}
