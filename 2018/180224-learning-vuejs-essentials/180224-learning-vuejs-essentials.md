---
title:      "学习 Vue.js 基础"
subtitle:   "总结在学习Vue.js官方文档时的一些心得"
date:       2018-02-24
author:     "Bowen"
tags:
    - 前端开发
    - JavaScript
    - Vue.js
---

## 简介

　　在HTML文档中，类似v-bind的特性被称为指令。指令带有前缀v-。以表示它们是Vue提供的特性。它们会在渲染的DOM上应用特殊的响应式行为。看起来Vue应用看起来非常像字符串模板，此时数据与DOM建立了关联，所有的东西都是响应式的。在Vue.js编程中，数据都是以对象的属性存储，即在Vue.js中存在数据对象用于存储数据。

## 常用指令

### 条件与循环

`v-for`指令可以绑定数组的数据来渲染一个项目列表。

### 处理用户输入

`v-on`指令添加一个事件监听器，通过它调用在Vue实例中的定义的方法。
 在Vue中操作DOM时，所有实际操作DOM都是Vue来操作，开发人员不会触碰DOM，所以开发时，只需关注逻辑层面即可。

`v-model`指令，用来实现表单输入和应用状态之间的双向绑定。他的作用是修改表单控件的value值，同时监听所在表单控件的input事件，在该指令后添加.lazy修饰符可改为监听change事件。

## Vue实例

　　当一个Vue实例被创建时，它像Vue的响应式系统加入了其data对象中所能找到的所有属性（所有可枚举属性？）。只有这些属性发生变化时，视图才会产生“响应”（视图重绘），即匹配更新为新的值。若之后再向data对象中添加的属性不是“响应式”的。

综上，只有创建Vue实例时的`data`对象中的属性才是“响应式”的，后期添加响应式属性使用` Vue.set(object, key, value)`又可写作 `vm.$set(object,key,value)`,其中vm是实例名，或在创建实例时添加一个该属性的默认值（具体见列表渲染中对象更改检测注意事项）。

那么，如何达到在创建实例之后，在未来某一时刻还会向data对象添加属性并产生视图更新的目的？解决的方法就是设置一些初始值，未来只需要修改某一初始值就可以达到响应式更新视图的目的。

注：`Object.freeze( )`（该方法表示参数对象是永不可变的，不可新增、修改、删除该对象的某一属性）会阻止修改现有的属性。也就意味着响应系统之后就无法追踪变化。
Vue实例除了数据属性之外，还暴露了一些实例属性和方法，这些属性都是以$开头，以便将用户定义的属性区分开来。

### 实例生命周期钩子

含义：给用户在实例的某个时期（比如，创建实例后，销毁实例后）运行自己代码的机会。
注：在实例声明周期钩子中，**不要用箭头函数**，因为箭头函数的this是借用外层作用域的this，箭头函数本身是没有this对象的。

## 模板语法

### 插值

#### 文本

数据绑定最常见的形式是使用`Mustache`语法（双大括号）的文本插值：
`<span>{ {msg} }</span>`
`Mustache`标签将被替换为对应数据对象（即`Vue`参数中的对象的data属性，该属性是一个对象）上`msg`属性的值。

无论何时，绑定的`msg`属性变化时，插值处的的内容都会更新。

在标签中添加`v-once`指令，就会执行一次性赋值，后续数据对象中绑定的属性更新时，插值处内容将不会更新。

#### 原始HTML

据前所述，双大括号将数据解释为普通文本，而非HTML代码。为输出真正的HTML代码，需要使用v-html指令。

#### 特性

Mustache语法不能作用在HTML特性上，遇到这种情况要（响应式赋值）使用v-bind指令：

```html
<!-- html -->
<div id="app">
  <span v-bind:id="dynamicId" >testing text</span>
  <button v-bind:disabled="isDisabled">Testing button</button>
</div>
```

```js
// JavaScript
let vm = new Vue({
   el:'#app',
   data: {
      dynamicId:'testing-id',
      isDisabled: true
   }
});
```

在布尔特性下，它们的存在即暗示为true，`v-bind`工作起来与上述不同。在示例中，当`isDisabled`为false时，将不会被包含在渲染出的`<button>`标签中。

#### 使用JavaScript表达式

对于所有的数据绑定，`Vue.js`都提供完全的JavaScript表达式的支持。
在Mustache语法中只支持表达式，不支持流控制。 　

```js

// 这是语句，不是表达式
{ { let a = 1; } }

// 流控制不会生效，请使用三元表达式代替
{ { if(true) { msg } } }

```

模板表达式都是存在于一个沙盒中，该沙盒只存在一些默认的全局变量白名单，如`Math`、`Date`。在模板表达式中无法访问用户定义的全局变量。

#### 指令

指令是带有`v-前缀`的特殊属性。指令属性的值预期是单个JavaScript表达式（`v-for`除外）。
指令的职责是当表达式的值改变时，将其产生的连带影响，响应式的作用于DOM。

#### 缩写

`v-bind`可直接省略，`v-on`可缩写为`@`　

`v-bind:id = "myId" `缩写为 `:id="myId"`　

`v-on:click = "doSomething" `缩写为` @click="doSomething"`

