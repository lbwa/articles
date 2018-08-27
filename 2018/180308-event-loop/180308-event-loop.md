---
title:      "解析 event loops"
subtitle:   "Event Loop 到底是什么，又是如何实现的？"
date:       2018-03-08
author:     "Bowen"
tags:
    - 前端开发
    - JavaScript
    - 事件循环
---

# 事件循环 event loop

单线程的实现方式就是事件循环（`event loop`）。

存在两种 `event loops`（[W3C][event loops]），即一种在 `browsing context` 下的事件循环，一种是在 `web workers` 下的循环。本文讨论在 `browsing context` 下的事件循环。

[event loops]:https://www.w3.org/TR/html5/webappapis.html#event-loop

## 事件循环定义

依据标准中对进程模型的流程描述（[来源][processing-model]）可得出，在完成一个宏任务，并清空因宏任务产生的微任务队列时，称之为一个事件循环。

## 任务源

- 宏任务（macrotask）：

    1. script

        - 整体代码（[来源][ECMA-Script-records]），即代码执行的基准执行上下文（[拓展阅读][post-execution-context]）

        - 该宏任务的目的在于，将整体代码段（或理解为模块）推入执行上下文栈（`execution context stack`）中。

            - 执行上下文栈初始会设置 `script` 为 `当前正在运行执行上下文`（`running execution context`），这期间可能因执行而创建新的执行上下文，那么就会依据模块内的代码不断的设置 **当前正在运行执行上下文**（`running execution context`），这样模块内的代码就会依次得以执行（此处主要是[执行上下文][post-execution-context] 中 `Running execution context 的更替` 的实际应用）。

            - 比如设置一些事件监听程序，一些声明，执行一些初始任务。在执行完成该任务时，会建立词法作用域等一系列相关运行参数。

    2. setTimeout，setInterval，setImmediate（服务端 API）

    3. I/O

        - 可拓展至 Web API（[来源][generic-task-sources]）：

            1. DOM 操作

            2. 网络任务

                - Ajax 请求

            3. history traversal

                - history.back()

            4. 用户交互

                - 其中包括常见 DOM2（`addEventListener`）和 DOM0（`onHandle`）级**事件监听回调函数**。如 `click` 事件回调函数等。

                - 特别地，事件需要冒泡到 `document` 对象之后并且事件回调执行**完成后**，才算该宏任务执行完成。否则一直存在于执行上下文栈中，等待事件冒泡并事件回调完成（来源：Jake Archibald blog - [level 1 boss fight][jake-blog]）。

    - **UI rendering**

- 微任务（microtask）:

    1. process.nextTick（[Node.js][process.nextTick]）

    2. Promise 原型方法（即 `then`、`catch`、`finally`）中被调用的回调函数

    3. MutationObserver（[DOM Standard][mutation-observer]）

        - 用于监听节点是否发生变化

    4. Object.observe(已废弃)

- **特别注明**：在 `ECMAScript` 中称 `microtask` 为 `jobs`（[来源][ECMAScript-jobs]，其中 [EnqueueJob][EnqueueJob] 即指添加一个 `microtask`）。

`macrotask` 和 `microtask` 中的每一项都称之为一个 **任务源**。

以上分类中，每一项执行时均占用`当前正在运行执行上下文`（`running execution context`）（线程）。如，可理解为浏览器渲染线程与 JS 执行共用一个线程。

**依据标准拓展**：

- 在 `W3C` 或 `WHATWG` 中除非特别指明，否则 `task` 即是指 `macrotask`。

- 根据 `W3C`（[来源][micro-task-source]）关于 `microtask` 的描述，只有两种微任务类型：单独的回调函数微任务（solitary callback microtasks），复合微任务（compound microtasks）。那么即在 `W3C` 规范中**所有**的**单独的回调函数**都是**微任务**类型。

    - solitary callback：Promise 原型的原型方法，即 `then`、`catch`、`finally` 能够调用单独的回调函数的方法。

    - compound microtask：

        1. MutationObserver（[DOM Standard - 4.3.2 步骤 5][mutation-observer]）

        2. process.nextTick（Only for [Node.js][process.nextTick]）

            - > all callbacks passed to process.nextTick() will be resolved before the event loop continues.

- 特别指明，`Web API` （event loops 章节在标准中是属于 Web API 大类）是属于宏任务类型，如 `Ajax` 属于 `I/O`（来源：[using a resource][using-a-resource]），但 `Ajax` 调用的 `Promise` 类型回调函数都是微任务类型。

[ECMA-Script-records]:https://www.ecma-international.org/ecma-262/#script-record

