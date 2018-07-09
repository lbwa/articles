---
title:      "PWA 基础"
date:       2018-07-07
author:     "Bowen"
tags:
    - 前端开发
    - PWA
---

`PWA` 意为 `progressive web application`，即渐进式网络应用。

## 解决的问题

### 对于 `web App`

1. `PWA` 可离线访问应用，体验接近 `Native App`，2017 年 `twitter` 的 `PWA` 显著降低了用户跳出率。

2. `PWA` 具备推送消息的能力，可即时加载和定期更新。

### 对于 `Native App`

1. `PWA` 因存在 `manifest` 清单而具有 `SEO` 增强，可被搜索引擎发现，可安装于移动端桌面。

    - `native app` 天生是封闭的环境，故不存在 `SEO` 能力，`PWA` 在浏览器环境下运行，存在 `manifest` 清单,故具有 `native app` 所不具有的 `SEO` 能力。

2. `PWA` 无需借助应用商店安装，可直接使用。

3. `PWA` 无需手动更新，它借助 `Service Worker` 保持最新状态。

### 对于以上二者

1. `PWA` 兼容任何具有浏览器的设备。因为它只依赖于支持 `Service Worker` 的浏览器运行。

## 基本架构

### `App shell`

`App shell` 是驱动 `PWA` 的 ***最小*** `HTML`，`CSS`，`JS`的集合。可理解为 `App shell` 是 `PWA` 运行的 ***基础架构***。`PWA` 中所有的数据层内容都将在 `App shell` 中运行。

`App shell` 架构将应用核心架构与 UI 和 数据层 分离。应用核心架构与 UI （即 `App shell` ）在初次加载时就被缓存。在后续加载应用时， ***只需要*** 请求更新的数据层内容即可。应用的核心架构和 UI 是从 ***本地缓存*** 中读取，避免了多次重复请求应用核心和 UI。此时的 `PWA` 因仅需要请求数据层数据而具备了快速启动的能力。

### `Server Worker`

`Service Worker`（又称[服务工作线程][service-worker]）运行在 ***独立*** 于浏览器主线程的 `ServiceWorkerGlobalScope` 上下文环境（即浏览器后台）中。它现阶段支持 ***离线体验***，包含推送通知和后台同步等功能。

1. 它属于 JS 工作线程的一种，但 ***不具备*** 访问 `DOM` 的能力。它通过 `postMessage` 接口来与控制的页面通信。

2. 本质是一种可编程的网络代理。可控制页面所发网络请求的处理方式。

3. 它在闲置时会被终止，在有需要时重启。所以不应依赖 `Service Worker` 的 `onfetch` 和 `onmessage` 处理全局状态。

4. 它是基于 `Promise` 对象的实现。


***notice***: `./service-worker.js` 的 `register` 注册路径是基于 ***应用*** 的 ***根路径***，而不是相对于以上注册程序代码的路径。因为 `Service Worker` 的作用域是由应用的根路径文件夹所定义的。（[Google Developers][cache sw]）

另附截止至本文发表之时 `Service Worker` 的兼容性列表 —— [Is Service Worker ready][Is Service Worker ready]。

### `Service Worker` 与 `App shell`

基于 `Service Worker` 的可离线使用，消息推送，网络请求代理等特性，我们可以使用 `Service Worker` 来缓存 `App shell` 来实现 `PWA` 的渐进增强。

## `Service Worker` 的生命周期

`Service Worker` 的生命周期完全独立于网页。`Service Worker` 在第一次打开应用页面界面时， 在页面的 JS 脚本中注册。（[Google Developers][sw-lifecycle-google docs]，[MDN][sw-api-mdn]）

