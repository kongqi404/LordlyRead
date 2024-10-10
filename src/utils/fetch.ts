import {fetch as systemFetch, request, file} from "./tsimports"
import {cookie} from "."
const GBK = require("gbk.js")

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
      request.download({
        url,
        ...fullOptions,
        success(data) {
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
                      resolve(result)
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
          reject(err)
        }
      })
    } else {
      systemFetch.fetch({
        url,
        ...fullOptions,
        success(res) {
          if (res.headers["Set-Cookie"]) {
            cookie.setUrlByHeader(url, res.headers["Set-Cookie"])
          }
          resolve(res)
        },
        fail(err) {
          console.log(err)
          reject(err)
        }
      })
    }
  })
}
