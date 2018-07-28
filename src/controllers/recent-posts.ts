import Koa = require('koa')
import { post } from '../utils/types'

const menuList = require('../../menu.json')
const { stringify } = require('../utils/index')

module.exports = async (ctx: Koa.Context, next: Function) => {
  let recentPosts: post[] = []
  for (let i = 0; i < 4; i++) {
    recentPosts.push(menuList[i])
  }

  ctx.status = 200
  ctx.body = stringify(recentPosts)
  ctx.set({
    'Content-Type': 'application/json; charset=utf-8'
  })
}
