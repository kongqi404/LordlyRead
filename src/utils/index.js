import systemRouter from "@system.router"
import storage from "@system.storage"
import prompt from "@system.prompt"
import systemFetch from "@system.fetch"
import systemDevice from "@system.device"

const config = {
  animationDuration: 200,
  animationDelay: 100
}

let thisObj = undefined

const state = {
  animationBack: false
}

const router = {
  push(uri, objArgs) {
    animation.out(false)
    setTimeout(() => {
      if (objArgs?.length) {
        const params = {}
        objArgs.forEach((item) => {
          params[item[0]] = item[1]
        })
        systemRouter.push({
          uri,
          params
        })
      } else {
        systemRouter.push({
          uri,
          ...objArgs
        })
      }
    }, config.animationDuration + config.animationDelay)
  },
  back(path) {
    if (typeof path !== "string") if (thisObj.onBack?.call()) return
    animation.out(true)
    setTimeout(() => {
      if (typeof path === "string") {
        systemRouter.back({
          path
        })
      } else {
        systemRouter.back()
      }
    }, config.animationDuration + config.animationDelay)
  }
}

const animation = {
  in() {
    if (setting.get("page_transition") === "cover") {
      thisObj.coverAnimation = thisObj.$app.$def.utils.state.animationBack
        ? "animation-out-back"
        : "animation-out"
      setTimeout(() => {
        thisObj.coverAnimation = "none"
      }, config.animationDuration + config.animationDelay)
    } else {
      thisObj.pageClass = thisObj.$app.$def.utils.state.animationBack
        ? "animation-in-back"
        : "animation-in"
    }
  },
  out(back) {
    thisObj.$app.$def.utils.state.animationBack = back
    if (setting.get("page_transition") === "cover") {
      thisObj.coverAnimation = back ? "animation-in-back" : "animation-in"
    } else {
      thisObj.pageClass = back ? "animation-out-back" : "animation-out"
    }
  }
}

const on = {
  show(pageThis) {
    thisObj = pageThis
    animation.in()

    thisObj.$element("body").getBoundingClientRect({
      success: (rect) => {
        thisObj.bodyHeight = rect.height
      }
    })

    thisObj.updateSetting?.call()
  },
  pageSwipe(evt) {
    if (evt.direction === "right") {
      router.back()
    }
  }
}

