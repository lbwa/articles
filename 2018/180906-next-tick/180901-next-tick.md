---
title:  "Vue.js 的 nextTick 实现"
date:   2018-09-06
author: "Bowen"
tags:
    - 前端开发
    - 事件循环
    - Vue.js
---

`Vue.js` 中的 `nextTick` 函数核心原理是基于 [W3C] 和 [HTML living standard][event loop processing model] 中的 `event loop processing model` 模型的实现。

[W3C]:https://www.w3.org/TR/html5/webappapis.html#event-loops-processing-model

[event loop processing model]:https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model

## nextTick 模块

在 `Vue.js` 源码 [src/core/util/next-tick.js] 中定义了 `nextTick` 模块，该模块实现了 `nextTick` 函数。`nextTick` 模块整体可分为 3 个部分：

1. 定义 `callbacks` 容器。该容器用于存储当前 `event loop` 中通过 `nextTick` 传入的所有 `cb` 函数。从设计思路上来讲，`nextTick` 始终是集中式、有序地执行传入的 `cb` 函数。
2. 定义执行器 `flushCallbacks` 函数。该函数用于在当前 `event loop` 的 `execution context stack` 为空时，即当前 `(marco)task` 执行完成时，通过存在于 `task queue` 或 `microtask queue`（默认值） 中的 `flushCallbacks` 来 ***一次性统一*** 执行 `callbacks` 容器中所有的函数。
3. 定义 `macroTimerFunc` 和 `microTimerFunc` 队列函数。`macroTimerFunc` 函数用于将 `flushCallback` 执行器定义于以 `(marco)task` 的方式执行。`microTimerFunc` 函数用于将 `flushCallback` 执行器定义于以 `microtask` 的方式执行。

[src/core/util/next-tick.js]:https://github.com/lbwa/vue/blob/dev/src/core/util/next-tick.js

## 注册 nextTick 函数

`Vue.js` 中 `$nextTick` 在 [src/core/instance/render.js] 中被挂载到 `Vue` 构造函数的原型对象上。

```ts
export function renderMixin (Vue: Class<Componenet>) {
  // ...
  Vue.prototype.$nextTick = function (fn: Function) {
    // 在 nextTick 内部实现了第二参数绑定为第一参数的 this 值
    return nextTick(fn, this)
  }
  // ...
}
```

其中下一节将介绍在注册 `$nextTick` 方法指定了 `nextTick` 的参数 `fn` 的 `this` 值为 `Vue` 实例。

[src/core/instance/render.js]:https://github.com/lbwa/vue/blob/dev/src/core/instance/render.js

## 收集 cb 函数

```ts
export function nextTick (cb?: Function, ctx?: Object) {
  // ...
  callbacks.push(() => {
    if (cb) {
      try {
        // 绑定 this 对象
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  // ...
}
```

当我们调用 `nextTick` 函数时，首先传入 `cb` 函数以及执行 `cb` 函数时的 `this` 对象。在 `Vue.js ` 中的处理中，之所以将 `cb` 函数暂缓执行，并添加至 `callbacks` 容器中暂存的原因是，在当前 `event loop` 中可能存在多次调用 `nextTick` 函数的情况。

```js
created () {
  this.$nextTick(() => {/* 1 do something you like */})
  this.$nextTick(() => {/* 2 do something you like */})
  this.$nextTick(() => {/* 3 do something you like */})
}
```

示例代码中，1，2，3 号函数在传入 `$nextTick` 函数之后，将被统一集中至 `callbacks` 容器中暂存。在当前 `(marco)task` 未完成前，1，2，3 函数均 ***不会被调用*** 。

## 创建 microtask 实现

```ts
// Here we have async deferring wrappers using both microtasks and (macro) tasks.
// In < 2.4 we used microtasks everywhere, but there are some scenarios where
// microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690) or even between bubbling of the same
// event (#6566). However, using (macro) tasks everywhere also has subtle problems
// when state is changed right before repaint (e.g. #6813, out-in transitions).
// Here we use microtask by default, but expose a way to force (macro) task when
// needed (e.g. in event handlers attached by v-on).
// ! 在 v-on 附加的事件监听器中，将使用 marcotask 来实现 nextTick
let microTimerFunc
let macroTimerFunc
let useMacroTask = false
```

在默认情况下，`Vue.js` 首先以 `microtask` 作为默认的 `nextTick` 执行实现。具体来说是通过 `Promise.then` 该 `microtask` 来实现 `microtask`。若当前的执行环境并不支持 `Promise` 对象时，将降级使用 `marcoTimerFunc` 来替换 `microTimerFunc` 实现。

