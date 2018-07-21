const { genMenu } = require('./generator')
const server = require('./server')
const config = require('./config')

const HOST: string = config.host
const PORT: string = config.port
const cwd: string = config.cwd
const catalogOutput: string = config.catalogOutput

genMenu(cwd, catalogOutput)
  .then(() => {
    // 在执行脚本时传入指定参数将跳过建立 local server
    // 主要用于部署前生成 menu.json
    // ! notice: `now scale app-name.now.sh sfo1 1`, prevent app sleep
    // ! It's `sfo1`, not `sfo`. Usage is wrong. https://zeit.co/blog/scale
    // ! https://github.com/zeit/now-cli/issues/146#issuecomment-373925793
    if (process.argv[2] === 'skip') return

    server.listen(PORT, () => {
      console.log(`\n Server is listening on http://${HOST}:${PORT}\n`)
    })
  })
  .catch((err: Error) => {
    console.error(err)
  })
