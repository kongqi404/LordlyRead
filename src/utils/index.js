import systemRouter from "@system.router"
import storage from "@system.storage"
import prompt from "@system.prompt"

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
    thisObj.$app.$def.utils.state.animationBack = false
    thisObj.pageClass = "animation-out"
    setTimeout(() => {
      systemRouter.push({
        uri,
        ...objArgs
      })
    }, config.animationDuration + config.animationDelay)
  },
  back() {
    if (thisObj.onBack?.call()) return
    thisObj.$app.$def.utils.state.animationBack = true
    thisObj.pageClass = "animation-out-back"
    setTimeout(() => {
      systemRouter.back()
    }, config.animationDuration + config.animationDelay)
  }
}

const animation = {
  in() {
    thisObj.pageClass = thisObj.$app.$def.utils.state.animationBack
      ? "animation-in-back"
      : "animation-in"
  }
}

const on = {
  show(pageThis) {
    thisObj = pageThis
    animation.in()

    thisObj.$element("body-swiper").getBoundingClientRect({
      success: (rect) => {
        thisObj.swiperHeight = rect.height
      }
    })
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
      title: "主界面"
    },
    {
      type: "switch",
      title: "自动刷新",
      subtitle: "打开软件时自动更新书籍",
      name: "auto_refresh",
      value: false
    },
    {
      type: "switch",
      title: "自动跳转最近阅读",
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
      value: "cover"
    },
    {
      type: "title",
      title: "其他设置"
    },
    {
      type: "choose",
      title: "预下载章节数量",
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
      title: "默认启用替换净化",
      subtitle: "为新加入书架的书启用替换净化",
      name: "default_purify",
      value: true
    },
    {
      type: "switch",
      title: "返回时提示放入书架",
      subtitle: "阅读未放入书架的书籍在返回时提示放入书架",
      name: "default_add",
      value: true
    },
    {
      type: "button",
      title: "清除缓存",
      subtitle: "清除已下载的书籍缓存",
      action() {
        console.log("清除缓存")
      }
    },
    {
      type: "switch",
      title: "记录日志",
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
        if (item.name) {
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
    swiperHeight: -1
  },
  onShow() {
    on.show(this)
  },
  pageSwipe(evt) {
    on.pageSwipe(evt)
  },
  wait() {
    prompt.showToast({message: "敬请期待"})
  }
}

global.config = config
global.state = state
global.router = router
global.animation = animation
global.on = on
global.template = template
global.setting = setting

export default {
  state
}
