import {fetch} from "./fetch"
import {Source} from "./source"

export class JsExtension {
  state: {
    vars: Map<string, any>
  }
  source: Source
  src: string

  constructor(state: any, source: Source) {
    this.state = state
    this.source = source
  }

  updateSrc(src: string) {
    this.src = src
  }

  put(key: string, value: any) {
    this.state.vars.set(key, value)
    return value
  }

  getString(rule: string) {
    return this.source.parseGetRule(rule, this.src)
  }

  async post(urlStr: string, body: string, headers: Record<string, string>) {
    let data: Record<string, string> | string = {}
    if (headers["Content-Type"] === "application/json") {
      data = JSON.parse(body)
    } else if (headers["Content-Type"] === "application/x-www-form-urlencoded") {
      body.split("&").forEach((v) => {
        const [key, value] = v.split("=")
        data[key] = value
      })
    }

    return await this.source.fetch(urlStr, {
      method: "POST",
      header: headers,
      data
    })
  }

  async ajax(urlStr: string) {
    return (await this.source.fetch(urlStr)).body()
  }
}
