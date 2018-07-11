---
title:      "客户端跨域解决方案"
date:       2018-04-19
author:     "Bowen"
tags:
    - 前端开发
    - 网络请求
---

## 什么是跨域

跨域，指的是浏览器当前页面不能执行其他网站的脚本。它是由浏览器的**同源策略**造成的，是浏览器对 JavaScript 脚本施加的安全限制。

所谓`同源`是指，**域名，协议，端口**都相同。浏览器执行 JavaScript 脚本时，会检查这个脚本属于哪个页面，如果不是同源页面，就不会被执行。

## 对跨域的基本理解

1. 跨域只存在于浏览器客户端，在服务端是不存在跨域的。

2. 跨域时的 ajax 请求并不是没有发出去，此时跨域请求**仍能发出**，且服务端能够收到请求，并返回相应的结果，只是结果在客户端解析时，**被拦截**了。这一点可在请求后的控制台 `network` 选项卡验证，在报错跨域时，仍然能够看到返回的数据结果 `response`。

浏览器在数据返回时会验证是否是同源数据，若不是同源数据，将会进一步**验证数据头部**是否带有 `access-control-allow-origin: *` ，以此来判断返回数据的服务器是否开启了 `CORS` ，并且检查当前源中**允许的源**是否包括了请求源，并作出解析或拒绝解析返回数据的判断。

![跨域请求][cross-domain-solution-img1]

[cross-domain-solution-img1]:https://raw.githubusercontent.com/lbwa/articles/master/2018/180419-cross-domain-solution/detect-cors.png

## 解决方案

跨域的常见解决方法:

目前为止，跨域请求都必须依靠服务端进行相关配置来处理跨域请求。
1.  window.name + iframe 需要目标服务器响应 window.name。
1.  window.location.hash + iframe 同样需要目标服务器作处理。
1.  html5 的 postMessage + iframe 这个也是需要目标服务器或者说是目标页面写一个 postMessage，主要侧重于前端通讯。
1.  JSONP 需要目标服务器配合一个 callback 函数。
1.  CORS 需要服务器设置 header：Access-Control-Allow-Origin。
1.  服务器（如，自建 nginx 服务器）反向代理，这种方法可以不用目标服务器配合，但是必须搭建一个**中转服务器**，用于转发请求。此法亦可伪造 header 来绕过 JSONP 的 header 验证

现在一般常用的是方法是 4，5，6。

## 拓展：关于 ajax 的同源限制

简短来说，客户端的 ajax 请求只能请求同源数据。

举例来说，a 网站有一个 ajax 请求 x，a 在没有配置后端的情况下，b网站是不能直接使用 ajax 跨域请求 a 网站的请求 x（浏览器同源策略），只有当 a 网站的请求 x 是 JSONP 请求时，b 网站才能通过 ajax 代理 JSONP 请求并伪造 header 请求 x。或将b网站的 ajax 请求由中转服务器转发去请求 x。

## 反向代理解决需要跨域的 ajax

反向代理原理：浏览器有同源限制，但**服务器没有同源限制**，那么可以利用这一特性来使用本地服务器来转发请求

前后端分离开发过程中，webpack-dev-server （基于 express 的实现）设置 [devServer.before][devServer.before] 来实现反向代理，示例配置[点我][fanxiandaili]

[fanxiandaili]:https://github.com/lbwa/vue-sonar/blob/master/build/webpack.dev.conf.js#L28-L116

[devServer.before]:https://doc.webpack-china.org/configuration/dev-server/#devserver-before

## 反向代理解决需要验证 header 的 JSONP

现象：JSONP 本身是不具有模拟 headers 的功能的。

原理：当目标是需要验证 header 的 JSONP 请求时。使用中转服务器的 axios 请求模拟目标 JSONP 请求及其 header。返回的数据格式是携带有目标数据的回调函数。

典型的需要验证 header 的 JSONP 请求模拟[示例][the-recommend.js-jsonp]

```js
export function getJSONPData (recommendId) {
  const data = {
    ...commonParams,
    ...{
      type: 1,
      json: 1,
      utf8: 1,
      // ... some request params
    }
  }

  // 在没有 header 验证的情况下直接使用 jsonp 请求 url，否则使用后端 ajax 代理转发 JSONP 请求
  // return jsonp(TARGET_URL, data, {
  //   ...options,
  //   // https://github.com/webmodules/jsonp/blob/master/index.js#L50
  //   prefix: '', // 回调函数前缀，默认值为 __jp
  //   name: 'playlistinfoCallback' // 回调函数名，默认值为从 0 开始的计数器
  // })

  return axios.get(TARGET_URL, {
    params: data
  }).then(res => res.data)
}
```

中转服务器示例配置(express 为例)[点我][aqjhddm]

```js
// devServer.before(它是一个 express API)

app.get('/api/getJSONPData', (req, res) => {
  const url = 'https://example.com'

  axios.get(url, {
    // 伪造 JSONP 的 headers
    headers: {
      referer: 'https://example.com',
      host: 'https://example.com'
    },
    params: req.query
  }).then(response => {
    let ret = response.data

    // 提取返回的 JSONP 数据中的回调函数中的参数（即目标数据）

    if (typeof ret === 'string') {
      // 该正则不具有普适性
      const reg = /^\w+\(({.+})\)$/
      const matches = ret.match(reg)

      if (matches) {
        ret = JSON.parse(matches[1])
      }
    }
    res.json(ret)
  }, err => {
    throw Error(`Proxy failed, ${err}`)
  })
})
```

