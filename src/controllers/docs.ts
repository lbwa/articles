import Koa = require('koa')

const { contentList } = require('../generator')
const { stringify } = require('../utils/index')

module.exports = async (ctx: Koa.Context, next: Function) => {
  // delete '/' from '/writings/something/' or '/writings/something'
  const url = ctx.path.replace(/^\/writings\//, '').replace(/\/$/g, '')

  if (!contentList[url]) {
    ctx.status = 404
    ctx.body = stringify({
      errno: 1,
      message: '[Error]: invalid request'
    })
    ctx.set({
      'Content-Type': 'application/json; charset=utf-8'
    })
    return
  }

  ctx.body = contentList[url]
}