计算属性和侦听器
一般只在Mustache语法中写入显而易见的JavaScript表达式，否则在Mustache语法中请使用计算属性或方法。

```html
<!-- html -->
<div id="app">
  <p>{ {reverseMsg} }</p>
  <p>{ {reverseString()} }</p>
</div>
```

```js
// JavaScript
let vm = new Vue({
    el: '#app2',
    computed: {
      /**
       * 相当于某属性的getter函数，有缓存的作用，在依赖的数据值未改变的情况下，不会重新
       * 执行函数，否则执行更新
       */
      reverseMsg: function () {
        return 'computed'.split('').reverse().join('');
      }
    },
    methods: {
      // 每次调用都会重新计算函数返回值
      reverseString: function () {
        return 'methods'.split('').reverse().join('');
      }
    }
  });
```

## 计算属性和侦听器

### 计算属性

#### 计算属性vs方法

　　二者在写法上，都是存储在一个对象中，都是一个函数。

　　二者的区别在于，计算属性是**基于它们的依赖进行缓存**的，相当于某属性的getter函数（计算属性函数本身默认只包含一个get方法），**只有**在该属性所依赖的数据**值改变**时，才会重新计算，否则不计算。而对于方法，当每次重绘渲染发生时，都将**总是**再次执行函数，不论值是否改变，即**方法不依赖值的改变而执行**。

综上，**推荐使用计算属性**，若不希望调用缓存则使用方法。

### 侦听器

　　Vue 通过 watch 选项提供了一个更通用的方法，来响应数据的变化。 在大多数情况（同步执行）下，使用计算属性，在特殊情况（异步执行，如侦听`Ajex`或开销较大时需要侦听的情况）下监听则可建立一个自定义监听器。

使用场景：当需要在数据变化时执行异步或开销较大的操作时，这个方式是最有用的。

个人理解：可类比JavaScript中的事件处理程序。

## Class 和 Style 绑定

#### 对象语法（切换class）

给`v-bind:class`传入一个对象，以**动态地切换**class
`<div v-bind:class = "{ active: isActive }"></div>`
以上表示active这个class是否存在取决于isActive的布尔值。
`v-bind:class`可与普通class**共存**。

## 列表渲染

### 数组更新检测注意事项

由于 JavaScript 的限制，Vue 不能检测以下变动的数组：

1. 当你利用索引直接设置一个项时，例如：
`vm.items[indexOfItem] = newValue`

2. 当你修改数组的长度时，例如：
`vm.items.length = newLengt`
为了解决第一类问题，以下两种方式都可以实现和 `vm.items[indexOfItem] = newValue`相同的效果，同时也将触发状态更新：

```js
// Vue.set
Vue.set(example1.items, indexOfItem, newValue)
// Array.prototype.splice
example1.items.splice(indexOfItem, 1, newValue)
```

为了解决第二类问题，你可以使用 splice：
`example1.items.splice(newLength)`

### 对象更改检测注意事项

还是由于 JavaScript 的限制，Vue 不能检测对象属性的添加或删除：

```js
var vm = new Vue({
  data: {
    a: 1
  }
})
// `vm.a` 现在是响应式的

vm.b = 2
// `vm.b` 不是响应式的
```

对于已经创建的实例，Vue 不能动态添加根级别的响应式属性。但是，可以使用 `Vue.set(object, key, value)` 方法向嵌套对象添加响应式属性。例如，对于：

```js
var vm = new Vue({
  data: {
    userProfile: {
      name: 'Anika'
    }
  }
})
```

你可以添加一个新的 age 属性到嵌套的 userProfile 对象：
`Vue.set(vm.userProfile, 'age', 27)`
你还可以使用 vm.$set 实例方法，它只是全局 Vue.set 的别名：
`vm.$set(vm.userProfile, 'age', 27)`
有时你可能需要为已有对象赋予多个新属性，比如使用 `Object.assign()` 或 `_.extend()`。在这种情况下，你应该用两个对象的属性创建一个新的对象。所以，如果你想添加新的响应式属性，不要像这样：

```js
Object.assign(vm.userProfile, {
  age: 27,
  favoriteColor: 'Vue Green'
})
```

你应该这样做：

```js
vm.userProfile = Object.assign({}, vm.userProfile, {
  age: 27,
  favoriteColor: 'Vue Green'
})
```

## 事件处理

### 事件修饰符

在事件处理程序中调用 `event.preventDefault()` 或  `event.stopPropagation()`是非常常见的需求。尽管我们可以在方法中轻松实现这点，但更好的方式是：方法只有纯粹的数据逻辑，而不是去处理 DOM 事件细节。

为了解决这个问题，`Vue.js `为 ` v-on` 提供了事件修饰符。之前提过，修饰符是由点开头的指令后缀来表示的。

注：使用修饰符时，顺序很重要；相应的代码会以同样的顺序产生。因此，用`@click.prevent.self` 会阻止所有的点击，而 `@click.self.prevent` 只会阻止对元素自身的点击。

Vue 还对应 addEventListener 中的 passive 选项提供了 `.passive`修饰符。

