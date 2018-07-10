// generate list of articles
// It must be handle by manual before render blog
// process.cwd(): '/'

const fs = require('fs')
const path = require('path')
const readMeta = require('front-matter')
const formatDate = require('./format-date')

import { meta, post, content } from './types'

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

  let result: post[] = []

  // 异步读取，加快效率 15ms ± 1ms
  // https://developers.google.com/web/fundamentals/primers/async-functions#_9
  // map 函数返回一个由参数函数返回值组成的数组
  // console.time('async reading')
  const contentPromise = filterFiles.map(async file => {
    return await readFile(file)
  })

  for (const content of contentPromise) {
    const { contentData, origin } = <content>await content // extract content
    const meta: meta = readMeta(contentData).attributes
    const title = meta.title
    const author = meta.author
    const date = formatDate(meta.date)
    const tags = meta.tags

    result.unshift({
      to: origin, // origin.replace(/.md$/g, '')
      title,
      author,
      date,
      tags
    })
  }
  // console.timeEnd('async reading')

  // 同步读取 20ms+
  // console.time('sync reading')
  // for (let i = 0; i < filterFiles.length; i++) {
  //   const {contentData} = <content>await readFile(filterFiles[i])

  //   const meta: meta = readMeta(contentData).attributes
  //   const title = meta.title
  //   const author = meta.author
  //   const date = formatDate(meta.date)
  //   const tags = meta.tags

  //   result.unshift({
  //     to: filterFiles[i].replace(/.md$/, ''),
  //     title,
  //     author,
  //     date,
  //     tags
  //   })
  // }
  // console.timeEnd('sync reading')

  return JSON.stringify(result)
}

module.exports = async function writeFile (output: string, input: string) {
  fs.writeFile(output, await scanner(input), (err: object) => {
    err
      ? console.error(err)
      : console.log(`\n 👌  generate menu successfully in ${output} ! \n`)
  })
}
