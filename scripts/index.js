const resolve = require('path').resolve
const generator = require('./generator')

const output = resolve(__dirname, '../menu.json')
const input = resolve(__dirname, '../')

generator(output, input)
