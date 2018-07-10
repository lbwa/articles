const resolve = require('path').resolve
const micro = require('micro')
const zlib = require('zlib')
const { genMenu, contentList } = require('./generator')

const { send } = micro
const cwd: string = resolve(__dirname, '../')
const catalogOutput: string = resolve(__dirname, '../menu.json')

interface req {
  readonly url: string
}

interface res {
  readonly setHeader: Function
  readonly writeHeader: Function
}

const server = micro(async function (req: req, res: res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Encoding', 'gzip')

  let path = req.url.slice(1) // delete `/` character in the beginning
  console.log(`Request address is: /${path}`)
  if (!contentList[path]) {
    return send(res, 404, zlib.gzipSync('File not found'))
  }

  const data = JSON.stringify(contentList[path])
  send(res, 200, zlib.gzipSync(data))
})

genMenu(cwd, catalogOutput).then(() => {
  const port = process.env.PORT || 8899
  server.listen(port)
  console.info(`\n Server listening on http://localhost:${port} \n`);
})