```html

<!-- 滚动事件的默认行为 (即滚动行为) 将会立即触发 -->
<!-- 而不会等待 `onScroll` 完成  -->
<!-- 这其中包含 `event.preventDefault()` 的情况 -->
<div v-on:scroll.passive="onScroll">...</div>

```
这个 `.passive `修饰符尤其能够提升移动端的性能。
不要把` .passive `和 `.prevent` 一起使用，因为` .prevent` 将会被忽略，同时浏览器可能会向你展示一个警告。请记住，`.passive`会告诉浏览器你不想阻止事件的默认行为。

## 表单输入绑定

### 基础用法

`v-model`指令用于表单元素的上创建双向数据绑定（即用于代替原来value属性的作用，表示当前表单元素的值）。他是根据控件类型 自动选取正确的方法来更新元素。

`v-model`本质是**语法糖**，它的作用是修改表单控件的value值，同时监听所在表单控件的input事件，在该指令后添加`.lazy`修饰符可改为监听change事件。

`<input  v-bind:value="something"  v-on:input="something = $event.target.value"`
`v-model`会忽略所有表单元素的` value`、`checked`、`selected` 特性的初始值而总是将 Vue 实例的数据（`data对象`）作为数据来源。你应该通过 JavaScript 在组件的 `data`选项中声明初始值。

#### 多个复选框

本质：将多个复选框，绑定到同一数组，否则选择其中一个，就会选择所有。

将`v-model`的`data`对象属性初始化为一个数组，那么该多个复选框将是可以多选的。

注：在表单控件中，选中控件（非文字空间，如多选框、单选框）将改变Vue实例的数据对象的值（因为表单元素与Vue数据对象是双向绑定的，此行为也间接修改了v-model值），则将数据对象值修改为表单控件value的值，但修改value的值是不会改变v-model的值。因为v-model的值只取决于Vue实例的数据对象。

在表单控件中，若要绑定多个数据，那么将他们绑定至同一数组中，若绑定单个数据，则绑定至以一个字符串。

### 值绑定

含义：对于单选、复选以及选择框的选项，`v-model`绑定的值通常是静态字符串（对于复选按钮也可以是布尔值），进一步，可用`v-bind`指令将一个动态属性（该值可以不是字符串）绑定在`v-model`值上。其中，单选/复选按钮本身value值只能是布尔值，这是在Vue内部维护的。`v-model`值只是表单控件的value属性的一个体现。

```html
<!-- html -->
<div id="app5">
    <!-- 注：在复选框中值绑定，必须绑定为 true-value 和 false-value 这两个属性，否则
    值绑定失效 -->
    <input
     id="testValue"
     type="checkbox"
     v-model="toggle"
     v-bind:true-value="Yes"
     v-bind:false-value="No"
    >
    <label for="testValue">Test value</label>
    <p>You have selected { {toggle} }</p>
</div>
```

```js
// JavaScript
let vm5 = new Vue({
    el: '#app5',
    data: {
      toggle: true,
      Yes: 'Yes',
      No: "No",
    }
  });
```

　　另外，注意因为提交表单时，提交的是表单控件的value的属性值。这里的 `true-value`和 `false-value` 特性并不会影响输入控件的 value 特性，因为浏览器在提交表单时并不会包含未被选中的复选框。如果要确保表单中这两个值中的一个能够被提交，(比如`yes`或`no`)，请换用单选按钮。

在复选框中值绑定，必须绑定为`true-value`和`false-value`这两个属性(除非修改源码，否则不能自定义这两个属性名)，否则值绑定失效。在其他value为非布尔值的表单控件中，直接将特定值绑定到value属性。

### 修饰符

#### .number

　　如果想自动将用户的输入值转为数值类型，可以给` v-model `添加 `number` 修饰符：
`<input v-model.number="age" type="number">`
这通常很有用，因为即使在` type="number" `时，HTML 输入元素的值也总会返回（某个数字的字符串形式）字符串。

```js
// 当没有.number修饰符时，返回某个字符串的String类型形式
typeof vm.age === 'String'

// 有.number修饰符时，返回某个字符串的Number类型形式
typeof vm.age === 'Number'
```

注：此时的type必须是`number`。

## 组件

### 使用组件

#### 全局注册

```js
// 全局注册组件，component方法不带s
Vue.component('my-component', {
  template: '<div>A custom component!</div>'
})

// 创建根实例（应用组件的范围）
new Vue({
  el: '#example'
})
```
　　组件在注册之后，便可以作为自定义元素 `<my-component></my-component>` 在一个实例的模板中使用。注意确保在初始化根实例之前注册组件。

#### 局部注册

示例代码如下：

```html
<!-- html -->
<div id="app1">
  <my></my>
</div>
```

```js
// JavaScript
const child = {
  template: '<div>A anther component!</div>'
};

new Vue({
  el: '#app1',
  components: {
    'my': child
  },
});
```

**注：全局注册时，component属性不带s，局部注册时components属性带s。**

#### DOM模板解析注意事项

当使用 DOM 作为模板时 (例如，使用 el 选项来把 Vue 实例挂载到一个已有内容的元素上)，你会受到 HTML 本身的一些限制，因为 Vue 只有在浏览器解析、规范化模板之后才能获取其内容。尤其要注意，像` <ul>`、`<ol>`、`<table>`、`<select> `这样的元素里允许包含的元素有限制，而另一些像 `<option> `这样的元素只能出现在某些特定元素的内部。

