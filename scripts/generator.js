// generate list of articles
// It must be handle by manual before render blog
// process.cwd(): '/'

const fs = require('fs')
const path = require('path')
const readMeta = require('front-matter')
const formatDate = require('./format-date')

function readFile (target) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.resolve(__dirname, `../${target}/${target}.md`),
      'utf8',
      (err, data) => {
        err ? reject(err) : resolve(data)
      }
    )
  })
}

async function scanner (path) {
  // fs.readdirSync return a string[]
  const initialFiles = fs.readdirSync(path)
  const filterFiles = initialFiles.filter(file => /^\d+/.test(file))

  let result = []

  for (let i = 0; i < filterFiles.length; i++) {
    const content = await readFile(filterFiles[i])

    const meta = readMeta(content).attributes
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

module.exports = async function writeFile (output, input) {
  fs.writeFile(output, await scanner(input), (err) => {
    err
      ? console.error(err)
      : console.log(`\n 👌  generate menu successfully in ${output} ! \n`)
  })
}
