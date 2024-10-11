import {JsExtension} from "./jsExtension"
import {Cookie} from "./cookie"
import {fetch} from "./fetch"
import {helper} from "./index"

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
  loginUi: string
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
  loginUi?: LoginUiComponent[]
  source: Source
}

export interface LoginUiComponent {
  type: string
  name: string
  value: string
}

export class Source {
  raw: SourceData
  cookie: Cookie
  java = new JsExtension({
    vars: new Map()
  })
  loginInfoMap: string

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
  get loginUi() {
    try {
      return JSON.parse(this.raw.loginUi)?.map((v) => {
        return {
          value: "",
          ...v
        }
      }) as LoginUiComponent[]
    } catch (e) {
      return undefined
    }
  }

  async executeJs(js: string, additional: any) {
    // noinspection JSUnusedLocalSymbols
    const {key, page, result, resolve} = additional
    const java = this.java
    const cookie = this.cookie
    const source = this

    let resultResolve: (value: any) => void
    let resultReject: (value: any) => void

    const resultPromise = new Promise((resolve, reject) => {
      resultResolve = resolve
      resultReject = reject
    })

    js = js.replace(/java\.(.*?)\(/gi, "await java.$1(")

    js =
      "async function main() {\n" +
      js.replace(/\n(.+)$/i, "\nreturn $1") +
      "\n}\nmain().then(r=>resultResolve(r)).catch(e=>resultReject(e))"

    try {
      eval(js)
      return await resultPromise
    } catch (e) {
      console.log(e)
      return result
    }
  }

  // noinspection JSUnusedGlobalSymbols // used in eval
  getLoginInfoMap() {
    return helper.json2Map(this.loginInfoMap)
  }

  // noinspection JSUnusedGlobalSymbols // used in eval
  putLoginHeader(header: string) {
    console.log("putLoginHeader 无实际作用", header)
  }

  async login(loginInfoMap: Map<string, string>) {
    this.loginInfoMap = helper.map2Json(loginInfoMap)

    if (!this.hasLogin) {
      return {
        success: false,
        message: "未配置登录信息"
      }
    }

    if (!this.raw.loginUrl.match(/^<js>|^@js:|<\/js>$/gi)) {
      console.error("暂不支持链接登录")
    }

    const js = this.raw.loginUrl
      .replace(/^<js>|^@js:|<\/js>$/gi, "")
      .replace(/function login\(\) {/gi, "async function login() {")

    let resultResolve: (value: {success: boolean; message: string}) => void

    const result = new Promise<{
      success: boolean
      message: string
    }>((resolve) => {
      resultResolve = resolve
    })

    await this.executeJs(
      js +
        "\nlogin().then(r=>resolve({success:true, msg:''})).catch(e=>resolve({success:false, msg:e}))",
      {
        resolve: resultResolve
      }
    )

    return await result
  }

  async search(key: string, page: number) {
    let parts = this.raw.searchUrl
      .split(/(@js:[\s\S]*?$)|(<js>[\s\S]*?<\/js>)/gi)
      .filter((v) => !!v && !v?.match(/^\s*$/))
      .filter((v) => !v.match(/^undefined$/gi))
    let url = parts.shift()

    console.log(this.raw.searchUrl)
    console.log(parts)

    for (const v of parts) {
      const js = v.replace(/^<js>|^@js:|<\/js>$/gi, "")
      url = await this.executeJs(js, {result: url})
    }

    if (url.match(/{{[\s\S]*?}}/gi)) {
      for (const v of url.match(/{{[\s\S]*?}}/gi)) {
        const js = v.replace(/^{{|}}$/gi, "")
        url = url.replace(v, await this.executeJs(js, {key, page}))
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
