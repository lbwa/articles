import Koa = require('koa')
const { stringify } = require('../utils/index')

module.exports = async (ctx: Koa.Context, next: Function) => {
  ctx.status = 404
  ctx.body = stringify({
    errno: 1,
    message: '[Error]: invalid request'
  })
  ctx.set({
    'Content-Type': 'application/json; charset=utf-8'
  })
}

export {}
