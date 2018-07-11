const resolve = require('path').resolve
const micro = require('micro')
const zlib = require('zlib')
const fs = require('fs')
const { genMenu, contentList } = require('./generator')

const { send } = micro
const { stringify } = JSON
const cwd: string = resolve(__dirname, '../')
const catalogOutput: string = resolve(__dirname, '../menu.json')

import { ServerResponse, ServerRequest } from 'http'

const server = micro(async function (req: ServerRequest, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Encoding', 'gzip')

  const url = req.url
  console.log(`Request address is: ${url}`)

  // const origin = req.headers['x-forwarded-for']
  //   || req.connection.remoteAddress
  //   || req.socket.remoteAddress
  // console.log('origin :', origin)

  if (url === '/') {
    return send(res, 200, zlib.gzipSync(stringify({
      date: new Date()
    })))
  }

  if (url === '/menu.json') {
    return send(res, 200, zlib.gzipSync(
      fs.readFileSync(resolve(__dirname, '../menu.json'), 'utf8')
    ))
  }

  let path = url.slice(1) // delete `/` character in the beginning
  if (!contentList[path]) {
    return send(res, 404, zlib.gzipSync('File not found'))
  }

  const data = stringify(contentList[path])
  send(res, 200, zlib.gzipSync(data))
})

genMenu(cwd, catalogOutput).then(() => {
  // 在执行脚本时传入指定参数将跳过建立 local server
  // 主要用于部署前生成 menu.json
  if (process.argv[2] === 'skip') return

  const port = process.env.PORT || 8800
  server.listen(port)
  console.info(`\n Server listening on http://localhost:${port} \n`)
})
