import Koa = require('koa')
import send = require('koa-send')

const DocsServer = require('docs-server')
const path = require('path')
const fs = require('fs')

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
        const originalPromise:Promise<string> = new Promise((resolve, reject) => {
          fs.readFile(
            path.resolve(__dirname, '../menu.json'),
            'utf8',
            (err: Error, data: string) => {
              err ? reject(err) : resolve(data)
            }
          )
        })

        const origin = JSON.parse(await originalPromise)
        let recentPosts: {}[] = []
        for (let i = 0; i < 5; i++) {
          recentPosts.push((<any>origin)[i])
        }
        ctx.status = 200
        ctx.body = JSON.stringify(recentPosts)
        ctx.set({
          'Content-Type': 'application/json; charset=utf-8'
        })
      }
    }
  ]
})
