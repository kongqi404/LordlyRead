import {fetch} from "./fetch"

export class JsExtension {
  state: {
    vars: Map<string, any>
  }

  constructor(state: any) {
    this.state = state
  }

  put(key: string, value: any) {
    this.state.vars.set(key, value)
    return value
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

    return await fetch(urlStr, {
      method: "POST",
      header: headers,
      data
    })
  }
}