应当注意，如果使用来自以下来源之一的字符串模板，则没有这些限制：
 - `<script type="text/x-template">`
 - JavaScript 内联模板字符串
 - vue 组件
因此，请尽可能使用字符串模板。

这样不可以

```html
<body>
  <div id="app">
    <select>
         <optioncomp></optioncomp>
    </select>
  </div>
  <script src="lib/vue.js"></script>
  <script>
    new Vue({
      el: '#app',
        components:{
         'optioncomp':{
            template: '<option>a</option>'
          }
        }
    })
   </script>
</body>
```

但是用is特殊属性可以：

```html
<body>
  <div id="app">
      <select>
          <option is="optioncomp"></option>
      </select>
  </div>
  <script src="lib/vue.js"></script>
  <script>
    new Vue({
      el: '#app',
      components:{
        'optioncomp':{
          template: '<option>a</option>'
        }
      }
    })
  </script>
</body>
```

或者temp模板标签也可以

```html
<body>
  <div id="app">
    <select>
      <option is="optioncomp"></option>
    </select>
    <!--模板内容存放区域-->
    <script type="x-template" id="optioncompTemp">
      <option >a</option>
    </script>
  </div>
  <script src="lib/vue.js"></script>
  <script>
    new Vue({
      el: '#app',
        components:{
          'optioncomp':{
            template: '#optioncompTemp'
          }
        }
    })
  </script>
</body>
```

或者内联模板字符串

```html
<body>
  <div id="app">
    <selectcomp></selectcomp>
  </div>
  <script src="lib/vue.js"></script>
  <script>
    Vue.component('optioncomp',{
      template: '<option >a</option>'
    });
    new Vue({
      el: '#app',
      components:{
        'selectcomp':{
          template: `<select><optioncomp></optioncomp></select>`
        }
      }
    })
    </script>
</body>
```

类型为单页应用的组件文件xxx.vue的情况暂略。

#### 组件中的data对象必须是函数

原因：首先明白，只有在创建Vue实例时，才会创建对data对象的引用。
　　若是data对象不是函数，那么在多处使用该组件（创建Vue实例）时，将造成多处的组件使用的是**同一**data对象。若是data是函数，那么在多处使用该组件时，在创建Vue实例时执行data函数，此时才会真正的创建仅仅属于每个组件自己的data对象，那么此时多处的组件都有自己的data对象（即每使用一次该组件都会重新创建一个新的data对象），这些data对象是相互独立，互不影响的，达到解耦。

```js
// 在局部组件中添加data对象
const child = {
  template: `<div>{ {fn} }</div>`,
  data: function() {
    return {
      fn: '这里是局部组件的data对象'
    };
  }
};

new Vue({
  el: '#app1',
  components: {
    'my': child
  },
});

// 在全局组件中添加data对象
Vue.component('global', {
  template: '<button @click="counter += 1">{ {counter} }</button>',
  data: function() {
    return {
      counter: 0
    };
  }
});

new Vue({
  el: '#app2'
});
```

在全局或者局部组件中，data 函数必须和 template 属性在同一对象中。

#### camelCase vs. kebab-case

HTML 特性是不区分大小写的。所以，当使用的不是字符串模板时，camelCase (驼峰式命名) 的 prop 需要转换为相对应的 kebab-case (短横线分隔式命名)：
```js
Vue.component('child', {
  // 在 JavaScript 中使用 camelCase
  props: ['myMessage'],
  template: '{ { myMessage } }'
})


```
如果你使用字符串模板，则没有这些限制。

### prop

静态prop作用是传递引用数据，父子组件将同步变化，**侧重点是同步变化**

应用场景：

　　当父组件中的某一属性的属性值需要传递至子组件（组件模板）中Mustache值（即建立一个子组件与父组件的引用时，或称指针）时，需要通过组件的props数组接口传递该值。

　　若不使用props数组接口，则将父组件的属性的属性值称为非prop特性，他们将以非prop特性传递到子组件（组件模板），成为子组件模板中的标签的属性。

> 当父组件中 props 某一项更新时，更新后的新值将自动传入子组件

#### 动态 prop

动态prop作用是动态修改prop，与静态prop不同的是，动态prop的侧重点是**动态修改prop**

```html
<!-- html -->
<div id="app4">
  <input type="text" v-model="parentMsg">
  <br>
  <child :my-msg="parentMsg"></child>
</div>
```

```js
// JavaScript
let vm4 = new Vue({
    el:'#app4',
    data:{
      parentMsg:''
    },
    components:{

      'child':{
        props:['myMsg'],
        template: `{ {myMsg} }`,
      }

    },
  });
```

数据传输如下：

>v-model <=>(此处双向绑定) data数据对象中的parentMsg => v-bind:my-msg读取data数据中的parentMsg => 得到my-msg的属性值 => 传递给组件中prop属性 => templata中的Mustache语法（双大括号插值）真正调用prop接口的值。

其中v-model的属性值与input输入框双向绑定。

