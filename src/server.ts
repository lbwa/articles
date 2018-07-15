const resolve = require('path').resolve

import Koa = require('koa')
import Router = require('koa-router')
import send = require('koa-send')
import compress = require('koa-compress')
const { genMenu, contentList } = require('./generator')
const cwd: string = resolve(__dirname, '../')
const catalogOutput: string = resolve(__dirname, '../menu.json')

const PORT = process.argv[2] || 8800
const stringify = JSON.stringify.bind(JSON)
const app = new Koa()
const router = new Router()

app.use(async (ctx: Koa.Context, next: Function) => {
  console.log(`Request url is ${ctx.path}`)
  try {
    await next()
  } catch (err) {
    console.error(err)
    ctx.body = err.message
  }
})

app.use(async (ctx: Koa.Context, next: Function) => {
  let origin: string
  // white list, `Access-Control-Allow-Origin` only receive 1 value
  if (ctx.origin === 'https://lbwa.github.io') {
    origin = ctx.origin
  } else {
    origin = 'https://set.sh'
  }

  ctx.set({
    'Access-Control-Allow-Origin': `${origin}`,
    'Access-Control-Allow-Methods': 'GET,POST',
    'vary': 'origin'
  })
  await next()
})

router
  .get('/menu', async(ctx: Koa.Context, next: Function) => {
    await send(ctx, './menu.json', {
      root: resolve(__dirname, '../')
    })
  })
  .get('/projects', async(ctx: Koa.Context, next: Function) => {
    await send(ctx, './projects.json', {
      root: resolve(__dirname, '../projects')
    })
  })
  .get('/', async(ctx: Koa.Context, next: Function) => {
    ctx.body = stringify({
      date: new Date()
    })
  })
  .get('*', async(ctx: Koa.Context, next: Function) => {
     // delete '/' from '/something/' or '/something'
    const url = ctx.path.replace(/\//g, '')

    if (!contentList[url]) {
      ctx.status = 404
      ctx.body = stringify({
        errno: 1,
        message: '[Error]: invalid request'
      })
      return
    }

    ctx.body = contentList[url]
  })

// Make sure correct sequence
app
  .use(compress({
    threshold: 0
  }))
  .use(router.routes())
  .use(router.allowedMethods())

genMenu(cwd, catalogOutput).then(() => {
  // 在执行脚本时传入指定参数将跳过建立 local server
  // 主要用于部署前生成 menu.json
  if (process.argv[2] === 'skip') return

  app.listen(PORT, () => {
    console.log(`\n Server is listening on http://localhost:${PORT}\n`)
  })
})
