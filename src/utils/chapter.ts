import {Book, BookData, BookTocChapter} from "./book"
import {file, crypto} from "./tsimports"
import {source} from "."

export interface ChapterInfo extends BookTocChapter {}

export class Chapter {
  info: ChapterInfo
  book: BookData

  constructor(info: ChapterInfo, book: BookData) {
    this.info = info
    this.book = book
  }

  getUri(type: string) {
    if (!this.info.chapterUrl) throw new Error("Chapter url not found")
    if (!this.book.bookUrl) throw new Error("Book url not found")
    return (
      `internal://files/lordly-read/${type}/chapter/` +
      crypto.hashDigest({
        data: this.book.bookUrl,
        algo: "MD5"
      }) +
      "-" +
      crypto.hashDigest({
        data: this.info.chapterUrl,
        algo: "MD5"
      })
    )
  }

  hasCached() {
    return new Promise<boolean>((resolve, reject) => {
      const uri = this.getUri("cache")
      file.access({
        uri,
        success() {
          resolve(true)
        },
        fail() {
          resolve(false)
        }
      })
    })
  }

  hasDownloaded() {
    return new Promise<boolean>((resolve, reject) => {
      const uri = this.getUri("download")
      file.access({
        uri,
        success() {
          resolve(true)
        },
        fail() {
          resolve(false)
        }
      })
    })
  }

  async getContent() {
    try {
      return await this.getCachedContent()
    } catch {
      try {
        return await this.getDownloadedContent()
      } catch {
        return await this.getOnlineContent()
      }
    }
  }

  getCachedContent() {
    return new Promise<string>((resolve, reject) => {
      const uri = this.getUri("cache")
      file.readText({
        uri,
        success(data) {
          console.log("cache: " + uri)
          resolve(data.text)
        },
        fail(data, code) {
          console.log("cache-fail: ", data, code)
          reject(new Error("Chapter not found in cache"))
        }
      })
    })
  }

  getDownloadedContent() {
    return new Promise<string>((resolve, reject) => {
      const uri = this.getUri("download")
      file.readText({
        uri,
        success(data) {
          // console.log("download: " + uri)
          resolve(data.text)
          console.log("download")
        },
        fail(data, code) {
          console.log("download-fail: ", data, code)
          reject(new Error("Chapter not found in downloads"))
        }
      })
    })
  }

  async getOnlineContent() {
    if (!this.info.chapterUrl) throw new Error("Chapter url not found")
    const chapterUrl = this.info.chapterUrl
    const bookSource = source.getSource(this.book.bookSourceUrl)
    const book = new Book(this.book)
    const content = await bookSource.loadContent(book, chapterUrl)
    await this.cacheContent(content)
    if (await this.hasDownloaded()) await this.downloadContent()
    return content
  }

  cacheContent(content: string) {
    return new Promise<void>((resolve, reject) => {
      const uri = this.getUri("cache")
      file.writeText({
        uri,
        text: content,
        success() {
          console.log("cache: " + uri)
          resolve()
        },
        fail(data, code) {
          console.log("cache-fail: ", data, code)
          reject(new Error("Failed to cache chapter"))
        }
      })
    })
  }

  clearCache() {
    return new Promise<void>((resolve, reject) => {
      const uri = this.getUri("cache")
      file.delete({
        uri,
        success() {
          resolve()
        },
        fail(data, code) {
          reject(new Error("Failed to clear cache"))
        }
      })
    })
  }

  downloadContent() {
    return new Promise(async (resolve, reject) => {
      const uri = this.getUri("download")
      const content = await this.getContent()
      await this.clearCache().catch(() => {})
      file.writeText({
        uri,
        text: content,
        success() {
          resolve(true)
        },
        fail(data, code) {
          reject(new Error("Failed to download chapter"))
        }
      })
    })
  }
}
