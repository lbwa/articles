---
title:      "对 Vue 插槽和生命周期的一点思考"
date:       2018-04-24
author:     "Bowen"
tags:
    - 前端开发
    - Vue.js
---

# Vue.js 生命周期钩子

在 Vue 组件的生命周期内，`mounted` 之前（包括自身）的所有钩子都只会调用**唯一的一次**。

在服务端渲染 Vue.js 组件时，不会调用 `beforeMount` 和 `mounted` 的钩子的，因为没有操作 DOM 的环境。

尽管在 `beforeCreate` 时期，事件与生命周期已完成初始化，但是初始化注入和交互都是在 `beforeCreate` 之后，`created`之前。那么在组件中的数据操作，如 `ajax 请求` 最早不能早于 `created` 时期。

# 渲染

`render` 函数不能写成 箭头函数，否则其中的 this 将指向错误的对象，而非 vue 实例。

# 实例对象

`$el` 只存在始于 `created` 之后，即在 `beforeMount` 才能被探测到。在 `beforeMount` 时期值为将被替换的节点，如原 DOM 中 `<div class="app"></div>`；在 `mounted` 时期的值为已经替换的 DOM 节点，原节点已经被新节点替换。

`$refs` 是对 DOM 的引用，那么它的存在只能在 `mounted` 才能被探测到

`$options` 是当前 Vue 实例化时的选项对象，即 `new Vue()` 时的参数对象

# 在 Vue.js 中监听对象属性的方法

在常规情况下， Vue.js 只监听数据**对象本身**，即只监听指向某对象的**指针是否变化**。它对于该对象的内部属性变化并不能做到响应其变化。

原因是，据 [官方文档][reactive] 响应式原理，Vue.js 在初始化实例时，对 data 对象中的每一项都执行 `getter/setter` 的转化过程。这里的转化过程**并没有进行深度遍历**，即 data 对象中的某项是一个对象 A，对象 A 下的属性是**不会**受到监听的，受到 Vue.js 监听的是对象 A 这个整体。

示例如下：

```js
new Vue({
  el: '#app',
  data: {
    obj: {
      a: 0
    }
  },

  methods: {
    inputEvt () {
      this.obj.a += 1
      console.log(this.obj.a)
    }
  },

  watch: {
    // 监听 obj 时是无法响应 obj.a 的变化的。修改为 'obj.a' 的监听即可
    obj (newValue, oldValue) {
      console.log('running')
    }
  },

  render (h) {
    return h('input', {
      on: {
        input: this.inputEvt
      }
    })
  },
})
```

## 解决方案

```js
watch: {
  // 法一
  'obj.a': { // 对象属性的样式一定要是字符串形式
    console.log('obj.a changed')
  },

  // 法二
  obj () {
    handler () { // 一般省略了 handler 写法，直接写内部代码块内容
      console.log('obj.a changed')
    },

    immediate: true, // 该回调将会在侦听开始之后被立即调用
    deep: true // 是否深度监听对象属性，性能开销大，慎用
  }
}
```

> 因 JavaScript 的限制，Vue.js 无法监听对象的属性的添加和删除。

`Vue.set()` 用于建立非初始化（没有在 data 项中声明的数据对象）对象属性的响应式监听，以触发视图更新。这个方法的目的是要去**触发响应式的视图更新**，而不是数据处理，若需要对对象的变化做出对应的数据处理，请使用 `watcher`。

[reactive]:https://cn.vuejs.org/v2/guide/reactivity.html#检测变化的注意事项

# 由 props 联系到子组件的通信行为

前提：一般地，我们将子组件分为业务子组件和基础（展示性）子组件。其中，基础组件是（展示性组件）由父组件向其通过 props 来传递数据并展示数据内容，仅仅具有展示功能，不具有处理数据功能。我们要遵循的原则是保持父子组件间的`单向数据流`。

子组件（业务和基础子组件）中不应有修改 props 的语句出现。因为 props 本身定位是**规范约束**子组件的显示行为。如果在这时在子组件中出现了修改 props 的语句。那么这破坏了传递 props 来约束子组件的原则。作为一个子组件不应该修改父组件的数据。

如果要在子组件内修改 props ，那么导致该子组件的职责不清晰。即该组件的**职责定位**有问题，要么派发事件让父组件处理数据，要么本应将数据处理完毕后再传给子组件。至于父组件会不会处理以及如何处理子组件传递的载荷，这不是子组件的职责所在。

