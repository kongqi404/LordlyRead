export interface BookData {
  bookSourceUrl: string
  name: string
  author: string
  kind: string
  wordCount: string
  lastChapter: string
  coverUrl: string
  intro: string
  tocUrl: string
  bookUrl: string
}

export class Book {
  bookSourceUrl: string
  name: string
  author: string
  kind: string
  wordCount: string
  lastChapter: string
  coverUrl: string
  intro: string
  tocUrl: string
  bookUrl: string

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
      bookUrl: this.bookUrl
    }
  }
}
