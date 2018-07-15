---
title:      "Vue-sonar 音乐播放器总结"
date:       2018-04-18
author:     "Bowen"
tags:
    - 前端开发
    - Vue.js
---

# 移动端点击存在 300 ms 延迟

## 缘由

出现延迟的原因：[What Exactly Is The 300ms Click Delay][click-delay]

简短来说，移动端的 300ms 延迟是浏览器厂商的一个设置，这是因为移动端浏览器是支持双击触摸操作的，厂商设置等待约 300ms 是为了**判断用户的点击行为**到底是单击操作还是双击操作。

## 解决方案

为了提升移动端的体验，使用 [FastClick.js][FastClick.js] 来优化这 300ms 的延迟， 它通过**事件代理**的方式来排除移动端浏览器对物理点击的 300ms 毫秒判断。

其他参考：[FastClick 源码解读][fastClick-reference]

[fastClick-reference]:https://segmentfault.com/a/1190000004295106

[click-delay]:https://www.telerik.com/blogs/what-exactly-is.....-the-300ms-click-delay

[FastClick.js]:https://github.com/ftlabs/fastclick

# 跨域解决方案

## 什么是跨域

跨域，指的是浏览器当前页面不能执行其他网站的脚本。它是由浏览器的**同源策略**造成的，是浏览器对 JavaScript 脚本施加的安全限制。

所谓`同源`是指，**域名，协议，端口**都相同。浏览器执行 JavaScript 脚本时，会检查这个脚本属于哪个页面，如果不是同源页面，就不会被执行。

## 解决方案

[点我，查看我的另一篇博文][cross-domain-origin]

[cross-domain-origin]:https://lbwa.github.io/blog/writings/cross-domain-solution/

# 基础模块通过 npm 下载

一般常用的基础模块可发布至 npm 中，在开发时，通过 npm 下载。

# event.currentTarget and event.target

event.currentTarget 是注册事件时所指向的元素，而 event.target 是响应事件的最小子元素，也就是最深层级的触发事件的元素，需要开发者合理使用。

监听程序的执行元素：event.currentTarget

事件捕获的目标，或称事件冒泡的触发者：event.target

# request Headers

5XX 错误：都是服务器错误

在服务器没挂的情况下，jsonp 请求不到数据的原因可能是服务器设置了 头部中 host 和 referer 验证（jsonp 是无法绕过（伪造） host 验证的）

解决方案： webpack-dev-server 代理使用 ajax 跨域请求

# Vue.js 中的 $nextTick() 实现

setTimeout 是 this.$nextTick 的一种实现，nextTick 本质上是利用 [事件循环][eventloop]来 达到异步更新目的

为兼容所有手机，`this.$nextTick(() => {})`可用`setTimeout(() => {}, 20)`来代替，其中 20ms 是经验值

参考：[点我][vuenexttickshixian]

[vuenexttickshixian]:https://mp.weixin.qq.com/s/mCcW4OYj3p3471ghMBylBw

[eventloop]:https://lbwa.github.io/blog/writings/event-loop/

>事实上，vue在2.5版本中已经删去了MutationObserver相关的代码，因为它是HTML5新增的特性，在 iOS 上尚有bug。

## ios 网页版 audio 需要用户点击才能播放

在组件 `app-player` 中的 `currentSong` 的 watcher 中的调用 audio 的 play() 方法在 IOS 上是[无法播放][cannotplay]（[解决方案][solveplayproblem]）的，此法会被 safari 拦截，那么 ios 需要用户来点击（得到用户的 action ）播放

[cannotplay]:https://github.com/DDFE/DDFE-blog/issues/24
[solveplayproblem]:https://github.com/vuejs/vue/issues/7109

原因：本质是 vue.js 的 nextTick 机制导致的无法播放的问题。[参考][vuenexttickshixian]

[vuenexttickshixian]:https://mp.weixin.qq.com/s/mCcW4OYj3p3471ghMBylBw

# 区分基础组件和业务组件

基础组件不会出现业务逻辑，将基础组件中的业务逻辑使用 `this.$emit` 派发给业务组件

基础组件常见内容: props、state、methods（**侧重**被外部调用，改变基础组件的状态，并不是侧重处理数据的 methods）、event（向外部传递并携带载荷，告知数据变化）

基础组件一般不放跟 vuex 数据处理相关的东西，***基础组件侧重展示数据的功能***。

# 滚动组件

若 app 有多处相同方式滚动区域，那么可结合 **slot 匿名插槽** 将滚动组件单独作为一个基础组件。

滚动基础组件中包含一些**代理**执行的函数，可从**外部调用**执行来更新组件内部状态。

```js
 // child component
 // 代理执行的方法，意在组件外部调用内部方法更新组件状态
  enable () {
    this.scroll && this.scroll.enable()
  },

  disable () {
    this.scroll && this.scroll.disable()
  },

  refresh () {
    this.scroll && this.scroll.refresh()
  }
```
```js
// parent component
// 在外部改变子组件（ref="child"）内部状态
this.$refs.child.enable()
this.$refs.child.disable()
this.$refs.child.refresh()
```

可能遇见的问题：

1.基础滚动组件中的 slot 插槽内容可能包含 ajax 请求数据，那么必须在 ajax 返回数据之后刷新基础组件，否则将得到错误的计算高度，那么也就无法滚动。

一种解决方案就是： 传入一个 data 对象（该对象即是 ajax 返回数据）到滚动组件中，那么当数据返回时将触发基础滚动组件中的 watcher ，这样就可以刷新组件了。