```ts
// Determine microtask defer implementation.
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  microTimerFunc = () => {
    p.then(flushCallbacks)
    // in problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop) // 添加 noop 至 (marco)task queue
  }
} else {
  // fallback to macro
  // 在不支持 Promise 的浏览器中默认使用 macrotask queue 实现 nextTick
  microTimerFunc = macroTimerFunc
}
```

另外在使用 `Promise` 来实现 `microtask` 时，在一些 `UIWebViews` 中，存在 `execution context stack` 为空的情况下，并不会调用 `microtask queue` 的奇怪情况（此时 `callbacks` 中存在待调用的 `cb` 函数，即此时 `microtask queue` 不为空）。除非在此时给 `task queue` 添加其他任务，来解除当前 `event loop` 中 `microtask queue` 被卡住的情况。

为了纠正这种奇怪的现象，`Vue.js` 通过向 `(marco)task queue` 手动添加一个 `(macro)task` 来实现强制执行 `microtask queue`。

## 创建 macrotask 实现

在初始化 `nextTick` 模块时，将以 `setTimeout`、`MessageChannel`、`setTimeout` 的从高到低的优先级实现  `macroTimerFunc`（`macrotask`）。

```ts
// Determine (macro) task defer implementation.
// Technically setImmediate should be the ideal choice, but it's only available
// in IE. The only polyfill that consistently queues the callback after all DOM
// events triggered in the same loop is by using MessageChannel.
/**
 * 优先使用 setImmediate，否则使用 MessageChannel，否则使用 setTimeout
 * MessageChannel 作为 setImmediate（宏任务异步回调）的备选
 * setImmediate 的性能优于 setTimeout，因为不必设置计时器；但存在兼容性问题
 */
/* istanbul ignore if */
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  macroTimerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else if (typeof MessageChannel !== 'undefined' && (
  isNative(MessageChannel) ||
  // PhantomJS
  MessageChannel.toString() === '[object MessageChannelConstructor]'
)) {
  const channel = new MessageChannel()
  const port = channel.port2
  channel.port1.onmessage = flushCallbacks
  macroTimerFunc = () => {
    // 向 channel.port1 发送信息，将会让 channel.port1 的 onmessage 回调注册为 (marco)task
    port.postMessage(1)
  }
} else {
  /* istanbul ignore next */
  macroTimerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```

代码中首先检测当前执行环境是否支持 [setImmediate]（仅有 `IE` 和 `Node.js` 实现），在不支持 [setImmediate] 的情况下降级使用 [MessageChannel] 做为备用的 `macrotask` 实现。

```js
const channel = new MessageChannel()
const port = channel.port2
channel.port1.onmessage = flushCallbacks
macroTimerFunc = () => {
  // 向 channel.port1 发送信息，将会让 channel.port1 的 onmessage 回调注册为 (marco)task
  port.postMessage(1)
}
```

> When a port's port message queue is enabled, the event loop must use it as one of its task sources.

API [MessageChannel] 本身是用于不同的 `browsing contexts` 之间通信（[Web Workers] 的核心之一），根据 [HTML living standard][ls-mc] 可知，`postMessage()` 方法将开启一个 `post message queue`。该队列将使得回调函数 `onmessage` 将注册为一个 `(macro)task`。

[MessageChannel]:https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel

[Web Workers]:https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API

[ls-mc]:https://html.spec.whatwg.org/multipage/web-messaging.html#port-message-queue

在同时不支持 [setImmediate] 和 [MessageChannel] 中的执行环境中，将使用最后的 `macrotask` 备选实现 `setTimeout(fn, 0)`。这里要注意的是 `setTimeout(fn, 0)` 并不会向国内很多人认为的那样会直接无前提的设置最小时限 `4ms`，在 [HTML living standard][HTML living standard-timer] 和 [W3C][W3C-timer] 中查阅 `timer` 章节均只有当 `timer` 算法嵌套层级超过 5 层，且此时的 `timeout` 小于 `4ms` 时，才会将 `timeout` 提升至 `4ms`。进一步可理解为 `setInterval` 的最小时限为 `4ms`。

在整个实现 `macroTimerFunc` 的过程中，将 [setImmediate] 作为第一选择而不是 `setTimeout` 是因为 [setImmediate] 不需要设置计时器，在性能上优于 `setTimeout`。

[setImmediate]:https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate

[HTML living standard-timer]:https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timer-initialisation-steps

[W3C-timer]:https://www.w3.org/TR/html/webappapis.html#timer-initialization-steps

## nextTick 触发执行队列

