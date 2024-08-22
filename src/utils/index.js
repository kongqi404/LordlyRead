import systemRouter from "@system.router"

const config = {
  animationDuration: 200,
  animationDelay: 50
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
    if (thisObj.tab > 0) return
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
  },
  pageSwipe(evt) {
    if (evt.direction === "right") {
      router.back()
    }
  }
}

const template = {
  private: {
    pageClass: "animation-in"
  },
  onShow() {
    on.show(this)
  },
  pageSwipe(evt) {
    on.pageSwipe(evt)
  }
}

export default {
  config,
  state,
  router,
  animation,
  on,
  template
}