# better-scroll 常见问题

1. 初始化 better-scroll 时机，常见在滚动区域有 ajax 请求时，要在 ajax 得到数据后刷新组件，即 `this.scroll.refresh()`。
1. 当滚动区域包含 ajax 请求时，可用 padding-top 占位或监听 load 事件（图片请求）刷新滚动组件。
1. 在滚动组件内部，建立一个 watcher ，它观察的值是一个 ajax 返回数据，当该数据对象变化时，将触发 watcher ，这样滚动组件就可**自我刷新**。

# 图像懒加载

页面有很多图像时，使用图像懒加载，在图像进入视口时才加载，否则为默认图像

原理：

``` html
<img src="默认图像地址" data-src="真实图像地址">
```

在图像进入视口之后，src 地址被替换为真实图像地址

推荐插件：[vue-lazyLoad][vue-lazyLoad]

[vue-lazyLoad]:https://github.com/hilongjw/vue-lazyload


# 给用户一个等待预期

在等待 ajax 返回数据时，显示`正在载入...`样式组件

# 在什么时候使用弹性布局

思考使用弹性布局的时机，现阶段移动端对于弹性布局都有良好的支持，那么在移动端页面开发时，首先应尝试使用弹性布局。

# 类通讯录组件的开发

（以组件`base-list`为例）

## 滚动行为

### 计算高度

设立一个 watcher 观察传入组件的 props 的变化，在 vue 更新 DOM 之后（nextTick）调用计算高度的函数 `_calculatHeight` 函数，计算各个类别元素的高度，加上初始高度 0，即可得到各个锚点（anchor）的位置，用 `listHeight` 变量存储。

```js
_calculateHeight {
  const group = this.$refs.group
  let listHeight = []
  let height = 0

  this.listHeight.push(0)

  for (let i = 0; i < group.length; i++) {
    // clientHeight = height + padding - 水平滚动条
    height += group[i].clientHeight
    this.listHeight.push(height)
  }
}
```

### 监听 scroll 事件，建立直达锚点函数

以下于基础滚动组件中操作

#### 派发 scroll 事件

监听 scroll 事件，是为了得到当前 scrollY 值

子组件 `base-scroll.vue`（以`better-scroll` 和 `slot 插槽` 建立的滚动基础组件）中设置监听事件 `scroll` ，并在事件处理程序中向父组件派发一个 `scroll` 事件。

```js
// 在初始化组件的函数中加入
if (this.listenScroll) { // this.listenScroll 是 props 属性，表示是否监听 scroll 事件
  let that = this
  this.scroll.on('scroll', pos => { // 监听原生滚动事件，派发一个滚动事件
    that.$emit('scroll', pos) // pos 包含当前滚动坐标值，形如 {x: 0, y:0}
  })
}
```

父组件中的监听程序

```js
scroll () {
  this.scrollY = pos.y
}
```

#### 建立直达锚点的函数

调用 `better-scroll` 自带函数 `this.scroll.scrollTo()` 和 `this.scroll.scrollToElement()`

[示例][scrollTo]

### 1.3. 监听 scrollY 变化，以计算当前 currentIndex

```js
watch: {
  scrollY (newY) { // watch 中函数可传入 newValue 和 oldValue，表示新值和旧值
    const listHeight = this.listHeight
    // 当位于顶端时
    if (newY > 0) {
      this.currentIndex = 0
    }
    // 当位于中段时
    for (let i = 1; i < listHeight.length - 1; i++) {
      let heightStart = listHeight[i]
      let heightEnd = listHeight[i + 1]
      if (-newY >= heightStart && -newY < heightEnd) { // 检测当前的可视区间
        this.currentIndex = i
      }
    }
    // 当位于列表底端时
    this.currentIndex = listHeight.length - 2
  }
}
```

### 设置激活 active 类的条件

``` html
<!-- index 为 v-for 中的 key 值-->
<span :class="currentIndex===index? 'active" : ''>
```

触摸触发 active 切换：

```js
_scrollTo (index) {
  this.scrollY = -this.listHeight[index] // 效果：点击行为切换 active 类
  //...
},
```

滚动触发 active 切换：

```js
_scrollTo (index) {
  // ...
  this.$refs.list.scrollToElement(this.$refs.group[index], 0) // 调用子组件方法跳转至锚点, 0表示动画时间
},
```

触摸和滚动事件都会触发方法 `_scrollTo`，使得跳转至目标锚点,`_scrollTo` 即是跳转函数

## 触摸行为

### 建立 data-index

在导航单个元素上建立一个 `data-index="index"` 属性，用于得到当前锚点的索引值

在基础 js 中添加一个类，该类功能是得到自定义 `data-` 属性的值或添加自定义属性给目标标签

注：这里涉及到一个复用的思维，即可能在之后的开发中复用该功能，那么我们可以将该函数独立到公共 JS 中。

```js
export function getData (el, name, value) {
  const prefix = 'data-'
  name = prefix + name
  if (value) {
    return el.setAttribute(name, value)
  } else {
    return el.getAttribute(name)
  }
}
```

### touchstart 事件

```js
// 得到锚点 index ，调用 better-scroll 方法跳转至锚点
onTouchStart (evt) {
  let anchorIndex = getData(evt.target, 'index') // 得到自定义 data-index 值
  this.touch.y1 = evt.touches[0].pageY // pageY 触摸目标在 HTML 文档中的 Y 坐标
  this.touch.anchorIndex = anchorIndex
  this._scrollTo(anchorIndex)
}
```
### touchmove 事件

