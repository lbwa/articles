---
title:      "理解 this 的指向"
date:       2018-02-06
author:     "Bowen"
tags:
    - 前端开发
    - JavaScript
---

> The abstract operation ResolveThisBinding determines the binding of the keyword this using the LexicalEnvironment of the running execution context.

JS 中的 `ResolveThisBinding` 操作将会绑定 [this][keyword] 关键字为当前执行上下文的词法作用环境。

[keyword]:https://www.ecma-international.org/ecma-262/#sec-resolvethisbinding

# 一、ES5中this的值

## 1.1 定义：this，指函数的调用上下文。

在函数没有被调用的时候是无法确定函数中的this值的指向，只有当函数调用时才能确定函数中this值的指向。

当函数被调用时，理解this值的指向有以下四种情况（函数中存在this）：

**情况一**：函数没有被上一级对象调用时，那么他函数体内的this值指向window。

**注**：在严格模式中默认的this值不是window，而是undefined。

```js
let num = () => {
   a = 10;
   console.log(this);
};
num();     // window
```

在上面的函数中，定义了一个函数num，在调用函数时，实际上是调用的window的属性num。

**情况二**：函数被上一级（一个）对象调用时，那么该this值指向的是调用的对象，即指向上一级对象。

```js
let num = {
  a: 10,
  fn: function() {
    console.log(this);
  }
};
num.fn();    // num
```

在上面的代码中，fn只被对象num包围，在调用fn时，this指向调用fn的上一级对象，也就是对象num。

**情况三**：函数外有多个对象包围时，尽管函数是被最外层的对象调用，那么函数中的this值只指向上一级对象。

```js
let num = {
  a: 10,
  b: {
    fn: function() {
      console.log(this);
    }
  }
};
num.b.fn();  // 对象b
```

　　由上可知，函数fn被对象b包围，而b又是对象num的属性之一，尽管是最外层对象num调用了函数fn（执行了这个调用行为的开端），而函数fn中的this值只会指向离他最近的上一级对象，也就是对象b。

**情况四：先赋值，后执行**

```js
let num = {
  a: 10,
  b: {
    fn: function() {
      console.log(this);
    }
  }
};
let digit = num.b.fn
digit() // window   与情况三的差别在于，先赋值，后调用
```

　　this值始终指向最后调用它的对象，且只在调用函数时才能确定this的指向。这里首先是把num.b.fn函数赋值给digit，虽然fn是被对象b所引用，但并没有直接执行函数，而执行digit时才确定了this的指向，window调用了digit，所以指向window。

```js
var length = 10;
function fn() {
  console.log(this.length)
}
var obj = {
  length: 5,
  method: function (fn) {
    fn() // 10
    arguments[0]() // 2
    fn.call(obj, 12) // 5
  }
};
obj.method(fn, 1);
```

　　在上面的示例中，`obj.method(fn, 1);`执行的本质是`fn();` `arguments[0]();` `fn.call(obj, 12);`这三句。先理解三个语句，因为单线程的缘故，所以是在method中给栈添加任务执行三个函数，此时，method任务执行完成，下一个任务执行调用fn，此时，没有显示的指定的对象调用fn，故fn中的this指向window，所以结果为10。下个任务`arguments[0]()`; 表示调用method的参数对象arguments的第一项并执行，此时，arguments对象（只是类数组，并非Array实例）开始调用它的第一项，即fn，此时，fn有显示的调用对象，即arguments对象，此时，fn中的this指向arguments对象，因为arguments对象有两项，故返回2。第三句，显示的指明this指向obj对象，故返回obj.length，即5。

**结论：**

1. （个人理解）在函数a内执行函数b时，确切来说**真正调用执行b的还是window对象**，此时函数b内的this是指向window对象，函数a的作用是**告知引擎添加一个执行b的任务**。

2. 当函数c是arguments对像的第 i 项时，`arguments[i]()`中的this指向的是arguments对象。

**补充：**

　　在`《JavaScript语言精粹》修订版`P28中，对于没有显式的调用对象的函数调用，该被调用的函数内的this指向全局对象。作者认为这是JavaScript设计上的一个“错误”。

