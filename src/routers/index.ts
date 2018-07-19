import Router = require('koa-router')

const menu = require('../controllers/menu')
const projects = require('../controllers/projects')
const home = require('../controllers/home')
const docs = require('../controllers/docs')

const router = new Router()

router
  .get('/menu', menu)
  .get('/projects', projects)
  .get('/', home)
  .get('*', docs)

module.exports = router
