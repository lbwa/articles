---
title:      "Event loops 中的 AsyncFunction"
date:       2018-07-26
author:     "Bowen"
tags:
    - JavaScript
    - async
---

> 本文旨在讨论 `async function` 的实现原理。但实现 `async function` 的方式不具有唯一性，其实现方式多种多样，但这些实现方式都应遵循 `ES` 标准中的原理来实现 `async function`。本文主要介绍了以 `Generator` 函数为基础，以 `Promise` 对象实现自动执行器来实现 `async function`。

起因是由于自己在使用 `async function` 时疑惑 `async function` 的本质到底是什么，它的函数体在执行时，是在宏任务队列 `task queue` 中执行（宏任务异步回调）还是在微任务队列 `micro queue` 中执行（微任务异步回调）还是以普通代码执行的形式在当前宏任务的执行上下文栈中执行？

## Typescript 中的实现

`Typescript` 通过 `Promise` 对象来实现 `Generator function` 中自动调用 `next` 方法。即实现了 `async function`。

```js
// 编译为 ES2016，即没有 async function 的情形
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  // return new Promise(...)
  return new (P || (P = Promise))(function (resolve, reject) {
    // 该函数被 Promise.then() 调用，即在当前事件循环中的 microtask queue 中执行回调
    // 即可理解为在遇到函数体中第一个 await 之后的代码调用都是在微任务队列中完成
    // 即在当前事件循环的微任务队列实现自动执行 Generator 函数
    function fulfilled(value) { // 传入 result.value
      try {
        // microtask queue
        // 执行至下一个 await
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    // gen.next() 返回一个 yield 表达式返回的对象（{value: 表达式返回值, done: false}）
    function step(result) { // 传入 generator.next()
      // 判断是否已经迭代到序列末端
      result.done
        ? resolve(result.value) // 已到序列末端
        : new P(function (resolve) { // 未到序列末端
            resolve(result.value);
            // 启用微任务队列来实现自动执行 gen.next()
          }).then(fulfilled, rejected);
    }
    // trigger
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
```

以上是自己使用 `typescript` 编译 `async function` 返回的编译结果，从结果可以看出，`typescript 2.9.2` 中 `async function` 实现原理的本质是 `Generator` 函数加上 `Promise` 自动执行器。另外参考 [co 源码] 和 [ECMAScript 6 入门] 中实现 `async function` 的原理亦与之相似。

其中的关键点在于使用 `Promise.resolve` 来调用 `then` 方法，以通过 ***微任务队列*** 来实现自动调用 `Generator` 函数的 `next` 方法。那么在 `async function` 函数体中，在遇到第一个 `await` 关键字之前的所有代码执行都是在 ***当前宏任务的执行上下文栈*** 中被调用执行，在第一个 `await` 及其之后的所有同步或异步代码都是通过 ***微任务队列*** `microtask queue` 来实现相对于 `async function` 函数体外部的 ***非阻塞*** 执行。

## ES 标准

> 以下解析主要参考最新正式版 ES 标准 [ES2018][async function start] (即 ES 9th)。

首先应该明白的专有[名词解析][async-function-definitions]：

| 名称 | 描述 |
| --- | ---- |
| `asyncContext` | `AsyncFunction` 的执行上下文 |
| `asyncFunctionBody` | `AsyncFunction` 的函数体，`FunctionBody [~Yield, +Await]` |
| `awaitExpression` | `await` 表达式，`await UnaryExpression[?Yield, +Await]` |

[async-function-definitions]:https://www.ecma-international.org/ecma-262/#sec-async-function-definitions

对于一般的 `AsyncFunction` 都将依据以下步骤执行。

1. 设定 `runningContext` 为 当前正在执行上下文（更多关于我对执行上下文的 [理解][execution-context]）。

2. 将 `asyncContext` 设置为 `runningContext` 的一份拷贝副本。

3. 设定 `asyncContext` 的代码求值状态，以用于在当 `asyncContext` 执行上下文恢复求值时，将执行以下步骤。

    1. 设置 `result` 为 `asyncFunctionBody` 的求值结果

    2. 断言：

        - 如果我们执行至此，`async function` 要么抛出一个异常，要么显式地或隐式地返回一个值；

        - 此时所有的 `await` 都已 `resolved`。

    3. 从执行上下文栈中移除 `asyncContext` 上下文。恢复执行上下文栈中最顶层执行上下文的执行，并将其设定为当前正在执行上下文。

    4. 如果 `result` 是 `normal` 类型（即没有显式地 `return` 返回值），那么调用 `Promise.resolve()`

    5. 否则如果 `result` 是 `return` 类型（即有显式地 `return` 返回一个值），那么调用 `Promise.resolve(return 的值))`

    6. 否则如果 `result` 是 `throw` 类型（即抛出了一个异常），那么调用 `Promise.reject(throw 的异常值)`

    7. 返回

4. 将 `asyncContext` 推入执行上下文栈的最上层。此时 `asyncContext` 即成为了当前正在执行的执行上下文。

5. (注：在执行 `asyncFunction` 时可能在函数体中存在 `await` 表达式，使得 `asyncContext` 脱离正在执行上下文进入 `heap memory` 等待执行回调，即进入一种冻结状态。在 `await` 表达式 `resolved` 之后继续执行下方第 `6` 步)

6. 恢复被暂停的 `asyncContext` 的求值。设置 `result` 的值是此时的计算返回值。