以上两个配置对比普通的 JSONP 请求，可看出，当（**前提条件**） JSONP 有 header 验证时，转为使用 后端代理 ajax 请求 JSONP 数据，（**返回数据的处理方法**）返回的数据是包含之前 JSONP 的回调函数名的，可在 [剔除回调函数][tchdhs] 看出，需要对返回的数据剔除回调函数名，并转为 JSON 正确格式

## 反向代理适用场景

### 场景一：目标服务器返回 JSON 格式

在后端代理请求返回数据格式为 JSON 的情况下，api 不要使用 JSONP 访问后端中转服务器的 url ，尽管 api 能收到正确的数据内容，但格式是错误 `(Uncaught SyntaxError: Unexpected token :)` 的！！因为中转服务器 axios 请求目标服务器返回的数据是 JSON 格式。中转服务器会将目标服务器返回的数据转发回 api ，那么 JSONP 是**无法正确解析** JSON 格式的（JSON 格式没有回调函数）。即请求的类型数据格式要对应相应的请求类型。

### 场景二：目标服务器返回 JSONP 格式

当目标服务器返回的是 JSONP 格式时，***仍然使用 axios 请求中转服务器***，不同于场景一的是，在返回的 JSONP 数据中需要**剔除回调函数并转化为 JSON 格式**。

那么可总结为，使用 axios 转发模拟带 headers 验证的 JSONP 时，***必须以 ajax 请求中转服务器***。我们根据目标服务器返回给中转服务器的数据类型来决定是否在中转服务器中添加**剔除回调函数并转化为 JSON 格式**这一数据处理的步骤。

[header-refer-JSONP]:https://github.com/lbwa/vue-sonar/blob/master/build/webpack.dev.conf.js#L47-L71

[the-recommend.js-jsonp]:https://github.com/lbwa/vue-sonar/blob/master/src/api/the-recommend.js#L33-L59

[aqjhddm]:https://github.com/lbwa/vue-sonar/blob/master/build/webpack.dev.conf.js#L74-L100

[tchdhs]:https://github.com/lbwa/vue-sonar/blob/master/build/webpack.dev.conf.js#L85-L95

### 易错点：反向代理转发请求时返回错误格式

现象：[链接][fxdlgscw]高亮处 JSONP 请求中转服务器，返回格式错误

原因：目标服务器只接受 ajax 请求（返回的数据不会有回调函数包裹）时，我们的网页也只能以 ajax 请求中转服务器，中转服务器转发 ajax 请求。若我们的网页使用 JSONP 来请求中转服务器，那么我们最后收到的是 ajax 类型的返回数据，并没有一个回调函数来包裹返回数据，那么就没有可执行的回调函数。即造成了格式错误。

[fxdlgscw]:https://github.com/lbwa/vue-sonar/blob/master/src/api/the-recommend.js#L49-L55

解决方案：[使用 axios 请求][axios-request]后端中转服务器，返回正确格式

[axios-request]:https://github.com/lbwa/vue-sonar/blob/master/src/api/the-recommend.js#L56-L59


## JSONP

JOSNP 意为 `JSON with padding`，本质是动态创建 script 标签的 src 属性来请求数据，因为 `<script>` 的 `src` 属性是可以**跨域的。**

原理：

1. 首先是利用 `<script>` 的 `src` 属性来实现跨域。

1. 通过将前端方法作为**参数**传递到服务器端，然后由服务器端注入参数之后再返回，实现服务器端向客户端通信。客户端在收到返回数据时，就会执行被回调函数包裹的目标数据。

1. 由于使用 script 标签的 src 属性，因此**只支持get方法**

**直接**使用 jsonp 方法访问源地址，这在**没有 referer 验证的情况下**可返回正确的数据，若需要 referer 验证(在 Chrome Devtool network 选项直接点击链接是否能返回正确数据)，那么使用 axios 后端代理转发请求。因为 JSONP 本身不能伪造 headers ，反向代理的目的是**伪造 header。**

典型的 JSONP 请求[点我][jsonp-example]

[jsonp-example]:https://github.com/lbwa/vue-sonar/blob/master/src/api/the-artist.js#L4-L20

### JSONP 的局限性

1. 只支持 GET 请求

1. 因为是通过 `<script>` 的 `src` 属性来实现跨域的，那么我们是无法验证请求数据的安全性，那么我们必须确保请求的域的安全性

1. 必须另外添加计时器来判断是否请求成功

## 参考

[MDN Same-Origin Policy][browser]

[HTML Standard Concept-origin][browser1]

[我知道的跨域与安全][all-I-know-about-cross-domain]

[ajax 跨域解决方案][CORSajaxky]

[如何解决前后端分离中的 ajax 跨域问题][rhjjqhdflzdkywt]

[常见 jsonp 出现格式错误的原因][cjjcxgscw]

[cjjcxgscw]:https://www.zhihu.com/question/264546160

[CORSajaxky]:https://segmentfault.com/a/1190000012469713#articleHeader12

[all-I-know-about-cross-domain]:https://juejin.im/post/5a6320d56fb9a01cb64ee191

[rhjjqhdflzdkywt]:https://www.zhihu.com/question/265985355

[browser]:https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy

[browser1]:https://html.spec.whatwg.org/multipage/origin.html#concept-origin
