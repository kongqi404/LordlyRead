import {fetch as systemFetch} from "./tsimports"

export function fetch(rawUrl: string, options?: any): Promise<Response> {
  return new Promise((resolve, reject) => {
    const urlOptions = JSON.parse(rawUrl.split(",")[1] ?? "{}")
    let url = rawUrl.split(",")[0] ?? rawUrl
    
    if (!/^http/i.test(url)) {
      if (options.baseUrl)
        url = `${options.baseUrl}/${url}`
      else
        console.error("错误链接格式")
    }

    systemFetch.fetch({
      url: url,
      ...options,
      ...urlOptions,
      success: (res) => {
        console.log("success", res)

        resolve(res)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}
