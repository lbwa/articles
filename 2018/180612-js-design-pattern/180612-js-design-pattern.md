---
title:      "JS 设计模式"
date:       2018-06-12
author:     "Bowen"
tags:
    - 前端开发
    - 设计模式
---

本文是 《[Learning JavaScript Design Patterns][Learning JavaScript Design Patterns]》的读书笔记。该书的作者是谷歌工程师的 `Addy Osmani`。撰写本文的目的就是为了学习参考前辈的编程开发思维，并结合自己的理解来加强自己的知识体系。另外，这本书中提到的 `GoF book` 即 `Gang Of Four book` 指的是 `Design Patterns` 这本书。该书列举了编程领域常见的 23 种编程模式和相应的设计原则。

[Learning JavaScript Design Patterns]:https://addyosmani.com/resources/essentialjsdesignpatterns/book/

|创造性设计模式| 描述 |
|---|---|
|factory method|可根据不同的参数数据或参数事件对象而实例化生成不同的实例。|
|prototype|一个包含类的所有实例共享的属性和方法的对象。|
|builder|将对象的构建方法和表象形式分离，并重视创建相同类型的对象。|
|singleton|在全局作用域中只有唯一的一个实例的类。|
|abstract factory|在没有具体类的详细细节的情况下创建多个相似的类的实例，即可传入具体类来让工厂决定是否实例化。|
|abstract class|一个永不会被实例化为具体对象的类。如 `水果` 是抽象概念，即抽象类，`苹果` 有实物，即具体类。|

抽象类（[wiki][wiki-class]）既可包含抽象方法也可包含具体方法。只有当抽象类的所有抽象方法都被子类实现后，子类才能被实例化。

[wiki-class]:https://zh.wikipedia.org/wiki/类_(计算机科学)#抽象类

```js
/**
 * 抽象类存在的意义：
 * 1. 抽象类表明一个功能的抽象集合，它不能被直接实例化，因为它仅用于在思维方面，表示功能
 * 设计架构上的一个抽象化概念。如 `水果` 这一抽象概念，`水果` 这一 `事物本身` 在现实中
 * 没有实物对应。
 * 2. 抽象方法，它表示继承的抽象类的子类 必须 实现的（或理解为功能）方法。在实现抽象类的
 * 所有方法（功能）之后，子类即实现了将抽象类所有功能在现实世界中的具体化。此时子类才能
 * 被真正的实例化。如 `苹果` 实现了 `水果` 在现实世界中的具体体现，它是抽象类 `水果` 的
 * 一个子类，并实现了  `水果` 的抽象方法（比如吃），那么 `苹果` 这一子类即可实现实例化为
 * 一个苹果。
 */

// Vehicle 类是抽象类，不能直接实例化，仅表示 `载具` 这一抽象化概念
class Vehicle {
  // 抽象方法，表示在思考分析方面，抽象类的某一个功能，可以根据不同的子类有不同的实现方法。
  // 必须被子类实例化，否则子类不应该被实例化
  detail () {
    throw new Error('你应该在子类中定义该方法。')
  }
}

class Car extends Vehicle {
  constructor (options) {
    super()
    this.brand = options.brand || 'Default brand'
    this.color = options.color || 'Default color'
  }

  // 在子类中实现抽象类的功能，每个子类都可以有自己的功能实现。
  // 原理：原型链（对于对象来说）与作用域链（对于变量来说），使用子类的同名原型方法来屏
  // 蔽抽象类的同名原型方法
  detail () {
    console.log(`Vehicle\'s brand is ${this.brand}.`)
    console.log(`Vehicle\'s color is ${this.color}.`)
  }
}

const car = new Car({
  brand: 'Benz',
  color: 'sliver'
})

car instanceof Car // true
car instanceof Vehicle // true
```

## 工厂模式

关键词：解耦实例化与类、包含固定类（与抽象工厂对比）。

即 `Factory Pattern`。

工厂模式的 `工厂` 是创建 `产品` 的地方，其目的是将产品的创建于产品的使用 ***分离***。实际中，是对构造方法封装的抽象（`abstract`），是对一个功能的抽象集合。它以特定接口实现对创建对象的具体类进行封装，由工厂来决定是否执行实例化或执行哪一个实例化路径。微观上，该模式提高了代码复用性，避免创建相似对象时产生大量重复代码；宏观上，使得被封装功能与应用整体比较时，工厂将被抽象为一个概念。这样在架构应用时整体思考只需要考虑抽象化后的功能，而不必过于纠结该功能的具体实现。

外部调用者只关心该工厂所暴露给外部的使用接口。即外部使用者只关心调用该工厂即可完成特定的相似对象创建或相似的功能实现，并不关心其中的内部实现。

### 实现

```js
// 以下 Car 类和 Truck 类也可以是抽象类，即不能被实例化的类，子类来实现抽象类的接口（原型方法）
class Car {
  constructor (options) {
    this.type = 'car'
    this.brand = options.brand || 'Default brand'
    this.color = options.color || 'Default color'
  }
}

