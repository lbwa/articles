import Koa = require('koa')

const { contentList } = require('../generator')
const { stringify } = require('../utils/index')

module.exports = async (ctx: Koa.Context, next: Function) => {
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
}
