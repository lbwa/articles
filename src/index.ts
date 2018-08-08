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
          maxage: 3600,
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
    const whitelist = [
      'https://set.sh',
      'https://lbw.netlify.com'
    ]

    const index = whitelist.indexOf(ctx.origin)

    const defaultOrigin = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://set.sh'

    const origin = index > -1 ? whitelist[index] : defaultOrigin

    ctx.set({
      'Access-Control-Allow-Origin': `${origin}`,
      'Access-Control-Allow-Methods': 'GET,POST'
    })

    await next()
  }
})