![sw-lifecycle](https://raw.githubusercontent.com/lbwa/lbwa.github.io/vue/source/images/post/pwa-fundamentals/sw-lifecycle.png)

### Install event

该事件主要用于缓存 `App shell`。

- 在安装 `Service Worker` 时，第一个触发的事件就是 [install][sw-lifecycle-install] 事件，在该事件完成后，可认为 `Service Worker` 安装完成。

```js
// app.js
// 注册 Service worker
// https://developers.google.com/web/fundamentals/codelabs/your-first-pwapp/#_14
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./service-worker.js')
    .then(() => console.log('Service Worker registered !', reg.scope))
    .catch((err) => console.error('Service Worker registered unsuccessfully !', err))
}
```

```js
// service-worker.js
const cacheName = 'PWA-application'
const filesToCache = [
  '/',
  '/index.html',
  // ...
]

self.addEventListener('install', evt => {
  console.log('[ServiceWorker] Install')
  // ExtendableEvent.waitUntil() 用于延长时间的寿命从而阻止浏览器在事件中的异步操作
  // 完成之前终止服务工作线程
  evt.waitUntil(
    // caches 对象是用于开辟存储容器。另注，是调用 caches 开辟容器而不是 Cache 或 cache
    // caches.open 返回匹配 cacheName 的 cache 对象的 Promise。
    caches.open(cacheName).then(cache => {

      // cache 参数即为匹配的 cache 对象
      console.info('[ServiceWorker] Caching app shell')

      // addAll 用于缓存当前 URL 数组（即 request[]）中每一项。
      return cache.addAll(filesToCache)
    })
  )
})
```

在示例代码中 [cache][caches] 对象为缓存的 `Request / Response` 对象提供 ***存储容器***。`cache.addAll` 方法具有原子性，任意一个文件缓存失败，整个缓存步骤也将失败。

### Activate event

该事件主要用于更新 `cache` 容器。

- 在安装事件完成后，会触发一个 [activate][sw-lifecycle-activate] 激活事件，`activate` 事件会在新的 `Service Worker` 启动时触发（旧版本 `Service Worker` 不触发该事件）。它触发时会清理与之前版本的 `Service Worker` 相关联的旧资源与旧缓存。

```js
// service-worker.js
// 只在不存在或旧版本 `Service Worker` 不再与任何页面关联时触发，否则进入 `waiting
// to activate` 阶段。
self.addEventListener('activate', e => {
  console.log('[ServiceWorker] Activate')
  e.waitUntil(
    // 循环所有的 cache 容器
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        // 删除所有除当前 cache 容器以外的所有容器，又因为 activate 事件仅在新版本
        // `Service Worker` 使用时才被调用，即可保证 Service Worker 在 App shell 更
        // 改时更新 cache 容器，删除旧容器
        if (key !== cacheName) {
          console.log('[Service worker] Removing old cache', key)
          // caches.delete 用于删除开辟的 cache 容器
          return caches.delete(key)
        }
      }))
    })
  )
  return self.clients.claim()
})
// 以上代码保证在 App shell 更新时，即启用新的 `Service Worker` 时更新 cache 缓存容器。
// 另外必须在 `Service Worker` 文件顶部重新定义 `cacheName` 变量。
```

***Notice***: 如果现有的 `Service Worker` 已启用，那么新版本仅会在后台安装，但 ***不会*** 被激活，此时被称为 [worker in waiting][sw-lifecycle-waiting-stage]。直到已加载的页面不再使用旧的 `Service Worker` 才会激活新的 `Service Worker`。只要旧版本的 `Service Worker` 不再与任何页面关联。那么新版本就会替代旧版本的 `Service Worker` 成为 `active worker`。旧版本及其关联资源（缓存）就会被清除。

[service-worker]:https://developers.google.com/web/fundamentals/primers/service-workers/

[Is Service Worker ready]:https://jakearchibald.github.io/isserviceworkerready/

[cache sw]:https://developers.google.com/web/fundamentals/codelabs/your-first-pwapp/#_15

[caches]:https://developer.mozilla.org/zh-CN/docs/Web/API/Cache

[sw-lifecycle-google docs]:https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle?hl=zh-cn

[sw-api-mdn]:https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API

[sw-lifecycle-install]:https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle?hl=zh-cn#install

[sw-lifecycle-activate]:https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle?hl=zh-cn#activate_1

[sw-lifecycle-waiting-stage]:https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle?hl=zh-cn#waiting

## 读取 App shell 缓存

`Service Worker` 通过拦截 `PWA` 请求来决定从缓存中读取 `App shell`。仅当缓存中不存在 `App shell` 时，`Service Worker` 才会默认使用原生 `fetch` API 来请求源服务器获得一个副本。

```js
self.addEventListener('fetch', evt => {
  console.log('[ServiceWorker] Fetch', evt.request.url)
  evt.respondWith(
    // caches.match 评估是否存在 evt.request 缓存
    caches.match(evt.request).then(response => {
      return response || fetch(evt.request)
    })
  )
})
```

![sw-fetch](https://rawgit.com/lbwa/lbwa.github.io/vue/source/images/post/pwa-fundamentals/sw-fetch.png)

当 `Cache storage` 中不存在指定 `cacheName` 的 `cache` 容器时，将发起网络请求，最终将缓存新的 `App shell` 于指定的 `cache` 容器中。

![sw-offline](https://rawgit.com/lbwa/lbwa.github.io/vue/source/images/post/pwa-fundamentals/sw-offline.png)

`Service Worker` 存在指定的 `App shell` 时，将从指定的 `cache` 容器中读取。

### 边界情况

1. 缓存取决于为每次更改更新缓存容器键名

以上 `Service Worker` 读取 `App shell` 时，仅当 `cacheName` 发生改变时，才会更新 `App shell`。否则将保持使用旧的缓存。即缓存取决于缓存键名。

2. 更新容器却更新了整个缓存容器

这样有一个缺点，就是只要一个文件发生变化时，为了更新缓存就不得不使整个 `cache` 容器失效，而重新下载新的 `App shell`。这样是有很大的性能浪费的。

解决方案可以是将 `cacheName` 指定为根据内容而生成的文件名。即 `content hash` 文件名。

3. 浏览器自身缓存可能阻止 `Service Worker` 的缓存更新

在初次安装处理程序时（`install handler`）浏览器将不会返回从浏览器缓存中返回数据，而是一定会执行 `HTTPS` 请求（补充：`Service Worker` 除本地服务器外仅支持 `HTTPS` 协议。）。这样做的目的就是为了保证安装的 `App shell` 一定是最新版。否则，浏览器将在初次安装 `App shell` 时使用旧版本 `App shell`。这将导致 `Service Worker` 永远得不到更新。因为浏览器在该情境下在一直循环使用旧版本。

推荐的方案是在安装 `App shell` 时总是请求源服务器。

4. 谨慎地在生产环境中执行缓存优先策略（`cache-first`）

在生产环境中执行缓存优先策略时，将导致任何读取缓存的时候都不会查询网络。这将导致只要本地有缓存，就几乎不可能更新本地的 `Service Worker` 配置中的 `App shell`。

因为 `Service Worker` 配置是取决于定义注册该 `Service Worker` 的 ***那个*** 文件，而不是服务器。（本文中指的是当时注册该 `Service Worker` 的 `./service-worker.js`）（此处原文为 `Since the configuration depends on where it was defined`）

处理以上四点边界情况推荐使用 [sw-precache] 或 [workbox]（Google 推荐 `workbox`） 之类的内容库来管理缓存。

[sw-precache]:https://github.com/GoogleChrome/sw-precache

[workbox]:https://github.com/GoogleChrome/workbox

## Reference

- [Your first progressive web app]（Google Developers）

- [Service Worker]（Google Developers）

- [Service Worker lifecycle]（Google Developers）

- [Debugging service workers]（Google Developers）

- [Using service worker]（MDN）

- [CacheStorage.open]（MDN）

- [CacheStorage.delete]（MDN）

- [CacheStorage.keys]（MDN）

- [Cache.addAll]（MDN）

[Your first progressive web app]:https://developers.google.com/web/fundamentals/codelabs/your-first-pwapp/

[Service Worker]:https://developers.google.com/web/fundamentals/primers/service-workers/

[Service Worker lifecycle]:https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle

[Debugging service workers]:https://codelabs.developers.google.com/codelabs/debugging-service-workers/#0

[using service worker]:https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API/Using_Service_Workers

[CacheStorage.open]:https://developer.mozilla.org/zh-CN/docs/Web/API/CacheStorage/open

[CacheStorage.delete]:https://developer.mozilla.org/zh-CN/docs/Web/API/CacheStorage/delete

[CacheStorage.keys]:https://developer.mozilla.org/zh-CN/docs/Web/API/CacheStorage/keys

[Cache.addAll]:https://developer.mozilla.org/zh-CN/docs/Web/API/Cache/addAll
