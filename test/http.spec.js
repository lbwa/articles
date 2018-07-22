const { expect } = require('chai')
const server = require('../dist/server')
const http = require('http')

const parse = JSON.parse.bind(JSON)

describe('Static server', () => {
  let app
  before((done) => {
    app = server.listen(8899)
    done()
  })

  after((done) => {
    app.close(() => {
      done()
    })
  })

  it('Request home', (done) => {
    createRequest('/', (data) => {
      done()
    })
  })

  it('Request menu', (done) => {
    createRequest('/menu', (data) => {
      const responseData = parse(data)
      expect(responseData[0].errno).to.be.equal(0)
      done()
    })
  })

  it('Request projects', (done) => {
    createRequest('/projects', (data) => {
      const responseData = parse(data)
      expect(responseData[0]).to.has.property('name')
      expect(responseData[0]).to.has.property('url')
      expect(responseData[0]).to.has.property('desc')
      done()
    })
  })
})

function createRequest (url, fn, method='GET') {
  const options = {
    hostname: 'localhost',
    port: 8899,
    path: url,
    method,
  }

  // http.get is one of alias
  // https://nodejs.org/api/http.html#http_http_request_options_callback
  const req = http.request(options, (res) => {
    res.setEncoding('utf8')
    res.on('data',fn)
    expect(res.statusCode).to.be.equal(200)
  })

  req.on('error', (err) => {
    console.error(err)
  })

  req.end()
}
