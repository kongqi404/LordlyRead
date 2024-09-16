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
      {text: "使用指南", link: "/getting-started"}
    ],

    sidebar: [
      {
        text: "使用指南",
        items: [
          {text: "快速开始", link: "/getting-started"},
          {text: "Runtime API Examples", link: "/api-examples"}
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
