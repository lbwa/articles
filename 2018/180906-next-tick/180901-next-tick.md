---
title:  "Vue.js 的 nextTick 实现"
date:  2018-09-06
author:  "Bowen"
tags:

-  前端开发

-  事件循环

---

`Vue.js` 中的 `nextTick` 函数核心原理是基于 [W3C] 或 [HTML living standard][event loop processing model] 中的 `event loop processing model` 模型的实现。

[W3C]:https://www.w3.org/TR/html5/webappapis.html#event-loops-processing-model

[event loop processing model]:https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model

## nextTick 模块

在 `Vue.js` 源码 [src/core/util/next-tick.js] 中定义了 `nextTick` 模块，该模块实现了 `nextTick` 函数。`nextTick` 模块整体可分为 3 个部分：

1. 定义 `callbacks` 容器。该容器用于存储当前 `event loop` 中通过 `nextTick` 传入的所有 `cb` 函数。
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

其中后文将介绍在注册 `$nextTick` 方法时指定了 `nextTick` 的参数 `fn` 的 `this` 值为 `Vue` 实例。

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

## 创建 macrotask 实现方式

在初始化 `nextTick` 模块时，将以 `setTimeout`、`MessageChannel`、`setTimeout` 的从高到低的优先级实现 `macrotask` 实现方式 `macroTimerFunc`。

```ts
// Determine (macro) task defer implementation.
// Technically setImmediate should be the ideal choice, but it's only available
// in IE. The only polyfill that consistently queues the callback after all DOM
// events triggered in the same loop is by using MessageChannel.
/**
 * 优先使用 setImmediate，否则使用 MessageChannel，否则使用 setTimeout
 * 通过 MessageChannel 来实现 setImmediate（宏任务异步回调）
 * setImmediate 的性能优于 setTimeout，因为不必设置计时器；但存在兼容性问题，仅 IE实现
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

API [MessageChannel] 本身是用于不同的 `browsing contexts` 之间通信（[Web Workers] 的核心），根据 [HTML living standard][ls-mc] 可知，`postMessage()` 方法将开启一个 `post message queue`。该队列将使得回调函数 `onmessage` 将注册为一个 `(macro)task`。

[MessageChannel]:https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel

[Web Workers]:https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API

[ls-mc]:https://html.spec.whatwg.org/multipage/web-messaging.html#port-message-queue

在同时不支持 [setImmediate] 和 [MessageChannel] 中的执行环境中，将使用最后的 `macrotask` 备选实现 `setTimeout(fn, 0)`。这里要注意的是 `setTimeout(fn, 0)` 并不会向国内很多人认为的那样会直接无前提的设置最小时限 `4ms`，在 [HTML living standard][HTML living standard-timer] 和 [W3C][W3C-timer] 中查阅 `timer` 章节均只有当 `timer` 算法嵌套层级超越 5 层，且此时的 `timeout` 小于 `4ms` 时，才会将 `timeout` 提升至 `4ms`。进一步可理解为 `setInterval` 的最小时限为 `4ms`。

在整个实现 `macroTimerFunc` 的过程中，使得 [setImmediate] 作为第一选择而不是 `setTimeout` 是因为 [setImmediate] 不需要设置计时器，在性能上优于 `setTimeout`。

[setImmediate]:https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate

[HTML living standard-timer]:https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timer-initialisation-steps

[W3C-timer]:https://www.w3.org/TR/html/webappapis.html#timer-initialization-steps

## nextTick API

首先在 `nextTick` 模块内定义了变量 `pending` 和 `useMacrotask`，`pending`用于标记 `callbacks` 容器中元素是否需要更新，当为 `false` 时，将触发执行函数 `macroTimerFunc` 或 `microTimerFunc`，并将执行 `callbacks` 容器中所有的 `cb` 函数。

```ts
export function nextTick (cb?: Function, ctx?: Object) {
  // ...
  if (!pending) {
    pending = true

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