const setting = {
  list: [
    {
      type: "title",
      title: "主界面",
      name: "main_ui"
    },
    {
      type: "switch",
      title: "自动刷新*",
      subtitle: "打开软件时自动更新书籍",
      name: "auto_refresh",
      value: false
    },
    {
      type: "switch",
      title: "自动跳转最近阅读*",
      subtitle: "默认打开书架",
      name: "jump_last",
      value: false
    },
    {
      type: "choose",
      title: "默认主页",
      options: [
        {label: "书架", value: "bookshelf"},
        {label: "探索", value: "explore"},
        {label: "我的", value: "mine"}
      ],
      name: "default_home",
      value: "bookshelf"
    },
    {
      type: "choose",
      title: "页面切换动画",
      subtitle: "覆盖动画性能开销更低",
      options: [
        {label: "滑动", value: "slide"},
        {label: "覆盖", value: "cover"}
      ],
      name: "page_transition",
      value: "slide"
    },
    {
      type: "title",
      title: "阅读界面",
      name: "read_ui"
    },
    {
      type: "choose",
      title: "正文字重",
      subtitle: "阅读时正文段落的字体粗细",
      options: [
        {label: "正常", value: "normal"},
        {label: "粗体", value: "bold"}
      ],
      name: "paragraph_weight",
      value: "normal"
    },
    {
      type: "number",
      title: "正文字号",
      subtitle: "阅读时正文段落的字体大小",
      step: 1,
      doubleStep: 5,
      min: 0,
      name: "paragraph_size",
      value: 20
    },
    {
      type: "number",
      title: "正文段距",
      subtitle: "阅读时正文段落的段间距，相对于字号大小的比例",
      step: 0.1,
      doubleStep: 0.5,
      min: 0,
      name: "paragraph_spacing",
      value: 1
    },
    {
      type: "choose",
      title: "标题对齐",
      subtitle: "阅读时章节标题的对齐方式",
      options: [
        {label: "左对齐", value: "left"},
        {label: "居中", value: "center"},
        {label: "右对齐", value: "right"}
      ],
      name: "chapter_title_align",
      value: "left"
    },
    {
      type: "number",
      title: "标题字号",
      subtitle: "阅读时章节标题的字体大小，相对于正文字号的比例",
      step: 0.1,
      doubleStep: 0.5,
      min: 0,
      name: "chapter_title_size",
      value: 1.2
    },
    {
      type: "number",
      title: "标题上边距",
      subtitle: "阅读时章节标题的上边距，相对于正文字号的比例",
      step: 0.1,
      doubleStep: 0.5,
      min: 0,
      name: "chapter_title_top_margin",
      value: 1
    },
    {
      type: "number",
      title: "标题下边距",
      subtitle: "阅读时章节标题的下边距，相对于正文字号的比例",
      step: 0.1,
      doubleStep: 0.5,
      min: 0,
      name: "chapter_title_bottom_margin",
      value: 1
    },
    {
      type: "title",
      title: "阅读设置",
      name: "read_setting"
    },
    {
      type: "switch",
      title: "平滑滚动",
      subtitle: "阅读时启用平滑滚动",
      name: "smooth_scroll",
      value: true
    },
    {
      type: "switch",
      title: "屏幕常亮*",
      subtitle: "阅读时屏幕常亮",
      name: "keep_screen_on",
      value: false
    },
    {
      type: "choose",
      title: "点击翻页",
      subtitle: "阅读时点击屏幕的翻页方式",
      options: [
        {label: "上下", value: "vertical"},
        {label: "左右", value: "horizontal"},
        {label: "禁用", value: "disable"}
      ],
      name: "click_to_turn_page",
      value: "vertical"
    },
    {
      type: "title",
      title: "其他设置",
      name: "other"
    },
    {
      type: "choose",
      title: "预下载章节数量*",
      options: [
        {label: "1", value: 1},
        {label: "2", value: 2},
        {label: "3", value: 3},
        {label: "4", value: 4}
      ],
      name: "preload",
      value: 1
    },
    {
      type: "switch",
      title: "默认启用替换净化*",
      subtitle: "为新加入书架的书启用替换净化",
      name: "default_purify",
      value: true
    },
    {
      type: "switch",
      title: "返回时提示放入书架*",
      subtitle: "阅读未放入书架的书籍在返回时提示放入书架",
      name: "default_add",
      value: true
    },
    {
      type: "button",
      title: "清除缓存*",
      subtitle: "清除已下载的书籍缓存",
      action() {
        console.log("清除缓存")
      }
    },
    {
      type: "switch",
      title: "记录日志*",
      subtitle: "记录调试日志",
      name: "log",
      value: false
    }
  ],

  get(name) {
    for (const item of setting.list) {
      if (item.name === name) {
        return item.value
      }
    }
  },

  getRaw(name) {
    return new Promise((resolve, reject) => {
      storage.get({
        key: name,
        success: (data) => {
          resolve(JSON.parse(data))
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  set(name, value) {
    return new Promise((resolve, reject) => {
      storage.set({
        key: name,
        value: JSON.stringify(value),
        success: () => {
          setting.list.forEach((item) => {
            if (item.name === name) {
              item.value = value
            }
          })
          if (name === "page_transition") {
            systemRouter.clear()
          }
          resolve()
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  async init() {
    Promise.all(
      this.list.map((item) => {
        if (item.value !== undefined) {
          return setting.getRaw(item.name).then((value) => {
            item.value = value
          })
        }
      })
    )
  }
}

setting.init()

const template = {
  private: {
    pageClass: "animation-in",
    bodyHeight: 0,
    coverAnimation: ""
  },
  onShow() {
    on.show(this)
  },
  pageSwipe(evt) {
    on.pageSwipe(evt)
  },
  wait() {
    prompt.showToast({message: "敬请期待"})
  },
  toast(message) {
    prompt.showToast({message})
  }
}

setting.getRaw("page_transition").then((value) => {
  if (value === "cover") {
    template.private.coverAnimation = "animation-out"
    template.private.pageClass = ""
  } else {
    template.private.pageClass = "animation-in"
  }
})

const fetch = (url, options) => {
  return new Promise((resolve, reject) => {
    systemFetch.fetch({
      url,
      ...options,
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

const source = {
  list: [],
  init() {
    storage.get({
      key: "source",
      success: (data) => {
        this.list = JSON.parse(data)
      }
    })
  },
  add(source) {
    for (const item of this.list) {
      if (item.bookSourceUrl === source.bookSourceUrl) {
        return false
      }
    }
    this.list.push(source)
  },
  remove(source) {
    this.list = this.list.filter((item) => item.bookSourceUrl !== source.bookSourceUrl)
  },
  moveUp(source) {
    source = this.list.find((item) => item.bookSourceUrl === source.bookSourceUrl)
    this.list = this.list.filter((item) => item.bookSourceUrl !== source.bookSourceUrl)
    this.list.unshift(source)
  },
  moveDown(source) {
    source = this.list.find((item) => item.bookSourceUrl === source.bookSourceUrl)
    this.list = this.list.filter((item) => item.bookSourceUrl !== source.bookSourceUrl)
    this.list.push(source)
  },
  clear() {
    this.list = []
  },
  save() {
    storage.set({
      key: "source",
      value: JSON.stringify(this.list)
    })
  },
  mapForUi() {
    return this.list.map((item) => {
      return {
        bookSourceUrl: item.bookSourceUrl,
        bookSourceName: item.bookSourceName,
        enabled: item.enabled,
        enabledExplore: item.enabledExplore,
        hasExplore: !!item.exploreUrl,
        hasLogin: !!item.loginUrl
      }
    })
  },
  syncFromUi(uiList) {
    uiList.forEach((item) => {
      const source = this.list.find((item2) => item2.bookSourceUrl === item.bookSourceUrl)
      if (source) {
        source.enabled = item.enabled
        source.enabledExplore = item.enabledExplore
      }
    })
  }
}

source.init()

const device = {
  info: undefined,
  async getInfo() {
    if (!this.info) {
      await this.init()
    }
    return this.info
  },
  getRawInfo() {
    return new Promise((resolve, reject) => {
      systemDevice.getInfo({
        success: (res) => {
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },
  getTotalStorage() {
    return new Promise((resolve, reject) => {
      systemDevice.getTotalStorage({
        success: (res) => {
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },
  getAvailableStorage() {
    return new Promise((resolve, reject) => {
      systemDevice.getAvailableStorage({
        success: (res) => {
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },
  async init() {
    this.info = await this.getRawInfo()
  }
}

device.init()

const date = {
  format(date, format) {
    const opt = {
      "y+": date.getFullYear().toString(), // 年
      "M+": (date.getMonth() + 1).toString(), // 月
      "d+": date.getDate().toString(), // 日
      "h+": date.getHours().toString(), // 时
      "m+": date.getMinutes().toString(), // 分
      "s+": date.getSeconds().toString() // 秒
    }
    for (const k in opt) {
      const ret = new RegExp("(" + k + ")").exec(format)
      if (ret) {
        if (/(y+)/.test(k)) {
          format = format.replace(ret[1], opt[k].substring(4 - ret[1].length))
        } else {
          format = format.replace(
            ret[1],
            ret[1].length === 1 ? opt[k] : opt[k].padStart(ret[1].length, "0")
          )
        }
      }
    }
    return format
  },
  now() {
    return new Date().getTime()
  },
  formatNow(format) {
    return this.format(new Date(), format)
  }
}

global.config = config
global.state = state
global.router = router
global.animation = animation
global.on = on
global.template = template
global.setting = setting
global.fetch = fetch
global.source = source
global.device = device
global.date = date

export default {
  state
}
