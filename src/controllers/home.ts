import Koa = require('koa')
const { stringify } = require('../utils/index')

module.exports = async (ctx: Koa.Context, next: Function) => {
  ctx.body = stringify({
    date: new Date()
  })
  ctx.set({
    'Content-Type': 'application/json; charset=utf-8'
  })
}
