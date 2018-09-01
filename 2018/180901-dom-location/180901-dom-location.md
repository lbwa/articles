---
title:      "获取 Element 在 document 中的位置信息"
date:       2018-09-01
author:     "Bowen"
tags:
    - 前端开发
    - CSS
---

## 实现方法

以下主要参考 [w3c cssom view module 1] 与 `MDN web docs`。

### [scrollTop] - 相对于可视区域

展示一个元素垂直滚动距离的像素值。一个元素的 `scrollTop` 的值来源于该元素的 `top` 顶端到最顶级的 ***可见*** 内容区域的距离。当一个元素的内容区域 `content` 未生成垂直滚动条时，那么该元素的 `scrollTop` 的值恒为 0。

赋值可改变当前滚动条位置。

```js
// 在当前页面生成滚动条时，即根元素的 `content` 区域生成垂直滚动条时，scrollTop 将变化
document.documentElement.scrollTop // 将展示当前页面滚动条的移动位置

// 由于历史原因存在以下兼容性解决方案
const nowLocation = document.documentElement.scrollTop
  || window.pageYOffset // window.scrollY 的别名
  || document.body.scrollTop
```

### [offsetTop] - 相对于最近的定位元素

只读属性。展示当前元素相对于 [offsetParent] 节点顶端 `top` 的距离。

`offsetParent` 表示相对于当前元素的最近的定位（`position` 为非默认值的包含块元素）包含元素 `positioned containing element`。如带有属性 `position: relative` 的包含块元素 `containing block`

### [scrollLeft] - 相对于可视区域

（[w3c scrollLeft 取值]）

展示当前元素相对于最顶级可见内容区域的左边缘距离。

### [offsetLeft] - 相对于最近的定位元素

（[w3c offsetLeft 取值]）

只读属性。表示当前元素的 ***左上角顶点*** 相对于 [offsetParent] 节点左侧偏移 `offset` 的像素。

### [scrollHeight] - 相对于可视区域

只读属性。描述了一个元素的内容区域的测量高度值。被测量的内容区域 ***包含*** 因为溢出屏幕而不可见的内容区域。

`scrollHeight` 等于在没有垂直滚动条时，元素在 `viewport` 内为了适应所有内容所需的最小高度。该高度以同样的方式被 [clientHeight] 测量：它包含了元素的 `padding` ，但不包含 `border`，`margin` 或者水平滚动条（如果存在的话）。它同样包含了伪元素的高度，如 `::before` 或 `::after`。 如果元素的内容区域可以被自动适应的情况下，且没有出现垂直滚动条时，[scrollHeight] 将等于 [clientHeight]。

> This property will round the value to an integer. If you need a fractional value, use [Element.getBoundingClientRect()].

***注：*** 该参数始终返回一个 [Math.round] 四舍五入取整的整数。如果需要小数位的值，可使用 [Element.getBoundingClientRect()]。

### [scrollWidth] - 相对于可视区域

只读属性。描述了当前元素的内容 `content box` 区域的宽度，其中包含因溢出屏幕不可见的内容区域。

与 [scrollHeight] 相似，在不存在水平滚动条时，当前元素的 `scrollWidth` 等于 `clientWidth`。

### [clientHeight]

只读属性。在没有 [CSS layout boxes] 或 `inline layout boxes` 的情况下，对于元素来说，该值为 0 。否则，等于元素的 `inner height` 的像素值。其中包含 `padding` 但不包含 `border`、`margin` 或 水平滚动条。

`clientHeight` 可通过 `height + padding - 水平滚动条（若有）` 来计算。

> This property will round the value to an integer. If you need a fractional value, use [Element.getBoundingClientRect()].

***注：*** 该参数始终返回一个 [Math.round] 四舍五入取整的整数。如果需要小数位的值，可使用 [Element.getBoundingClientRect()]。

## 块级元素

对于块级元素来说，`offsetTop`，`offsetLeft`，`offsetWidth`，`offsetHeight` 描述了一个元素的 [border box][box model]（即盒模型中边框形成的区域）相对于 [offsetParent] 的偏移量。

## 行内元素

对于存在换行 （`wrap`） 的行内元素来说。`offsetTop` 和 `offsetLeft` 描述了第一个 [border box][box model] 的位置 `positions`（通过 [Element.getClientRects()] 获得该 `box` 的 `width` 和 `height`），而 `offsetWidth` 和 `offsetHeight` 描述的是 `bounding border box` （由 [Element.getBoundingClientRect()] 获取该 `box` 尺寸）的尺寸。

因此，一个行内元素盒模型的 `offsetTop`，`offsetLeft`，`offsetWidth`，`offsetHeight` 的 `left`、`top`、`width`、`height` ***不会是*** 一个包含换行文本的 `bounding box`。

## 抽象总结

一般来说，`scroll~` 系属性趋向于描述当前元素相对于当前视口区域的状态。`offset~` 系属性趋向于描述当前元素相对于最近的祖先定位包含块的状态。`client~` 系属性趋向于描述当前元素的 [padding box][box model] 区域的测量值，若对应方向上，存在对应滚动条时，还需要加上对应滚动条的值。

[w3c cssom view module 1]:https://www.w3.org/TR/cssom-view-1/

[scrollTop]:https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop

[offsetTop]:https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop

[offsetParent]:https://developer.mozilla.org/en-US/docs/Web/API/HTMLelement/offsetParent

[scrollLeft]:https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft

[w3c scrollLeft 取值]:https://www.w3.org/TR/cssom-view-1/#dom-element-scrollleft

[offsetLeft]:https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetLeft

[w3c offsetLeft 取值]:https://www.w3.org/TR/cssom-view-1/#dom-htmlelement-offsetleft

[scrollHeight]:https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight

[scrollWidth]:https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth

[clientHeight]:https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight

[box model]:https://www.w3.org/TR/CSS22/box.html#box-dimensions

[Element.getClientRects()]:https://developer.mozilla.org/en-US/docs/Web/API/Element/getClientRects

[Element.getBoundingClientRect()]:https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect

[Math.round]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round

[css layout boxes]:https://www.w3.org/TR/cssom-view-1/#css-layout-box