借鉴上面的示例，我们可以将**父组件的方法**经 Vue 实例中的 prop 传递给子组件。
```html
<!-- parent.vue -->
<div id="app">
  <custom :methods="myMethods"></custom>
</div>
```
```js
// child.vue
export default {
  // 此处传递 methods 的值是一个对象（函数 myMethods），而不是固定思维中的基本类型值
  props: ['methods']
  // ...
}
```

#### 区分父组件与子组件

**说法一：**
       由Vue.js官方文档（[组件——自定义事件][1]），其中第一句是“我们知道，父组件使用 prop 传递数据给子组件。”，这句话个人理解为父组件数据通过Vue实例的参数对象的prop特性数组将数据传递给子组件。而因为在Vue实例中，自定义标签根据Vue实例的prop属性接口提供数据给组件模板，以此推断，父组件指的是自定义标签，子组件指的是Vue实例中的模板（或者说是Vue实例渲染出的标签，即组件对象中的template属性值）。　

**说法二：**
       由官方文档（[组件——组件组合][2]），其中第一段，尤其是`常见的父子组件关系是组件A在他的模板中使用了组件B`，那么我们可推断当存在一种包含关系时，某一组件A的模板中包含组件B，那么我们称组件A数组件B的父组件，B是A的子组件。

**总结：**
       据官方文档（[组件——编译作用域][3]）如下：
在深入内容分发 API 之前，我们先明确内容在哪个作用域里编译。假定模板为：

```html
<child-component>
  { { message } }
</child-component>
```
　　message 应该绑定到父组件的数据，还是绑定到子组件的数据？答案是父组件。组件作用域简单地说是：
父组件模板的内容在父组件作用域内编译；子组件模板的内容在子组件作用域内编译。
　　我们应该将对父组件与子组件的定义的想法更加拓宽一点，父子组件应该是一个相对概念。说法一和说法二都是正确的。个人觉得，对于父子组件的定义应该为，子组件一定由父组件产生，子组件只能存在父组件中。如上例，`<child-component>`的父组件为Vue实例挂载的元素（即`new Vue( )`中的参数对象中的`el属性值`），`<child-component>`是Vue实例挂载元素的子组件。而在组件定义中 ，`<child-component>`是组件模板（组件定义中的`template`属性）的父组件，组件模板为`<child-component>`的子组件。所以我们对于父子组件的定义不应该过于狭隘，父子组件应该是一个相对的概念。参照系不同，那么对于同一个组件到底是父组件还是子组件是不同的。

#### 单向数据流

　　Prop 是单向绑定的：当父组件的属性变化时，将传导给子组件，但是反过来不会（反过来是通过事件传递数据，详见自定义事件）。这是为了防止子组件无意间修改了父组件的状态，来避免应用的数据流变得难以理解。
　　另外，每次父组件更新时，子组件的所有 prop 都会更新为最新值（因为二者之间通过`props数组`，二者之间存在数据引用）。这意味着你不应该在子组件内部改变 prop。如果你这么做了，Vue 会在控制台给出警告。
在两种情况下，我们很容易忍不住想去修改 prop 中数据：
1. Prop 作为初始值传入后，子组件想把它当作局部数据来用；
2. Prop 作为原始数据传入，由子组件处理成其它数据输出。

对这两种情况，正确的应对方式是：
1. 定义一个局部变量，并用 prop 的值初始化它：

```js
props: ['initialCounter'],
data: function () {
  return { counter: this.initialCounter }
}
```

2. 定义一个计算属性，处理 prop 的值并返回：

```js
props: ['size'],
computed: {
  normalizedSize: function () {
    return this.size.trim().toLowerCase()
  }
}
```

注意在 JavaScript 中对象和数组是引用类型，指向同一个内存空间，如果 `props`是一个对象或数组，在子组件内部改变它会影响父组件的状态。

### 非prop特性

**非prop特性作用是传递静态值，如父组件（自定义标签）的属性**

含义：

　　自定义标签中的属性（非Mustache值，即非双括号值，若需要建立父组件（自定义标签）与子组件（组件模板）之间的数据引用（或理解为指向子组件Mustache值的指针），则需要通过prop特性传递）指可以直接传入组件，而不需要定义相应的`props`。在形如`<mine data-line="red" style="color:red;"></mine>`的自定义标签中，当此时的Vue实例中的`props`属性没有定义名为`data-line`、`style`的接口时，那么我们称`data-line`、`style`属性为**非prop特性**。若在`props`中有调用，则是**props特性**。总而言之，以`props属性`中有没有出现属性A的名字来判断一个属性A是否是非prop特性。

**应用场景：**要建立父子组件的数据引用（同步变化）时，通过`props数组`将父组件数据传递至子组件。要将父组件的属性，直接传递给子组件时，直接通过非prop特性传递。
父组件向子组件传递数据是单向传递。子组件向父组件传递数据是通过事件传递（详见下文自定义事件）。

应用：替换/合并现有的特性

若存在组件模板（子组件）：

`<p style="background: #fff;">There is nothing</p>`

自定义标签（父组件）为：

`<mine data-line="red" style="color:red;"></mine>`

　　在组件模板和自定义标签中存在同名特性时，除class和style特性在传递给组件模板的值会合并同名特性的特性值外，其他同名特性均会将传递的自定义标签的特性值覆盖组件模板中的同名特性值，使得组件被破坏。

