---
title:      "HTTP 协议响应首部"
date:       2018-06-07
author:     "Bowen"
tags:
    - 前端开发
    - 网络请求
---

`HTTP` 响应首部即 `Response Headers`。它将与 `HTTP` 请求首部内容协商（[source][content-negotiation]），再根据 `server` 端的内部实现并依托 `HTTP` 响应首部来返回实际的协商结果。故返回的值可能不匹配 `HTTP` 请求头的值。

[content-negotiation]:https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation

## Access-Control-Allow-Origin

- 常用于 HTTP 请求跨域解决方案之一 —— `CORS` 。表示指定了该响应资源只允许被给定的 `Origin` 共享。该值设置为 `*` 时，表示允许所有源都具有访问该资源的权限（[source][access-control-allow-origin]）。

- 该属性只能指定一个 ***唯一值***，不接受多个值。

    - 若有多个源需要通过 CORS 跨域，那么可配置一个模块。该模块在 `server` 端设置该头部前配置筛选出 URL 是否为白名单内源，若是白名单内源，那么就配置头部 `Access-Control-Allow-Origin`，否则不配置该头部。

详见我的另一篇博文👉[客户端跨域解决方案][客户端跨域解决方案]

[access-control-allow-origin]:https://fetch.spec.whatwg.org/#http-access-control-allow-origin

[客户端跨域解决方案]:http://lbwa.github.io/blog/writings/180419-cross-domain-solution/

## Access-Control-Allow-Headers

- 常用于标记超出 `CORS` 限定配置的 `request headers` 是否合法。表示指定在 `CORS` 请求中除限定配置外额外被允许的请求头（[source][access-control-allow-headers]）。

### CORS 请求限制

  - 默认允许的 `CORS` 请求方法（[source][CORS-methods]）

      - 只允许 `GET`、`POST`、`HEAD` 方法。使用其他请求方法都需要经过 `CORS` 预请求。

  - 默认允许的 `CORS` 请求头（[source][cors-safelisted-request-header]）

      - `Accept`
      - `Accept-Language`
      - `Content-Language`
      - `Content-Type` 中仅包含 `text/plain`、`multipart/form-data`、`application/x-www-form-urlencoded` 三种 `MIME` 类型值。

  - 其他限制

      1. `XMLHttpRequestUpload` 对象均没有注册任何事件监听程序。

      2. 请求中没有使用 `ReadableStream` 对象。

***总结***:使用其他超出以上 `CORS` 请求所限定的配置都将需要经过 `CORS` 预请求检测 `CORS` 请求头的合法性。

### CORS 预请求

`CORS` 预请求的 `Request Method` 值为 `OPTIONS`。

在浏览器即将发起超过 1 中限定配置的 `CORS` 请求时，将触发浏览器 `CORS` 预请求策略。该策略用于在发起正式的 `CORS` 请求之前确认 `CORS` 请求中超出限定配置的部分是否合法。仅当超出默认配置的默认配置被 `server` 端认可时，浏览器才会真正 ***解析*** CORS 正式请求返回的数据。

  - 不论 `CORS` 预请求是否合法，浏览器均会发出正式的 `CORS` 请求，合法性检测的意义在于浏览器 ***是否解析*** 返回的数据（该原理类似浏览器对跨域资源的解析策略（[extension][extension-cross-domain-solution]））。

  ```js
  // server1.js
  const http = require('http')
  const fs = require('fs')

  http.createServer(function (request, response) {
    console.log('request.url :', request.url)

    const html = fs.readFileSync('cross-domain-solution.html', 'utf8')
    response.writeHead(200, {
      'Content-type': 'text/html',
    })
    response.end(html)
  }).listen(8888)

  console.info('server listening at port 8888')
  ```
  ```js
  // client.html
  // client 跨域请求 server2 数据
  fetch('http://127.0.0.1:8800', {
    method: 'POST',
    headers: {
      // 请求头类型不在 CORS 请求限定配置内，触发 CORS 预请求检测该请求头合法性
      'X-Test-Cors': 'test custom headers in CORS preflight'
    }
  })
    .then(res => {
      target.innerText = 'check your network tag in console drawer'
    })
    .catch(err => console.error(err))
  // 不论 CORS 预请求是否合法，client 均会发起 CORS 正式请求。
  ```

  当被请求的 `server2` 没有配置 `Access-Control-Allow-Headers` 或目标值不在该值中时，`client` 将在预请求响应后报错，但仍发起正式 `CORS` 请求，但拒绝解析正式 `CORS` 请求返回的数据。

  ```js
  // server2.js
  const http = require('http')

  http.createServer(function (request, response) {
    console.log('request.url :', request.url)

    response.writeHead(200, {
      // 允许跨域请求
      'Access-Control-Allow-Origin': '*',
      // 允许除限定配置外额外的合法请求头的值
      'Access-Control-Allow-Headers': 'X-Test-Cors'
    })
    response.end('server response')
  }).listen(8800)

  console.log('server listening at port 8800')
  ```