class Truck {
  constructor (options) {
    this.type = 'truck'
    this.brand = options.brand || 'Default brand'
    this.color = options.color || 'Default color'
  }

  transport () {
    return `I can transport vehicle`
  }
}

// 外部只关心调用该工厂方法即可实现特定功能
class CarFactory {
  constructor () {
    // 默认类
    Reflect.defineProperty(this, '_vehicle', {
      enumerable: false,
      writable: true,
      value: Car
    })
  }

  createVehicle (options) {
    // 将类的实例化统一集中管理，通过传入的参数选择不同的实例化路径
    if (options.type === 'truck') this._vehicle = Truck

    return new this._vehicle(options)
  }
}

```

外部调用工厂方法：

```js
// 外部调用只关心工厂方法的结果
const ins = new CarFactory()

const car = ins.createVehicle({
  type: 'car',
  brand: 'Panda',
  color: 'rainbow'
})
car instanceof Car // true

const truck = ins.createVehicle({
  type: 'truck',
  brand: 'Benz',
  color: 'sliver'
})
truck instanceof Truck // true
```

以上示例代码展示了根据传参不同，而执行不同的实例化路径。代码中将判断路径的这个行为封装为一个工厂方法，实行集中管理。后续若需要修改某一类时，只需要修改工厂方法即可。

若不使用该工厂方法，那么在后期需要删除该类时，需要修改所有引用该类的地方，而使用了工厂方法后，删除该类只需要修改工厂方法即可，即将该构造类与其他代码解耦，将该构造类的实例化通过工厂模式来抽象为一个功能模块。

### 实际应用

适用场景：

1. 在创建对象或模块会涉及高复杂度逻辑时，可使用工厂模式解耦（创建者与使用者）并简化创建逻辑。

2. 需要根据不同的传入参数来实现不同的实例化路径时。

3. 当我们需要建立大量具有相似属性的对象或组件时。

4. （与 1 相似）当我们需要使用一些对象去与另一些对象实例组合时，可通过工厂模式实现简洁的组合接口。在组合时，调用这些工厂接口，可以解耦组合者与被组合者。

### 工厂模式利弊

- 优势

    1. 以一个基础结构创建无限个新的结构相似的实例，解决了创建相似对象的问题。

    2. 以一个工厂类封装可能被复用的操作，避免重复代码。

    3. 解耦功能接口（即具体类的实例）与调用者。通过工厂实例将二者联系。

- 弊端

    1. 每次增加、删除、修改功能，都要去修改具体类（可以是抽象类的子类）和工厂类（违背遵循 `开放封闭原则`）。若是增加功能，即在工厂内部添加新的原型方法，那么在一定程度上增加了不必要的应用复杂度。

        - 除非创建结构相似的对象并提供一个接口是代码设计的目标（指上文的工厂模式适用场景，如以抽象化功能为目标），否则都应该显式地使用构造函数来创建对象。这样可以避免不必要的性能开销（`unnecessary overhead`）。

    2. 基于创建对象的行为通过接口被抽象化这一事实，那么这可能会为单元测试带来一些困难（因为外部无法感知内部实现）。至于有多困难取决于被抽象化的行为有多复杂。

## 抽象工厂模式

关键词：抽象实例化过程、本身不包含固定类、传入类、选择性实例化。

即 `Abstract Factory`。

### 含义

1. 抽象工厂用于将一组相互独立的且他们有共同目标的工厂进行封装。从他们的一般用例（`their general usage`）中分离出对象的实现细节。

2. 抽象工厂会 ***筛选*** 出符合条件的类，最终抽象工厂的具体工厂（`concrete factories`，即能够被实例化的工厂类）将只实例化符合条件的具体类。

### 适用场景

在系统必须独立于创建对象的方式或需要使用多种类型对象的情况下，应该使用抽象工厂。

### 实现

一个简单且容易理解的示例是下面的载具工厂示例 `AbstractVehicleFactory`。它实现了得到载具类型方法 `getVehicle` 和注册载具类型方法 `registerVehicle`。这个抽象工厂允许定义类似 `car` 或 `truck` 这样的载具类型，并且最终只有符合特定条件的载具类才能被具体工厂实现。

```js
class AbstractVehicleFactory {
  constructor () {
    // 缓存载具类
    Reflect.defineProperty(this, '_types', {
      enumerable: false,
      writable: true,
      value: {}
    })
  }

