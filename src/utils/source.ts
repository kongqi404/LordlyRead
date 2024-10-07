export interface SourceData {
  bookSourceComment: string
  bookSourceGroup: string
  bookSourceName: string
  bookSourceType: number
  bookSourceUrl: string
  concurrentRate: string
  customOrder: number
  enabled: boolean
  enabledCookieJar: boolean
  enabledExplore: boolean
  exploreUrl: string
  lastUpdateTime: number
  loginCheckJs: string
  loginUrl: string
  respondTime: number
  ruleBookInfo: RuleBookInfo
  ruleContent: RuleContent
  ruleExplore: RuleExplore
  ruleSearch: RuleSearch
  ruleToc: RuleToc
  searchUrl: string
  weight: number
}

export interface RuleBookInfo {
  author: string
  coverUrl: string
  intro: string
  kind: string
  lastChapter: string
  name: string
  tocUrl: string
  wordCount: string
}

export interface RuleContent {
  content: string
}

export interface RuleExplore {
  author: string
  bookList: string
  bookUrl: string
  coverUrl: string
  intro: string
  kind: string
  name: string
  wordCount: string
}

export interface RuleSearch extends RuleExplore {
  checkKeyWord: string
}

export interface RuleToc {
  chapterList: string
  chapterName: string
  chapterUrl: string
  isVolume: string
}

export class Source {
  raw: SourceData
  constructor(public data: SourceData) {
    this.raw = data
  }

  get bookSourceUrl() {
    return this.raw.bookSourceUrl
  }

  get bookSourceName() {
    return this.raw.bookSourceName
  }

  get enabled() {
    return this.raw.enabled
  }

  set enabled(value: boolean) {
    this.raw.enabled = value
  }

  get enabledExplore() {
    return this.raw.enabledExplore
  }

  set enabledExplore(value: boolean) {
    this.raw.enabledExplore = value
  }

  get hasExplore() {
    return this.raw.ruleExplore !== undefined
  }

  get hasLogin() {
    return this.raw.loginUrl !== undefined
  }
}
