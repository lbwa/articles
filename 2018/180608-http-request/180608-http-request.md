---
title:      "HTTP 协议请求首部"
date:       2018-06-08
author:     "Bowen"
tags:
    - 前端开发
    - 网络请求
---

`HTTP` 请求首部 ***不具有强约束***。它将与 `server` 端进行内容协商（[source][content-negotiation]），`server` 端将依托与请求首部对应的响应首部返回对应的内容协商结果。即可能不执行请求首部的请求值，而在对应的响应头中返回其他值。

[content-negotiation]:https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation

## Cookie

- 通过 `server` 端响应首部 `Set-Cookie` 设置本地 `HTTP Cookie`。在每次请求时，会通过 `Cookie` 请求首部携带 `HTTP Cookie`（[extension][extension-cookie]）传输至 `server` 端验证，用于确认当前用户等同源信息。

在 `client` 发起一个 `HTTP` 请求时，最多只能有一个 `Cookie` 头部被建立，但 `HTTP Cookie` 不具有唯一性，可以有多个。当 `client` 设置禁用 `Cookie` 后，请求时将完全忽略 `Cookie` 首部的建立。

（拓展阅读: `HTTP 响应首部` - [Set-Cookie][set-cookie]）

[set-cookie]:https://lbwa.github.io/blog/writings/180607-http-response/#set-cookie

## Connection/长连接

- 值为 `keep-alive` 或 `close`。

- 用于构建 `HTTP` 长连接，复用同一客户端下的 `TCP` 通道。即用于告知 `server` 端在此次请求完成后，是否应该保持 `TCP` 通道开启，以用于该 `client` 下次请求可跳过 `三次握手` 直接进行 `TCP` 传输。

    - 注：此举不具有强约束，那么 `server` 端 ***可能*** 有自己的实现并返回不同值的 `Connection` 响应头，而不遵循 `Connection` 请求头的值。

    - 在建立 `HTTP` 长连接后，若没有新的请求，在有效期后 `server` 将会关闭当前 `TCP` 连接通道。

### 资源请求与加载

（拓展阅读: [浏览器工作原理][how-browsers-work]）

以 `Chrome ` 为示例，在控制台 `Network` 选项卡的 `Connection ID` （原理介绍[source][chrome-connection-id]）条目中，相同 ID 的连接即是使用的同一 `TCP` 通道。

（更多的 `Chrome` 的 1. `waterfall` 文档：[source][chrome-water-fall]。2. 控制台官方文档（[source][chrome-console-drawer]））

  1. 在 `HTTP 1.1` 中 `TCP` 通道本身是串行请求的，即一个 `TCP` 通道内每次只执行一次请求，但该 `TCP` 连接通道是可以被同一 `client` 的不同请求复用的（此处应与浏览器允许多个 `TCP` 并发进行区分）。

      - 在 `HTTP 2` 中可进行并发请求。即在请求时，所有请求可并发复用同一个 `TCP` 通道。

  2. `client` 在请求 ***同域*** 的情况下会尽量复用同一 `TCP` 通道。超出限定时间后未有新的请求时，`server` 会关闭当前 `TCP` 连接通道。

  3. `Chrome` 现阶段最大并发数为 6，那么即最多有 6 个 `TCP` 请求（通道开启）同时进行，超出的请求将在队列中等待（[source][chrome-water-fall]）。

[how-browsers-work]:https://www.html5rocks.com/en/tutorials/internals/howbrowserswork/

[chrome-connection-id]:https://stackoverflow.com/questions/34184994/chrome-developer-tools-connection-id

[chrome-water-fall]:https://developers.google.com/web/tools/chrome-devtools/network-performance/understanding-resource-timing

[chrome-console-drawer]:https://developers.google.com/web/tools/chrome-devtools/

整体加载时，`waterfall` 图例：

（注：以下浏览器默认添加 `Connection: keep-alive` 请求头。）

![waterfall1][waterfall1]

上图中，首先加载 `HTML` 文件，在 DOM 树构建完成后，加载外部资源，那么表现为前六个外部资源 `TCP` 请求是并发的，所以他们之间的 `Connection ID` 是不同的。

当其中某一外部资源加载完成，那么请求队列中的请求开始复用之前的 `TCP` 通道，这点可从后续请求的 `Connection ID` 可以看到。

![waterfall2][waterfall2]