  // 静态方法常用于实现构造函数的某个功能，但该功能应该仅限在构造函数上被调用的情形下。
  static getVehicle (type, customization) {
    const Vehicle = this._types[type]

    // 若存在已经注册的载具类，那么执行该载具类
    return Vehicle ? new Vehicle(customization) : null
  }

  static registerVehicle (type, Vehicle) {
    // 获取传入的载具类的原型对象
    const proto = Vehicle.prototype

    // 只有符合特定条件的载具类才能被注册（注册之后才能实例化载具类）
    if (proto.drive && proto.breakDown) {
      // 注册符合特定条件的载具类，该类将用于具体工厂 getVehicle 中执行实例化
      this._types[type] = Vehicle
    }

    // 启用级联，用于链式调用
    return this
  }
}
```

调用结果如下：

```js
AbstractVehicleFactory
  .registerVehicle('car', Car)
  .registerVehicle('truck', Truck)

// 基于 Vehicle 抽象类实例化 Car 类
const car = AbstractVehicleFactory.getVehicle('car', {
  brand: 'Panda'
  color: 'red'
})

// 基于 Vehicle 抽象类实例化 Truck 类
const truck = AbstractVehicleFactory.getVehicle('truck', {
  brand: 'Benz',
  color: 'sliver'
})
```

## 构造函数模式

关键词：类实例化、原型对象、原型链。

即 `Constructor Pattern`。

解决创建多个结构相似的对象的问题。每次构造函数被实例化，都会在内存中开辟新的存储区域，即每次都会创建一个新的对象。

```js
class Person {
  constructor (name, age, gender) {
    this.name = name
    this.age = age
    this.gender = gender
  }
}

const john = new Person('John', 20, 'male')
const mary = new Person('Mary', 20, 'female')

// 构造函数模式通过 constructor 原型属性解决了 `不知道是谁的实例` 的弊端。
john.__proto__.constructor === Person // true
mary.__proto__.constructor === Person //true

john instanceof Person // true
mary instanceof Person // true
```

### 与原型对象结合

将 `构造函数模式` 与 `原型对象` 相结合，那么可以实现基于构造函数对象的原型对象创建出不同的构造函数实例，即根据子类的不同可创建出不同的原型继承链。

```js
class Person {
  constructor (name, age, gender) {
    this.name = name
    this.age = age
    this.gender = gender
  }

  // 原型方法，它被所有 Person 的实例以及 Person 的子类所共享
  say (property) {
    const detect = `${property}` in this
    if (!detect) {
      throw new Error('parameter must be a string of `name, age, gender`')
      return
    }

    return this[property]
  }
}

class SuperPerson extends Person {
  constructor (name, age, gender) {
    super(name, age, gender)
  }

  // ... 子类的原型方法
}

const jack = new SuperPerson('Jack', 20, 'male')
const lily = new SuperPerson('Lily', 20, 'female')

// say 方法是父类原型方法，能被任何子类实例通过原型链访问
'say' in jack // true
'say' in jack.__proto__ // true
jack.hasOwnProperty('say') // false
jack.__proto__.hasOwnProperty('say') // false

'say' in lily // true
'say' in lily.__proto__ // true
lily.hasOwnProperty('say') // false
lily.__proto__.hasOwnProperty('say') // false
```

以上代码实现了基于原型链的继承方案实现。使得创建的每个 `SuperPerson` 实例都继承过了父类 `Person` 的原型方法。

## 原型模式

关键词：共享属性、共享方法、原型链。

即 `Prototype Pattern`。

以一个对象作为原型对象，该对象包含所有实例所共有的属性和方法。

```js
const car = {
  name: 'Benz',

  drive () {
    console.log('I am driving!')
  }
}

const yourCar = Object.create(car)