示例如下：

```html
<!-- html -->
<div id="app6">
  <mine data-line="red" style="color:red;"></mine>
</div>
```

```js
// JavaScript
let vm6 = new Vue({
    el:'#app6',
    components:{
      "mine":{
        template:`<p data-line="blue" style="background: #fff;">Nothing here</p>`,
      }
    }
});
```

渲染结果为：

红色的 `Nothing here`

由上可知，模板中的 data-line 特性值被覆盖，style 特性的值与自定义标签中的同名特性合并。

### 自定义事件

应用场景：使用Vue的自定义事件可以达到子组件与父组件通信的目的。（父组件与子组件通过Vue实例中prop特性将数据传递给子组件）。

```html
<!-- html -->
<div id="app7">
    <p>{ {total} }</p>
    <counter @increment="incrementTotal"></counter>
    <counter @increment="incrementTotal"></counter>
    <counter @increment="incrementTotal"></counter>
    <counter @increment="incrementTotal"></counter>
</div>
```

```js
// JavaScript
let vm7 = new Vue({
    el:'#app7',
    data:{
      total:0
    },
    components:{
      'counter':{
        template:`<button @click="incrementCounter">{ {counter} }</button>`,
        data: function() {
          return {
            counter: 0,
          };
        },
        methods: {
          // 子组件计数
          incrementCounter:function () {
            this.counter += 1;
            // 触发父组件事件
            this.$emit('increment');  // 此处子组件与父组件（外部）完全解耦
          },
        },
      }
    },
    methods:{
      incrementTotal:function() {
        this.total += 1;
      }
    },
  });
```

数据传递如下：
>点击`<button>` => 执行incrementCounter函数 => this.counter += 1;this.$emit('increment') => 『子组件中的数据传递结束，子组件通过$emit方法触发事件向父组件传递数据，给父组件一个信息，让父组件开始在父组件内部传递数据』 =>`<counter> ` => 执行incrementTotal函数 => this.total += 1;

#### Prop 验证

我们可以为组件的 prop 指定验证规则。如果传入的数据不符合要求，Vue 会发出警告。这对于开发给他人使用的组件非常有用。
要指定验证规则，需要用对象的形式来定义 prop，而不能用字符串数组：

```js
Vue.component('example', {
  props: {
    // 基础类型检测 (`null` 指允许任何类型)
    propA: Number,
    // 可能是多种类型
    propB: [String, Number],
    // 必传且是字符串
    propC: {
      type: String,
      required: true
    },
    // 数值且有默认值
    propD: {
      type: Number,
      default: 100
    },
    // 数组/对象的默认值应当由一个工厂函数返回
    propE: {
      type: Object,
      default: function () {
        return { message: 'hello' }
      }
    },
    // 自定义验证函数
    propF: {
      validator: function (value) {
        return value > 10
      }
    }
  }
})
```

type 可以是下面原生构造器：
* String
* Number
* Boolean
* Function
* Object
* Array
* Symbol

type 也可以是一个自定义构造器函数，使用 instanceof 检测。
当 prop 验证失败，Vue 会抛出警告 (如果使用的是开发版本)。注意 prop 会在组件实例创建之前进行校验，所以在 default 或 validator 函数里，诸如 data、computed 或 methods 等实例属性还无法使用。

#### 自定义组件的 v-model

（2.2.0 新增 ）
默认情况下，一个组件的` v-model `会使用 `value prop` 和 input 事件。但是诸如单选框、复选框之类的输入类型可能把 value 用作了别的目的。model 选项可以避免这样的冲突：

```js
Vue.component('my-checkbox', {
  //以下model选项作用是自定义v-model属性
  model: {
    prop: 'checked',
    event: 'change'
  },
// 以下当props值为一个对象时，是为了指定验证规则
// 以下props对象表示checked值为布尔值，value值为字符串
  props: {
    checked: Boolean,
    // 这样就允许拿 `value` 这个 prop 做其它事了
    value: String
  },
  // ...
})
```

### 使用插槽分发内容（slot/作用域插槽）

#### 简介

有如下示例：

```html
<app>
  <app-header></app-header>
  <appfooter></appfooter>
</app>
```

我们在使用如上例的组件时，传递给app的内容是由`<app>`的父组件决定的。

以下列举其几种应用场景：

1. 在一些开发过程中，我们可能会需要弹出通知（通知组件），那么这些通知又可分为警告通知、普通通知、错误通知等等类型（不同的通知类型可理解为通知组件的子组件），但是他们都是属于通知类型的（是各种通知类型的父组件）的。

2.下拉菜单中按钮上的显示切换的应用（待补充）

综上，可将`slot插槽`的作用总结为以下：

　　为了组合这些子组件，我们可以使用特殊的`<slot>`元素作为特殊的原始内容的分发接口。父组件集中接收了所有子组件可能需要的内容。通过识别子组件`<slot>`的name属性来决定传递给对应子组件的内容。以上过程解释了如何通过`<slot>`方式向子组件分发内容。此过程常称为**内容分发**。

