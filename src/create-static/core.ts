const Mtj = require('mark-to-json')
const glob = require('glob')
const path = require('path')
const fs = require('fs')

class CreateStatic {
  cwd: string
  constructor ({
    cwd // 搜索开始的基路径
  }: {
    cwd: string
  }) {
    this.cwd = cwd
    this.scanner()
  }

  async scanner () {
    let paths: string[] = []
    try {
      // get all markdown paths
      paths = await this.getPaths()
    } catch (err) {
      console.error(`[Static Scanner]: ${err}`)
    }

    // read every markdown
    paths.map(async (singlePath: string) => {
      let contentBox: string
      let origin: string

      try {
        // 防止将 {} 解析为代码块，应该解析为对象
        ({ origin, contentBox } = await this.getContent(singlePath))
      } catch (err) {
        console.error(err)
      }

      const normalized = this.normalizeRoute(origin)

      this.convert({
        token: contentBox,
        dest: path.resolve(process.cwd(), `./${normalized}.json`),
        extraHeader: {
          erron: 0
        },
        contentKey: 'content'
      })
    })
  }

  getPaths (): Promise<string[]> {
    return new Promise((resolve, reject) => {
      glob('*/**/*.md', {
        cwd: this.cwd,
        ignore: 'node_modules/**/*',
        nodir: true
      }, (err: null | Error, paths: string[]) => {
        err ? reject(err) : resolve(paths)
      })
    })
  }

  getContent (docPath: string): Promise<{origin: string, contentBox: string}> {
    return new Promise((resolve, reject) => {
      fs.readFile(
        path.resolve(process.cwd(), `./${docPath}`),
        'utf8',
        (err: Error, contentBox: string) => {
          err ? reject(err) : resolve({
            origin: docPath,
            contentBox
          })
        }
      )
    })
  }

  normalizeRoute (origin: string) {
    const removeShortDate = origin.replace(/\/{0}(\d{6}-)+/g, '')
    const removeInitialYear = removeShortDate.replace(/^\d{4}/, '')
    const removeRepeat = removeInitialYear.replace(/^\/\S+\//, '')
    const removeExtension = removeRepeat.replace(/\.md$/, '')
    return `writings/${removeExtension}`
  }

  convert ({
    token,
    dest,
    extraHeader,
    contentKey,
  }: {
    token: string,
    dest: string,
    extraHeader: {
      [key: string]: any
    },
    contentKey: string
  }) {
    new Mtj({
      token,
      dest,
      extraHeader,
      contentKey
    })
  }
}

module.exports = CreateStatic

export {}