　　作者认为此时的函数调用中的this应该指向外部函数的this变量。其中当函数A内调用函数B时，首先执行函数A的语句，当执行到调用函数B语句时，暂停函数A内的语句执行，将控制权转交给函数B，先执行完函数B，然后再继续执行函数A（`《JavaScript语言精粹》修订版`P27）。

**构造函数中的this**

```js
function Fn(){
    this.user = "Jack";
}
var a = new Fn();
console.log(a.user); // Jack
```

　　根据官方文档[new运算符](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new)中Description第2点的解释，使用new运算符调用构造函数时，构造函数中的this会指向实例化的对象。

实践也可证明：

```js
function Foo() {
  this.name =  'Jack';
  console.log(this);
}
new Foo(); // Foo {name:'Jack'}
```

　　此时控制台返回对象Foo {name:'Jack'} 2次，一个是 console.log(this); 的返回值，一个是实例化的返回值，即 this 在实例化时指向了实例化的对象（或者理解为new运算符将构造函数中的this值绑定到实例化对象上）。

**结论**：函数体中的this始终指向最后调用它的那个对象。在构造函数中，this指向实例化的对象。

## 1.2 实例化时，构造函数的this是如何绑定到实例化对象的呢？

- 据`《JavaScript高级程序设计》第三版`P145，解释如下：

创建新实例时，必须使用new运算符，创建会经历以下四个阶段：

1. 创建一个新对象；

2. 将构造函数和的作用域赋给新对象（因为这个新对象调用了构造函数，所以this就指向了这个新对象）；

3. 执行构造函数中的代码（目的是为了给这个新对象添加属性）；

4. 返回新对象。


- 据`《JavaScript语言精粹》修订版`P47，使用new操作符去调用一个函数时，函数的执行方式将被修改，可将new操作符理解为一个方法，则有:

Note:

1. 下文Function.method(name,fn)表示给Function函数添加一个new的方法（method为书中自定义函数，并非JavaScript原生函数，表示给调用的对象添加一个名为name的方法（fn））

2. 代码中的注释讨论的this是构造函数调用new这个方法时的this。　

代码如下：

```js
Function.method('new', function() {
  // 创建一个新对象（对象that）， that和构造函数共用同一个对象
  // this 指向（与new连用的）构造函数，Object.create()创建一个以参数为原型对象的对象
  var that = Object.create(this.prototype);

  // 调用构造器函数，绑定 -this- 到新对象（指that）上
  // 此处存在apply方法，this 指向（与new连用的）构造函数，则以下语句表示，that调用以
  // arguments对象为参数对象的构造函数（指定构造函数中的this值为that），目的是给that
  // 添加属性（或方法）
  // 此处根据构造函数的函数体，函数体内可能有（或没有）return语句，则other可能是对象、
  // 基本类型值、undefined、null
  var other = this.apply(that, arguments);

  // 如果它返回的不一个对象，就返回该(that)新对象，即优先返回构造函数中return语句返回
  // 的对象，若return返回的不是对象，则忽视return返回值
  return (typeof other === 'object' && other) || that;    // 1.3解释
})
```

在以上代码中，that是一个中间对象，that的作用是执行Function构造函数，并将指向构造函数原型的指针复制给other（实例化对象）。

回到之前的代码：
　
```js
function Fn(){
    this.user = "Jack";
}
var a = new Fn();
console.log(a.user); // Jack

```

由两本文献可知，实例化过程中，经历了以下过程：

（由`var a = new Fn();`可知变量a复制了指向Fn()实例对象的指针，以下就以变量a指代Fn的实例。）

1. 创建了一个新对象a（指向构建函数的原型对象），此时对象为空；

2. 复制构造函数的作用域给新对象a；

3. 然后执行构造函数，这是为了给新对象添加属性（因为在构造函数Fn中直接将属性赋给了this对象），那么是如何添加的呢？此时因为是新对象a调用了构造函数，所以构造函数内的this指向了新对象a，此时新对象a就获得了Fn的属性user；

4. 返回新对象a。

以上过程展示了在构造函数实例化的过程中，this的值是如何绑定在实例化的对象上的。

## 1.3 在有return语句中的函数中this的值

(据1.2创建实例经历的四个阶段，可得当存在变量a等于{ user:"Jack"}时，可认为构造函数的this指向构造函数的实例。)