[generic-task-sources]:https://www.w3.org/TR/html5/webappapis.html#generic-task-sources

[ECMAScript-jobs]:http://www.ecma-international.org/ecma-262/#sec-performpromisethen

[EnqueueJob]:http://www.ecma-international.org/ecma-262/#sec-enqueuejob

[micro-task-source]:https://www.w3.org/TR/html5/webappapis.html#microtask

[using-a-resource]:https://www.w3.org/TR/html5/webappapis.html#task-queues

[mutation-observer]:https://dom.spec.whatwg.org/#queue-a-mutation-record

[jake-blog]:https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/

[process.nextTick]:https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/#process-nexttick

## 任务队列 task queue

任务队列分为 `宏任务队列` 和 `微任务队列`。一个事件循环中可能有一个或多个任务队列。因为在执行一个宏任务时，可能产生微任务调用，即产生新的微任务队列。

**相同类型**的任务源的任务被调用时进入相同的任务队列，反之进入不同的任务队列。

### 标准（W3C and WHATWG）中的队列模型

**注**：

- 依据标准[描述][macro-task-queue]，除非特别指明是 `microtask queue`，那么我们一般常说的任务队列（`task queue`）都是指 `宏任务队列`（`macrotask queue`）。

- 每个事件循环都有一个 `当前执行中的任务`（`currently running task`），用于轮询队列中的任务（`handle reentrancy`）。

- 每个事件循环都有一个 `已执行 microtask 检查点标志`（`performing a microtask checkpoint flag`）（初始值一定为 false）表示已经执行了 `microtask` 检查点，用于阻止执行 `microtask checkpoint` 算法的可重入调用。

    1. 可重入调用（[reentrant invocation][reentrant-invocation]）是指，算法在执行过程中意外中断时，在当前调用未完成的情况下被再次从头开始执行。一旦可重入执行完成，上一次被中断的调用将会恢复执行。

    2. 设置该检查点的原因是：

        - 执行微任务时，可能会调用其他回调函数，当其他回调函数时，并在弹出执行上下文栈时，会断言当前执行上下文栈是否为空，若为空时，那么就会再一次执行 `microtask checkpoint`（来源：[perform a microtask checkpoint - step 2.3][microtask-checkpoint]、[clean up after running script][clean-up-after-running-script]），若没有设置检查点执行标志的话就会再次进入 `microtask queue` 重复执行 `microtask`。

[macro-task-queue]:https://www.w3.org/TR/html5/webappapis.html#microtask

[reentrant-invocation]:https://en.wikipedia.org/wiki/Reentrancy_(computing)

[microtask-checkpoint]:https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint

[clean-up-after-running-script]:https://html.spec.whatwg.org/multipage/webappapis.html#clean-up-after-running-script

（[来源][processing-model]）

1. 在 `browsing context` 事件循环的情况下（与第 8 步并列），选择当前 `task queue` 中**最早**加入的 task。如果没有任务被选中（即当前 `task queue` 为空），那么直接跳转到第 6 步 `Microtasks`

    - 如 `Ajax` 请求返回数据时，若当前 `task queue` 为空时，将直接跳转执行回调函数微任务。

2. 设置当前事件循环的 `当前执行中的任务` 为第 1 步被选出的 task。

3. `Run`：执行当前被选出的 task（即 task 进入最上层[执行上下文栈][post-execution-context] `execution context stack`）。

4. 重置当前事件循环的 `当前执行中的任务` 为默认值 null。

5. 从当前的 `task queue` 中移除在第 3 步执行过的任务。