[CORS-methods]:https://fetch.spec.whatwg.org/#methods

[cors-safelisted-request-header]:https://fetch.spec.whatwg.org/#cors-safelisted-request-header

[access-control-allow-headers]:https://fetch.spec.whatwg.org/#http-access-control-allow-headers

[extension-cross-domain-solution]:https://lbwa.github.io//blog/writings/180419-cross-domain-solution/#对跨域的基本理解

## Access-Control-Allow-Methods

该响应头的使用方法与原理于 `Access-Control-Allow-Headers` 相似。

- 常用于标记超出 `CORS` 限定配置情况下的 `Request Method` 是否合法（[source][access-control-allow-methods]）。

  ```js
  response.writeHead(200, {
    // 允许跨域请求
    'Access-Control-Allow-Origin': '*',
    // 允许除限定配置外额外的合法 `Request Method` 的值
    'Access-Control-Allow-Methods': 'PUT, DELETE'
  })
  ```

[access-control-allow-methods]:https://fetch.spec.whatwg.org/#http-access-control-allow-methods

## Access-Control-Max-Age

- 表示当次预请求检测 `Access-Control-Allow-Methods` 和 `Access-Control-Allow-Headers` 的缓存有效期，即在有效期内，即使有超出限定配置的 `CORS` 请求也不需要再进行 `CORS` 预请求来检测其合法性（[source][access-control-max-age]）。

[access-control-max-age]:https://fetch.spec.whatwg.org/#http-access-control-max-age

## Cache-Control/缓存头

- 用于指定在 `request` 或 `response` 链中缓存当前请求数据，该指令是单向指令（[source][http1.1-cache-control]）。

### 可缓存性

  1. `public` 表示响应链中所有缓存都可存储当前响应数据，如发送客户端，中转服务器等。

  2. `private` 表示当前响应数据只能单个用户缓存，即中转服务器不能缓存该响应数据。

  3. `no-cache` 表示在使用本地缓存之前，必须首先请求原 `server` 端验证当前缓存的数据是否可用。

  ![cache-control][img-cache-control]

[img-cache-control]:https://rawgit.com/lbwa/articles/master/2018/180607-http-response/cache-control.svg

### 缓存有效期

  1. `max-age=<seconds>` 于 `server` 端设置响应数据在 `client` 端的缓存有效期，始于请求时间点。在有效期内，`client` 将读取缓存数据而不是请求数据。即使在 `server` 端该数据已经被更新，也不会改变 `client` 在有效期内读取缓存的策略，因为 `client` 在有效期内当前请求 URL 未改变的情况下就不会去请求该数据，所以 `client` 并不知道该数据已经在 `server` 端被更新了。

      - ***拓展应用***：根据静态资源的 ***内容*** 打包生成的 `contentHash` 码来命名常缓存文件。只要 `server` 端该静态资源文件被更新，那么该资源的 `contentHash` 一定变化，即请求 URL 改变，那么 `client` 知晓当前静态资源请求 URL 改变后，即使在缓存有效期内，也会重新请求该资源。这样做的目的是最大限度使用缓存文件，且规避在有效期内即使 `server` 端数据被更新但仍使用缓存文件的问题。

  ```js
  response.writeHead(200, {
    'Content-type': 'text/javascript',
    'Cache-Control': 'max-age=200, public' // 以秒为单位
  })
  response.end('console.log("script loaded")')
  ```

  2. `s-maxage=<seconds>` 覆盖 `max-age=<seconds>`，只在共享缓存中（如中转服务器）有效。

  3. `max-stale[=<seconds>]` 表示即使缓存过期，仍可接受一个（在指定时间内）已过期资源，只在发起端设置才有效，在 `server` 端响应数据中设置是无效的。