```js
// 计算偏移距离，以至于得到偏移个数，之后调用跳转元素方法，达到 touchmove 滚动 list 的效果
onTouchMove (evt) {
  this.touch.y2 = evt.touches[0].pageY
  let jumpNumber = (this.touch.y2 - this.touch.y1) / ANCHOR_HEIGHT | 0 // 触摸偏移。其中设置初始值 0
  let anchorIndex = parseInt(this.touch.anchorIndex) + jumpNumber // anchorIndex 为字符串
  this._scrollTo(anchorIndex)
}
```

[示例][base-list]

[base-list]:https://github.com/lbwa/vue-sonar/blob/master/src/base/base-list.vue

[scrollTo]:https://github.com/lbwa/vue-sonar/blob/master/src/base/base-scroll.vue#L33

# 模拟 position: sticky 效果

原理： 计算 scrollY 与第 i + 1 个锚点开始的 y 坐标的差值，当差值小于 title 高度时，原 title 向上移动（title 高度 - 差值）像素。

# mutations

mutations 常有 mutation-types.js 来存储 mutation 的名字（设置为常量）

```js
//...
import createLogger from 'vuex/dist/logger' // 每次修改 state ，都会打印新旧 state

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions,
  strict: debug, // 检测是否是 mutations 修改 state,非法修改将报错。因有性能损失，则不能在生产环境开启
  plugins: debug ? [createLogger()] : []
})

```

# 业务逻辑层和表现层

业务逻辑（常见于业务组件）也是核心逻辑，业务逻辑层***专注于数据的处理***，因业务逻辑层常改变，所以将业务逻辑层独立出来，降低修改业务逻辑对其他层的影响。业务逻辑的特点是不与使用者交互

表现层（常见于基础组件）专注于***数据展现***，指界面和交互。

# 在单文件组件中引用子组件

``` html
<child-component ref="child">
```
```js
this.$refs.child // 返回对组件的引用
this.$refs.child.$el  // 返回对 DOM 节点的引用
```

总结：`ref="name"` 在 DOM 上使用时 `this.$refs.name` 引用的是 DOM 节点，在组件上使用时，则引用的是组件，若要在组件上引用渲染后的组件，那么使用 `this.$refs.name.$el`

注：只有在 `mounted` 生命周期之后才有 `$el`，在 `created` 时期 `$el` 不可见

# data 对象

在 vue Devtool 中，除非给 data 添加一个 watcher 否则，将在 Devtool 中**不会**响应式变化

# 浏览器能力检测 - 简单实现 autoprefixer

目标：实现 autoprefixer 的自动添加厂商前缀

```js
// 浏览器能力检测，查询能够被当前浏览器识别的前缀
let elementStyle = document.createElement('div').style

let vendor = (() => {
  transformNames = {
    webkit: 'webkitTransform',
    Moz: 'MozTransform',
    O: 'OTransform',
    ms: 'msTransform',
    standard: 'transform'
  }

  for (let key in transformNames) {
    if (elementStyle[transformNames[key]] !== undefined) {
      return key
    }
  }

  return false // 没有任何已知前缀能被当前浏览器识别时
})

export function prefixStyle (style) {
  if (vendor === false) { // 没有任何已知前缀能被当前浏览器识别时
    return false
  }

  if (vendor === 'standard') {
    return style
  }

  return vendor + style.charAt(0).toUpperCase() + style.substr(1)
}
```

## 调用变量属性

常见场景： 兼容不同浏览器，可能会有不同的 CSS 属性名

```js
// const transform = prefixStyle('transform')
this.$refs.cd.style[transform] = `translate3d(${x}, ${y}, 0) scale(${scale})`
```

以上因为 transform 为变量，所以在引用时，是引用的变量 transform ，故**只能**使用**方括号法**访问属性，而不是点属性法

# common/js/config.js 放置整个项目的配置文件

在 Vuex 的 store 文件中，

state 只保留最基础的数据，能够通过基础数据计算得到的值放置到 getters 中。

mutations 最好建立一个 mutations-type.js 来封装各个 mutation 的名字为常量，意义在于使得 linter 之类的工具发挥作用，和使得合作者一目了然存在哪些 mutation。

actions 用于异步操作或对 mutations 的封装（封装需要一次触发多个 mutations 的操作）

# 子组件派发事件，传递数据

base 组件（即基础组件）**只**起展示作用？数据处理**都**在在业务组件中处理？
示例： base-song-list.vue 中的 selectItem 处理函数，该函数处理点击歌曲后向父组件派发一个 select 事件，载荷为点击的歌曲和该歌曲的索引。base 组件中的最终目标是展示传进来的数据，对于数据的改变是**不在**该组件中处理，转而派发事件，或触发 mutations 或 actions 提交

以上，待验证总结其他基础组件的最终目的是否也是只是展示传进来的数据，不处理变化的数据。

子组件（扩展为基础组件）只管尽可能地提供它所能够提供的数据(this.$emit()的载荷)，而不去管最后这些数据哪些能够被使用，以及如何被使用。综合的，子组件的角色定位是`只管提供数据`，子组件`并不知道如何使用这些它传出的数据`，子组件不管数据的使用，故`不应该因为外部如何使用数据或使用哪些数据来定义子组件的提供数据这一行为`。

子组件（扩展为基础组件）的角色定位是`只管提供数据`，父组件监听子组件事件，得到传出的数据，并处理数据（哪些数据需要使用，以及如何使用）

示例：

