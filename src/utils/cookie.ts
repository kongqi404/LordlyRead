export class Cookie {
  cookies: Map<string, Map<string, string>>
  constructor() {
    this.cookies = new Map()
  }

  getKey(url: string, key: string) {
    return this.cookies.get(url)?.get(key)
  }
}
