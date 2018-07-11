---
title:      "eleme-candy 项目总结"
subtitle:   "复盘在开发中的一些思路"
date:       2018-03-28
author:     "Bowen"
tags:
    - 前端开发
    - JavaScript
    - Vue.js
---

## 真正的 1 像素边框

原理： 伪类 + 缩放（根据不同像素比）

利用一个 class 加入 HTML 文档

```scss
@mixin bottom-1px($color) {
  position: relative;
  &:after {
    display: block;
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    border-bottom: 1px solid $color;
    content: ''
  }
};

// 引用 mixin 时，同时向该 class 添加以下 scale 类名来缩放伪类
// media 查询前缀，需要手动添加，postcss 的 autoprefixer 不会补全 media 查询条件

@media (min-device-pixel-ratio: 1.5), (-webkit-min-device-pixel-ratio: 1.5) {
  .scale {
    &:after {
      transform: scaleY(0.7);  // 1.5 * 0.7 约等于 1 像素
    }
  }
};

@media (min-device-pixel-ratio: 2), (-webkit-min-device-pixel-ratio: 2) {
  .scale {
    &:after {
      transform: scaleY(0.5);
    }
  }
};
```

总结：@include bottom-1px() 要与 scale **配合使用**

## 组件生命周期中的 ajax 请求

app.vue 中 created 函数是异步请求，那么初始化时第一次传递给 sellerData  的就是 sellerDetail 的初始值，即 {} ，在 created 异步请求返回后，回调函数内 sellerDetail 变化，那么重新传递 sellerData 值，此时传递正常数据值。由此，在示例中，初始化时会 props 值会变化两次

JSON 中的地址在使用时要 v-bind 绑定，才能调用JSON 中的地址，否则src特性值为变量名字符串

```html
<img :src="item.url"> <!-- v-bind 绑定 src 属性 -->
```

## 消除标签之间的空白

设置容器元素的 font-size（该属性可被后代元素继承） 设为 0 ，再将容器内的后代元素设置正常的font-size，那么各个元素之间的空白将消失
见 preview.gif