至于基础子组件和业务子组件的划分，个人认为是通过组件本身内部功能实现（是否仅仅是展示数据），**组件复用性**来划分。一般地，复用性子组件我们定义为基础子组件，其中**不应有**处理数据的语句出现。因为复用性高，那么其在不同的使用环境可能对应不同的数据处理方法。所以，复用性组件应该作为基础组件的存在，其职责主要是展示数据。处理数据这一行为交由子组件的父组件处理。

# 对增强组件复用性的思考

1. 划分明确的组件职责

2. slot 插槽

3. slot 插槽 + slot-scope 插槽

## slot-scope 插槽原理

一般情况下，每个组件都有自己的作用域，父组件模板的内容在父组件作用域内编译；子组件模板的内容在子组件作用域内编译。典型示例就是，子组件中的 `slot 插槽` 内容引用的是**父组件**的数据对象。即 `slot 插槽` 的内容引用的数据对象是**跟随**父组件作用域的。

作用域插槽用于在子组件 `slot 插槽` 中调用自身的数据对象。父组件中的 `slot-scope 插槽` **指定**了要引用的 props 对象。这里就像是子组件的作用域插到父组件中一样。

``` html
<!-- child component -->
<div class="child">
<!-- 在父组件没有使用 slot-scope 时，插槽内容中的 props.text 值为父组件内的 props 值 -->
  <slot></slot>
</div>

<!-- parent component -->
<my-awesome-list :items="items">
<!-- 此时，slot 插槽内容调用 props.text 值将优先调用子组件的 props.text -->
  <li
    slot-scope="props"
    class="my-fancy-item">
    {{ props.text }}
  </li>
</my-awesome-list>
```

在父组件中，指定了传给子组件的 slot-scope 值，那么在子组件中此时调用的 props 即为父组件的 props 值。

## slot-scope 插槽实现

示例如下：

```js
const ChildComponent = {
  data () {
    return {
      childText: 'child text'
    }
  },

  // 子组件中的 text 将经过 slot-scope 传递给父组件
  template: `
  <div class="child">
    <slot :text="childText"></slot>
  </div>
  `
}

new Vue({
  el: '#app',

  components: {
    ChildComponent
  },

  // 父组件以 props 对象的属性的形式接收子组件传递的 text 值
  // 同时，在插槽内仍可调用父组件的 data 对象
  template: `
  <div class="app">
    <child-component>
      <span slot-scope="props">{{props.text}}</span>
    </child-component>
  </div>
  `,

  data: {
    text: 'parent text'
  }
})
```

此时，渲染的 DOM 树如下：

``` html
<div class="app">
  <div class="child">
    <span>child text</span>
  </div>
</div>
```

由以上实例，`slot-scope 插槽` 提供了一种经过 props 对象**子组件向父组件传递数据**的**机会**。它一般配合 `slot 插槽` 一起使用，这样，可以有不同的 `slot 插槽` 内容，但是使用的是**同一数据对象**，即***子组件作为一个能传递数据的重用模板***。此时，子组件的作用域好像插在父组件一样。

## slot-scope 插槽与 slot 插槽的不同

`slot-scope 插槽` **侧重**指定渲染时的**数据对象**的调用，它实现了一种经过 props 对象子组件向父组件传递数据的机会。`slot 插槽` 侧重指定渲染时的**内容**，即内容分发。

另外值得注意的是，`slot-scope 插槽` 定位并不是向父组件传递数据，它**仅仅**只能指定 `slot 插槽` 中内容区域的数据对象，那么 `slot-scope 插槽` 是不能与 `vm.$emit()` 来相提并论的。

# 在渲染函数中使用 $slot

```js
const ChildComponent = {
  render (h) {
    return h('div', {
      class: 'child'
    }, this.$slots.header) // 在子组件中通过 vm.$slot 来访问插槽内容
  }
}

new Vue({
  el: '#app',

  components: {
    ChildComponent
  },

  render (h) {
    return h('div', {
      attrs: {
        id: 'app'
      }
    }, [
      h('child-component', {}, [
        h('span', {
          slot: 'header'
        }, this.text)
      ])
    ])
  },

  data: {
    text: 'parent text'
  }
})
```

在渲染函数中，使用 `vm.$slot` 在子组件中（接收方）访问插槽内容，匿名插槽为 `vm.$slot.default`，具名插槽为 `vm.$slot.name`。
