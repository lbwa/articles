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

      try {
        contentBox = await this.getContent(singlePath)
      } catch (err) {
        console.error(err)
      }

      this.convert({
        token: contentBox,
        dest: path.resolve(process.cwd(), `./writings/${Date.now()}.json`),
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

  getContent (docPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(
        path.resolve(process.cwd(), `./${docPath}`),
        'utf8',
        (err: Error, content: string) => {
          err ? reject(err) : resolve(content)
        }
      )
    })
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
