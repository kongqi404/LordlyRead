import {defineConfig} from "vitepress"

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Lordly·阅读",
  description: "支持「开源阅读」规则的手环在线阅读工具",
  head: [["link", {rel: "icon", href: "/logo.png", type: "image/png"}]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {text: "首页", link: "/"},
      {text: "使用指南", link: "/start"}
    ],

    sidebar: [
      {
        text: "使用指南",
        items: [
          {text: "简介&下载", link: "/start"},
          {text: "基础教程", link: "/Tutorial/a"},
          {text: "功能介绍及详细说明", link: "/Tutorial/b"},
          {text: "书籍的缓存与导出", link: "/Tutorial/c"},
          {text: "界面自定义", link: "/Tutorial/d"},
          {text: "主要社区", link: "/Tutorial/e"},
          {text: "反馈渠道", link: "/Tutorial/f"}

        ]
      }
    ],

    socialLinks: [{icon: "github", link: "https://github.com/Lordly-Tech/LordlyRead"}],

    footer: {
      message: "Released under the MPL-2.0 license",
      copyright: "Copyright © 2024-present, Jiwang Yihao (as part of the Lordly Tech Team)"
    },

    logo: "logo.png"
  },

  locales: {
    root: {
      label: "简体中文",
      lang: "zh-CN"
    },
    en: {
      label: "English",
      lang: "en",

      title: "Lordly·Read",
      description: "Supports Legado rule band reading tool",
      
      themeConfig: {
        nav: [
          {text: "Home", link: "/"},
          {text: "Getting Started", link: "/getting-started"}
        ],
        sidebar: [
          {
            text: "Getting Started"
          },
          {
            text: "Runtime API Examples"
          }
        ],

        logo: "logo.png"
      }
    }
  },

  lastUpdated: true,
  cleanUrls: true
})
