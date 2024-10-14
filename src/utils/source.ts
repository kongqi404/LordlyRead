import {JsExtension} from "./jsExtension"
import {Cookie} from "./cookie"
import {Book, BookData} from "./book"
import {fetch} from "./fetch"
import {helper} from "./index"
import {JSONPath} from "jsonpath-plus"

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
  init: string
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
  lastChapter: string
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
}

export interface LoginUiComponent {
  type: string
  name: string
  value: string
}

export class Source {
  raw: SourceData
  cookie: Cookie
  java = new JsExtension(
    {
      vars: new Map()
    },
    this
  )
  loginInfoMap: string
  loginHeader: string

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
      const loginInfoMap = helper.json2Map(this.loginInfoMap ?? "{}")
      return JSON.parse(this.raw.loginUi)?.map((v: Partial<LoginUiComponent>) => {
        return {
          value: loginInfoMap.get(v.name) ?? "",
          ...v
        }
      }) as LoginUiComponent[]
    } catch (e) {
      return undefined
    }
  }

  get additionalData() {
    return {
      bookSourceUrl: this.bookSourceUrl,
      loginInfoMap: this.loginInfoMap,
      loginHeader: this.loginHeader
    }
  }

  set additionalData(value: {bookSourceUrl: string; loginInfoMap: string; loginHeader: string}) {
    this.loginInfoMap = value.loginInfoMap
    this.loginHeader = value.loginHeader
  }

  get sourceHeader() {
    return JSON.parse(this.loginHeader ?? "{}")
  }

  // noinspection JSUnusedGlobalSymbols // used in eval
  getLoginInfoMap() {
    return helper.json2Map(this.loginInfoMap)
  }

  // noinspection JSUnusedGlobalSymbols // used in eval
  putLoginHeader(header: string) {
    this.loginHeader = header
  }

  async fetch(url: string, options?: any) {
    return await fetch(url, {
      baseUrl: this.bookSourceUrl,
      sourceHeader: this.sourceHeader,
      ...options
    })
  }

  async executeJs(js: string, additional: any) {
    // noinspection JSUnusedLocalSymbols
    const {key, page, result, resolve, book} = additional
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
      js.replace(/\n(.+)$/i, "\nreturn $1").replace(/^(.+)$/i, "return $1") +
      "\n}\nmain().then(r=>resultResolve(r)).catch(e=>resultReject(e))"

    try {
      eval(js)
      return await resultPromise
    } catch (e) {
      console.log(e)
      return result
    }
  }

  async parseGetRule(rule: string, result: string) {
    let res
    if (/^\$\./.test(rule)) {
      // JsonPath
      global.runGC()
      res = JSONPath({json: JSON.parse(result), path: rule})
    } else {
      // No Match
      res = rule
    }

    if (res instanceof Array) {
      return res
    } else {
      return [res]
    }
  }

  async parseRule(rule: string, result: string, isList = false, additional?: any) {
    if (!rule) {
      return isList ? [] : ""
    }

    let parts = rule
      .split(/(@js:[\s\S]*?$)|(<js>[\s\S]*?<\/js>)/gi)
      .filter((v) => !!v && !v?.match(/^\s*$/))
      .filter((v) => !v.match(/^undefined$/gi))

    let res = undefined

    for (const v of parts) {
      if (/^<js>|^@js:|<\/js>$/gi.test(v)) {
        let js = v.replace(/^<js>|^@js:|<\/js>$/gi, "")
        if (js.match(/{{[\s\S]*?}}/gi)) {
          for (const v of js.match(/{{[\s\S]*?}}/gi)) {
            const rule = v.replace(/^{{|}}$/gi, "")
            js = js.replace(v, (await this.parseGetRule(rule, result)).join(", "))
          }
        }
        res = await this.executeJs(js, {result: res ?? result, ...additional})
      } else {
        let resultList = []
        for (const orPart of v.split("||")) {
          for (const andPart of orPart.split("&&")) {
            resultList.push(...(await this.parseGetRule(andPart, result)))
          }
          if (resultList.length > 0) break
        }
        res = resultList.flat(3).map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
        if (!isList) {
          res = res.join(", ")
        }
      }
    }

    if (!isList) {
      if (res.match(/{{[\s\S]*?}}/gi)) {
        for (const v of res.match(/{{[\s\S]*?}}/gi)) {
          const rule = v.replace(/^{{|}}$/gi, "")
          res = res.replace(v, await this.parseGetRule(rule, result))
        }
      }
    }

    return res
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
      // .replace("pageSize=20", "pageSize=10")
      .split(/(@js:[\s\S]*?$)|(<js>[\s\S]*?<\/js>)/gi)
      .filter((v) => !!v && !v?.match(/^\s*$/))
      .filter((v) => !v.match(/^undefined$/gi))
    let url = parts.shift()

    for (const v of parts) {
      const js = v.replace(/^<js>|^@js:|<\/js>$/gi, "")
      url = await this.executeJs(js, {result: url})
    }

    parts = null

    if (url.match(/{{[\s\S]*?}}/gi)) {
      for (const v of url.match(/{{[\s\S]*?}}/gi)) {
        const js = v.replace(/^{{|}}$/gi, "")
        url = url.replace(v, await this.executeJs(js, {key, page}))
      }
    }

    url.match(/{(key|page)}/gi)?.forEach((v) => {
      url = url.replace(v, (/key/gi.test(v) ? key : page) as string)
    })

    const response = (
      await this.fetch(url, {
        responseType: "text"
      })
    ).body()

    url = null

    return await Promise.all(
      (await this.parseRule(this.raw.ruleSearch.bookList, response, true)).map(async (v) => {
        return new Book({
          bookSourceUrl: this.bookSourceUrl,
          name: await this.parseRule(this.raw.ruleSearch.name, v),
          author: await this.parseRule(this.raw.ruleSearch.author, v),
          kind: await this.parseRule(this.raw.ruleSearch.kind, v, true),
          coverUrl: await this.parseRule(this.raw.ruleSearch.coverUrl, v),
          intro: await this.parseRule(this.raw.ruleSearch.intro, v),
          wordCount: await this.parseRule(this.raw.ruleSearch.wordCount, v),
          bookUrl: await this.parseRule(this.raw.ruleSearch.bookUrl, v),
          lastChapter: await this.parseRule(this.raw.ruleSearch.lastChapter, v)
        })
      })
    )
  }

  async detail(bookData: BookData) {
    const response = await this.parseRule(
      this.raw.ruleBookInfo.init,
      (
        await this.fetch(bookData.bookUrl, {
          responseType: "text"
        })
      ).body(),
      false,
      {book: new Book(bookData)}
    )

    return new Book({
      ...bookData,
      bookSourceUrl: this.bookSourceUrl,
      name: helper.withDefault(
        await this.parseRule(this.raw.ruleBookInfo.name, response),
        bookData.name
      ),
      author: helper.withDefault(
        await this.parseRule(this.raw.ruleBookInfo.author, response),
        bookData.author
      ),
      kind: helper.withDefault(
        await this.parseRule(this.raw.ruleBookInfo.kind, response),
        bookData.kind
      ),
      wordCount: helper.withDefault(
        await this.parseRule(this.raw.ruleBookInfo.wordCount, response),
        bookData.wordCount
      ),
      lastChapter: helper.withDefault(
        await this.parseRule(this.raw.ruleBookInfo.lastChapter, response),
        bookData.lastChapter
      ),
      coverUrl: helper.withDefault(
        await this.parseRule(this.raw.ruleBookInfo.coverUrl, response),
        bookData.coverUrl
      ),
      intro: helper.withDefault(
        await this.parseRule(this.raw.ruleBookInfo.intro, response),
        bookData.intro
      ),
      tocUrl: helper.withDefault(
        await this.parseRule(this.raw.ruleBookInfo.tocUrl, response),
        bookData.tocUrl
      ),
      bookUrl: helper.withDefault(
        await this.parseRule(this.raw.ruleBookInfo.tocUrl, response),
        bookData.bookUrl
      )
    })
  }
}
