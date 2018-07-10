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
  to: string
  data: string
}

async function parser (path: string) {
  let catalog: post[] = []
  let contentList: contentList[] = []
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

    const body: string = raw.body

    contentList.unshift({
      to: origin,
      data: body
    })
  }

  return {
    catalog,
    contentList
  }
}

module.exports = async function writeFile (cwd: string, catalogOutput: string, contentListOutput: string) {
  let allData

  try {
    allData = await parser(cwd)
  } catch (err) {
    console.error(err)
  }

  const catalog = JSON.stringify(allData.catalog)
  const contentList = JSON.stringify(allData.contentList)

  fs.writeFile(catalogOutput, catalog, (err: object) => {
    err
      ? console.error(err)
      : console.log(`\n 👌  generate menu successfully in ${catalogOutput} ! \n`)
  })

  fs.writeFile(contentListOutput, contentList, (err: object) => {
    err
      ? console.error(err)
      : console.log(`\n 👌  generate content list successfully in ${contentListOutput} ! \n`)
  })
}