当函数的return语句返回一个对象时：　

```js
function Fn(){
    this.user = "Jack";
    return {};
}
var a = new Fn(); // 返回的不是Fn的实例
console.log(a.user); // undedined
console.log(a); // {} 此时a并没有继承Fn的user属性，可见Fn函数内this并未指向a
```

当函数的return语句返回一个基本类型值时

```js
function Fn(){
    this.user = "Jack";
    return 1;
}
var a = new Fn();
console.log(a.user); // "Jack"
console.log(a); // {user: "Jack"} 此时a继承Fn的user属性，可见Fn函数内this指向a
```

当函数的return语句返回null时

```js
function Fn(){
    this.user = "Jack";
    return null; // null是特殊对象值，但此时this仍指向构造函数实例a
}
var a = new Fn();
console.log(a.user); // "Jack"
console.log(a); //  {user: "Jack"} 此时a继承Fn的user属性，可见Fn函数内this指向a
```

**结论**：构造函数本身也是函数，所以可以设置return语句的返回值，那么当函数的return语句返回一个对象时，this会指向这个return语句返回的对象，不会指向函数的实例。当return语句返回一个基本类型值（或null）时，会忽略这个基本类型值，指向函数的实例。

# 二、箭头函数（ES6）中的this值

箭头函数可以让this绑定定义时所在的作用域，而不是指向运行时所在的作用域。

```js
function foo() {
  setTimeout(() => {
    console.log('id:', this.id);
  }, 100);}

var id = 21;

foo.call({ id: 42 }); // id: 42
```

　　在以上示例中，setTimeout参数中是一个箭头函数，定义生效时就是函数生成时，而真正的执行在100毫秒（因为JavaScript是单线程，所以在执行完foo后，由全局对象调用执行setTimeout参数中的函数）之后。若是普通函数的话，因为是全局对象调用，所以此时的this值指向window，foo.call({ id: 42 }); 返回21。在示例中，因为是箭头函数，所以this值在定义时就已经确定，总是指向定义生效时所在的对象，这里是{id:42}，所以返回 42。

**推广：箭头函数可以让this指向固定化，这种特性很有利于封装回调函数**。

一次在实践单例的过程中遇到的问题：

简化代码如下：

```js
let foo = () => {
      let a = 111;
      return {
        a: a,
        fn: () => {
          console.log(this); // window对象
          // 在某个环境中读取或写入而引用一个标识符时，必须通过搜索来确定该标识符实际代
          // 表是什么。若找到，搜索停止。若没有，则该变量未声明
          // fn中对变量a的赋值本质是，向上在作用域链中搜索，找到位于foo中的变量a，并在
          // fn中对foo的变量a进行赋值
          a = 222;
        },
        num: () => {
          console.log(this); // foo对象
          console.log(a); // 222
        }
      };
    };
let ins = foo();
ins.fn();
ins.num();
```

在以上箭头函数fn中，this指向函数定义时的外部环境。

实际上在箭头函数中，自身并没有this对象，它所使用的this是外层代码块的this。实际上箭头函数可以起到绑定this值的作用。　　

**推广：在箭头函数中，不存在真正属于他自己的this、arguments对象，因为不存在自己的this，所以不能使用call()、apply()、bind()方法修改箭头函数中的this值。**

若要让num方法中的this指向foo，就使用原有的function声明代替箭头函数。这样在调用num方法时，最后调用该方法的对象是foo，所以此时的num方法中的this指向foo。

```js
let foo = () => {
      let a = 111;
      return {
        a: a,
        fn: () => {
          console.log(this); // window对象
          a = 222;
        },
        num: function() {
          console.log(this); // foo对象
          console.log(a); // 222
        }
      };
    };
let ins = foo();
ins.fn();
ins.num();
```

　　另外，**要将作用域中的变量和对象的属性和区分开，作用域只与函数定义时的位置有关，与运行过程无关**。在num方法中要输出变量a，则先在当前num方法中寻找变量a，若没有找到则沿着作用域链向上搜索变量a，则在foo的活动对象中找到变量a，然后返回输出变量a。要注意的一个细节是，a:111是foo的属性，不是变量，不要弄混淆了。