6. `Microtasks`：执行 `microtask` 检查点。

    - 当 `已执行 microtask 检查点标志` 为 false 时：

        1. 设置 `已执行 microtask 检查点标志` 为 true。

        2. `操作（handling) microtask 队列`：在当前 `microtask queue` 为空时，跳转到步骤 `Done` 之后。

        3. 选中 `microtask queue` 中最早加入的 `microtask`。

        4. 设置当前事件循环的 `当前执行中的任务` 值为上一步选中的 `microtask`。

        5. `Run`：执行选中的 `microtask`（进入最上层[执行上下文栈][post-execution-context]（来源1：[HTML Standard EnqueueJob 7.6][enqueue-job]、来源2：[ECMAScript EnqueueJob 步骤4][ECMAScript-enqueue-job-step-4]））。

        6. 重置置当前事件循环的 `当前执行中的任务` 值为 null。

        7. 从 `microtask queue` 中移除第 5 步 `Run` 被执行的 `microtask`，回到第 3 步 `操作（handling) microtask 队列`。

            - **重点**：为在一个事件循环中，总是要**清空**当前事件循环中的微任务队列**才会进行重渲染**（`Vue.js` 的 DOM 更新原理）。

        8. `Done`：对于每一个 `responsible event loop` 是当前事件循环的环境设置对象（`environment setting object`），向它（环境设置对象）告知关于 `rejected` 状态的 `Promise` 对象的信息。

            - 个人理解为触发浏览器 `uncaught` 事件，并抛出 `unhandled promise rejections` 错误（[W3C][unhandled-promise-rejections]）。

            - 此步骤主要是向开发者告知存在未被捕获的 `rejected` 状态的 `Promise`。

        9. 执行并清空 `Indexed Database`（用于本地存储数据的 API） 的修改请求。

        10. 重置 `已执行 microtask 检查点标志` 为 false。

    - 当一个复合微任务（`compound microtask`）执行时，客户端必须去执行一系列的复合微任务的`子任务`（subtask）

        1. 设置 parent 为当前事件循环的 `当前执行中的任务`。

        2. 设置 `子任务` 为一个由一系列给定步骤组成的新 microtask。

        3. 设置 `当前执行中的任务` 为 `子任务`。这种微任务的任务源是微任务类型的任务源。这是一个复合微任务的 `子任务`。

        4. 执行 `子任务`（进入[执行上下文栈][post-execution-context]）。

        5. 重置当前事件循环的 `当前执行中的任务` 为 parent。

7. 更新 DOM 渲染。

    - 一个宏任务 task **至此**整体执行结束（包含调用，执行，重渲染），也是一个**事件循环结束**。

8. （与第 1 步并列）如果当前的事件循环是 `web works` 的事件循环，并且在当前事件循环中的 `task queue` 为空，并且 `WorkerGlobalScope` 对象的 `closing` 为 true，那么将摧毁当前事件循环，并取消以上的事件循环步骤，并恢复执行一个 `web worker` 的步骤。

9. 回到第 1 步执行下一个事件循环。

[processing-model]:https://www.w3.org/TR/html5/webappapis.html#event-loops-processing-model

[enqueue-job]:https://html.spec.whatwg.org/#enqueuejob(queuename,-job,-arguments):queue-a-microtask

[ECMAScript-enqueue-job-step-4]:http://www.ecma-international.org/ecma-262/#sec-enqueuejob

[unhandled-promise-rejections]:https://www.w3.org/TR/html5/webappapis.html#notify-about-rejected-promises

### 示例

以一个示例讲解事件循环：

```js
// script
// 1
console.log('I am from script beginning')

// 2
setTimeout(() => { // 该匿名函数称为匿名函数a
  console.log('I am from setTimeout')
}, 1000)

// 3
const ins = new Promise((resolve, reject) => {
  console.log('I am from internal part')
  resolve()
})

// 4
ins.then(() => console.log('I am from 1st ins.then()')).then(() => console.log('I am from 2nd ins.then()'))

// 5
console.log('I am from script bottom')
```

以上整个代码段即是，`macro-task` 中的 `script` 任务源。

执行原理（依据 Chrome 66 的 V8 实现）如下：

1. 整个代码段 `script` 进入执行上下文栈（亦称调用栈，`call stack`（[来源][post-execution-context]）），执行 1 处代码调用 `console.log` 函数，该函数进入调用栈，之前 `script` 执行上下文执行暂停（冻结），转交执行权给 `console.log`。`console.log`成为[当前执行中的执行上下文][post-execution-context]（`running execution context`）。`console.log` 执行完成立即弹出调用栈，`script` 恢复执行。

2. `setTimeout` 是一个任务分发器，该函数本身会立即执行，延迟执行的是其中传入的参数（匿名函数 a）。`script` 暂停执行，内部建立一个 1 秒计时器。`script` 恢复执行接下来的代码。1 秒后，再将匿名函数 a 插入宏任务队列（根据宏任务队列是否有之前加入的宏任务，可能不会立即执行）。

3. 声明恒定变量 `ins`，并初始化为 `Promise` 实例。特别地，`Promise` 内部代码会在本轮事件循环立即执行。那么此时， `script` 冻结，开始执行 `console.log`，`console.log` 弹出调用栈后，`resolve()` 进入调用栈，将 `Promise` 状态 `resolved`，并之后弹出调用栈，此时恢复 script 执行。