```js
// base-song-list 组件中
// template
@click="selectedItem(item, index)"

// script
selectedItem (song, index) {
  this.$emit('select', song, index)
}
```
子组件（扩展为基础组件）中派发 select 事件，传递点击事件后产生的载荷 song 和 index，此时，子组件（扩展为基础组件） base-song-list 并不知道这里的载荷 song 和 index 接下来将被如何使用，以及会不会使用，它的职责**只是**提供他所能够提供的数据 song 和 index。这里的一个思维就是：不要以派发事件 select 之后如何使用数据来定义子组件（扩展为基础组件） base-song-list 传递数据的这一行为，如何使用数据并不是子组件 base-song-list 的职责

```js
// parts-music-list 组件中
// template
@select="selectedSong"
// script
methods: {
  ...mapActions([
    'selectedPlay'  // actions 映射
  ]),
  selectedSong (item, index) {
    this.selectedPlay({
      list: this.songs,
      index
    })
  }
  // ...
}
```
在父组件 parts-music-list 中，事件处理程序 selectedSong 中由子组件（扩展为基础组件）传入的数据 song 和 index 只使用了 index，而没有使用 song。

父组件中才会处理传入的数据

子组件（扩展为基础组件）的数据只与自身相关，如何处理如何使用传出的数据，不是子组件（扩展为基础组件）的职责。

# 元素的百分比宽度和高度的计算

元素的百分比宽高是依据**包含块**（containing block）的宽高(指内容区的宽高)来计算的。

关于包含块（containing block）的概念，不能简单地理解成是父元素。如果是静态定位和相对定位（位于普通流中），包含块一般就是其父元素。但是对于绝对定位（position: absolute）的元素，包含块应该是离它最近的 position 为 absolute、relative、或者 fixed 的祖先元素。对固定定位（position: fixed）的元素，它的包含块是视口（viewport）。


参考：[w3c height][w3c-height]、[CSS Standard property index][CSS-Standard-property-index]

[w3c-height]:https://www.w3.org/TR/CSS21/visudet.html#the-height-property

[CSS-Standard-property-index]:https://drafts.csswg.org/css-box/#property-index

# 定义 vue transition 组件中的各个部分的动画

``` scss
&.normal-enter-active, &.normal-leave-active {
  transition: all .4s;
  .parts-top, .parts-bottom {
    transition: all .4s ease;
  }
}
&.normal-enter, &.normal-leave-to {
  opacity: 0;
  .parts-top { // Chrome simulator 有一定几率出现只有一个部分进入动画，IOS 正常
    transform: translate3d(0, -100px, 0);
  }
  .parts-bottom {
    transform: translate3d(0, 100px, 0);
  }
}
```

# 动画性能优化

当在使用 @keyframes 动画时，如果做的动画比较复杂的话，就会导致动画不流畅，掉帧，尤其是移动端掉帧特别明显。这是因为，如果@keyframes 改变的属性是与 layout 相关的话，就会**触发重新布局**，导致渲染和绘制的时间会更加地长。 所以，应该尽可能地使用不会触发重新布局的属性来完成动画。

触发重新布局的属性有： width, height, margin, padding, border, display, top, right, bottom ,left, position, float, overflow等。应该尽量规避使用。

不会出发重新布局的属性有：transform(其中的translate, rotate, scale), color, background等。应该尽量用这些去取代。

# 便捷格式化数字的方法

**数字格式化**

[Number.prototype.toLocaleString][toLocaleString]( [ locales [, options ] ] ) 可将数字格式化为特定格式**字符串**，如**补0**。控制位数，是否有逗号（分隔符），添加货币符号等等。

注：该方法最终返回的结果是**字符串**。使用补0时，第一个参数 locales 要设置（如：'zh'）。

```js
const num = 2333333;
num.toLocaleString('zh', { style: 'decimal' }) // 2,333,333
num.toLocaleString('zh', { style: 'percent' }) // 233,333,300%
num.toLocaleString('zh', { style: 'currency' }) // 报错
num.toLocaleString('zh', { style: 'currency', currency: 'CNY' }) // ￥2,333,333.00
num.toLocaleString('zh', { style: 'currency', currency: 'cny', currencyDisplay: 'code' }) // CNY2,333,333.00
num.toLocaleString('zh', { style: 'currency', currency: 'cny', currencyDisplay: 'name' }) // 2,333,333.00人民币
num.toLocaleString('zh', { minimumIntegerDigits: 5 }) // 02,333.3

//如果不想有分隔符，可以指定 useGrouping 为 false
num.toLocaleString('zh', { minimumIntegerDigits: 5, useGrouping: false }) // 02333.3
num.toLocaleString('zh', { minimumFractionDigits: 2, useGrouping: false }) // 2333.30

// 控制有效数字
const num = 1234.5
num.toLocaleString('zh', { minimumSignificantDigits: 6, useGrouping: false }) // 1234.50
num.toLocaleString('zh', { maximumSignificantDigits: 4, useGrouping: false }) // 1235
```

**日期格式化**

[Date.prototype.toLocaleString][toLocaleString]( [ locales [, options ] ] ) 可将数字格式化为特定格式**字符串**