### 验证

  1. `must-revalidate` 在使用之前的旧资源时，必须请求原 `server` 端来验证当前旧资源是否已经过期。

  2. `proxy-revalidate` 与 `must-revalidate` 作用相同，但仅适用于共享缓存，如中转服务器。

### 其他

  1. `no-store` 表示所有的链中节点的缓存都不可存储当前响应数据。

  2. `no-transform` 表示不能对当前响应数据进行转换或变化。

***注***：以上所有指令都不具有强制力，仅表示一种约束期望。

[http1.1-cache-control]:https://tools.ietf.org/html/rfc7234#section-5.2

## Last-Modified/缓存验证

- 用于 `server` 端标记响应数据上次修改的时间，据此来判断本地缓存是否需要更新。

    - 一般在使用对应的数据缓存之前，`client` 首先通过配合 `If-Modified-Since` 或 `If-Unmodified-Since` ***请求头*** 来向 `server` 端传输之前的 `Last-Modified` 值。`server` 端据此可以来判断 `client` 端与 `server` 端的数据是否是同步的，即验证本地缓存是否需要更新。

        - 注：在 `Cache-Control` 配置了 `no-store` 时，`client` 将不会携带 `If-Modified-Since` 或 `If-Unmodified-Since` 请求头。

## Etag/缓存验证

用于通过数据签名（如根据内容的 `contentHash` 计算）来 ***严格验证*** 数据是否需要更新。

  - `client` 在下次使用该缓存之前，一般配合 `If-Match` 或 `If-Non-Match` ***请求头*** 来向 `server` 传输本地缓存的数据签名。`server` 端据此判断数据签名是否一致，即` server` 是应该向 `client` 返回新的数据，还是可以直接使用 `client` 端本地缓存。

  ```js
  response.writeHead(200, {
    'Content-type': 'text/javascript',
    'Cache-Control': 'max-age=20000000, no-cache',
    'Last-Modified': '18/06/06 00:00:00', // 上次修改日期
    'Etag': '777' // 指定数字签名
  })

  // 读取请求头
  const etag = request.headers['If-None-Match']
  if (etag && etag === '777') {
    response.writeHead(304, {
      'Content-type': 'text/javascript',
      'Cache-Control': 'max-age=20000000, no-cache',
      'Last-Modified': '18/06/06 00:00:00',
      'Etag': '777'
    })
    response.end() // 即使此处返回内容，client 也会忽略该内容而使用本地缓存。
  } else {
    response.writeHead(200, {
      'Content-type': 'text/javascript',
      /**
       * 1. 配置 no-cache 用于在每次使用本地缓存之前，强制向 server 端验证是否可使
       * 用本地缓存
       */
      'Cache-Control': 'max-age=20000000, no-cache',
      'Last-Modified': '18/06/06 00:00:00',
      'Etag': '777'
    })
    response.end('console.log("script updated")')
  }

  response.end('console.log("script loaded")')
  ```

  - 注：在 `Cache-Control` 配置了 `no-store` 时，`client` 将不会携带 `If-Match` 或 `If-Non-Match` 请求头。

## Set-Cookie

用于 `server` 端通过 `Set-Cookie` 设置 `client` 端的 `HTTP Cookie`。

### 特点

`Set-Cookie` 响应首部不同于 `Cookie` 请求首部，它 ***不具有唯一性***。在 `Node.js` 中它通过一个数组来设置多个`Set-Cookie` 响应头。

  ```js
  response.writeHead(200, {
    'Content-type': 'text/html',
    'Set-Cookie': ['username=John_Wick', 'gender=male']
  })
  ```

（以下 `Cookie` 都是指 `HTTP Cookie`，除非特别指明是 `Cookie` 请求首部（[extension][cookie-request-header]）。）

  ```markup
  # 创建 client 端 Cookie
  Set-Cookie: <cookie-name>=<cookie-value>
  ```

`HTTP Cookie` （[extension][extension-cookie]）通常用于:

  1. 会话管理，如登录状态，购物车等需要记录的信息。

  2. 用户个性化设置，如用户自定义设置等。

  3. 浏览器行为追踪，如跟踪分析用户行为等。

