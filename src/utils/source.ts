import {JsExtension} from "./jsExtension"
import {Cookie} from "./cookie"
import {fetch} from "./fetch"

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

export interface SourceUi {
  bookSourceUrl: string
  bookSourceName: string
  enabled: boolean
  enabledExplore: boolean
  hasExplore: boolean
  hasLogin: boolean
}

export class Source {
  raw: SourceData
  cookie: Cookie
  constructor(raw: SourceData, cookie: Cookie) {
    this.raw = raw
    this.cookie = cookie
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

  async executeJs(js: string, java: JsExtension, additional: any) {
    // noinspection JSUnusedLocalSymbols
    const {key, page, result} = additional
    const cookie = this.cookie
    try {
      return eval(js)
    } catch (e) {
      console.log(e)
      return result
    }
  }

  async search(key: string, page: number) {
    const java = new JsExtension({
      vars: new Map()
    })
    let parts = this.raw.searchUrl
      .split(/(@js:[\s\S]*?$)|(<js>[\s\S]*?<\/js>)/gi)
      .filter((v) => !!v && !v?.match(/^\s*$/))
    let url = parts.shift()

    console.log(this.raw.searchUrl)
    console.log(parts)

    for (const v of parts) {
      const js = v.replace(/^<js>|^@js:|<\/js>$/gi, "")
      //       const js = `if(new Date().getTime()-Number(cookie.getKey('http://www.wenku8.net','jieqiVisitTime') ? cookie.getKey('http://www.wenku8.net','jieqiVisitTime').replace('jieqiArticlesearchTime%3D','') : 6)*1000<6000){
      //   java.toast('搜索频率过高，延迟'+(new Date().getTime()-Number(cookie.getKey(source.bookSourceUrl,'jieqiVisitTime').replace('jieqiArticlesearchTime%3D',''))*1000)/1000+'秒后继续')
      // }
      // while(new Date().getTime()-Number(cookie.getKey('http://www.wenku8.net','jieqiVisitTime') ? cookie.getKey('http://www.wenku8.net','jieqiVisitTime').replace('jieqiArticlesearchTime%3D','') : 6)*1000<6000){
      //   console.log(123)
      // }
      // result`
      url = await this.executeJs(js, java, {result: url})
    }

    if (url.match(/{{[\s\S]*?}}/gi)) {
      for (const v of url.match(/{{[\s\S]*?}}/gi)) {
        const js = v.replace(/^{{|}}$/gi, "")
        url = url.replace(v, await this.executeJs(js, java, {key, page}))
      }
    }

    url.match(/{(key|page)}/gi)?.forEach((v) => {
      url = url.replace(v, (/key/gi.test(v) ? key : page) as string)
    })

    const response = await fetch(url, {
      baseUrl: this.bookSourceUrl
    })

    return response
  }
}
