import Koa = require('koa')
import compress = require('koa-compress')

const { genMenu } = require('./generator')
const router = require('./routers/index')
const config = require('./config')

console.log('\nEnvironment: ', process.env.NODE_ENV)

const HOST = config.host
const PORT = config.port
const WHITELIST = config.whiteList
const cwd: string = config.cwd
const catalogOutput: string = config.catalogOutput
const isDev = process.env.NODE_ENV === 'development'

const app = new Koa()

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

  if (isDev) {
    origin = '*'
  } else {
    // white list, `Access-Control-Allow-Origin` only receive 1 value
    const index = WHITELIST.indexOf(ctx.origin)
    origin = index > -1 ? WHITELIST[index] : 'https://set.sh'
  }

  ctx.set({
    'Access-Control-Allow-Origin': `${origin}`,
    'Access-Control-Allow-Methods': 'GET,POST',
    'vary': 'origin'
  })
  await next()
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
  // ! notice: `now scale app-name.now.sh sfo1 1`, prevent app sleep
  // ! It's `sfo1`, not `sfo`. Usage is wrong. https://zeit.co/blog/scale
  // ! https://github.com/zeit/now-cli/issues/146#issuecomment-373925793
  if (process.argv[2] === 'skip') return

  app.listen(PORT, () => {
    console.log(`\n Server is listening on http://${HOST}:${PORT}\n`)
  })
})
