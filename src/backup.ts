const resolve = require('path').resolve
const micro = require('micro')
const zlib = require('zlib')
const fs = require('fs')
const { genMenu, contentList } = require('./generator')

const { send } = micro
const { stringify } = JSON

const whiteList = [
  'https://lbwa.github.io',
  'https://set.sh'
]
const HOST = process.env.HOST || '127.0.0.1' // Should be from pm2
const PORT = process.env.PORT || 8800 // same as HOST variable

const isDev = process.env.NODE_ENV === 'development'
const cwd: string = resolve(__dirname, '../')
const catalogOutput: string = resolve(__dirname, '../menu.json')

import { ServerResponse, ServerRequest } from 'http'

const server = micro(async function (req: ServerRequest, res: ServerResponse) {
  const url = req.url
  console.log(`Request address is: ${url}`)

  let origin: string

  if (isDev) {
    origin = '*'
  } else {
    const index = whiteList.indexOf(`${req.headers.origin}`)
    origin = index  > -1 ? whiteList[index] : 'https://set.sh'
  }

  res.setHeader('Access-Control-Allow-Origin', `${origin}`)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST')
  res.setHeader('Vary', 'Origin, Accept-Encoding')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Encoding', 'gzip')

  // ! detect source IP
  // const origin = req.headers['x-forwarded-for']
  //   || req.connection.remoteAddress
  //   || req.socket.remoteAddress
  // console.log('origin :', origin)

  if (url === '/') {
    return send(res, 200, zlib.gzipSync(stringify({
      date: new Date()
    })))
  }

  if (url === '/menu') {
    return send(res, 200, zlib.gzipSync(
      fs.readFileSync(resolve(__dirname, '../menu.json'), 'utf8')
    ))
  }

  if (url === '/project') {
    return send(res, 200, zlib.gzipSync(
      fs.readFileSync(resolve(__dirname, '../projects/projects.json'), 'utf8')
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

  server.listen(PORT)
  console.info(`\n Server listening on http://${HOST}:${PORT} \n`)
})
