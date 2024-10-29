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
  jsLib: string
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
  updateTime: string
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
  variable: string

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
      loginHeader: this.loginHeader,
      variable: this.variable
    }
  }

  set additionalData(value: {
    bookSourceUrl: string
    loginInfoMap: string
    loginHeader: string
    variable: string
  }) {
    this.loginInfoMap = value.loginInfoMap
    this.loginHeader = value.loginHeader
    this.variable = value.variable
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

  getVariable() {
    return this.variable ?? ""
  }

  async fetch(url: string, options?: any) {
    return await fetch(url, {
      baseUrl: this.bookSourceUrl,
      sourceHeader: this.sourceHeader,
      ...options
    })
  }

  async executeJs(js: string, additional: any, debug = false) {
    // noinspection JSUnusedLocalSymbols
    let {key, page, result, resolve, book, baseUrl} = {
      book: new Book({bookSourceUrl: this.bookSourceUrl}),
      baseUrl: this.bookSourceUrl,
      ...additional
    }
    const java = this.java
    const cookie = this.cookie
    const source = this

    let resultResolve: (value: any) => void
    let resultReject: (value: any) => void

    const resultPromise = new Promise((resolve, reject) => {
      resultResolve = (res) => {
        if (debug) console.log(res)
        resolve(res)
      }
      resultReject = (e) => {
        if (debug) console.log(e)
        reject(e)
      }
    })

    // js = js.replace(/java\.(.*?)\(/gi, "await java.$1(")

    js = js
      .replace(/(?<=\s|\(|=|\n|\[)([.\w]+)\(/g, "await $1(") // 将函数调用全部转换为 await
      .replace(/^([.\w]+)\(/g, "await $1(") // 将函数调用全部转换为 await
      .replace(/\((\w+)\(([^()\n]*?)\)/g, "(await $1($2))") // 将函数调用全部转换为 await
      .replace(/function( await)? (\w+)\(/g, "async function $2(") // 将函数声明全部转换为 async function
      .replace(/new( await)? (\w+)\(/g, "new $2(") // 将类实例化中的 await 去掉
      .replace(/await (if|else if|catch|for|while)/g, "$1") // 去掉关键字前的 await
      .replace(/await (\w+)\((.*?)\)/g, "(await $1($2))") // 给 await 函数调用加括号

    js =
      "async function main() {\n" +
      (this.raw.jsLib ?? "")
        .replace(/(?<=\s|\(|=|\n)([.\w]+)\(/g, "await $1(") // 将函数调用全部转换为 await
        .replace(/^([.\w]+)\(/g, "await $1(") // 将函数调用全部转换为 await
        .replace(/function( await)? (\w+)\(/g, "async function $2(") // 将函数声明全部转换为 async function
        .replace(/new( await)? (\w+)\(/g, "new $2(") // 将类实例化中的 await 去掉
        .replace(/await (if|else if|catch|for|while)/g, "$1") // 去掉关键字前的 await
        .replace(/await (\w+)\((.*?)\)/g, "(await $1($2))") // 给 await 函数调用加括号
        .replace(/(const|let|var)\s*\{[\w\s,]+}\s*=\s*this\s*\n/g, "") + // 去掉 this 变量声明
      js.replace(/\n(.+)\s*$/i, "\nreturn $1").replace(/^(.+)$/i, "return $1") +
      "\n}\nmain().then(r=>resultResolve(r)).catch(e=>resultReject(e))"

    if (debug) console.log(js)

    try {
      eval(js)
      return await resultPromise
    } catch (e) {
      console.log(e)
      return result
    }
  }

  async parseGetRule(
    rule: string,
    result: string,
    maybeJs = false,
    additional: any = {},
    debug = false
  ) {
    let res: string | string[] = rule

    const additionalKeys = Object.keys(additional)

    if (debug) console.log(rule)

    if (additionalKeys.includes(rule)) {
      return [additional[rule]]
    } else if (/^\$\./.test(rule)) {
      // JsonPath
      global.runGC()
      res = JSONPath({json: JSON.parse(result), path: rule.replace(/\[-1]/gi, "[-1:]")})
    } else if (maybeJs) {
      try {
        res = await this.executeJs(rule, {result, ...additional})
      } catch (e) {
        console.log(e)
      }
    }

    if (debug) console.log(rule, res)

    if (res instanceof Array) {
      return res
    } else {
      return [res]
    }
  }

  async parseBracketRule(
    rule: string,
    result: string,
    maybeJs = false,
    additional?: any,
    debug = false
  ) {
    const regexpRule = rule.match(/##.+(##.*)?/gi)?.[0]
    rule = rule.replace(/##.+(##.*)?/gi, "")

    let resultList = []
    for (const orPart of rule.split("||")) {
      if (debug) console.log(orPart)
      for (const andPart of orPart.split("&&")) {
        resultList.push(...(await this.parseGetRule(andPart, result, maybeJs, additional, debug)))
      }
      if (resultList.length > 0) break
    }

    resultList = resultList.flat(3).map((v) => (typeof v === "string" ? v : JSON.stringify(v)))

    if (regexpRule) {
      resultList = resultList.map((res) =>
        res.replace(
          new RegExp(regexpRule.split("##")[1] ?? "", "gi"),
          regexpRule.split("##")[2] ?? ""
        )
      )
    }

    return resultList
  }

  async parseRule(rule: string, result: string, isList = false, additional?: any, debug = false) {
    if (!rule) {
      return isList ? [] : ""
    }

    let parts = rule
      .split(/(@js:[\s\S]*?$)|(<js>[\s\S]*?<\/js>)/gi)
      .filter((v) => !!v && !v?.match(/^\s*$/))
      .filter((v) => !v.match(/^undefined$/gi))

    let res = undefined

    if (debug) console.log(parts)

    for (const v of parts) {
      if (/^<js>|^@js:|<\/js>$/gi.test(v)) {
        let js = v.replace(/^<js>|^@js:|<\/js>$/gi, "")
        if (js.match(/{{[\s\S]*?}}/gi)) {
          for (const v of js.match(/{{[\s\S]*?}}/gi)) {
            const rule = v.replace(/^{{|}}$/gi, "")
            js = js.replace(
              v,
              (await this.parseBracketRule(rule, result, false, additional, debug)).join(", ")
            )
          }
        }
        if (debug) console.log(js)
        res = await this.executeJs(js, {result: res ?? result, ...additional}, debug)
      } else if (/^\s*##.+(##.*)?\s*$/.test(v)) {
        if (!isList && typeof res === "string") {
          res = res.replace(new RegExp(v.split("##")[1] ?? "", "gi"), v.split("##")[2] ?? "")
        }
      } else if (!v.match(/{{[\s\S]*?}}/gi)) {
        res = await this.parseBracketRule(v, result, false, additional, debug)
        if (!isList) {
          res = res.join(", ")
        }
      } else {
        res ??= v
      }
    }

    if (!isList && typeof res === "string") {
      if (res.match(/{{[\s\S]*?}}/gi)) {
        for (const v of res.match(/{{[\s\S]*?}}/gi)) {
          const rule = v.replace(/^{{|}}$/gi, "")
          if (debug) console.log(v, rule)
          res = res.replace(v, await this.parseBracketRule(rule, result, true, additional, debug))
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

    return await Promise.all(
      (await this.parseRule(this.raw.ruleSearch.bookList, response, true)).map(async (v) => {
        try {
          return new Book({
            bookSourceUrl: this.bookSourceUrl,
            name: await this.parseRule(this.raw.ruleSearch.name, v, false, {baseUrl: url}),
            author: await this.parseRule(this.raw.ruleSearch.author, v, false, {baseUrl: url}),
            kind: await this.parseRule(this.raw.ruleSearch.kind, v, true, {baseUrl: url}),
            coverUrl: await this.parseRule(this.raw.ruleSearch.coverUrl, v, false, {
              baseUrl: url
            }),
            intro: await this.parseRule(this.raw.ruleSearch.intro, v, false, {baseUrl: url}),
            wordCount: await this.parseRule(this.raw.ruleSearch.wordCount, v, false, {
              baseUrl: url
            }),
            bookUrl: await this.parseRule(this.raw.ruleSearch.bookUrl, v, false, {baseUrl: url}),
            lastChapter: await this.parseRule(this.raw.ruleSearch.lastChapter, v, false, {
              baseUrl: url
            })
          })
        } catch (e) {
          try {
            return new Book({
              bookSourceUrl: this.bookSourceUrl,
              name: await this.parseRule(this.raw.ruleSearch.name, v, false, {baseUrl: url}),
              author: await this.parseRule(this.raw.ruleSearch.author, v, false, {baseUrl: url}),
              kind: await this.parseRule(this.raw.ruleSearch.kind, v, true, {baseUrl: url}),
              coverUrl: await this.parseRule(this.raw.ruleSearch.coverUrl, v, false, {
                baseUrl: url
              }),
              intro: await this.parseRule(this.raw.ruleSearch.intro, v, false, {baseUrl: url}),
              wordCount: await this.parseRule(this.raw.ruleSearch.wordCount, v, false, {
                baseUrl: url
              }),
              bookUrl: await this.parseRule(this.raw.ruleSearch.bookUrl, v, false, {baseUrl: url}),
              lastChapter: await this.parseRule(this.raw.ruleSearch.lastChapter, v, false, {
                baseUrl: url
              })
            })
          } catch (e) {
            console.log(e)
          }
        }
      })
    )
  }

  async detail(bookData: BookData) {
    const book = new Book(bookData)
    const response = await this.parseRule(
      this.raw.ruleBookInfo.init,
      (
        await this.fetch(bookData.bookUrl, {
          responseType: "text"
        })
      ).body(),
      false,
      {book}
    )

    book.name = helper.withDefault(
      await this.parseRule(this.raw.ruleBookInfo.name, response, false, {
        book,
        baseUrl: book.bookUrl
      }),
      book.name
    )
    book.author = helper.withDefault(
      await this.parseRule(this.raw.ruleBookInfo.author, response, false, {
        book,
        baseUrl: book.bookUrl
      }),
      book.author
    )
    book.kind = helper.withDefault(
      await this.parseRule(this.raw.ruleBookInfo.kind, response, true, {
        book,
        baseUrl: book.bookUrl
      }),
      book.kind
    )
    book.wordCount = helper.withDefault(
      await this.parseRule(this.raw.ruleBookInfo.wordCount, response, false, {
        book,
        baseUrl: book.bookUrl
      }),
      book.wordCount
    )
    book.lastChapter = helper.withDefault(
      await this.parseRule(this.raw.ruleBookInfo.lastChapter, response, false, {
        book,
        baseUrl: book.bookUrl
      }),
      book.lastChapter
    )
    book.coverUrl = helper.withDefault(
      await this.parseRule(this.raw.ruleBookInfo.coverUrl, response, false, {
        book,
        baseUrl: book.bookUrl
      }),
      book.coverUrl
    )
    book.intro = helper.withDefault(
      await this.parseRule(this.raw.ruleBookInfo.intro, response, false, {
        book,
        baseUrl: book.bookUrl
      }),
      book.intro
    )
    book.tocUrl = helper.withDefault(
      await this.parseRule(this.raw.ruleBookInfo.tocUrl, response, false, {
        book,
        baseUrl: book.bookUrl
      }),
      book.tocUrl
    )
    book.bookUrl = helper.withDefault(
      await this.parseRule(this.raw.ruleBookInfo.tocUrl, response, false, {
        book,
        baseUrl: book.bookUrl
      }),
      book.bookUrl
    )

    return book
  }

  async loadToc(book: Book) {
    const response = (
      await this.fetch(book.tocUrl ?? book.bookUrl, {
        responseType: "text"
      })
    ).body()

    book.toc = await Promise.all(
      (await this.parseRule(this.raw.ruleToc.chapterList, response, true)).map(async (v, i) => {
        try {
          return {
            chapterInfo: await this.parseRule(this.raw.ruleToc.updateTime, v, false, {
              baseUrl: book.bookUrl
            }),
            chapterName: await this.parseRule(this.raw.ruleToc.chapterName, v, false, {
              baseUrl: book.bookUrl
            }),
            chapterUrl: await this.parseRule(this.raw.ruleToc.chapterUrl, v, false, {
              baseUrl: book.bookUrl
            }),
            isVolume: await this.parseRule(this.raw.ruleToc.isVolume, v, false, {
              baseUrl: book.bookUrl
            })
          }
        } catch (e) {
          console.log(e)
        }
      })
    )

    return book
  }

  async loadContent(book: Book, chapterUrl: string) {
    const response = (
      await this.fetch(chapterUrl, {
        responseType: "text"
      })
    ).body()

    const content = await this.parseRule(
      this.raw.ruleContent.content,
      response,
      false,
      {
        baseUrl: chapterUrl
      },
      true
    )
    return content
      .split(/\n+/g)
      .map((v: string) => v.trim())
      .join("\n")
  }
}
