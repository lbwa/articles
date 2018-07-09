const resolve = require('path').resolve
const generator = require('./generator')

const output:string = resolve(__dirname, '../menu.json')
const input:string = resolve(__dirname, '../')

generator(output, input)