注：不推荐再使用 `Cookie` 作用为本地存储介质，推荐使用 `localStorage`、`sessionStorage`、`IndexedDB` 代替。 因为每次请求时，在没有禁用 `Cookie` 的情况下都会携带 `Cookie` 请求首部传输至 `server`。如果使用了，将会带来额外的性能开销，尤其是在移动端下。

[cookie-request-header]:https://lbwa.github.io/blog/writings/180608-http-request/#cookie

### Cookie 属性

  1. `max-age`（时长）和 `expires`（时间点）设置过期时间。

      - 会话期 `Cookie`，若设置 `Cookie` 时未指定过期时间，那么它在浏览器关闭后就会被自动删除。

      - 持久性 `Cookie`，在设置 `Cookie` 时指定了过期时间后，`Cookie` 将保存至特定的过期时间，除非手动删除。

  ```js
  response.writeHead(200, {
    'Content-type': 'text/html',
    // 使用逗号分隔不同的 Cookie 键值对，分号连接 Cookie 属性
    'Set-Cookie': ['username=John_Wick', 'gender=male; Max-Age=5']
  })
  ```

  2. `Secure` 只在 `HTTPS` 协议下发送。

  3. 配置 `HttpOnly` 可阻止通过 `document.cookie` 访问指定 `Cookie`。

  4. `domain` 属性，用于在访问一级域名设置指定 `Cookie` 时（前提），授权给所有子级域名指定 `Cookie` 使用权。

  ```js
  response.writeHead(200, {
    'Content-type': 'text/html',
    'Set-Cookie': ['username=John_Wick; domain=github.com', 'gender=male']
  })
  /**
   * 1. domain=github.com 表示所有 github.com 的子域名都被授权访问
   * github.com 下的 cookie
   * 2. 必须首先访问一级域名才能设置（被共享的）Cookie
   * 3. 只有设置了 domain 属性的 Cookie 才被共享
   */
  ```
***注***：`Cookie` 属性是作用于个体，而非全体。

[extension-cookie]:https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies

## Connection/长连接

- 值为 `keep-alive` 或 `close`。

- 用于构建 `HTTP` 长连接，复用同一客户端下的 `TCP` 通道。即用于告知 `client` 端在完成本次响应后，`server` 端是否会关闭当前 `TCP` 通道。即返回 `Connection` 请求头的执行结果，并设置为 `Connection` 响应头。

- 在 `server` 端构建 `HTTP` 长连接之后，可设置长连接的 ***有效时间***，即在一定时间内没有新的请求时，关闭当前 `HTTP` 长连接。

更多信息，查看本文 `HTTP 请求首部`[章节 - Connection][http-request-header]。

[http-request-header]:https://lbwa.github.io/blog/writings/180608-http-request/#connection-长连接

## Content-Type/内容协商

与 `Accept` 请求首部对应。

用于标注 `server` 端在与请求首部内容协商（[source][content-negotiation]）后，实际 `server` 端返回内容的 `MIME` 类型。

`MIME` 类型对应的文件拓展名：[source][mime-reference]

[mime-reference]:http://tool.oschina.net/commons

## Content-Encoding/内容压缩

与 `Accept-Encoding` 请求首部对应。

用于标注 `server` 端在与请求首部内容协商后，实际 `server` 端返回内容的内容编码类型（即实际使用的压缩算法）。

### 值

`gzip` 表示采用 `Lempel-Ziv coding (LZ77)` 压缩算法，以及32位CRC校验的编码方式。

`deflate` 采用 `zlib` 结构和 `deflate` 压缩算法。

`br` 表示采用 `Brotli` 算法的编码方式。

`;q=` 表示 ***权重***，即编码方式的优先顺序。

`*` 匹配任意未在请求首部中列出的编码方式。

以下为不常使用的编码方式：

`compress` 采用 `Lempel-Ziv-Welch (LZW)` 压缩算法，已被大部分浏览器弃用。

`identity` 用于指代自身，如未经过压缩或修改。

```js
// Node.js 编码数据内容的模块
const zlib = require('zlib')

// ...

response.writeHead(200, {
  'Content-Type': 'text/html',
  'Content-Encoding': 'gzip'
})
response.end(zlib.gzipSync(html))
```