7. 断言：当我们返回此处时，`asyncContext` 已经从执行上下文栈中移除，并且 `runningContext` 是此时的当前执行上下文。

8. 断言：

    - `result` 是一个值为 `undefined` 的 `normal` 类型返回值（即没有显式地在函数体内调用 `return` 的情形。）。

    - 计算后返回值的可能来源是 [Await][await] 表达式或者 `async function` 中不存在未执行的 `await` 表达式时，执行 3.7 步骤（即之后执行 4 将 `asyncContext` 设置为当前正在执行上下文）。

9. 返回

[execution-context]:https://set.sh/blog/writings/execution-context/

[async function start]:https://www.ecma-international.org/ecma-262/9.0/#sec-async-functions-abstract-operations-async-function-start

[await]:https://www.ecma-international.org/ecma-262/#await

## 实践

```js
const promise = new Promise((resolve, reject) => {
  console.log('From promise object') // 1 current event loop
  resolve('from promise') // 4 current event loop
})
const ts = async () => {
  // 2 current event loop
  console.log('From async function')

  /**
   * 1. 第一次执行至此时， asyncContext 弹出执行上下文栈，并移除当前执行上下文标识
   * 2. await 标识了一个异步操作，那么为了不阻塞当前宏任务中其他执行上下文栈的执行，故
   * 此时 asyncContext 弹出执行上下文栈，将当前执行上下文标识转移给其他执行上下文
   */
  // 4 microtask queue
  const a = await promise

  // 4 microtask queue
  console.log(a)
}

// current event loop
ts()

// 3 current event loop
// 在 async function 遇到第一个 await 之后获得当前执行上下文标识
console.log('event loop end')

// 匿名函数在倒计时结束后加入 task queue，此处即是成为宏任务队列中的下一个宏任务
setTimeout(()=>{
  // 5 next event loop
  console.log('From setTimeout')
}, 0)
```

```bash
# nodejs 10 and Chrome 67
From promise object
From async function
event loop end
from promise
From setTimeout
```

以上结果正好验证了之前对 `async function` 的执行原理分析。

在 2 处时，代码执行仍在当前事件循环的执行上下文栈中执行，当遇到第一个 `await` 表达式时，该表达式进入了 `heap memory` 等待 `Promise` 被 `resolved`（示例代码中是直接调用 `resolve()`，这不影响分析 `async function`）。在 `await` 表达式等待计算结果期间，当前执行上下文标识转移，继续执行当前宏任务的其他执行上下文。待 `await` 表达式被 `resolved` 之后，该表达式将进入 `microtask queue` 等待执行（如同正常的微任务异步回调一样）。

`await` 表达式及其之后所有代码之所以要进入 `microtask queue` 正是为了 ***防止*** 对当前宏任务中其他执行上下文造成 ***阻塞***。在他进入 `microtask queue` 之后，只有等到当前宏任务所有执行上下文都执行完毕之后，才会被调用执行。

以上正是体现了 `async function` 的异步原理。

## 结论

通过简要分析一般 `async function` 的原理及其典型实现方式，可以得出结论：

1. 异步流程必须保证不阻塞后续代码执行。实现 `async function` 的关键点即在于非阻塞。

    - 在现行 `ES` 标准中，无疑 `microtask queue` 是符合这一角色担当（不是实现非阻塞的唯一方式）。`microtask queue` 不阻塞当前宏任务其他执行上下文的执行，只在当前宏任务中所有执行上下文都执行完成后被调用。这样的特点正好符合 ***非阻塞***　的特性。

2. 为了实现异步流程可控性，控制异步流程的并发性，即表现为以同步的方式书写异步函数。那么可以结合 `Generator` 函数来实现。`Generator function` 本身具有 ***可控***　这一特点（即 `next` 方法），可严格控制异步流程。结合 `Generator function` 的可控特点可实现 `async function` 中控制多个异步流程之间的逻辑关系，各个异步流程之间执行先后顺序，它们之间是否需要并发异步执行。

3. `Promise` 对象的异步回调的调用方式即是微任务异步回调。那么可以通过 `Promise` 对象来实现 2 中的 `Generator function` 的自动执行器。那么可实现在 2 的基础上达到非阻塞的效果。

4. 结合 2 和 3 ，那么即可实现 1 中的 ***非阻塞*** 队列。该队列不阻塞当前宏任务中其他执行上下文的执行。并且可以做到严格控制各个异步流程之间的关系（***执行先后，是否并发***）。

## 参考

- [ECMAScript asyncFunctionStart][async function start]

- [ECMAScript await][await]

- [co 源码]

- [How JavaScript Async/Await Works]

- [Await and Async Explained with Diagrams and Examples]

- [ECMAScript 6 入门]

- [async/await 实现原理]

- [JS 中异步执行代码的意义]

[co 源码]:https://github.com/tj/co/blob/master/index.js#L98-L106

[How JavaScript Async/Await Works]:https://medium.com/siliconwat/how-javascript-async-await-works-3cab4b7d21da

[Await and Async Explained with Diagrams and Examples]:http://nikgrozev.com/2017/10/01/async-await/

[ECMAScript 6 入门]:http://es6.ruanyifeng.com/#docs/async#async-函数的实现原理

[async/await 实现原理]:https://www.zhihu.com/question/39571954

[JS 中异步执行代码的意义]:https://www.zhihu.com/question/62254462/answer/197769615
