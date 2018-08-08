---
title:      "总结如何进行单元测试"
date:       2018-04-21
author:     "Bowen"
tags:
    - 前端开发
    - Vue.js
    - 应用测试
---

# 关于单元测试应该了解的知识

## 测试原则

首先最应该搞明白的是，我们要测什么？测试的目的是什么？

单元测试，侧重点在"单元"。在单元测试中更应该注重**单个**单文件组件的功能实现，而不是过多纠缠于组件之间的数据传递(这是端到端测试的内容，即 e2e，测试整个应用的功能展现)和组件中的功能实现过程。

我们不论是在单元测试中还是 e2e 测试的重点都应该是，测试单个组件（或由多个组件组成的整个应用）的渲染或功能的**结果**，而不是过程！！即侧重**黑盒测试**，至于是怎样实现的，并不是测试的内容。

注重结果测试的好处就是，并不限制结果的实现方式，为后期的优化和拓展提供了更多的可能性。

比如，测试一个函数的功能，就看这个函数需要什么数据，然后提供测试的原始数据，之后我在调用该函数(可通过直接调用或事件触发)。断言函数的返回结果。这些就是我们的测试内容。至于该函数是如何处理数据的，并不是测试内容。

## Vue.js 单元测试工具箱

1. [vue-test-utils][vue-test-utils] - 官方

- karma 单元测试环境
- Mocha 单元测试框架
- [Chai][Chai] 断言库

2. [ElementFE Vue.js test utils][ElementFE Vue.js test utils]

[vue-test-utils]:https://vue-test-utils.vuejs.org/zh-cn/

[ElementFE Vue.js test utils]:https://github.com/lbwa/vue-unit-test/blob/master/test/unit/util.js

[vue-test-utils 高级技巧]:https://vue-test-utils.vuejs.org/zh-cn/guides/common-tips.html

