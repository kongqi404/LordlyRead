export interface BookTocChapter {
  chapterInfo?: string
  chapterName: string
  chapterUrl?: string
  isVolume?: boolean
}

export interface BookData {
  bookSourceUrl: string
  name: string
  author: string
  kind: string[]
  wordCount: string
  lastChapter: string
  coverUrl: string
  intro: string
  tocUrl: string
  bookUrl: string
  toc: BookTocChapter[]
  progress: number
  fProgress: number
  variable: string
}

export class Book {
  bookSourceUrl: string
  name: string
  author: string
  kind: string[]
  wordCount: string
  lastChapter: string
  coverUrl: string
  intro: string
  tocUrl: string
  bookUrl: string
  toc: BookTocChapter[] = []
  fProgress: number = 0

  variable: string

  constructor(data: Partial<BookData>) {
    this.bookSourceUrl = data.bookSourceUrl
    this.name = data.name
    this.author = data.author
    this.kind = data.kind
    this.wordCount = data.wordCount
    this.lastChapter = data.lastChapter
    this.coverUrl = data.coverUrl
    this.intro = data.intro
    this.tocUrl = data.tocUrl
    this.bookUrl = data.bookUrl
    this.toc = data.toc ?? []
    this.progress = data.fProgress ?? data.progress ?? 0
    this.progress = Math.max(this.fProgress, 0)
    if (this.progress >= this.toc.length) this.progress = this.toc.length - 1
    this.variable = data.variable ?? ""
  }

  set progress(progress: number) {
    this.fProgress = progress
  }

  get progress() {
    return Math.floor(this.fProgress)
  }

  update(book: Book) {
    this.bookSourceUrl = book.bookSourceUrl
    this.name = book.name
    this.author = book.author
    this.kind = book.kind
    this.wordCount = book.wordCount
    this.lastChapter = book.lastChapter
    this.coverUrl = book.coverUrl
    this.intro = book.intro
    this.tocUrl = book.tocUrl
    this.bookUrl = book.bookUrl
    this.toc = book.toc
  }

  toData(): BookData {
    return {
      bookSourceUrl: this.bookSourceUrl,
      name: this.name,
      author: this.author,
      kind: this.kind,
      wordCount: this.wordCount,
      lastChapter: this.lastChapter,
      coverUrl: this.coverUrl,
      intro: this.intro,
      tocUrl: this.tocUrl,
      bookUrl: this.bookUrl,
      toc: this.toc,
      progress: this.progress,
      fProgress: this.fProgress,
      variable: this.variable
    }
  }

  getVariable(v?: string) {
    return this.variable ?? ""
  }
}
