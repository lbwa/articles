const whiteList = [
  'https://lbwa.github.io',
  'https://set.sh'
]

module.exports = {
  host: process.env.HOST || '127.0.0.1',
  port: process.env.PORT || 8800,
  whiteList
}
