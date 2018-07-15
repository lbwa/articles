// generate list of articles
// It must be handle by manual before render blog
// process.cwd(): '/'

const fs = require('fs')
const path = require('path')
const readMeta = require('front-matter')
const glob = require('glob')
const formatDate = require('./format-date')

import { header, post, initialContent, contentList } from './types'

function readFile (target: string) {
  // target 形如 '2018/180707-pwa-fundamentals/180707-pwa-fundamentals.md'
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.resolve(__dirname, `../${target}`),
      'utf8',
      (err: object, contentData: string) => {
        err ? reject(err) : resolve({origin: target, contentData})
      }
    )
  })
}

function getDocsPath (cwd: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob('*/**/*.md', {
      cwd: cwd,
      ignore: 'node_modules/**/*',
      nodir: true
    }, (err: null | object, docsPath: string[]) => {
      err ? reject(err) : resolve(docsPath)
    })
  })
}

async function scanner (cwd: string) {
  let docsPath: string[] = []

  try {
    docsPath = await getDocsPath(cwd)
  } catch (err) {
    console.error(err)
  }

  // 异步读取，加快效率
  // https://developers.google.com/web/fundamentals/primers/async-functions#_9
  // map 函数返回一个由参数函数返回值组成的数组
  const docsPromises = docsPath.map(async (doc: string) => {
    let docContent: object

    try {
      docContent = await readFile(doc)
    } catch (err) {
      console.error(err)
    }
    return docContent
  })

  // 所有博文被 Promise 对象包裹，并组成一个数组
  return docsPromises
}

let contentList: contentList = {} // all content storage

async function parser (path: string) {
  let catalog: post[] = []
  let docsPromises

  try {
    docsPromises = await scanner(path)
  } catch (err) {
    console.error(err)
  }

  for (const initialContent of docsPromises) {
    let contentData: string
    let origin: string

    try {
      // 已经声明的变量的解构赋值必须有括号包裹表达式，以防止将 {} 解析为代码块
      ({ contentData, origin } = <initialContent>await initialContent)
    } catch (err) {
      console.error(err)
    }

    const raw = readMeta(contentData)

    // generate menu, saved by JSON file
    const header: header = raw.attributes
    const title = header.title
    const author = header.author
    const date = formatDate(header.date)
    const tags = header.tags

    // filter string
    // origin --> /(\d{4})?\/(\d{6}-)+/g
    const removeShortDate = origin.replace(/\/{0}(\d{6}-)+/g, '')
    const removeInitialYear = removeShortDate.replace(/^\d{4}/, '')
    const removeRepeat = removeInitialYear.replace(/^\/\S+\//, '')
    const removeExtension = removeRepeat.replace(/\.md$/, '')

    catalog.unshift({
      errno: 0,
      to: removeExtension,
      title,
      author,
      date,
      tags
    })

    // generate content list, saved by object
    const body: string = raw.body
    const to: string =  removeExtension

    contentList[to] = {
      // origin, // this is full path according to root path
      errno: 0,
      to,
      title,
      author,
      date,
      tags,
      data: body
    }
  }

  return JSON.stringify(catalog)
}

async function genMenu (cwd: string, catalogOutput: string) {
  let header: string

  try {
    header = await parser(cwd)
  } catch (err) {
    console.error(err)
  }

  // 避免部署时再次写入，因为 now.sh server 不支持部署时文件写入
  if (process.env.NODE_ENV === 'production') return

  fs.writeFile(catalogOutput, header, (err: object) => {
    err
      ? console.error(err)
      : console.log(`\n 👌  generate menu successfully in ${catalogOutput} ! \n`)
  })
}

module.exports = { genMenu, contentList }
