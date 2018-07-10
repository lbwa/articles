const resolve = require('path').resolve
const { genMenu, contentList } = require('./generator')

const cwd: string = resolve(__dirname, '../')
const catalogOutput: string = resolve(__dirname, '../menu.json')

genMenu(cwd, catalogOutput).then(() => {
  console.log('180329-css-bfc :', contentList['180329-css-bfc'])
})