yourCar.name // 'Benz'
yourCar.drive // 'I am driving!'
```

示例代码中，`Object.create` 指定了以参数对象为新对象的原型对象。那么由 `Object.create(car)` 创建的所有新对象都共享 `car` 对象的所有属性和方法。

## 模块模式

关键词：私有变量、公共接口。

与外观模式不同的是，模块模式侧重私有变量的保护。外观模式侧重内部系统的抽象。

即 `Module Pattern`。

在 JS 中实现模块（即一个拥有公共接口的封闭命名空间）的方式：

1. 模块模式

2. 对象字面量

3. AMD 模块

4. CommonJS 模块

5. ES 模块语法

### 对象字面量

```js
const myModule = {
  property: 'some value',

  fu () {
    console.log('I\'m a function in Object')
  }
}

myModule.property // some value
myModule.fn // I'm a function in Object
```

- 利：示例代码中 `myModule` 构成了一个功能集合（模块），方便调用。
- 弊：模块中的键值对可被外部任意修改，不具有安全性。

### 模块模式

为了解决对象字面量的无法实现私有变量的问题，模块模式利用 ***闭包***（作用域链）原理实现私有变量，保护模块内部变量无法从模块外部修改。

```js
const myModule = (function () {
  // 私有变量，只能被模块内部修改，对外部不可见。
  let counter = 0

  // 公有方法和属性，是模块外部访问内部变量的唯一渠道。
  return {
    running () {
      return ++counter
    },
    reset () {
      counter = 0
      return counter
    }
  }
})()
```

示例代码中，私有变量 `counter` 因公有方法保持了对其引用，故在函数执行完成后，仍存在于内存中直至公有方法或属性的生命周期结束。

模块模式在 `jQuery` 等一些 `JS` 库中都有广泛的应用。

另外还存在一种模块模式的变种模式。

1. 传入参数

```js
const myModule = (function (jQuery, lodash) {
  function reviseHtml () {
    jQ('.container').html('test')
  }

  function printMin () {
    console.log(_.min([1, 2, 3]))
  }

  return {
    revise: reviseHTML,
    print: printMin
  }

  // 传入参数
})(jQuery, _)
```

2. 返回模块对象

```js
const myModule = (function () {
  let module = {}
  const privateVariable = 'Hello'
  function privateFn () {}

  module.publicVariable = 'World'
  module.publicFn = function () {
    privateFn()
    console.log(privateVariable)
  }

  return module
})
```

模块模式的应用技巧，将所有私有方法和属性统一，只通过公有接口暴露其键名。这样可直观展示出该模块的公有接口及其与私有方法或属性的关系。

```js
const customModule = (function () {
  let counter = 0

  function addFunction () {
    counter++
    console.log(`Counter is ${counter}.`)
  }

  function minusFunction () {
    counter--
    console.log(`Counter is ${counter}.`)
  }

  function resetFunction () {
    counter = 0
    console.log(`Counter is ${counter}.`)
  }

  // 清晰展示了公有接口及其与内部变量的关系
  return {
    add: addFunction,
    minus: minusFunction,
    reset: resetFunction
  }
})()
```

### 模块模式利弊

- 优势

    1. 基于面向对象编程使得功能逻辑更为清晰。

    2. 保护了模块内部变量，该变量只能通过公有方法修改，无法通过模块外部修改。

- 劣势

    1. 可拓展性差，没有遵循设计模块的 ***开（放）（封）闭原则***（对拓展开放，对修改封闭）。该模块一旦建立，其功能就被固定，后期拓展该模块必须修改模块本身，这是违背开闭原则中的 `对拓展开放`。

    2. 除非需要创建一个不希望后期被拓展的封闭模块，那么 1 就是劣势。

    3. 模块模式的公有接口有被修改的风险。


## 单例模式

关键词：缓存实例、实例唯一。

即 `Singleton Pattern`。

在 `模块模式` 基础上发展而成的 `单例模式`，在实例化时，最多在全局只创建一个该类的实例。

```js
const singleton = (function () {

  // 实例化方法，可以是一个构造函数或模块
  // （可选）可分离出 singleton 模块
  // init 模块
  function init () {
    let privateNum = 10
    const privateFn = function () {}

    return {
      num: privateNum,
      fn: privateFn
    }
  }

  // singleton 类的实例的缓存容器，必须以私有变量的形式存在于 singleton 模块中
  let _instance = null

  // singleton 类的公有方法
  return {
    // 该方法通过闭包形式保持了对实例缓存容器的引用，只有在不存在实例时才执行 init 初始化
    getInit () {
      // 缓存实例
      _instance = _instance ? _instance : init()
      // or _instance = _instance ? _instance : new Initialize()
      return _instance
    }
  }
})()