```js
const date = new Date();
date.toLocaleString('en', { weekday: 'narrow', era: 'narrow' }) // W A
date.toLocaleString('en', { weekday: 'short', era: 'short' }) // Wed AD
date.toLocaleString('en', { weekday: 'long', era: 'long' }) // Wednesday Anno Domini

const date = new Date();
date.toLocaleString('zh', { timeZoneName: 'short' }) // 2018/4/5 GMT+8 下午7:18:26
date.toLocaleString('zh', { timeZoneName: 'long' }) // 2018/4/5 中国标准时间 下午7:18:26

const date = new Date()
date.toLocaleString('zh', { year: 'numeric',  month: 'numeric',  day: 'numeric',  hour: 'numeric',  minute: 'numeric',  second: 'numeric', }) // 2018/4/5 下午7:30:17
date.toLocaleString('zh', { year: '2-digit',  month: '2-digit',  day: '2-digit',  hour: '2-digit',  minute: '2-digit',  second: '2-digit'  }) // 18/04/05 下午7:30:17

const date = new Date();
date.toLocaleString('en', { month: 'narrow' }) // A
date.toLocaleString('en', { month: 'short' }) // Apr
date.toLocaleString('en', { month: 'long' }) // April

```

[toLocaleString]:https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString

# $refs 对象的生命周期

```js
computed: {
  /**
  * https://cn.vuejs.org/v2/api/#ref
  * $refs 本身是作为渲染结果存在的，故在 mounted 之前 $refs 是不存在的，故查询
  * $refs.bar 的宽度只能使用 watcher 时查询。
  */

  currentBtn () {
    const progressLength = this.$refs.bar.clientWidth // 报错
    return {
      transform: `translateX(${this.currentPercent * progressLength}px)`
    }
  }
}
```

示例中是无法查询到 `this.$refs.bar` 标签的宽度的，经试验 `computed 属性` 在 created 时期之后，mounted 时期之前执行，而 `$refs` 对象是作为渲染结果的存在，那么在执行 `computed 属性` 中函数时，`this.$refs` 是 `undefined`。

**总结：**`this.$refs`对象只在渲染后填充，不能在 `computed 属性` 中调用 `this.$refs`对象。参考：[子组件引用][refs]

[refs]:https://cn.vuejs.org/v2/guide/components.html#子组件引用

# 进度条组件中的点击事件与触摸事件

## 比较点击与触摸事件的共同点：

因为在基础组件中不处理业务逻辑，那么通过改变进度条样式来**触发**播放器时间改变。

### 改变样式

```js
methods: {
  // ...
  _offset (length) { // 修改当前显示进度的样式
    this.$refs.progress.style.width = `${length}px`
    this.$refs.progressBtn.style[TRANSFORM] = `translateX(${length}px)`
  }
  // ...
}
```

### 修改时间

在基础组件中，是不应该有业务逻辑的。换句话说，业务逻辑只出现在业务组件中，那么在修改样式之后，通过向父组件派发事件的方式来启动业务逻辑。

```js
methods: {
  // ...
  _triggerPercent () { // 载荷为目标时间百分比（当前样式百分比）
    // 计算修改够的样式百分比
    const progressLength = this.$refs.progressBar.clientWidth - PROGRESS_BTN_WIDTH
    const percent = this.$refs.progress.clientWidth / progressLength

    this.$emit('percentChange', percent)
  }
  // ...
}
```

## 触摸事件

关键点：利用 `touch` 事件中特有的事件对象得到各个基础数据，进而得到移动距离。

组件初始化时，建立一个在 `touchstart`,`touchmove`,`touchend` 三个事件中可共享的数据容器

```js
created () {
  this.touch = {}
}
```

### touchstart

得到当前播放控件的坐标位置，为后续计算移动距离做准备

```js
progressTouchStart (evt) {
  this.touch.initiated = true // 表示是否已经初始化
  this.touch.startX = evt.touches[0].pageX
  this.touch.left = this.$refs.progress.clientWidth
}
```

### touchmove —— 计算当前的移动距离

```js
const PROGRESS_BTN_WIDTH = 16 // 圆点控件的宽度

progressTouchMove () {
  if (!this.touch.initiated) { return }

  // 当前位移
  const displacement = evt.touches[0].pageX - this.touch.startX
  // 总移动长度
  const progressLength = this.$refs.progressBar.clientWidth - PROGRESS_BTN_WIDTH
  const offsetLength = Math.min(progressLength, Math.max(0, this.touch.left + displacement))

  this._offset(offsetLength) // 触发进度条样式的改变
}
```

### touchend —— 重置初始状态

```js
progressTouchEnd (evt) {
  this.touch.initiated = false
  this._triggerPercent() // 派发事件，启动业务逻辑
}
```

由 touchmove 事件中的样式改变结果，计算时间百分比。向父组件派发事件来启动修改播放器时间的业务逻辑。

## click 事件

### 当前点击的位置 —— offsetX

```js
methods: {
  // ...
  progressClick (evt) {
    this._offset(evt.offsetX) // 修改样式
    this._triggerPercent() // 获得目标百分比，并派发事件和载荷，以启动修改时间的业务逻辑
  }
  // ...
}
```

在 click 事件中，与 touch 事件共同的关键点是得到当前点击位置的 X 坐标，这样才能得到目标百分比来修改播放器时间。

而在 click 事件中，事件对象有一个 `offsetX` 属性，该属性表示事件对象与目标节点的 `padding edge` 在 X 轴方向上的偏移量。这里得到的数据即是目标位置。

## 总结

综上分析，不论是在 click 事件还是 touch 事件中，**最重要**的是解决获取当前位置的问题，当获取到当前位置，那么就可得到目标百分比，进而派发事件，携带载荷来修改播放器的当前时间。

据此，我们也可得到一些开发组件的经验。在开发组件之前，预想设想组件的使用场景，得到将会产生**哪几种事件**，他们的**公共驱动点**在哪？如何使用最少的代码量来**驱动**不同的事件所带来的数据改变。

