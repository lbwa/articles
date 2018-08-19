import Koa = require('koa')
import send = require('koa-send')

const DocsServer = require('docs-server')
const path = require('path')
const menu = require('../menu.json')

module.exports = new DocsServer({
  filter: (origin: string) => {
    const removeShortDate = origin.replace(/\/{0}(\d{6}-)+/g, '')
    const removeInitialYear = removeShortDate.replace(/^\d{4}/, '')
    const removeRepeat = removeInitialYear.replace(/^\/\S+\//, '')
    const removeExtension = removeRepeat.replace(/\.md$/, '')
    return `writings/${removeExtension}`
  },

  extra: [
    {
      route: '/projects',
      middleware: async (ctx: Koa.Context, next: Function) => {
        await send(ctx, './projects/projects.json', {
          maxage: 30 * 60 * 1000,
          root: path.resolve(__dirname, '../')
        })
      }
    },
    {
      route: '/recent-posts',
      middleware: async (ctx: Koa.Context, next: Function) => {
        let recentPosts: {}[] = []
        for (let i = 0; i < 5; i++) {
          recentPosts.push(menu[i])
        }
        ctx.status = 200
        ctx.body = JSON.stringify(recentPosts)
        ctx.set({
          'Content-Type': 'application/json; charset=utf-8'
        })
      }
    }
  ],

  headerMiddleware: async (ctx: Koa.Context, next: Function) => {
    const defaultOrigin = process.env.NODE_ENV === 'development'
      ? '*'
      : 'https://set.sh'

    const whitelist = [
      'https://set.sh',
      'https://lbw.netlify.com',
      'https://blog.set.sh'
    ]

    // 不要使用 ctx.origin 或 ctx.request.origin 别名
    // 二者值在 服务器上与 ctx.request.headers.origin 不同
    const index = whitelist.indexOf(ctx.request.headers.origin)

    const origin = index > -1 ? whitelist[index] : defaultOrigin

    ctx.set({
      'Access-Control-Allow-Origin': `${origin}`,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    })

    await next()
  }
})