const ins1 = singleton.getInit() // { num: 10, fn: function () {} }
const ins2 = singleton.getInit() // { num: 10, fn: function () {} }

ins1 === ins2 // true
```

单例模式通过模块内部的一个变量 `instance` 来作为实例的缓存容器，通过判断是否存在实例缓存来决定是否执行实例化。据此实现全局只存在唯一一个 `singleton` 的实例的逻辑。

### 单例模式适用场景

1. 作用域中只应存在唯一一个具有公共接口的类的实例，比如创建弹窗。

    ```js
    const createDiv = (function () {
      let div = null

      return function () {
        if (!div) {
          div = document.createElement('div')
          div.innerText = 'Hello world'
          div.style.display = 'none'
          document.body.appendChild(div)
        }
        return div
      }
    })()

    document.querySelector('.btn').addEventListener('click', evt => {
      // 即使是多次点击也是只有一个弹窗被创建
      const div = createDiv()
      div.style.display = 'block'
    })
    ```
    以上代码保证了即使存在多次点击，也只会在第一次点击时创建弹窗元素。另外该效果也可使用函数防抖（[extension][debounce-function]）来实现，不同的是，只有在有限时间内的最后一次点击生效。但是超过有限时间仍然会创建多个弹窗元素。

[debounce-function]:https://github.com/lbwa/set/issues/10

2. 在单例通过子类拓展后，使用者可以调用该拓展后的单例而不用修改使用者本身的代码。

    ```js
    singleton.getInit = function () {
      if (this._instance === null) {
        // 判断是否拓展单例
        if (doSomething()) {
          // 拓展单例
          this._instance = new SubSingleton()
        } else {
          // 初始化单例
          this._instance = new BasicSingleton()
        }
      }
      return this._instance
    }
    ```

     示例代码中，`SubSingleton` 是 `BasicSingleton` 的子类，具有与 `BasicSingleton` 相同的数据接口。

### 通用的单例模式

```js
const getInit = function (fn) {
  let cache = null

  return function (...args) {
    // this 为调用该匿名包装函数的对象
    // args 为调用该匿名包装函数时传入的 rest 参数
    return cache || (cache = fn.apply(this, args))
  }
}
```

创建单例弹窗：

```js
const createDiv = function (text) {
  const div = document.createElement('div')
  div.innerText = `${text}`

  return div
}

const initDiv = getInit(createDiv)

document.querySelector('.btn').addEventListener('click', evt => {
  // 匿名包装函数内 this 指向 .btn 元素，args 为 ['hello world']
  initDiv('hello world')
})
```

### 单例模式利弊

- 优势

    1. 使得类的实例化过程可控，即控制类的实例数量，保证作用域内只存在唯一的实例。实际上，在应用中只需要一个单例就可协调其他模块运作的情况下，都应该使用单例模式。

    2. 单例可通过子类任意拓展，使用者在调用该拓展后的单例时也不用修改使用者本身的代码。

### 单例模式的风险

当在应用中经常使用单例时，这时应该重新评估自己的代码结构。这通常表明该单例模块要么过于与其他模块的逻辑耦合，要么在应用中过于分散。过度使用单例将导致范围过大的依赖关系，即 `debug` 成本增加。后期如要将单例修改为多个实例或移除单例都会很麻烦。

## 观察者模式

关键词：主体对象、观察者

即 `Observer Pattern`。

观察者模式：一个主体对象（`subject`）维护一个观察者对象（`observers list`）列表，并且主体对象对状态的任何修改都会被观察者对象 ***自动通知***。对主体对象修改状态的行为感兴趣的对象只需要接受观察者的通知即可。

|基本概念|描述|
|-------|----|
|`Subject` 主体对象| 维护一个观察者列表，并能够添加或移除观察者。|
|`Observer` 观察者 | 提供通知状态更新方法，在主体对象有任何修改状态的改变时，观察者将发出通知。|
|`ConcreteSubject`|存储 `ConcreteObserver`。在主体对象状态改变时，向观察者广播通知。|
|`ConcreteObserver`|存储对 `ConcreteSubject` 的引用，实现一个通知更新的接口，该接口将用于保持与 `ConcreteSubject` 的状态一致。|

### 实现

```js
// 观察者缓存容器（列表）
class ObserverList {
  constructor () {
    this.observerList = []
  }

  add (observer) {
    return this.observerList.push(observer)
  }

