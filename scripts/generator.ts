// generate list of articles
// It must be handle by manual before render blog
// process.cwd(): '/'

const fs = require('fs')
const path = require('path')
const readMeta = require('front-matter')
const formatDate = require('./format-date')

import { header, post, initialContent } from './types'

function readFile (target: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.resolve(__dirname, `../${target}/${target}.md`),
      'utf8',
      (err: object, contentData: string) => {
        err ? reject(err) : resolve({origin: target, contentData})
      }
    )
  })
}

async function scanner (path: string) {
  // fs.readdirSync return a string[]
  const initialFiles: string[] = fs.readdirSync(path)
  const filterFiles: string[] = initialFiles.filter((file: string) => {
    return /^\d+/.test(file)
  })

  // 异步读取，加快效率
  // https://developers.google.com/web/fundamentals/primers/async-functions#_9
  // map 函数返回一个由参数函数返回值组成的数组
  const contentPromises = filterFiles.map(async file => {
    let fileContent: object

    try {
      fileContent = await readFile(file)
    } catch (err) {
      console.error(err)
    }

    return fileContent
  })

  return contentPromises
}

interface contentList {
  [path: string]: string
}

let contentList: contentList = {} // all content storage

async function parser (path: string) {
  let catalog: post[] = []
  let contentPromises

  try {
    contentPromises = await scanner(path)
  } catch (err) {
    console.error(err)
  }

  for (const initialContent of contentPromises) {
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

    catalog.unshift({
      to: origin, // origin.replace(/.md$/g, '')
      title,
      author,
      date,
      tags
    })

    // generate content list, saved by object
    const body: string = raw.body

    contentList[origin] = body
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

  fs.writeFile(catalogOutput, header, (err: object) => {
    err
      ? console.error(err)
      : console.log(`\n 👌  generate menu successfully in ${catalogOutput} ! \n`)
  })
}

module.exports = { genMenu, contentList }
