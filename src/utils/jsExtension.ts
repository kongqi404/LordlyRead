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
}