  remove (index) {
    return this.observerList.splice(index, 1)
  }

  get (index) {
    return this.observerList[index]
  }

  len () {
    return this.observerList.length
  }

  indexOf (observer, startIndex = 0) {
    const len = this.observerList.length
    for (let i = startIndex; i < len; i++) {
      if (this.observerList[i] === observer) {
        return i
      }
    }
    return -1

    // same as `return this.observerList.indexOf(observer, startIndex)`
  }
}

// 主体
class Subject {
  constructor () {
    // Subject 实例通过 observers 属性来维护观察者列表
    // 即观察者缓存容器
    this.observers = new ObserverList() // { observerList: [] }
  }

  addObserver (observer) {
    this.observers.add(observer)
  }

  removeObserver (observer) {
    // 传入的是某个之前被加入观察者容器中的 Observer　实例的引用的变量，故存在 index
    const index = this.observers.indexOf(observer, 0)
    return  this.observers.remove(index)
  }

  // 参数 context 可选，非重点。
  // 此处重点是 Subject 实例状态改变时，触发容器中每个观察者的更新函数，即让他们发出通知。
  notify (context) {
    const len = this.observers.len()
    for (let i = 0; i < len; i++) {
      this.observers.get(i).update(context)
    }
  }
}

// 观察者
class Observer {
  // 观察者通知类型原型方法，可在其中加入回调，以向这些对观察者通知感兴趣的对象发起通知
  update (context) {
    console.log('observer has been updated.')
  }
}
```

实例化如下：

```js
// concrete Subject
const sub = new Subject()

// Concrete Observer
const obs = new Observer()

sub.addObserver(obs)

// 其中有几个 Observer 实例，update 就被调用几次
sub.notify()
// observer has been  updated.

sub.removeObserver(obs)
// 返回被删除的 obs 观察者实例
```

***注***：一个隐藏的弊端就是，以上代码中并未实现有·选择性的触发 `Observer` 实例的 `update` 函数。`notify` 函数是触发所有的 `Observer` 实例。

示例代码中三者之间的关系如下图：

![observer-pattern][observer-pattern]

[observer-pattern]:https://rawgit.com/lbwa/articles/master/2018/180612-js-design-pattern/observer-pattern.svg

## 发布/订阅模式

关键词：发布者、`topic/event channel`、订阅者

即 `Publish/Subscribe Pattern`。

发布/订阅模式是观察者模式的变种。不同与观察者模式的是发布/订阅模式实现了一个 `主体/事件通道` ，它用于发布者和订阅者之间通信，解耦发布者和订阅者。

### 实现

```js
class Pub {
  constructor () {
    // 订阅者缓存容器，其中包含各类消息的缓存队列
    this.caches = []

    Reflect.defineProperty(this, '_uid', {
      enumerable: false,
      writable: true,
      value: -1
    })
  }

  publish (evt, ...args) {
    if (!this.caches[evt]) return false

    const subscribers = this.caches[evt]
    let len = subscribers ? subscribers.length : 0
    while (len--) {
      subscribers[len].callback.apply(subscribers[len], args)
    }

    return this // pub 实例，启用级联，用于链式调用
  }

  subscribe (evt, callback) {
    // 初始化消息类型为 evt 的缓存容器
    if (!this.caches[evt]) this.caches[evt] = []

    this.caches[evt].push({
      uid: ++this._uid,
      callback
    })
    // caches[evt]: [{uid: 0, fn}, {uid: 1, fnn}, ...]
  }

  unsubscribe (evt, uid) {
    const cache = this.caches[evt]
    const len = this.caches[evt].length

    for (let i = 0; i < len; i++) {
      if (cache[i].uid === uid) {
        return cache.splice(i, 1)
      }
    }

    return this // 启用级联，用于链式调用
  }
}
```

实例化后：

```js
const pub = new Pub()

pub.subscribe('hello',() => console.log('I\'m from hello'))
pub.subscribe('index',() => console.log('I\'m from index'))

// 只调用 hello 类别中的订阅者，而不是像观察者模式那样触发所有订阅者
pub.publish('hello') // I'm from hello