# 在某数值范围内循环

```js
methods: {
  // ...
  changeMode () {
    const mode = (this.mode + 1) % 3
    this.setPlayMode(mode) // setPlayMode 为映射的 mutation，用于修改 state mode
  }
  // ...
}
```

由以上方法，可将 mode 的值的范围限制在 `0 ~ 2` 中。

# 打乱数组

```js
function getRandomInt (min, max) { // 产生介于 min 和 max 之间的随机数，包含上下限
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function shuffle (arr) { // 经典打乱数组算法
  for (let i = 0; i < arr.length; i++) {
    let j = getRandomInt(0, i)
    let t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}
```

# 得到元素在视口中的坐标

[Element.getBoundingClientRect()][getBoundingClientRect] 方法返回`元素A`的大小及其相对于视口的位置。

得到的[对象][client-rect]为：

```js
DOMRect {x: 67.53125, y: 682, width: 240.2604217529297, height: 30, top: 682, …}
    bottom:712 // 矩形盒子A的底部相对于视口圆点的 y 坐标
    height:30 // 元素高度 = bottom - top
    left:67.53125 // 矩形盒子A的左侧相对于视口圆点的 x 坐标
    right:307.7916717529297 // 矩形盒子A的右侧相对于视口圆点的 x 坐标
    top:682 // 矩形盒子A的顶部相对于视口圆点的 y 坐标
    width:240.2604217529297  // 元素宽度 = right - left
    x:67.53125
    y:682
```


[getBoundingClientRect]:https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect

[client-rect]:https://developer.mozilla.org/zh-CN/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIDOMClientRect

# music-list 中的随机播放按钮

始于 randomPlaySong ==> actions 中 randomPlay (==> actions 中 selectedPlay 对应修改 ==> common/js/util 中 shuffle 函数修改 )

```js
function getRandomInt (min, max) { // 产生介于 min 和 max 之间的随机数，包含上下限
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function shuffle (arr) { // 经典打乱数组算法
  let _arr = [...arr] // 不能对原数组造成影响

  for (let i = 0; i < _arr.length; i++) {
    let j = getRandomInt(0, i)
    let t = _arr[i]
    _arr[i] = _arr[j]
    _arr[j] = t
  }
  return _arr
}
```

shuffle 函数中的**关键点**是，**不能**对传入的参数数组造成影响，否则在 selectedPlay 中的`index = findIndex(randomList, list[index])` 将导致无法找到正确的当前播放歌曲的索引

```js
export const selectedPlay = ({ commit, state }, { list, index }) => {
  commit(types.SET_SEQUENCE_LIST, list)

  if (state.mode === playMode.random) {
    let randomList = shuffle(list) // 打乱数组
    commit(types.SET_PLAYLIST, randomList) // 设置打乱后的歌单为当前歌单
    index = findIndex(randomList, list[index]) // 找到所选歌曲在打乱数组中的索引
  } else {
    commit(types.SET_PLAYLIST, list)
  }

  commit(types.SET_CURRENT_INDEX, index)
  commit(types.SET_FULL_SCREEN, true) // 默认点击歌曲后全屏播放
  commit(types.SET_PLAYING_STATE, true)
}
```
（注：当前播放歌曲是依据 playList 计算而来，sequenceList 是用于展示（交互）的列表，详见 [vuex store][currentSong]）

***关键点：***

a. 在 selectedPlay 中，区分`随机播放`和`其他模式播放`，在当前模式为`随机播放`时，找到传入索引在打乱后的歌单中的索引，并设置新的索引。

b. `index = findIndex(randomList, list[index])`一定要保证 `list[index]` 的 `list` **是之前的未打乱列表**，这样才能找到用户在点击时所选的正确歌曲（项），这样在之后的设置新索引时才能保证找到之前用户的点击项。

[currentSong]:https://github.com/lbwa/vue-sonar/blob/master/src/store/getters.js

# 空间不够的横向排列

在盒模型中，当两个子元素（`display：inline-block`）的宽度都为视口宽度时，可在父元素设置 `white-space: nowrap`，那么两个子元素本是上下排列的将转为横向左右排列。注意：这是一个**强制**不换行行为。

这里父元素设置 [white-space][white-space] 的好处是，子元素不用另外设置 `transform` 等初始位移属性。

[示例配置][example-nowrap]

[white-space]:https://developer.mozilla.org/zh-CN/docs/Web/CSS/white-space

[example-nowrap]:https://github.com/lbwa/vue-sonar/blob/master/src/components/app-player/app-player.vue#L603-L609

# v-if 与 v-for 同时使用

一般情况下，v-if 最佳实践是在 v-for 的外层容器来控制 v-for 的渲染与否。[参考][refer]

[refer]:https://cn.vuejs.org/v2/guide/list.html#v-for-with-v-if

# 多个组件使用同一逻辑

在多个组件使用同一逻辑的情况下，使用 mixin [混入][vue-mixin]来一次写入所有相同逻辑。

注：mixin 中的 mapMutations 已定义的函数不能在组件中再次定义，否则报错：no setter

[vue-mixin]:https://cn.vuejs.org/v2/guide/mixins.html

# 块级元素开始的空白文本将被忽略

块级元素开始的空白文本将会被忽略，并且，块级元素后面的空白文本结点将不会参与渲染，要注意的是注释节点也是正常的页面节点，只是它不参与渲染。[参考][kjyskb]

[kjyskb]:https://juejin.im/post/599ececb5188252423583c27#heading-18