![content-encoding][content-encoding]

上图中，`420B` 则是表示传输的数据内容经过 `server` 的编码后，传输时的大小。它的大小与内容的实际编码方式有关，即 `Content-Encoding` 响应首部。`476B` 为数据内容在 `client` 端解压后的大小，除非内容变化，否则该值不变。

[content-encoding]:https://raw.githubusercontent.com/lbwa/articles/master/2018/180607-http-response/content-encoding.png

## Content-Language

与 `Accept-Language` 请求首部对应。

用于标注 `server` 端在与请求首部内容协商后，实际 `server` 端返回的数据内容的自然语言类型。


## X-Content-Type-Options

标注 `client` 一定要遵循 `Content-Type` 响应头中的 `MIME` 类型，不应推测（修改）返回数据 `MIME` 类型。

  - 早期 `IE` 会因错误的 `Content-Type` 或未声明该值而根据返回内容推测数据类型。此举极易导致文本代码被执行，那么 `client` 就可能被恶意注入。

## Location/重定向

表示请求当前 URL 时，`server` 端向 `client` 端告知之前请求的数据资源转移后的 `URL`，`client` 端应该去重定向请求（`Redi`）这个转移后的 URL。其中，重定向由 `client` 自动完成完成，不需要人工干预。

- ***注***：必须向 `client` 端指定 `301` 或 `302` 重定向代码，否则浏览器不会自主进行重定向，此刻，将页面空白。

```js
// server.js
const data = fs.readFileSync('data.html')

if (request.url === '/') {
  // 必须设置为 302（推荐）或 301 代码，否则客户端无法正常跳转
  response.writeHead(302, {
    'Location': '/new-url'
  })

  response.end(html)
}

if (request.url === '/new-url') {
  response.writeHead(200, {
    'Content-Type': 'text/html'
  })

  response.end(data)
}
```

`301` 与 `302` 的区别：

  - `301` 表示永久重定向。例如，在请求 `url-0` 并完成当次重定向 `url-1` 后，缓存当前 `url-1`。之后发起的所有 `url-0` 请求直接在 `client` ***本地读取缓存*** 读取重定向地址 `url-1` ，此时并不会先向 `server` 请求重定向的目标地址。

      1. 该存储的 `url-1` 会在缓存中尽可能长的存储。除非清除了 `client` 缓存。

      2. 因为是从本地缓存读取重定向 URL，故应谨慎使用 `301` 代码。因为若在 `server` 端进行 URL 更新后，本地是无法感知更新的，本地仍将重定向至之前的 URL。

  - `302` 表示临时重定向。即每次请求都会请求 `server` 来得到重定向的目标地址。只有指定了 `Cache-Control` 或 `Expires` 时，该重定向地址才是缓存的。

## Content-Security-Policy/内容安全策略

用于限制资源获取，报告（`report-uri` 指令）资源获取越权（[source][csr-intro]）。如，限制 HTML 中外部资源的加载（执行）。

API:[source][csr-api]

注：`connect-src`（[source][connect-src]）指令可以限制当前站的 `Ajax` 请求。

实现方法一（推荐）：

```js
// server.js
response.writeHead(200, {
  'Content-Type': 'text/html;'

  /**
   * 1. default-src 指定了所有资源的备用策略，即在形如 img-src 等策略未指定的时候被应用。
   * 2. 以下限制了只能通过 http 或 https 的方式来加载所有资源，那么嵌入式 JS 代码将被
   * 忽视执行。
   * 3. 值为 'default-src \'self\'' 时，将只限 `同域的资源（即本站）` 加载执行，那么
   * 所有非同域外部资源将被 `block`
   * 4. form 表单不受 'default-src \'self\'' 的限制。必须设置为
   * 'form-action: \'self\''
   */
  'Content-Security-Policy': 'default-src http: https:'
})
```

实现方法二：

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">
```

结果：

```html
<body>
  <!-- 以下外部 JS 脚本将被执行 -->
  <script src="https://example.com/data.js"></script>
  <!-- 以下嵌入式代码将被忽略 -->
  <script>
    console.log('Hello World !')
  </script>
</body>
```

[csr-intro]:https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP

[csr-api]:https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Security-Policy__by_cnvoid

[connect-src]:https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src