单个外部资源 `waterfall` 详细对比：

![initial][initial]

上图中经历过 `HTTP` 三次握手的初始化请求的 `waterfall` 中都有一栏桔黄色条目 `Initial connection`，表示 `三次握手` 所经历的时间。而经过复用 `TCP` 通道的请求时没有这一栏的，即不会经过 `三次握手`。

[waterfall1]:https://raw.githubusercontent.com/lbwa/articles/master/2018/180608-http-request/waterfall-integrity1.png

[waterfall2]:https://raw.githubusercontent.com/lbwa/articles/master/2018/180608-http-request/waterfall-integrity2.png

[initial]:https://raw.githubusercontent.com/lbwa/articles/master/2018/180608-http-request/waterfall-initial.png

## Accept/内容协商

与 `Content-Type` 响应首部对应。

表示 `client` 可处理的内容类型（`MIME`类型）。与 `Content-Type` 响应头对应。

`MIME` 类型对应的文件拓展名：[source][mime-reference]

[mime-reference]:http://tool.oschina.net/commons

## Content-Type/客户端数据传输

与响应首部中的 `Content-Type`（[source][response-content-type]）进行区分。请求首部的 `Content-Type` 表示传输给 `server` 端的数据内容的 `MIME` 类型，该请求首部可用于提交 `Form` 表单的 `POST` 请求中。

[response-content-type]:https://lbwa.github.io/blog/writings/180607-http-response/#content-type-内容协商

### 通过标签的默认行为提交

```html
<!-- enctype 默认只有三种类型，其他 MIME 类型可另使用 ajax 定义 -->
<!-- 必须指定 method 否则浏览器默认执行 GET 方法，则数据会以查询参数传递，而不是数据内容 -->
<form action="/target-url" method="POST" enctype="application/x-www-form-urlencoded">
  <input type="text" name="username">
  <input type="password" name="password">
  <input type="submit">
</form>
```

`enctype` 的值选项：

  - `application/x-www-form-urlencoded`: 如果属性未指定时的默认值。

  - `multipart/form-data`: 该值针对 `<input type=file"">` 元素。表现为拆分上传内容，上传内容（包含输入文本）将以 ***二进制***（主要是因为上传文件必须以二进制传输） 传输至 `server` 端，而不是以字符串传输。

  - `text/plain` (HTML5)

注：在 `Chrome` 中，使用 `multipart/form-data` 时，不会在控制台 `network` 显示 `Request Payload`，除非使用 `Ajax` 提交表单。

### 通过 Ajax 提交

```html
<form action="/target-url" id="form" method="POST" enctype="multipart/form-data">
  <input type="text" name="username">
  <input type="password" name="password">
  <input type="file" name="file" id="file-functions">
  <input type="submit">
</form>

<script>
  const form = document.getElementById('form')
  form.addEventListener('submit', evt => {
    // 阻止标签的默认提交，即标签中的 method 提交
    evt.preventDefault()
    const formData = new FormData(form)

    // fetch API 可根据 form 信息自动添加 Content-Type 请求头，不用主动声明
    fetch('/target-url', {
      method: 'POST',
      body: formData
    })
  })
</script>
```

## Accept-Encoding

与 `Content-Encoding` 响应首部对应。

表示 `Client` 可接受的编码类型（通常是以某种压缩算法实现）。`client` 通过与 `server` 进行内容协商后，`server` 会通过 `Content-Encoding` 响应头的方式告知 `client` 端 `server` 端最终所选择的编码方式。

### 值

`gzip` 表示采用 `Lempel-Ziv coding (LZ77)` 压缩算法，以及32位CRC校验的编码方式。

`compress` 采用 `Lempel-Ziv-Welch (LZW)` 压缩算法，已被大部分浏览器弃用。

`deflate` 采用 `zlib` 结构和 `deflate` 压缩算法。

`br` 表示采用 `Brotli` 算法的编码方式。

`identity` 用于指代自身，如未经过压缩或修改。

`*` 匹配任意未在请求首部中列出的编码方式。

`;q=` 表示 ***权重***，即编码方式的优先顺序。

## Accept-Language

与 `Content-Language` 响应首部对应。

表示 `client` 端所能理解的自然语言，如中文、en。

## User-Agent

表示当前 `client` 端的信息。即 `navigator.userAgent` 的值。
