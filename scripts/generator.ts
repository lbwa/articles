// generate list of articles
// It must be handle by manual before render blog
// process.cwd(): '/'

const fs = require('fs')
const path = require('path')
const readMeta = require('front-matter')
const formatDate = require('./format-date')

import { meta, post } from './types'

function readFile (target: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.resolve(__dirname, `../${target}/${target}.md`),
      'utf8',
      (err: object, data: string) => {
        err ? reject(err) : resolve(data)
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

  for (let i = 0; i < filterFiles.length; i++) {
    const content = await readFile(filterFiles[i])

    const meta: meta = readMeta(content).attributes
    const title = meta.title
    const author = meta.author
    const date = formatDate(meta.date)
    const tags = meta.tags

    result.unshift({
      to: filterFiles[i].replace(/.md$/, ''),
      title,
      author,
      date,
      tags
    })
  }

  return JSON.stringify(result)
}

module.exports = async function writeFile (output: string, input: string) {
  fs.writeFile(output, await scanner(input), (err: object) => {
    err
      ? console.error(err)
      : console.log(`\n 👌  generate menu successfully in ${output} ! \n`)
  })
}
