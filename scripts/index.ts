const resolve = require('path').resolve
const generator = require('./generator')

const cwd: string = resolve(__dirname, '../')
const catalogOutput: string = resolve(__dirname, '../menu.json')
const contentListOutput: string = resolve(__dirname, '../list.json')

generator(cwd, catalogOutput, contentListOutput)