![pa](https://raw.githubusercontent.com/lbwa/articles/master/2018/180328-summary-of-eleme-candy/preview.gif)


若后代元素不设置 font-size ，那么后代元素的字将消失，因为在后代元素不设置 font-size 的情况下，后代元素将继承祖先元素的 font-size

因此，容器元素和的 font-size 要与后代元素的 font-size 配合使用

## 对 vertical-align 和 line-height 探究

CSS 的属性 [vertical-align][vertical-align] 用来指定行内元素（inline）或表格单元格（table-cell）元素的垂直对齐方式。不能用于块级元素。

```scss
vertical-align: top; // 把元素顶端与整行的顶端对齐，该属性设置的是元素在该行中的行为
```

当 webfont 与文字没有对齐时，设 webfont 为行内块元素，且设置 vertical-align: top（源自 BaseRatingsSelector）

[line-height][line-height] 是可继承属性

图片默认在盒模型中以顶端基线为准对齐，文字默认以底端基线对齐 => vertical-align: top 或 bottom;将他们对齐

注： 内含文字和图片的容器元素不要设置行高！

[vertical-align]:https://developer.mozilla.org/zh-CN/docs/Web/CSS/vertical-align

[line-height]:https://developer.mozilla.org/zh-CN/docs/Web/CSS/line-height

## 文字超出指定宽度省略为 ...

示例代码：
```scss
white-space: nowrap;
text-overflow: ellipsis;
overflow: hidden;
```

### 文字省略和 font-size: 0 的效果兼容

当使用单行超出部分省略时，font-size：0 将导致**省略号消失**，那么解决办法是不使用 font-size: 0 而是将两个span 写在同一行，而不是分开两行写，这样就是不使用 font-size: 0 也能去掉两个标签之间的空白的方法。

盒模型内容 content 区域不包括 [before / after][Pseudo-elements]（创建一个被选择元素的第一个或最后一个子元素） 伪元素区域,他们的尺寸是单独设置。即使设置了 box-sizing：border-box也不包括。

[Pseudo-elements]:https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements

## css sticky footer 实现

法一：不使用绝对定位，添加一个容器撑开 footer

```scss
.seller-detail {
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  width: 100%;  // fixed 布局的包含块是视口，故计算结果是视口宽度
  height: 100%;  // 原理同上，故计算结果是视口高度
  .detail-wrapper {
    // 推开 footer 的容器，css sticky footer 的关键，高度不能写死，否则其子元素，即真
    // 正的内容区域可能突破父元素
    min-height: 100%;
    width: 100%;
    // 真正的内容区域
    .seller-detail-main {
      // 必须是 padding 给 footer 留出空间，否则可能与 footer 区域重叠
      padding-bottom: 64px;
    }
  }
  .close-detail {
    height: 32px;
    width: 32px;
    margin: -64px auto 0 auto;
    clear: both;
    font-size: 32px;
  }
}
```

主要原理：内容外容器，即包装层，.detail-wrapper 用于撑满整个屏幕，即将 footer 撑开，使 footer 保持视口在底部。容器内内容块 .seller-detail-main 要有一个 padding-bottom 留给 footer ，用于在内容区域超过视区（滚动出现）之后 footer 不会遮挡内容区域

法二： 使用绝对定位，使用父元素撑开 footer

```html
<div class="wrapper">
    <div class="content"></div><!-- 页面主体内容区域 -->
    <div class="footer"></div><!-- 需要做到 Sticky Footer 效果的页脚 -->
</div>
```
``` scss
html, body {
    height: 100%;
}
.wrapper {
  position: relative;
  min-height: 100%;  // 关键，使其可以随内容区变化，撑开 footer
  padding-bottom: 50px;  // 预留 footer 高度，防止重叠
  box-sizing: border-box;
  .footer {
    position: absolute;
    bottom: 0; // 当绝对定位的参照元素高度变化时，将跟随移动，达到 sticky footer 效果
    height: 50px;
  }
}
```

主要原理：绝对定位 .footer 使其脱离普通流，定位于 .wrapper，那么由 .wrapper 担任撑开 footer 的角色。
在内容区小于 wrapper 时，footer 将保持在视口底部，当 .content 区大于 wrapper 时，wrapper 将被 .content 撑开，wrapper 被撑开，此时，footer 也跟着被定位（因为 `bottom: 0` 的存在）到 .wrapper 底部，达到跟随的目的。

两个方法的本质**区别**是：法一是用一个容器"**抵开**" footer，法二是使用绝对定位的 `bottom: 0` **跟随**被撑开的绝对定位的参照元素（此参照元素的高度**一定不能**写死，否则高度不能变化，那么 sticky footer 也就失效了）。

其他方法：flexbox 纵向布局、calc(100vh - footer的高度)

## vue 组件引用父元素的循环单项

示例代码： AppHeader.vue 中列表循环商家优惠信息

```html
<ul v-if="sellerData.supports" class="seller-detail-supports">
  <li
    class="supports-item"
    v-for="(item, index) of sellerData.supports"
    :key="index"
  >
    <span :class="['icon', classMap[sellerData.supports[index].type]]"></span>
    <span class="text">{{sellerData.supports[index].description}}</span>
  </li>
</ul>
```

示例中，体现了父元素中显示声明的循环单项（index）可在其后代元素中使用


## 在初始化组件后，向 vue 中的对象添加属性的方法

参考：[深入 vue 响应式原理][vue-reactive]

vue 本身不能够响应（监听）已有对象中添加或删除属性的行为，要**添加响应式属性**的方法有：

1. 使用 `Vue.set()` (别名是 `vm.$set`，其中 vm 是 vue 实例)方法添加/删除属性。
2. 使用 `Object.assign()` 来创建一个新的对象，使新对象包含原对象的属性和新属性，注意，不能使用 `Object.assign()` 方法直接将新属性添加至原对象，否则是非响应式属性，**不会**触发数据更新。

[vue-reactive]:https://cn.vuejs.org/v2/guide/reactivity.html#检测变化的注意事项

## vue 中 computed 最佳实践

（参考：[vue doc][vue-doc]）

结论：computed 的最佳实践：在计算属性中**不应该**有修改 data 对象的（赋值）语句出现

原因：因为 computed 属性设定的角色定位是**仅仅**是一个 getter ，不包括setter，为不偏离 getter 的角色定位，故将对 this.scroll 的初始化（在 computed 中赋值：this.scroll = new BScroll(...)）提炼出为一个方法，通过调用这个方法来初始化 this.scroll 且不叛离 computed 属性的 getter 角色定位。否则，报错 Unexpected side effect in “某计算属性名” computed property

[vue-doc]:https://cn.vuejs.org/v2/guide/computed.html#计算属性的-setter

## 制作弹出的详情页

购物车详情页（从 tab 组件中弹出）构建步骤：

基本结构：
```html
<transition name="fold">
  <div class="cart-list scale" v-show="showList">

    <div class="list-header">
      <h1 class="title">购物车</h1>
      <span class="clear-cart" @click="cleaner">清空</span>
    </div>
    <!-- ref 下的第一个子元素即滚动的目标元素 -->
    <div class="list-content" ref="scroll">
      <ul>
        <li
        class="item"
        v-for="(item, index) of goodsInCart"
        :key="index">
          <div class="name">{{ item.name }}</div>
          <div class="price">
            <span>￥{{ item.price * item.quantity }}</span>
          </div>

          <div class="cart-wrapper">
            <BaseCartBtn :singleGood="item"/>
          </div>

        </li>
      </ul>
    </div>

  </div>
</transition>
```

### 确定详情页展开的目标位置
```scss
.cart-list {
  // 整个购物车相对于屏幕视口 fixed 定位，详情页是相对于购物车绝对定位
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1;
  width: 100%;  //宽度撑满屏幕，计算视口宽度得出
  // -100% 相对于当前高度做 -100% 偏移，组件的常态位置
  transform: translate3d(0, -100%, 0);
}
```

这一步的重点是：定位 和 相对于自身做 -100% 的偏移， -100% 的偏移可自适应向上展开合适的高度

### 确定详情页内的基本布局样式，添加展开动画

重要样式：

```scss
&.fold-enter-active, &.fold-leave-active {
  transition: all .5s;  // 定义动画过度过程中的样式
}
&.fold-enter, &.fold-leave-to {
  transform: translate3d(0, 0, 0); // 定义弹出动画起始位置和折叠时的动画的目标位置
}
```

此处是定义详情页自购物车中 0 位置向之前定义的 -100% 位置过渡，即**目标状态是常态**！！此时设常态为 `display: none` 即可，这样就达到了详情页自 tab 组件中弹出过渡到完整状态。

### 总结

前提：[transition][transition] 封装组件，一般与 (1)条件渲染(使用 v-if)； (2)条件展示(使用 v-show)； (3)动态组件组件； (4)根节点配合使用。

本质：在动画过程中不断插入类名来体现动画效果，是由这些插入的类名来控制动画效果的。

由购物车详情页的构建，我们可以拓展总结出，vue 的动画原理（`定义组件的进入和离开状态的动画`）是向目标元素插入特定类，`将由 vue 设定类的状态过渡到常态或当缓存（或销毁）发生时由常态过渡到一个自定义目标状态`。

进入（创建）时，`自定义名-enter`（定义起始状态）、`自定义名-enter-to`（定义进入态的目标状态）和`自定义名-enter-active`（定义进入时中间过渡状态）此类表示进入态过渡至常态。

离开（被缓存或销毁）时，`自定义名-leave`（定义离开时的起始状态）、`自定义名-leave-to`（定义离开态的目标状态）和`自定义名-leava-active`（定义离开时中间过渡状态）由常态过渡到类所定义的一个目标态。

注：

1. 常态是固定不变的，通过修改进入态或目标态，即可做到过渡动画。
1. `自定义名-enter-to` 和 `自定义名-leave-to` 与常态的区别是，他们会**在动画结束时被移除**。
1. transition 使用的前提条件定义了动画结束之后，组件的真正"归处"(如被隐藏、创建、或销毁等)。

[transition]:https://cn.vuejs.org/v2/guide/transitions.html

## better scroll 原理

1. 初始化 better-scroll 传入需要滚动的元素的**父元素**，better-scroll将滚动该父元素的第一个子元素
1. 如有必要，将该父元素定高（即**父元素不能由子元素撑开**，目的是让子元素有可能超出父元素宽度，否则子元素无法滚动），且设置超出部分隐藏，即 overflow: hidden 。
1. 当检测到父元素的第一个子元素高度高于该父元素高度时，better-scroll 将设置 transform: translate3d(x, y, z) 移动滚动区域，达到滚动效果。

注： 在 vue 中使用 better-scroll 必须等到 DOM 更新之后（vue 有自己的任务队列，是异步更新 DOM，在 this.$nextTick 中初始化 better-scroll）才能挂载 better-scroll，这样 better-scroll 才能正确计算父元素高度。当 DOM 结构改变时，使用 scroll.refresh() 重新计算父元素高度

### 使用 better-scroll 添加滚动

添加滚动的结构是 vue 中 ref 的**第一个子元素**区域

重要样式有：

```scss
.list-content {
  max-height: 217px;   // 设置最大高度
  overflow: hidden;  // 达到最大高度超出部分隐藏，滚动交由 better-scroll 组件
  // ...
}
```

JavaScript 代码：

```js
// vue methods 选项内
initScroll (show) {
  if (show) {
    // vue 有自己的任务队列，为异步更新DOM，只有更新了 DOM 才能初始化 better-scroll
    this.$nextTick(() => {
      if (!this.scroll) {
        // this.$refs.scroll的第一个子元素即为滚动目标元素
        this.scroll = new BetterScroll(this.$refs.scroll, {
          click: true  // 支持原生点击事件
        })
      } else {
        this.scroll.refresh()
      }
    })
  }
},
```

## 父组件调用子组件的方法
``` html
<child ref="child"> <!-- child 值不要用连字符 -->
```
``` javascript
this.$refs.child.show()  // 调用子组件 child 的 show 方法
```

## 布局时防止图像加载的闪烁

问题：模块内有一张图，该图因为要自适应不同的屏幕，故**不能定高**，而且要留有空间给图像加载，以防止图像加载出来布局改变（常称为闪烁，因为没有加载出来前，盒模型没有内容无法撑起），如何布局？

以下都是针对**块级元素**来说，行内元素不能设置 width 和 height

思路：用盒模型 padding / margin **设置百分比值**代替内容区撑起高度，先占位

解决方案：设定目标块的 padding-top 或者 padding-bottom 的值为 100%，该百分数是图像比例。

原因：padding / margin 的百分比值计算结果是相对于包含块的 **width 值**。其中包含 padding 和 margin **所有部分**都是以包含块的内容区宽度为参照计算最后结果的。

```scss
.img-list-wrapper {
  position: relative;
  width: 100%;
  // 占用图片高度，防止图像加载完成造成的闪烁，需要与父元素 相对定位 和子元素 的绝对定
  // 位配合使用
  padding-top: percentage(90 / 378);
  overflow: hidden;
  white-space: nowrap;
  .img-list {
    position: absolute;
    top: 0;
    left: 0;
    // ...
  }
  // ...
}
```

### 参考及拓展

参考：(1)[w3c margin/padding][w3c-margin/padding](2)[css standard margin/padding][css-standard-margin/padding]

拓展： 图片自适应 ———— 解决方案：margin / padding 百分数（按比例自适应）

拓展：CSS3 新特性 [vh][css3-vh] 单位（视口高度的 1/100，vw 同理）也可达到相同的效果，但要考虑兼容性。

[css-standard-margin/padding]:https://drafts.csswg.org/css-box/#property-index

[w3c-margin/padding]:https://www.w3.org/TR/CSS21/box.html#pahdding-properties

[css3-vh]:https://developer.mozilla.org/zh-CN/docs/Web/CSS/length

## CSS 中 width 和 height 百分比属性值的计算结果

（以占用普通流的元素的 width 为例）

现象：当包含块的 width 设置为 100% 且有效时，那么包含块的子元素的宽度加上子元素的 margin 和 padding 值（如有）等于包含块的 width 计算后的值。

原因：当 C 的包含块 A 设置 width: 100% 时， 100% 的计算是基于包含块 A 的**父元素 B 的 width**的（[w3c box model][box-model]）。当包含块的父元素 B 宽度为默认值（即 B 没有明确指定 width），即 auto 时，而 B 的宽度又是基于其父元素，那么直至根元素都是 auto 值的话，那这里可理解为**子元素 C 撑起了其祖先元素**。因此可以得到，此时包含块 A 的宽度 100% 的计算结果对象可由 A 的父元素 width 转化为 B 的后代元素所撑起的宽度（此宽度包含边距），即此时 B 的后代元素 C 的内容区 width + 边距 margin / padding 等于包含块 A 的 width: 100% 的计算值。

现象：非内联元素的 width 默认值计算

原因：内联元素无法设置 width 和 height。非内联元素的 width 默认值是 auto ，意思是，将元素本身宽度(即内容区宽度)加上元素本身的 margin / padding 之和等于父元素的 content width。

###width: auto 与 width: 100% 的区别

当元素 A 设置了 width 属性时，

百分数的计算是基于元素的父元素 width 计算的，与元素 A 的自身边距无关，最后结果是 A **可能撑破**父元素。

auto 即为默认值时，有等式：A 的 width + margin / padding === A 的父元素 width 是恒成立的，即此时的 A 是**不会**撑破 父元素的。

拓展：根元素（`<html>`）的包含块是视口（viewport），那么根元素的包含块的 width 是一定固定存在的。即`<html>`的 width: 100% 即为包含块视口的宽度。

拓展： 关于包含块（containing block）的概念，不能简单地理解成是父元素。如果是静态定位和相对定位（位于普通流中），包含块一般就是其父元素。但是对于绝对定位（position: absolute）的元素，包含块应该是离它最近的 position 为 absolute、relative、或者 fixed 的祖先元素。对固定定位（position: fixed）的元素，它的包含块是视口（viewport）。

（以上元素的 height 同理，都是基于父元素的 height 来计算的）

[box-model]:https://www.w3.org/TR/CSS21/visudet.html#propdef-width

## 使用 global event bus

当有多个组件有同一事件 global event bus 监听器时， 另外的组件不能通过 global event bus 传递事件，因为会触发所有的监听器。因为 global event bus 是**全局**的，他不受某一组件的控制

## 常用构建组件的技巧

构建组件：

1. 有哪些数据需要维护（传递）
1. 组件结构

样式及激活与未激活状态，一般是同色不同透明度的切换。

```scss
.all-ratings, .positive-ratings {
  margin-right: 8px;
  &.active {  // 激活时添加 active 类
    color: $color-empty;
    background: rgba(0, 160, 220, 1);
  }
}
```

## 理解 BFC 和闭合浮动

独立为一篇文章，链接如下：

[理解 BFC 和闭合浮动][css-bfc]

[css-bfc]:https://lbwa.github.io/blog/writings/180329-css-bfc/
