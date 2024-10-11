import {fetch as systemFetch, request, file} from "./tsimports"
import {cookie, helper} from "."
const GBK = require("gbk.js")

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

    if (fullOptions.charset) {
      if (/^utf-?8$/gi.test(fullOptions.charset)) {
        fullOptions.charset = undefined
      } else if (/^gbk$/gi.test(fullOptions.charset)) {
        fullOptions.charset = "gbk"
        url = GBK.URI.encodeURI(url)
      } else {
        console.error("不支持的编码类型")
        reject("不支持的编码类型")
      }
    }

    if (fullOptions.charset) {
      // fullOptions.header = Object.entries(fullOptions.header ?? {})
      //   .map((kv) => kv.join(": "))
      //   .join("\n")
      console.log(url, fullOptions)
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
      console.log(url, fullOptions)
      systemFetch.fetch({
        url,
        ...fullOptions,
        success(res) {
          console.log(res)
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
