import Router = require('koa-router')

const menu = require('../controllers/menu')
const projects = require('../controllers/projects')
const home = require('../controllers/home')
const docs = require('../controllers/docs')

const router = new Router()

// RESTful API：看 url 就知道要什么，看 http method 就知道干什么，看 http status
// code 就知道结果如何。即用 url 定位资源，用 http method 描述操作。
router
  .get('/menu', menu)
  .get('/projects', projects)
  .get('/', home)
  .get('*', docs)

module.exports = router