　　以上的中心思想是，增强组件的**复用性**。相对于prop特性，slot插槽的组件是侧重**不需要引用数据**的更新的，但是需要多处使用**相同结构组件**时，就可使用slot插槽。

#### 编译作用域

>遵循原则：父组件模板的内容在父组件作用域内编译；子组件模板的内容在子组件作用域内编译。

#### 具名插槽

示例代码如下：

```html
<div id="app9">
  <app-layout>
    <!-- slot属性对应子组件模板中的同名slot元素 -->
    <!-- 父组件内容在父组件作用域内编辑 -->
    <h1 slot="header">这里可能是一个页面的标题</h1>
    <p>主要内容的一个段落</p>
    <p>另一个主要段落</p>
    <!-- 若子组件中不包含slot接口，那么父组件中的slot属性的标签将被丢弃 -->
    <p slot="footer">这里有一些联系信息</p>
  </app-layout>
</div>
```

```html
let vm9 = new Vue({
  el:'#app9',
  components:{
    'app-layout':{
      template:`
      <div class="container">
        <header>
        <!-- 子模板中的slot元素与父组件中的同名slot属性对应 -->
          <slot name="header"></slot>
        </header>
        <main>
        <!-- 父组件中没有slot属性的元素将匹配以下子组件中的匿名插槽 -->
          <slot></slot>
        </main>
        <footer>
          <slot name="footer"></slot>
        </footer>
      </div>
      `,
    }
  },
});
```

渲染结果为：

```html
<div id="app">
  <div class="container">
    <header>
      <h1>这里可能是一个页面的标题</h1>  <!-- 与 slot="header" 对应-->
    </header>
    <main>
      <p>主要内容的一个段落</p>    <!-- 与没有 slot 属性的内容对应-->
      <p>另一个主要段落</p>
    </main>
    <footer>
      <p>这里有一些联系信息</p>   <!-- 与 slot="footer" 对应-->
    </footer>
  </div>
</div>
```

>依据以上示例，可总结为，在设计组合使用的子组件时，依据父组件（自定义标签）中的slot属性与子组件（组件模板）模板中slot标签的对应关系来设计不同的复用子组件的显示（渲染）。

slot插槽的侧重点在**设计子组件如何复用**

#### 作用域插槽

（2.1.0以上版本）

>作用：作用域插槽仅仅是依靠prop对象（**数据作为prop对象的属性传递给父组件**）给子组件**提供**一个向父组件传递数据的**机会**。普通prop属性本身只是父组件向子组件的通道，并不接受子组件向父组件传递数据。

示例代码如下：

```html
<div id="app10">
  <child>
    <!-- 拥有slot-scape属性的template标签表示是作用域插槽的模板 -->
    <!-- slot-scape属性的值作为一个变量固定接收子组件传递过来的props属性值。 -->
    <template slot-scope="props">
      <span>hello from parent</span>
      <span>{{ props.text }}</span>
    </template>
  </child>
</div>
```

```js
let vm10 = new Vue({
  el:'#app10',
  components:{
    'child':{
      props:['props'] // 此处可省略，作用域插槽的模板会固定接收props属性值(prop对象)
      template:`
      <div class="child">
      <!-- 子组件中slot作用域插槽与父组件slot-scope属性绑定，向父组件传递数据 -->
        <slot text="hello from child"></slot>
      </div>
      `,
    },
  },
});
```

>由示例可知，子组件经由prop对象“插到”父组件上，故称**此时**的prop为作用域插槽。

**与prop特性（props属性）、非prop特性（仅仅比较数据传递方向）、slot插槽的异同**

不同：传递数据的方向不同

　　由示例可知，与prop特性、非prop特性和slot插槽（**父组件向子组件传递数据**）不同的是，作用域插槽提供了一种**由子组件向父组件传递数据**的可能，即由子组件开始渲染DOM的可能。

　　作用域插槽与普通slot插槽不同之处在于，作用域插槽**并不管**经过prop对象**传递给父组件的是什么内容**，以及父组件要如何分发内容。这是普通slot插槽的事情。作用域插槽仅仅是提供给子组件一个经prop对象向父组件传递数据的机会。其中，子组件数据**以prop对象的属性**传递到父组件中。因为prop对象本身只允许父组件向子组件传递数据。

相同：均为父组件属性与子组件插槽绑定

　　作用域插槽**本质**上可看作是与普通slot插槽传递数据方向相反的**slot具名插槽**，在父组件中，slot-scope属性将父组件与子组件的slot标签绑定。这一绑定数据传递的方式与父组件（自定义标签）中普通slot属性与子组件（组件模板）的同名slot具名（有name属性的slot标签）（或匿名）插槽绑定的方式是一致的。

>在 2.5.0+，slot-scope 能被用在任意元素或组件中而不再局限于 template 标签。

一个简单应用，将slot插槽与作用域插槽结合起来：自定义如何渲染列表的每一项：

```html
<div id="app11">
  <my-list :item="items">
    <li slot="item" slot-scope="props" class="my-fancy-item">{{props.text}}</li>
  </my-list>
</div>
```