# 组件 watcher 的另一种写法

```js
created () {
  this.$watch('query', debounce(newQuery => {
    this.$emit('queryChange', newQuery)
  }, 200))
}
```
以上示例与写为 vue 选项的写法作用相同。

# 对子组件的一种传值方法，当该值不需要监听时

```js
// child component
methods: {
  setQuery (query) {
    this.query = query
  }
}

// parent component

methods: {
  selectKey (item) {
    this.$ref.child.setQuery(item)
  }
}
```

调用子组件方法传值的优势在于:

1. 不用设置不必要的 props 和 watch
2. 代码量更少

适用于不需要监听的数据传递，注重传递这一行为

这里也牵涉到一个子组件是基础组件时，不应在子组件中出现业务逻辑

## vuex store 中慎用 splice() 等会修改原对象的方法

```js
export const insertSong = ({ commit, state }, song) => {
  /**
   * 为了在之后使用 Array.prototype.splice() 方法，这里使用拓展运算符浅复制数组
   * 原因：
   * 1. 因为在 JavaScript 中操作对象的实质是操作对象指针，那么在不复制数组的情况下使
   * 用数组 splice() 方法将会修改原数组。
   * 2. 第一点的这个行为与在 vuex 中必须通过mutation 来修改 state 的原则相悖。继而报
   * 错 Do not mutate vuex store state outside mutation handlers。
   */

  let playlist = [...state.playlist]
  let sequenceList = [...state.sequenceList]
  let currentIndex = state.currentIndex // 当前在 playlist 中的索引

  // 记录当前歌曲
  let currentSong = playlist[currentIndex]
  // 判断当前歌曲是否已存在，若存在则返回索引
  let fqIndex = findIndex(playlist, song)
  // 因为是插入歌曲，所以索引 +1
  currentIndex++
  // 插入目标歌曲到当前索引位置
  playlist.splice(currentIndex, 0, song)
  // 查找结果是存在目标歌曲
  if (fqIndex > -1) {
    if (currentIndex > fqIndex) {
      // 若当前插入索引大于列表中的索引，即在原索引之后
      playlist.splice(fqIndex, 1)
      currentIndex-- // 因为原单项已被删除，所以 -1
    } else {
      // 若当前插入索引不大于列表中的索引，即在原索引之前
      playlist.splice(fqIndex + 1, 1)
    }
  }

  let sequenceCurrentIndex = findIndex(sequenceList, currentSong) + 1

  let fsIndex = findIndex(sequenceList, song)

  sequenceList.splice(sequenceCurrentIndex, 0, song)

  if (fsIndex > -1) {
    if (sequenceCurrentIndex > fsIndex) {
      sequenceList.splice(fsIndex, 1)
    } else {
      sequenceList.splice(fsIndex + 1, 1)
    }
  }

  commit(types.SET_PLAYLIST, playlist)
  commit(types.SET_SEQUENCE_LIST, sequenceList)
  commit(types.SET_CURRENT_INDEX, currentIndex)
  commit(types.SET_FULL_SCREEN, true)
  commit(types.SET_PLAYING_STATE, true)
}
```

浅复制数组的几种方法：

1. 拓展运算符
1. concat()
1. slice()
1. for...of 遍历数组

# 函数防抖

意为在某段持续时间内，不断地触发事件，但**只执行**最后一次回调函数的调用。

实现：

```js
/**
 * @param  {Function} fn     要实现函数防抖的原函数
 * @param  {Number}   delay  延迟时间
 * @return {Function}        添加防抖功能的包装函数
 */
function debounce (fn, delay = 200) { // 延迟默认值 200ms
  let _timer = null // 匿名函数保持了对 _timer 变量的引用
  return function (...args) { // rest 参数，保存传入参数，用于向 fn 传递参数
    if (_timer) {
      clearTimeout(_timer)
      _timer = null
    }
    _timer = setTimeout(() => { // 这里的箭头函数中调用的 this 是外部匿名函数的 this
      fn.apply(this, args) // 指定 this 和参数，若不使用 apply 指定，那么 this 将指向 window
    }, delay)
  }
}
```
***注***：一个**易错点**就是 setTimeout 中为**箭头函数**时，因为箭头函数自身是没有 this 对象的，它内部的 this 对象是外部的 this 对象，那么此时可**直接调用**匿名包装函数的 this（这也是箭头函数的一个典型应用）。但若 setTimout 中是**非箭头函数**时，必须先在**外部引用**匿名函数的 this，即 `_that = this`，然后再用 `apply()` 方法指定调用 fn 时的 this 对象。

以上示例中，`debounce 函数`起**修饰作用**，用于定义一个闭包变量存储定时器和传入延迟载荷，返回的匿名函数也是 `fn 函数`的一个**修饰**，用于判断是否执行函数。其中 `...args` 为 ES6 `rest 参数`，它定义了在调用匿名函数时，由传入的参数组成的**真**数组（对于 arguments 伪数组而言）。

其中在 `setTimeout` 任务分发器中，是一个**异步调用**，那么必须指定调用 fn 的 this 和调用 fn 的包装匿名函数的传入参数。这是为了保证在使用防抖函数后调用 fn 与在没有使用防抖函数时调用 fn 的 this 对象和 arguments 对象**一致**。若不指定那么执行fn 时的 this 将指向 window，并且调用 fn 时无法正确传入 arguments 参数对象。

