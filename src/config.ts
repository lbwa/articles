/**
 * 1. 在 ts 中，当文件中没有出现 import / export 时，ts 编译器将认为当前文件是全局作
 * 用域，即使实际情况是当前作用域是一个模块。
 * 2. const { resolve } = require('./utils/index') 所以此处会与 utils/index 中的
 * 同名变量冲突
 * 3. 只要当前文件中存在关键字 import / export 时，ts 编译器就认为该文件的作用域是一
 * 个模块作用域，而不是全局作用域。如 controllers/menu
 */
const { resolve } = require('./utils/index')

const whiteList = [
  'https://lbwa.github.io',
  'https://set.sh'
]

const cwd: string = resolve(__dirname, '../')
const catalogOutput: string = resolve(__dirname, '../menu.json')

module.exports = {
  host: process.env.HOST || '127.0.0.1',
  port: process.env.PORT || 8800,
  whiteList,
  cwd,
  catalogOutput
}

// prevent throw error TS2451
// 编译后的代码 export {} 将转换为
// Object.defineProperty(exports, "__esModule", { value: true });
export {}