[Matt O'Connell]:http://slides.com/mattoconnell/deck#/

[Chai]:http://www.chaijs.com/guide/styles/#assert

# 单元测试技巧

## 测试异步行为

首先需要了解的是 `vue-test-utils` 是同步应用 DOM 更新的，那么在 `Mocha` 的 `expect()` 中存在异步操作且还未完成异步操作时，就可能已经调用 `expect()` 来断言了。

在 `Jest` 和 `Mocha` 等单元测试库都定义了一个回调函数 `done()` 来标明测试用例的完成时机。有了该 `done()` 回调函数即表明了，该处代码块是异步操作（具体原理见下文）。我们可以和 `$nextTick` 或 `setTimeout` 结合 `done()` 来保证异步操作在断言之前完成。

`done()`实际用例：[用例一][example-done-1]，[用例二][example-done-2]

## 测试异步行为的原理

结论： `done()` 保证了断言是在下一个事件循环被执行，那么在断言之前的所有异步操作均已完成。

在单元测试库中通过一个 `done()` 回调函数来标明了测试用例的执行时机，其意义在于，只有等到当前事件循环中的所有任务执行（包含了当前事件循环中的所有异步操作的执行）完成后，单元测试库才会调用 `done()` 回调，用于执行断言。此时的，断言已经开启了新的事件循环队列。

之所以，当前事件循环中的异步操作全部被执行的原因是，在一个事件循环中，首先从 marco-task 队列提取第一个任务，在执行这个任务过程中，产生的所有**异步操作**的**回调函数**调用（如，Promise.then()中的参数对象），都将进入 micro-task 队列等待执行。待当前 marco-task 这一任务完成，开始依次执行 micro-task 队列中的任务，直至**清空**该 micro-task 队列。只有等到当前事件循环中的 micro-task 清空后才会进入下一个事件循环，即开启下一个 marco-task 的执行。此时，即是 `done()` 的执行时机，即正因为有了 `done()` 才保证了断言是在下一个事件循环中被执行，那么，在此之前的所有异步操作的回调函数早就已经执行完成了。

以上原理更多的具体分析，可点击查看我的另一篇博文——[《理解 event loop 机制》][event-loop]。

## 测试键盘、鼠标及其他 DOM 事件

（以官方单元测试工具为例）

## 测试环境中的事件触发与监听

```js
it('测试点击 todo 单项事件 - refreshThisCompleted', done => {
    const wrapper = mount(ContentItem, {
      propsData: {
       // ...
      }
    })
    const button = wrapper.find('.toggle')

    button.trigger('click') // 官方库包装了事件触发以及事件的监听的过程

    // ...
  })
```
`button.trigger('click')` 是官方库的事件触发 API，其包含了事件初始化，事件派发，事件监听等一系列过程。

注：在原本的测试环境中 `Vue.js` 的 watcher 是不能被触发的，其中的 watcher 都是需要手动触发的。

```js
// 创建事件并触发
const evt = new window.Event('click') // Event() 代替 Document.createEvent() 成为标准
button.dispatchEvent(evt)
// 手动触发 watcher
vm._watcher.run() // vm 表示测试环境中的 Vue 实例
```

特别地，特定按键的事件触发如下:

```js
it('刷新显示的 todo 单项 - refreshItems', () => {
    const wrapper = mount(LayoutContent)
    const inputBox = wrapper.find('.add-item')

    inputBox.element.value = 'Test content'
    inputBox.trigger('keyup.enter') // 与 Vue.js 中的特定事件触发写法相似
    // ...
})
```

参考：[测试环境中的事件][dom-events]

[dom-events]:https://vue-test-utils.vuejs.org/zh-cn/guides/dom-events.html

## 测试环境中的 evt.target

一般情况下 `wrapper.trigger()` 可携带一个对象作为载荷，传递给监听器。但是，这个对象**不能**设置事件 evt.target 对象。原因：[点我][trigger]

那么在需要取得某个元素的 value 值的情况下，我们可以有以下的实现：

```js
const input = wrapper.find('input')
input.element.value = 100
input.trigger('click')
```
在调用 `trigger()` 方法之前就设置好该元素的 value 值。

具体使用案例：[点我][trigger1]

[trigger]:https://vue-test-utils.vuejs.org/zh-cn/api/wrapper/trigger.html

[trigger1]:https://github.com/lbwa/vue-unit-test/blob/3fcee440f0e0511071d8f559b54b88ab23197904/test/unit/specs/LayoutContent.spec.js#L38-L50

## 重要事项

Vue Test Utils 是同步触发事件。因此 Vue.nextTick 不是必须的。

[example-done-1]:https://github.com/lbwa/vue-unit-test/blob/3fcee440f0e0511071d8f559b54b88ab23197904/test/unit/specs/ContentItem.spec.js#L61-L64

[example-done-2]:https://github.com/lbwa/vue-unit-test/blob/3fcee440f0e0511071d8f559b54b88ab23197904/test/unit/specs/LayoutContent.spec.js#L104-L107

[event-loop]:https://set.sh/blog/writings/event-loop/

# travis CI

## .travis.yml 中

在 travis CI 集成时，调用 Chrome 的[必须选项][chrome-options]：

```yaml
sudo: required

addons:
    chrome: stable

before_install:
  - export CHROME_BIN=chromium-browser
  - export DISPLAY=:99.0
  - sh -e /etc/init.d/xvfb start
```

`export CHROME_BIN=chromium-browser` 表示指定测试时使用的 Chrome 浏览器(最好字指明，还有 `google-chrome` 可选)。

在 `karma.conf.js` [示例配置][karma.conf.js]中调用 `Chrome` 等**界面浏览器**时，以下两项是***必须项***。

`export DISPLAY=:99.0` 指定一个 GUI 测试。[出处][display-origin]

`sh -e /etc/init.d/xvfb start` 指定一个在 `travis CI` 中测试时的图形界面。[出处][xvfb-origin]

特别地，在 travis CI 中调用不需要图形界面的 ChromeHeadless 版本（[示例配置][ChromeHeadless]）的时候，那么以上两项就***不是必须的***。

[ChromeHeadless]:https://github.com/lbwa/vue-ssr/blob/master/test/unit/karma.conf.js#L19-L23

## karma.conf.js 中

在 `karma.conf.js` [示例配置][karma.conf.js]中将部分配置修改如下：

```js
module.exports = function karmaConfig (config) {
  config.set({
    // browsers: ['PhantomJS'], 结合 vue-test-utils 挂载时 执行 mount() 会报错
    // browsers 数组有多项时，将同时调用数组内的所有浏览器开始 unit test
    browsers: process.env.TRAVIS ? ['Chrome_travis_ci'] : ['Chrome'], // 浏览器
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        // https://github.com/karma-runner/karma-chrome-launcher
        flags: process.env.TRAVIS ? ['--no-sandbox'] : ['']
      }
    },
    // ...
    coverageReporter: { // karma-coverage配置，配置测试覆盖率的输出目录及格式
      dir: './coverage',
      reporters: [
        { type: 'lcov', subdir: '.' }, // 输出 Icov.info
        { type: 'text-summary' }, // 输出 网页报告 Icov-report
        { type: 'json', subdir: '.' } // 输出 coverage-final.json
      ]
    }
  })
}
```

在配置中使用 `process.env.TRAVIS` 来判定当前的测试环境，因为在 travis CI 环境中调用 Chrome 时有[权限的限制][chrome-options]，在 travis CI 使用 Chrome 的 `--no-sandbox` 模式来进行单元测试。

另外一种根据不同环境使用 Chrome 的不同模式的**方法**就是，去掉配置中的环境判断，在添加同样的 `customLaunchers` 配置下，根据 [karma-chrome-launcher API][karma-chrome-launcher] 来在 node script 添加 CLI 命令以指定测试的浏览器。

```bash
$ cross-env BABEL_ENV=test karma start test/unit/karma.conf.js --single-run --browsers Chrome_travis_ci
```

添加 `--browsers Chrome_travis_ci` 来指定在 travis CI 中的浏览器，因为我们在 [karma.conf.js][karma.conf.js] 中定义了 `customLaunchers` ，那么此时启动的**浏览器及其模式**将会**匹配**我们定义的 `customLaunchers` 项。

# 参考

[vue-test-utils 高级技巧][vue-test-utils 高级技巧]

[Matt O'Connell 关于 Vue.js 的单元测试的演讲][Matt O'Connell]

[How to run JavaScript tests in Chrome on Travis][JS-on-Travis]

[travis CI 默认环境变量][Default Environment Variables]

[JS-on-Travis]:https://swizec.com/blog/how-to-run-javascript-tests-in-chrome-on-travis/swizec/6647

[karma.conf.js]:https://github.com/lbwa/vue-unit-test/blob/master/test/unit/karma.conf.js

[karma-chrome-launcher]:https://github.com/karma-runner/karma-chrome-launcher

[chrome-options]:https://docs.travis-ci.com/user/chrome

[display-origin]:https://docs.travis-ci.com/user/languages/javascript-with-nodejs#Ember-Apps

[xvfb-origin]:https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-xvfb-to-Run-Tests-That-Require-a-GUI

[Default Environment Variables]:https://docs.travis-ci.com/user/environment-variables/#Default-Environment-Variables