```js
// Vue.js 中使用函数防抖

created () {
  // watch 中真正的回调函数是 debounce() 返回的匿名函数
  this.$watch('query', debounce (newQuery => {
    this.$emit('queryChange', newQuery)
  }, 200))
}

```
在以上示例中，`debounce()` 表示了函数被调用，那么真正的回调函数是 `debounce()` 返回的匿名包装函数。因为 fn 的 this 与匿名包装函数的 this 是保持一致（使用 apply 指定的）的，那么 fn 的 this 此时是指向 Vue 实例组件的，`rest 参数`为由 `newValue` 和 `oldValue` 组成的数组。

[示例配置][debounce]，[示例使用][debounce1]

[参考][debounce2]

[debounce]:https://github.com/lbwa/vue-sonar/blob/master/src/common/js/util.js#L16-L26

[debounce1]:https://github.com/lbwa/vue-sonar/blob/master/src/base/base-search-box.vue#L34-L38

[debounce2]:https://github.com/sakila1012/blog/issues/17

# vuex 与 localStorage 的区别

> Q:既然 localStorage 和 sessionStorage 能做到数据维护,为什么还要引入vuex!这个问题问得好,Vuex的目的用来维护同级组件间的数据通讯,拥有一个共同的状态树;

仅仅活在SPA的里面的伪多页(路由)内, 这种东东明明然 localStorage 和sessionStorage也可以做到,还能做到跨页面数据维护..还不会被浏览器刷新干掉...
为什么还要引入 vuex, 我个人觉得原因只有这么一个,"可维护性"和"易用性"及
怎么理解呢?

可维护性: 因为是单向数据流,所有状态是有迹可循的...数据的传递也可以及时分发响应
易用性: 它使得我们组件间的通讯变得更强大,而不用借助中间件这类来实现不同组件间的通讯

而且代码量不多,若是你要用 ls 或者 ss,你必须手动去跟踪维护你的状态表...虽说可行,但是代码量会多很多,而且可读性很差...
是不是每个项目都需要用到vuex?答案是否定的,小型项目上这个反而是累赘..这东西一般是用在中型项目+的,因为里面涉及需要维护的数据比较多,同级组件间的通讯比较频繁
若是用到vuex的项目记得**结合** ss 或者 ls 来达到某些**状态持久化**!!!为什么看下面!

Q:vuex的**用户信息**为什么还要存一遍在浏览器里(sessionStorage or localStorage)

因为 vuex的 store 干不过刷新啊.保存在浏览器的缓存内,若用户刷新的话,值再取一遍呗

[来源][localStorage-src]

[localStorage-src]:https://juejin.im/post/59fa9257f265da43062a1b0e

# 不同组件有不同功能

不同组件有不同功能，对于在组件中发生不是自己组件的职能任务时，派发事件和载荷，让关心载荷的组件去完成任务。

# 本地存储

1. localforage 异步读取与写入

适配 vue，由 Mozilla 开发

弊端：无法在 vuex state 中设置读取（原因：异步机制）

2.  store.js 同步读取与写入

# 拓展小图标点击区域

``` scss
// 拓展小图标点击区域
@mixin extend-click () {
  position: relative;
  &::before {
    content: '.';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
  }
}
```

# 定制 CSS3 动画过程

使用 CSS3 animation 和 @keyframe

animation 来定义 animation-timing-function，其中 animation-timing-function 可由 @keyframe 来定制动画过程

## 比较 animation 和 transition

transition 关注 CSS property 的变化，即在 CSS 属性变化时控制动画

```scss
.test {
  transition: opacity 1s;
}
```

animation 关注元素本身动画流程和控制

transition + transform ＝ 两个关键帧的 animation

## 总结

追求复杂动画效果使用 animation；优先使用 transition 来定义动画。

# vue 事件修饰符

.self

``` html
<!-- 只当在 event.target 是当前元素自身时触发处理函数 -->
<!-- 即事件不是从内部元素触发的 -->
<div v-on:click.self="doThat">...</div>
```

# 提交 aciton 时需要携带多个载荷

vuex 提价 action 只允许携带**一个**载荷，当有多个参数需要传递时，使用一个对象作为载荷，多个参数作为该对象的属性

# 当提交一次 mutation / action 是触发多次提交的原因

1. 事件可能冒泡到父容器，父容器的监听器同样触发了相同的 mutation / action

这种意外触发很隐蔽。

总结：当组件中有很多同一事件的监听器时，要注意他们之间的关系，看他们的事件触发是否会影响到其他监听器的意外触发

2. watcher 的影响

# transition-group 绑定 key 值

transition-group 绑定 key 值若是默认 `(item, index) of items` 中的 index ，那么动画始终出现在列表的最后一项，解决方案是自定义一个 key 值，如 item 的某个不会复现的属性值

# 基础组件的整体定位

基础组件的定位交由基础组件外层容器元素来执行，这样的好处是将基础组件与定位解耦，复用性更强

# 编译打包优化

## 优化源码

### 路由懒加载(组件按需异步加载)

原理：webpack 代码分割（适用于项目打包文件 app.xxxxx.js 过大的问题）

# CDN 静态资源加载

webpack 中关于 public path [介绍][webpack-public-path]

设置 assetPublicPath 地址，[参考一][assetPublicPath1],[参考二][assetPublicPath2]

[webpack-public-path]:https://doc.webpack-china.org/guides/public-path/

[assetPublicPath1]:https://github.com/lbwa/vue-sonar/blob/master/build/webpack.base.conf.js#L30-L32

[assetPublicPath2]:https://github.com/lbwa/vue-sonar/blob/master/config/index.js#L53
