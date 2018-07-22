const resolve = require('path').resolve
const { expect } = require('chai')
const { genMenu } = require('../dist/generator')
const menu = require('../menu.json')
const server = require('../dist/server')
const http = require('http')

const parse = JSON.parse.bind(JSON)

describe('Test route', () => {
  let app
  before((done) => {
    const cwd = resolve(__dirname, '../')
    const catalogOutput = resolve(__dirname, '../menu.json')
    genMenu(cwd, catalogOutput)
      .then(() => {
        app = server.listen(8899)
        done()
      })
  })

  after((done) => {
    // https://github.com/visionmedia/supertest/issues/437
    // https://stackoverflow.com/a/14636625
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

  it('Request one of docs', done => {
    const len = menu.length
    const random = Math.round(Math.random() * len)
    const doc = menu[random]
    createRequest(`/writings/${doc.to}`, (data) => {
      const responseData = parse(data)
      expect(responseData.errno).to.has.equal(0)
      expect(responseData).to.has.property('to')
      expect(responseData).to.has.property('title')
      expect(responseData).to.has.property('author')
      expect(responseData).to.has.property('date')
      expect(responseData).to.has.property('tags')
      expect(responseData).to.has.property('data')
      done()
    })
  })

  it('Handle wrong method', done => {
    createRequest(
      '/',
      data => {
        const responseData = parse(data)
        expect(responseData.errno).to.be.equal(1)
        done()
      },
      'POST',
      404
    )
  })

  it('Handle wrong url', done => {
    createRequest(
      '/1',
      data => {
        const responseData = parse(data)
        expect(responseData.errno).to.be.equal(1)
        done()
      },
      'GET',
      404
    )
  })

  it('Handle wrong docs request', done => {
    createRequest(
      '/writings/1',
      data => {
        const responseData = parse(data)
        expect(responseData.errno).to.be.equal(1)
        done()
      },
      'GET',
      404
    )
  })
})

function createRequest (url, fn, method='GET', statusCode=200) {
  const options = {
    hostname: 'localhost',
    port: 8899,
    path: url,
    method,
  }

  // http.get is one of alias
  // https://nodejs.org/api/http.html#http_http_request_options_callback
  http
    .request(options, (res) => {
      res.setEncoding('utf8')
      res.on('data',fn)
      expect(res.statusCode).to.be.equal(statusCode)
    })
    .on('error', (err) => {
      console.error(err)
    })
    .end()
}