```js
let vm11 = new Vue({
  el:'#app11',
  data:{
    // 父组件中自定义标签的items属性值，与插槽无关
    items:'parent-list-items'
  },
  components:{
    'my-list':{
      template:`
      <ul>
        <slot name="item"
        v-for="item in items"
        :text="item.text">
        如果你看到这句话说明子组件中的slot插槽(name属性值)与父组件的slot属性(值)不能对
        应，父组件接受到此数据（提示）无法对应分发，故没有li标签生成，但此提示仍然以文
        本形式迭代输出。
        </slot>
      </ul>
      `,

      data: function() {
        return {
          // 此items是子组件中的items循环数据对象
          items:[
            {text:11},
            {text:22},
          ]
        };
      },

    },
  },
});
```

在示例中的子组件，各属性的作用如下：

1. name属性：将子组件中的slot标签中的name属性与父组件中的slot属性值匹配，形成一一对应的数据传递关系（也是迭代产出新标签的**关键**）。依据上一节，将父组件接受的内容（**由作用域插槽传递而来**）依据name属性（内容分发的凭证）分发到各个子组件。
1. v-for属性：迭代子组件的数据对象。
1. :text="item.text"：接受v-for迭代产出的值，text属性经prop对象传递给父组件。
1. 父组件中，slot-scope属性：仅仅用于给子组件**提供**一个向父组件传输数据的通道。 它并不管传递的是什么内容，以及父组件将如何分发内容。

　　由此示例可知，slot插槽和作用域插槽的不同之处在于，slot插槽提供内容分发凭证（即子组件中slot标签的name属性）将父组件接收的内容分发给各个子组件。作用域插槽是仅仅给子组件一个经由prop属性向父组件传递数据的机会。作用域插槽**并不管**经过prop对象**传递给父组件的是什么内容**，以及父组件要如何分发内容。***这是slot插槽的事情***。

### 动态组件

使用保留的`<component>`元素，并对其`is`属性进行动态绑定，切换`is`属性的值可在同一个挂载点动态切换多个组件。

#### keep-alive

在父组件外包围`<keep-alive>`可将被切换的组件保留在内存中，以避免被替换的组件在切换回来的时候重新渲染，达到缓存组件的目的。

### 杂项

#### 编写可复用的组件

Vue 组件的 API 来自三部分 —— prop、事件、slot插槽：

- **prop** 提供父组件向子组件传递数据的传输通道，数据是作为props数组的项来传递
- **事件** 允许子组件向父组件传递数据，侧重于子组件的事件侦听器中通过`this.$emit('某一父组件事件')`方法来触发某一父组件的事件侦听器，从而执行父组件的某一任务。
- **slot插槽** slot插槽用于将父组件收到的数据内容依据内容分发凭证（子组件中`slot`标签的name属性）分发给各个子组件。

#### 子组件引用（ref属性）

使用[ref属性][4]作为子组件指定的一个引用id，这样就可在JavaScript中直接访问子组件。

>因为`$refs`是非响应式，故应该避免在模板或计算属性中使用`$refs`。

#### 组件命名约定

注册组件时，可使用kebab-case、camelCase、PascalCase

在HTML模板中，始终使用kebab-case。

#### 内联模板

若子组件有inline-template属性，那么组件将它本身的内容（子节点）代替组件模板渲染出来，而不是把它当作分发内容。

```html
<app inline-template>
  <p>From custom element</p>
</app>
```

```js
new Vue({
  el:'app',
  components: {
    'app': {
      /**
       * 1.因为是组件模板向HTML文档渲染，故此时的子组件为自定义标签
       * 2.因为子组件（自定义标签）中存在inline-template属性，以下组件模板将被子组件自
       * 身的内容代替
       */
      template:`<div>There are something good</div>`
    }
  }
});
```

渲染结果为：

`From custom element`

**作用：**即有了inline-template属性，我们可以决定是渲染自定义标签中的内容还是渲染组件模板中的内容。

>在项目中，inline-template属性可能使模板的作用域难以理解。**最佳实践**为使用组件模板的template选项或在`.vue`文件中使用`template`元素。

#### X-Template

除组件模板、内联模板外，第三种定义模本的方式是在JavaScript标签中使用`text/x-template`类型。并指定一个id属性。

```html
<script type="text/x-template" id="hello-world-template">
  <p>Hello hello hello</p>
</script>
```

```js
Vue.component('hello-world', {
  template: '#hello-world-template'  // 此处引用了定义的模板
})
```

>此法将组件模板与定义分离，不便于管理。故一般情况下应避免使用。

#### 对敌开销的静态组件使用 v-once

当组件包含大量**静态**内容时，可使用 [v-once][5] 可缓存渲染结果。

  [1]: https://cn.vuejs.org/v2/guide/components.html#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%BA%8B%E4%BB%B6
  [2]: https://cn.vuejs.org/v2/guide/components.html#%E7%BB%84%E4%BB%B6%E7%BB%84%E5%90%88
  [3]: https://cn.vuejs.org/v2/guide/components.html#%E7%BC%96%E8%AF%91%E4%BD%9C%E7%94%A8%E5%9F%9F
  [4]: https://cn.vuejs.org/v2/guide/components.html#%E5%AD%90%E7%BB%84%E4%BB%B6%E5%BC%95%E7%94%A8
  [5]: https://cn.vuejs.org/v2/api/#v-once
