import send = require('koa-send')
import Koa = require('koa')
const { resolve } = require('../utils/index')

module.exports = async (ctx: Koa.Context, next: Function) => {
  await send(ctx, './projects.json', {
    root: resolve(__dirname, '../../projects')
  })
}
