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
    const data: Record<string, string> = {}
    body.split("&").forEach((v) => {
      const [key, value] = v.split("=")
      data[key] = value
    })

    return await fetch(urlStr, {
      method: "POST",
      headers: headers,
      data
    })
  }
}
