import Koa = require('koa')
import compress = require('koa-compress')

const router = require('./routers/index')
const { whiteList } = require('./config')

console.log('\nEnvironment: ', process.env.NODE_ENV)

const WHITELIST = whiteList
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

module.exports = app
