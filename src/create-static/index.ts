const CreateStatic = require('./core')
const path = require('path')

new CreateStatic({
  cwd: path.resolve(process.cwd(), './')
})