在 `nextTick` 模块内定义了变量 `pending` 和 `useMacrotask`，`pending`用于标记 `callbacks` 容器中元素是否已经更新，当为 `false` 时，将触发执行函数 `macroTimerFunc` 或 `microTimerFunc`，并将执行 `callbacks` 容器中所有的 `cb` 函数。

```ts
export function nextTick (cb?: Function, ctx?: Object) {
  // ...
  if (!pending) {
    pending = true // 保证当前 `event loop` 中仅有第一次调用创建执行队列

    // ! 执行传入的 cb 函数
    if (useMacroTask) {
      macroTimerFunc()
    } else {
      // ! 为了避免不必要的多次 vnode 重绘，nextTick 默认使用 microtask 实现
      microTimerFunc()
    }
  }
  // ...
}
```

在当前 `event loop` 中第一次调用 `nextTick` 时，首先将传入的 `cb` 函数添加至 `callbacks` 数组容器暂存。此时，因为存在默认值 `let pending = false`，那么当执行至 `if` 语句判断时，将触发执行队列的创建。因为另外存在默认值 `let useMacroTask = false`，那么将默认使用 `microTimerFunc` 实现执行队列，即在 `microtask queue` 中执行 `callbacks` 容器中函数。此时将在本次 `event  loop` 中的 `microtask queue` 添加新的 `microtask` —— `flushCallbacks`。待当前 `event loop` 的 `execution context stack` 为空时，将触发 `microtask queue` 执行，即执行 `flushCallbacks`。

## nextTick 被多次调用

上一节叙述了在当前 `event loop` 中 ***第一次*** 调用 `nextTick` 时的情况。因为在第一次创建执行队列的实现方式时，存在以下标记修改：

```js
pending = true
```

那么，在当前 `event loop` 中后续多次调用 `nextTick` 时，`nextTick` 将 ***跳过*** 执行队列实现方式的创建。那么也就是说后续的多次调用 `nextTick` 仅仅会向引用类型值 `callbacks` 容器来添加当前的 `cb` 函数。而不会执行 `marcoTimerFunc` 或 `microTimerFunc`。

那么也就达到了一种仅在第一次调用 `nextTick` 时创建执行队列的实现方式，后续调用仅仅更新储存容器的效果。也就避免了多次创建执行队列，多次刷新 `callbacks` 容器的局面。

## flushCallbacks 执行器

```ts
// 执行容器中的 cb 回调函数
function flushCallbacks () {
  pending = false // 重置 pending
  const copies = callbacks.slice(0) // 获取副本
  callbacks.length = 0 // 重置 callbacks 容器
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}
```

`flushCallbacks` 执行器是实现传入 `nextTick` 的 `cb` 函数能够被执行的核心模块。首先在该模块中重置 `pending` 变量，以用于下次 `event loop` 中重新创建执行队列实现方式 `microTimerFunc` 或 `macroTimerFunc`。第二部分获取 `callbacks` 的副本。并重置原始 `callbacks` 容器。然后循环迭代执行容器副本中的所有 `cb` 函数，并 ***依次*** 执行这些 `cb` 函数。

此处之所以使用副本遍历，并且在遍历之间将 `callbacks` 容器是因为可能存在嵌套调用 `nextTick` 的情况：

（以 `microTimerFunc` 实现方式为例）

```js
created () {
  // 多次使用箭头函数来保持 this 始终为 vue 实例
  this.$nextTick(() => { // fn1
    console.log('I am outer !')
    this.$nextTick(() => { // fn2
      console.log('I am nested !')
    })
  })
}
```

在示例代码执行后，此时的 `callbacks` 为 `[fn1]`，那么此时 `execution context stack` 为

```js
// execution context stack（抽象 `stack` 数据结构如下）
[console.log('I am outer !')] // 输出 'I am outer !'，此时 callbacks 已经重置为 []
[flushCallbacks] // 包含执行 console.log 和 this.$nextTick(fn2) 的执行语句
```

根据规范的 `event loop processing model` 模型（[W3C][w3c-el] 和 [HTML living standard][ls-el]），在执行当前 `microtask` 时，`microtask` 仍存在于 `microtask queue` 中，直到 `microtask` 从 `execution context stack` 中移除，`microtask` 才会从 `microtask queue` 中移除。那么此时的 `microtask queue` 为：

```js
// microtask queue（抽象 `queue` 数据结构如下）
[flushCallbacks]
```

[w3c-el]:https://www.w3.org/TR/html5/webappapis.html#performs-a-microtask-checkpoint

[ls-el]:https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint

继续执行代码，此时 `execution context stack` 变为：

