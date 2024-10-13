import {fetch as systemFetch, request, file} from "./tsimports"
import {cookie, helper} from "."

class Response {
  data: string
  cookie: string

  constructor(data: string) {
    this.data = data
  }

  body() {
    console.log(this.data)
    return this.data
  }

  cookies() {
    return helper.json2Map(this.cookie ?? "{}")
  }
}

export function fetch(rawUrl: string, options?: any): Promise<Response> {
  return new Promise((resolve, reject) => {
    const urlOptions = JSON.parse(rawUrl.split(",")[1] ?? "{}")
    let url = rawUrl.split(",")[0] ?? rawUrl

    if (!/^http/i.test(url)) {
      if (options.baseUrl) url = `${options.baseUrl}/${url}`
      else {
        console.error("错误链接格式")
        reject("错误链接格式")
      }
    }

    const cookieList = []

    cookie.getUrl(url)?.forEach((v, k) => {
      cookieList.push(`${k}=${v}`)
    })

    const fullOptions = {
      ...options,
      ...urlOptions,
      header: {
        Cookie: cookieList.join(";"),
        ...options?.header,
        ...urlOptions?.header
      }
    }

    fullOptions.header = {
      ...fullOptions.sourceHeader,
      ...fullOptions.header
    }

    if (fullOptions.charset) {
      if (/^utf-?8$/gi.test(fullOptions.charset)) {
        fullOptions.charset = undefined
        url = encodeURI(decodeURIComponent(url))
      } else if (/^gbk$/gi.test(fullOptions.charset)) {
        fullOptions.charset = "gbk"
      } else {
        console.error("不支持的编码类型")
        reject("不支持的编码类型")
      }
    } else {
      url = encodeURI(decodeURIComponent(url))
    }

    if (fullOptions.charset) {
      const GBK = require("../third-party/GBK.js/dist/gbk.min")
      url = GBK.URI.encodeURI(url)
      request.download({
        url,
        ...fullOptions,
        header: "",
        success(data) {
          console.log(data)
          request.onDownloadComplete({
            token: data.token,
            success(res) {
              file.readArrayBuffer({
                uri: res.uri,
                success(buffer) {
                  const result = GBK.decode(buffer.buffer)
                  // const result = buffer
                  file.delete({
                    uri: res.uri,
                    success() {
                      resolve(new Response(result))
                    },
                    fail(...err) {
                      reject(err)
                    }
                  })
                },
                fail(...err) {
                  reject(err)
                }
              })
            },
            fail(...err) {
              reject(err)
            }
          })
        },
        fail(...err) {
          console.log(err)
          reject(err)
        }
      })
    } else {
      systemFetch.fetch({
        url,
        ...fullOptions,
        success(res) {
          const response = new Response(res.data)
          if (res.headers["Set-Cookie"]) {
            cookie.setUrlByHeader(url, res.headers["Set-Cookie"])
            response.cookie = helper.map2Json(cookie.getCookieFromHeader(res.headers["Set-Cookie"]))
          }
          resolve(response)
        },
        fail(err) {
          console.log(err)
          reject(err)
        }
      })
    }
  })
}