// 只调用 index 类别中的订阅者
pub.publish('index') // I'm from index
```

***关键点***：示例代码中，`evt` 变量即是作为 `主题/事件通道` 的存在，它分离出了不同类型的消息通道，使得发出通知时只会触发相同类型下的订阅者。

![publish-subscribe][publish-subscribe]

[publish-subscribe]:https://rawgit.com/lbwa/articles/master/2018/180612-js-design-pattern/publish-subscribe.svg

### 实际应用

一个典型应用是 `Vue.js` 中的依赖收集与更新（[我的解析][vue-reactive]）。其中定义了一个 `subs` 变量维护 `主题/事件` 通道。`Watcher` 实例作为订阅者，`Dep` 实例作为发布者。

另一个典型应用 `Vue.js` 中 `event bus`。

```js
// eventBus.js
import Vue from 'vue'
export default new Vue({}) // 该 Vue 实例将暴露在全局中

// a.vue
import eventBus from '@/eventBus'
eventBus.$emit('goPublish', payload) // publish by publisher

// b.vue
import eventBus from '@/eventBus'
function handler (payload) { // callback in b.vue
  // do something
}
eventBus.$on('goPublish', handler) // subscribe by subscriber
eventBus.$off('goPublish', handler) // unsubscribe
```

[vue-reactive]:https://github.com/lbwa/vue-reactive

### 观察者模式和发布/订阅模式的差异

1. 观察者模式

    1. 观察者模式要求希望接受通知的 `观察者对象` 必须订阅它所感兴趣的发起事件的 `主体对象`（`the object firing the event(the subject)`） 。

    2. 观察者必须 ***直接*** 订阅主体对象，此举导致二者形成 ***耦合***。主体对象广播时，所有观察者中回调都将被 ***同步*** 执行。

2. 发布/订阅模式

    1. 二者最大的差异是 `发布/订阅模式` 建立了一个 `主题/事件通道`。该通道是位于 `订阅者 subscribers`（希望接受通知的对象，`Observer`）和 `发布者 publisher`（发布通知/事件的对象，`Subject`）之间，作为二者的通信桥梁。

    2. 该事件系统（`主题/事件通道`）允许通过应用中包含自定义参数值的特殊事件来 ***区分订阅者***。这样做的目的是 ***选出*** 特定的订阅者用于单独执行回调（可形成一个消息队列），即 ***解耦*** 了订阅者和发布者之间的依赖关系（上文 1.2）。

    3. 观察者是通过 `主题/事件通道` ***间接*** 订阅主体对象。

与观察者模式不同的是，`发布/订阅模式` 允许任何的订阅者执行一个适当的事件处理程序用于注册和接受通过发布者广播的通知。即 `发布/订阅模式` 可单独执行某类消息下的订阅者的回调。而不是像 `观察者模式` 一样每次都执行全部类别消息下的观察者的事件回调。

### 观察者模式和发布/订阅模式的优劣

- 优势

    1. 观察者模式和发布/订阅模式鼓励我们去思考应用中不同模块之间的关系。它们帮助我们用主体对象和观察者对象的集合来代替包含直接关系的逻辑层。最终使得我们的应用更加倾向于轻量，***松耦合***，并改善代码的潜在复用性。

    2. 观察者模式使得 `主体对象` 与 `观察者对象` 形成动态联系。此举在应用中互不相关的模块之间存在强耦合时，提供了一种灵活性高的解耦解决方案。

    3. 观察者模式和发布/订阅模式是设计解耦系统的最佳工具之一，推荐使用。

- 劣势

    1. 在发布/订阅模式中，解耦了发布者和订阅者，那么它们二者之间是没有直接关系的。那么发布者发起事件，通过 `主题/事件通道` 传递给订阅者，在订阅者接受事件之后，触发订阅者回调时，发布者此时是没有方法知道订阅者的回调是否执行成功的。

    2. 发布者与订阅者二者之间的动态关系（动态体现在并不一一对应，可能触发一个或多个订阅者）也导致了 ***难以追踪*** 其中的执行过程。

## 建造者模式

关键词：抽象复杂 `DOM` 对象的构建、解耦复杂对象的表象与构建。

即 `Builder Pattern`。

该模式专注于将复杂对象的构建与表象分离。

当我们使用 `DOM` 时，我们经常需要动态地创建新的元素对象。这个过程应用复杂度会随着我们所添加标签特性，元素对象属性，和元素标签多寡而增加。

当我们既希望能够灵活地使用字面量来定义元素的最终标记（`markup`），又可以调用一个可读的面向对象的路由（`route`）来实现构建复杂对象时，建立一个独立于复杂 `DOM` 元素对象本身的机制即是最佳的解决方案。这也正是 `Builder Pattern` 为我们所提供的内容，`Builder` 将负载对象的构建与表象 ***解耦***，二者将通过 `builder` 维系。

`Builder` 允许我们只通过指定元素的对象类型和对象内容即可创建复杂的对象，并且屏蔽了我们显式地创建或表示对象的过程。一切复杂对象的创建和表示工作都由 `builder` 来完成，我们只需要提供创建对象所需的对象类型和对象属性即可。

在 `jQuery` 中，`$()` 方法即是 `builder` 对复杂的 `jQuery` 对象创建的封装，我们在使用该方法时，只需要提供特定的参数即可完成复杂的 `jQuery` 对象的创建。

```js
// 传入特定字符串完成 jQuery 对象的创建
$('<div class="app">this is a element.</div>')
$('.app')
```

个人认为，建造者模式和外观模式较为相似。外观模式侧重复杂操作的抽象，建造者模式侧重剥离复杂对象的构建（亦可理解为对复杂的构建过程的抽象），他们都向外暴露公共接口，以将模块内部与外部调用者解耦（建造者是构建与表象解耦）。

## 外观模式

关键词：抽象子系统接口、暴露 `facade` 公共接口。

与模块模式不同的是，模块模式侧重私有变量的保护。外观模式侧重内部系统的抽象。

|结构性设计模式|描述|
|-------------|----|
|facade|一个隐藏了整个子系统的复杂实现的类|

即 `Facade Pattern`。

该模式专注于对外提供一个高级别且便捷的接口，以用于隐藏内部的复杂实现。该模式所暴露的接口是对内部实现的抽象概括。

`Facade Pattern` 模式常见于 JS 库中，尽管该模式实现了具有广泛性为的方法，但是只有这些内部方法的 `facade`（可理解为内部方法的有限抽象）被提供给外部使用。

这允许我们直接与 `facade` 交互，而不是内部的子系统。每当我们调用 `jQuery` 的 `$(el).css()` 之类的方法时，我们实际调用的是 `facade`（它是避免为了实现某一行为而直接使用 `jQuery` 内部核心的多个方法的公共接口）。这也直接避免了我们与 `DOM` 的 `API` 直接交互，也不用维护因直接交互而产生的状态变量。

### 实现

```js
const addListener = function (el, evt, callback) {
  if (el.addEventListener) {
    el.addEventListener(evt, callback, false)
  } else if (el.attachEvent) {
    el.attachEvent(`on${evt}`, callback)
  } else {
    el[`on${el}`] = callback
  }
}
```

示例代码中，`addListener` 的参数即是对外暴露的给元素添加事件处理程序的接口。我们只需要传入三个参数就可以给对应的标签对象 `el` 添加监听 `evt` 事件的 `callback` 事件监听器。整个过程都被整体简化，同时也避免我们直接接触内部实现代码。

常见地，`Facade Pattern` 模式可与其他设计模式整合，比如 `module pattern`。

### 适用场景

- 在应用设计初期，应有意识地将不同层分离，比如将数据层与表现层分离，在二者之间通过加入 `facade` 层来解耦。

- 在开发阶段，当子系统越来越复杂时，可加入一个 `facade` 层来提供简化后的接口，并解耦复杂的子系统与其他模块的耦合。

- 在维护阶段，当存在一个难以维护的系统时，加入一个 `facade` 层以简化抽象该系统的接口，让其他模块与该系统交互时，转而与 `facade` 交互。这样接口即清晰也便于系统功能拓展。

### 外观模式利弊

- 优势

    1. 该模式既简化了某个目标类的内部接口，也将该类与调用它的模块解耦，中间由  `facede` 这一抽象接口维系。

    2. 避免我们直接与 `Facade Pattern` 所形成的子系统（模块内部）直接交互。间接交互也降低了与子系统交互时意外引入 `bug` 的风险。

    3. `Facade Pattern` 模式更为显著的特点是易用性高，且通常实现该模式的代码量体积小。

- 弊端

    1. 性能问题。在 `Facade Pattern` 模块被确定时，即其内部实现已确定，那么不论我们传入何种参数，其内部总会实现其所有判断逻辑（如有）。那么这就可能带来一些隐性的性能消耗。

        - 比如使用了 `Facade Pattern` 的公共接口 `$(el)`（其内部通过 `document.querySelector` 实现查找元素）对比 `document.getElementById` 将有更高的性能损耗。因为 `document.getElementById` 只专注于元素 id 查找，而 `document.querySelector` 接受任何元素选择器，那么这其中执行判断逻辑（判断以何种方式查找元素）就会带来性能损耗。