```js
// execution context stack（抽象 `stack` 数据结构如下）
[this.$nextTick(fn2)] // 向 callbacks 中添加 fn2 函数，此时 callbacks 为 [fn2]
[flushCallbacks] // from microtask queue
```

此时的 `microtask queue` 仍然为：

```js
// microtask queue（抽象 `queue` 数据结构如下）
[flushCallbacks]
```

继续执行代码，此时 `execution context stack` 变为：

```js
// execution context stack（抽象 `stack` 数据结构如下）
[microTimerFunc] // 即添加另外一个 microtask 到 microtask queue 中，即 flushCallbacks
[this.$nextTick(fn2)]
[flushCallbacks]
```

此时的 `microtask queue` 将变为：

```js
// microtask queue（抽象 `queue` 数据结构如下）
[flushCallbacks][flushCallbacks]
```

这里我们可以首先从 `nextTick` 的设计角度来看，在 `nextTick` 中嵌套调用 `nextTick` 时，总是应该在另外一个 `microtask` 中执行传入嵌套的 `nextTick` 的 `cb` 函数。这也就时上文对 `nextTick` 的嵌套调用的执行分析。

更深层次地，为什么需要新建一个 `microtask`？因为这是为了统一整体 `nextTick` 的设计思路，在非嵌套调用 `nextTick` 时，`nextTick` 就是通过新建一个 `microtask` 来实现 `cb` 函数的有序调用。那么在存在嵌套调用的情况下，内部嵌套调用的 `nextTick` 函数也应该新建一个 `microtask` 来实现自己的 `cb` 函数有序调用。

解析完 `nextTick` 的嵌套调用，回到 `为什么使用 callbacks 副本循环迭代？且在迭代前重置 callbacks 容器` 的问题上。结合上文所解析的 `nextTick` 嵌套调用，使用副本的最根本的原因是 `callbacks` 是引用类型值，若在嵌套的 `nextTick` 中共用外部 `nextTick` 的 `callbacks` 容器，那么将导致在内部的嵌套函数 `nextTick` 的 `callbacks` 容器中将存在之前外部的 `callbacks` 容器的 `cb` 函数（此时还在循环迭代 `callbacks` 各项 `cb` 函数的过程中，无法做到重置 `callbacks` 容器）。那么外部 `callbacks` 容器中的 `cb` 函数将出现重复调用。所以，就必须使用副本循环迭代执行 `cb` 函数，并在循环迭代前重置 `callbacks` 容器，这样无论在什么样的情况下执行 `nextTick` 函数时，都将使用一个重置状态的 `callbacks` 容器。

另外，在循环之前保证 `callback` 为空，是为了保证在循环迭代时出现 `this.$nextTick` 嵌套调用时，不影响该嵌套函数的 `callbacks` 使用，此时当前外部 `nextTick` 所需的`callbacks` 执行容器已经通过浅复制保存了下来，这样就达到既不影响外部 `nextTick` 使用 `callbacks` 容器也不影响内部嵌套 `nextTick` 使用 `callbacks` 容器的目的。

## 返回一个 Promise 对象

在 `Vue.js` [文档] 中存在以下用法：

```js
// 作为一个 Promise 使用 (2.1.0 起新增，详见接下来的提示)
Vue.nextTick()
  .then(function () {
    // DOM 更新了
  })
```

在调用 `nextTick` 函数时，在没有传入参数的情况下将返回一个 `Promise` 对象。该实现对应的源码如下：

```ts
export function nextTick (cb?: Function, ctx?: object) {
  let _resolve

  callbacks.push(() => {
    if (cb) {
      // ...
    } else if (_resolve) {
      // _resolve 为 resolve 函数或 undefined
      _resolve(ctx)
    }
  })

  if (!cb && typeof Promise !== 'undefined') {
    // 在未传入 cb 函数且执行环境支持 Promise 时，使用 _resolve 缓存 resolve 函数
    // 配合 callback.push() 使用可起到在未传入 cb 函数时，将返回一个 Promise 实例。
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
```

在未向 `nextTick` 函数传入一个参数时，将触发实例化一个 `Promise` 对象，并在实例化过程中缓存内部 `resolve` 函数，并添加至 `callbacks` 容器中。那么在执行 `callbacks` 容器时，将执行之前缓存的 `resolve` 函数，从而 `resolve` 之间的 `Promise` 实例化对象（因为函数是引用类型值，即执行的是同一个函数）。进而在未传入参数的情况下返回一个 `Promise` 对象。

[文档]:https://cn.vuejs.org/v2/api/#Vue-nextTick
