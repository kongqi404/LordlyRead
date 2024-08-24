import systemRouter from "@system.router"

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
  }
}

global.config = config
global.state = state
global.router = router
global.animation = animation
global.on = on
global.template = template

export default {
  config,
  state,
  router,
  animation,
  on,
  template
}
