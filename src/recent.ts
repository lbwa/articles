import fs = require('fs')
import path = require('path')

const menu = require('../menu.json')

type item = {
  errno: number
  to: string
  title: string
  author: string
  date: string
  tags: string[]
}

let recent: item[] = []

function createRecent (token: string, path: string) {
  const ws = fs.createWriteStream(
    path
  )
  ws.on('close', () => {
    console.log('complete')
  })
  ws.write(token)
  ws.end()
}

for (let i = 0; i < 5; i++) {
  recent.push(menu[i])
}

createRecent(JSON.stringify(recent), path.resolve('./recent-posts.json'))