4. 因为第 3 步，已经在本轮宏任务完成前 `resolved` ，否则，将跳过第 4 步向本轮事件循环的微任务队列添加回调函数（[来源][promise-standard]）。调用 `ins` 的 `then` 方法，将第一个 `then` 中回调添加到 `微任务队列`，继续执行，将第二个 `then` 中回调添加到 `微任务队列`。

5. 如同 1 时的执行原理。

6. `script` 宏任务执行完成，弹出执行上下文栈。此时，微任务队列中有两个 `then` 加入的回调函数等待执行。另外，若距 2 超过 1 秒钟，那么宏任务队列中有一个匿名函数 a 等待执行，否则，此时宏任务队列为空。

7. 在当前宏任务执行完成并弹出调用栈后，开始**清空**因宏任务执行而产生的微任务队列。首先执行 `console.log('I am from 1st ins.then()')`，之后执行 `console.log('I am from 2nd ins.then()')`。

8. 微任务队列清空后，开始调用下一宏任务（即进入下一个事件循环）或等待下一宏任务加入任务队列。此时，在 2 中计时 1 秒后，加入匿名函数 a 至宏任务队列，此时，因之前宏任务 script 执行完成而清空，那么将匿名函数 a 加入调用栈执行，输出 `I am from setTimeout`。

**注**：`JavaScript` 中在某一函数内部调用另一函数时，会暂停（冻结）当前函数的执行，并将当前函数的执行权转移给新的被调用的函数（具体解析见[拓展阅读][post-execution-context]）。

示例总结：

1. **在一个代码段（或理解为一个模块）中**，所有的代码都是基于一个 `script` 宏任务进行的。

2. 在当前宏任务执行完成后，**必须**要清空因执行宏任务而产生的`微任务队列`。

3. 只有当前微任务队列清空后，才会调用下一个宏任务队列中的任务。即进入下一个事件循环。

4. `new Promise` 时，`Promise` 参数中的匿名函数是**立即执行**的。被添加进`微任务队列`的是 `then` 中的回调函数。

    - **特别地**，只有 `Promise` 中的状态为 `resolved` 或 `rejected` 后（[Promise 标准][promise-then]），才会调用 `Promise` 的原型方法（即 [then][promise-then]、`catch`（因为是 `then` 的[语法糖][promise-catch]，所以与 `then` 同理）、`finally`（`onfinally`时[触发][promise-finally]）），才会将回调函数到添加微任务队列中。

5. `setTimeout` 是作为任务分发器的存在，他自身执行会创建一个计时器，只有待计时器结束后，才会将 `setTimeout` 中的第一参数函数添加至`宏任务队列`。换一种方式理解，`setTimeout` 中的函数**一定不是在当前事件循环**中被调用。

以下是在客户端（Node.js 可能有不同结果）的输入结果：

```markup
I am from script beginning
I am from internal part
I am from script bottom
I am from 1st ins.then()
I am from 2nd ins.then()
I am from setTimeout
```

[promise-then]:https://promisesaplus.com/#point-26

[promise-catch]:https://www.ecma-international.org/ecma-262/#sec-promise.prototype.catch

[promise-finally]:https://tc39.github.io/ecma262/#sec-promise.prototype.finally

## 事件循环拓展应用 —— 异步操作

1. 定时任务：setTimeout，setInterval

2. 请求数据：Ajax 请求，图片加载

3. 事件绑定

一般地，在 JS 开发过程中，凡是可能造成代码阻塞的地方都可根据实际情况考虑使用异步操作。比如，数据获取等等。

[post-execution-context]:https://set.sh/blog/writings/execution-context/

[promise-standard]:https://promisesaplus.com/

# 参考

`JavaScript 语言精粹(修订版)`

[w3c Event loop][w3c]

[HTML5 Standard][html5]

[ECMA Jobs and Job Queues][job-queues]

[Tasks, microtasks, queues and schedules][blog0]

[Great talk at JSConf 2014 on the event loop][video]


[1]:https://stackoverflow.com/questions/25915634/difference-between-microtask-and-macrotask-within-an-event-loop-context

[2]:http://www.ituring.com.cn/article/66566

[w3c]:https://www.w3.org/TR/html5/webappapis.html#event-loops

[html5]:https://html.spec.whatwg.org/multipage/webappapis.html#event-loops

[es6]:http://www.ecma-international.org/ecma-262/6.0/#sec-jobs-and-job-queues

[promise]:http://www.ecma-international.org/ecma-262/6.0/#sec-performpromisethen

[job-queues]:http://www.ecma-international.org/ecma-262/6.0/#sec-jobs-and-job-queues

[blog0]:https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/

[video]:https://www.youtube.com/watch?v=8aGhZQkoFbQ
