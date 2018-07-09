---
title:      "学习 vuex 基础"
subtitle:   "简要总结学习 vuex 的个人理解"
date:       2018-03-06
author:     "Bowen"
tags:
    - 前端开发
    - Vue.js
---

# 核心概念

vuex 就是将 vue 中需要管理的状态，全部集中到一个容器中，集中管理。下文代码中 store 指代 vuex 容器实例（`const store = new Vuex.Store({ ... })`），同时在组件中可使用`this.$store`来访问 vuex 容器实例。注意，在通过`this.$store`来访问各个选项时，选项名末尾除state外，都必须有`s`。

Vuex 通过 store 选项，提供了一种机制将状态从根组件"注入"到每一个子组件中（需调用`Vuex.use(Vuex)`）。通过在**根实例**中注册`store`选项，该 store 实例会注入到根组件下的**所有**子组件中，且子组件可以通过`this.$store`访问到。

## state —— 存储状态的容器

state 用于缓存状态（计算属性）数据。可**类比**于 vue 实例中的 data 数据对象。

特点：

1. 具有响应式变化的特点，最简单读取 vuex 实例（store）的状态的方法是，在计算属性中返回某个状态。如下所示:
```js
computed: {
  count () {
    return store.state.count
  }
}
```
但是，一般的用法是，通过**store选项**注入到 vue 组件中。
2. [mapState 辅助函数][mapState]用于读取多个状态，生成计算属性（状态）

## getter —— 处理旧状态生成新状态

getter 可**类比** vue 实例中的 computed 选项，可称为是 store 的计算属性。读取 state 中的数据A，经 getter 中的处理函数处理后返回生成一个新的状态数据B（A的计算属性）。

getter 暴露一个`store.getter`对象，这里`store`指的是 vuex 的实例对象，可写作`this.$store`或`$store`。getter 对象中包含了一些处理 state 中状态的处理函数。这些处理函数将返回一个新的状态数据，这些新的状态数据是**储存于 getter 对象中的**。

getter 中的处理函数接受 state 中的状态数据作为**第一参数**，另外可选的，可将 getter 中的其他 getter 作为**第二参数**

`mapGetters`[辅助函数][mapGetters]仅仅是将 store 中的 getter 映射到局部计算属性。

`mapGetters`的实现和`mapState`很类似，不同的是`mapGetters`函数的参数**不能是函数**，只能是一个字符串。对比如下：

```js
import { mapState, mapGetters } from 'vuex'
export default {
  // ...
  computed: mapState({
    // ...
    // mapState 中可以传入函数
    // 若要访问局部状态 state 必须借助一个普通函数
    countPlusLocalState (state) {
      return state.count + this.localCount
    }
  })
}
// 等价于
export default {
  // ...
  computed: {
    // ...
    countPlusLocalState () {// this.$store.state 即为局部状态容器
      return this.$store.state.count + this.localCount
    }
  }
}

export default {
  // ...
  computed: {
  // 使用对象展开运算符将 getter 混入 computed 对象中
    ...mapGetters([
      'doneTodosCount',// mapGetters 中不能传入函数
      'anotherGetter',
      // ...
    ])
  }
}
// 等价于
export default {
  // ...
  computed: {
    doneTodosCount () {
      return this.$store.getters['doneTodosCount']
    },
    anotherGetter () {
      return this.$store.getters['anotherGetter']
    }
  }
}

```

## Mutation —— 修改旧状态

### 含义及作用

更改 vuex 的 store 中的状态的**唯一方法**是提交 mutation。可**类比**vue中的事件，提交 mutation **类比**触发事件(this.$emit(‘事件名’))。

每个 mutation 都有一个字符串类型的**事件类型(type)**和一个回调函数（接受 state 作为第一参数），该回调函数即是更改 state 状态的**关键**。回调函数的名称**即是**事件类型。

这种 mutation 中定义事件类型和回调函数的方式**可看作**是自定义事件注册。但**不能直接调用** mutation 中的回调函数。

### 使用方法

不能直接调用 mutation handler，可类比调用`this.$emit`方法触发某自定义事件。那么，使用 mutation handler 的方法如下：

```js
store.commit('mutations 选项中的回调函数名')
```

>`store.commit()`可传入一个可选项第二参数，作为载荷。 载荷的作用是带入 mutation handler 中作为参数使用。

另外，还可以使用对象风格的提交方式（其中必包含事件类型 type ），该对象将整体传入 mutation 对象。如下所示提交 mutation 的三种方法：

```js
store.commit('increment')
// 或者写为
store.commit('increment', { amount: 10 })
// 或者写为
store.commit({
  type: 'increment', // 将用于匹配对应的回调函数
  amount: 10 // 将作为 回调函数 的参数使用
})
```

综上，在组件中使用`this.$store.commit('xxx')`来提交 mutation。或使用`mapMutations`将组件的 methods 映射为`store.commit`调用（需要在根节点注入 store）
```js
import { mapMutations } from 'vuex'

export default {
  // ...
  methods: {
    ...mapMutations([
      // 将 `this.increment()` 映射为 `this.$store.commit('increment')`
      'increment',

      // `mapMutations` 也支持载荷：
      'incrementBy'
    ]),
    ...mapMutations({
      // 将 `this.add()` 映射为 `this.$store.commit('increment')`
      add: 'increment'
    })
  }
}
```

### 注意事项

1. mutations 选项中的方法是不分组件的 , 假如你在 A.js 文件中的定义了
fn 方法 , 在其他文件（B.js等等）中的一个 fn 方法 , 那么
$store.commit('fn') 会**执行所有**的 fn 方法。
1. mutations 选项中的操作**必须是同步**的。

## Action —— 可包含异步的“Mutation”

action 与 mutation 根本作用都是修改状态，不同之处在于：
1. action 提交的是 mutation，而不是直接修改状态
1. action 可以包含任意异步操作

**本质上**，action 是通过提交 mutation 来修改状态的，最终还是回归到**只有** mutation 能够修改 state 中的状态。

actions 选项中的回调函数接受的**参数**是一个与 store 实例对象具有相同方法和属性的 context 对象。

常见[action 注册][action]如下：

```js
const store = new Vuex.Store({
  state: {
    count: 0
  },
  mutations: {
    increment (state) {
      state.count++
    }
  },
  actions: {
    increment (context) { // comtext 与 store 有相同的属性和方法
      context.commit('increment') // action 通过提交 mutation 来修改状态
    }
  }
})
```

据[vuex 官方文档][action]，有这么一段话：

> Action 函数接受一个与 store 实例具有相同方法和属性的 context 对象，因此你可以调用 context.commit 提交一个 mutation，或者通过 context.state 和 context.getters 来获取 state 和 getters。

因为在[分发 action][action]时要使用到`store.dispatch`来触发 action 中的函数，那么我们给 action 对象中的函数定义时需要一个名字，该函数名作为分发 action 的**依据**。此时，该函数的参数对象会**获得与 store 实例相同的方法和实例**，而且因为有 ES6 的[解构赋值][destructuring]的存在，那么之前注册 actions 选项的代码与下面的代码等价：

```js
actions: {

  /**
   * 默认的 action 对象中的函数的参数对象将获得与 store 实例相同的方法和属性（容器实例
   * 默认有 commit 方法），那么 { commit } 对象是存在有 commit 方法的(因为 ES6 解构
   * 赋值)。commit 不仅仅是属性，还是方法。
   */

  increment ({ commit }) {
    commit('increment')
  }
}
```

### 分发 action

action 通过`store.dispatch`方法触发分发。

```js
store.dispatch('actions 中的回调函数')
```

这里可总结为：
1. action 中函数通过`this.$store.dispatch('xxx')`触发执行。
1. action 中函数内部通过`context.commit('xxx')`触发提交`mutations`

根据 action 本质还是提交 mutation 来说，不直接分发 mutation 的原因在于 mutation 必须是同步执行的。那么，分发 action 的**意义**在于可在 action 内部中**执行异步操作**。

在组件中使用`this.$store.dispatch('xxx')`分发 action，或者使用`mapActions`辅助函数将组件的 methods 映射为 `store.dispatch` 调用（需要先在根节点注入 store ）：

```js
import { mapActions } from 'vuex'

export default {
  // ...
  methods: {
    ...mapActions([
      // 将 `this.increment()` 映射为 `this.$store.dispatch('increment')`
      'increment',

      // `mapActions` 也支持载荷：
      // 映射为 `this.$store.dispatch('incrementBy', amount)`
      'incrementBy'
    ]),
    ...mapActions({
      // 将 `this.add()` 映射为 `this.$store.dispatch('increment')`
      add: 'increment'
    })
  }
}
```

### 组合 action

前文提到，action 对象内部可执行异步操作，那么如何知道其对象内部的处理函数何时执行结束？
因为只有知道执行结束才能组合其他 action 中的处理函数，用于处理复杂的异步情况。

首先，必须明白`store.dispatch`可以处理 被触发的 action 内部的处理函数返回的 Promise，简而言之，`store.dispatch`**可以**处理 Promise。并且`store.dispatch`方法本身仍旧**返回 Promise 对象**。

```js
actions: {
  actionA ({ commit }) {
    return new Promise((resolve, reject) => { // actionA 函数返回一个 Promise
      setTimeout(() => {
        commit('someMutation')
        resolve()
      }, 1000)
    })
  }
}

// store.dispatch 方法可处理 Promise 对象，那么有以下代码成立
store.dispatch('actionA').then(() => {
  // ...
})

// store.dispatch 方法可处理 Promise 对象且本身返回 Promise ，那么可在 action 中可以
// 调用其他的 action
actions: {
  // ...
  actionB ({ dispatch, commit }) {
    return dispatch('actionA').then(() => {
      commit('someOtherMutation')
    })
  }
}
```

因为有进化版的 Promise，即[async/await][async]，aysnc 函数本身返回一个 Promise 对象，那么我们可以据此组合 action：

```js
// 假设 getData() 和 getOtherData() 返回的是 Promise

actions: {
  async actionA ({ commit }) {
    commit('gotData', await getData())
  },
  async actionB ({ dispatch, commit }) {
    await dispatch('actionA') // 等待 actionA 完成
    commit('gotOtherData', await getOtherData())
  }
}
```

## module —— 将 store 分割成模块

每个模块可拥有自己的 store 容器，其中包含属于自己模块的 state、mutation、action、getter。store 容器中可使用 module 选项来**包含其他模块的 store 容器**。

### 模块内的局部状态

对于模块内部的 mutation 和 getter，接收的第一个参数是模块的**局部状态对象**。

```js
const moduleA = {
  state: { count: 0 },
  mutations: {
    increment (state) {
      // 这里的 `state` 对象是模块的局部状态，指向 state: { count: 0 }
      state.count++
    }
  }
}
```

对于模块内部的 action，局部状态通过`context.state`暴露出来，根节点状态则为`context.rootState`（参数对象简写成以下代码格式的原因见 Action 章节简介）：

```js
const moduleA = {
  // ...
  actions: {
    // state 是局部状态，commit 是提交 mutation 的方法，rootState 是根节点状态
    incrementIfOddOnRootSum ({ state, commit, rootState }) {
      if ((state.count + rootState.count) % 2 === 1) {
        commit('increment')
      }
    }
  }
}
```

对于模块内部的 getter，根节点状态会作为第三个参数暴露出来：

```js
const moduleA = {
  // ...
  getters: {
    // state 是模块内的局部状态，getters 是调用其他的 getter，rootState 是根节点状态
    sumWithRootCount (state, getters, rootState) {// 这里是三个参数，而不是一个对象
      return state.count + rootState.count
    }
  }
}
```

### 命名空间

默认情况下，模块内部的 action、mutation 和 getter 是注册在**全局**命名空间的。

通过在 module 选项中添加`namespaced: true`来使模块成为成为**命名空间模块**，当模块被注册之后，它所有的 `getters`、`actions`、`mutations` 都会自动根据模块注册的路径**调整**命名。

```js
new Vuex.Store({
  modules: {
    moduleA: {
      // namespaced 选项限定了模块下的 mutations 和 actions 的命名空间（作用域）
      namespaced: true
      //...
      mutations: {
        getSomeState (state) {
          // ...
        }
      }
    }
  }
})
```

在以上示例中，`namespaced` 选项限定了当前模块下的 `getters` 和 `mutations` 和 `actions` 的命名空间（或者理解为作用域），使得要调用它们必须先调用它们的模块。即 `this.$store.commit('moduleA/getSomeState')`。

```js
// 组件内
...mapMutations([
  'moduleA/getSomeState'
])

// 调用 Mutations
this['moduleA/getSomeState']()
```

或者在组件中另外定义名称

```js
// 组件内
...mapMutations({
  getSomeState: 'moduleA/getSomeState'
})

// 调用 Mutations
this.getSomeState()
```

设置命名空间的好处是，可在不同的模块之间取**同名**的 `mutations` 等函数而不会冲突，它们也会获取自己命名空间的 `state`。

#### 命名空间内访问全局内容

特别地，在命名空间内，`rootState` 和 `rootGetters` 将作为**第三**和**第四**参数传入 `mutations`，在 `actions` 中作为 `context` 的属性传入，那么可在命名空间内调用 `rootState` 和 `rootGetters` 得到全局的 `state` 和 `getters`。

在命名空间内调用全局的 `mutations` 和 `actions` 时，**必须**添加第三参数 `{ root: true }` 来调用全局函数。否则调用的是命名空间内的函数。
```js
new Vuex.Store({
  modules: {
    moduleA: {
      // namespaced 选项限定了模块下的 mutations 和 actions 的命名空间（作用域）
      namespaced: true
      //...
      actions: {
        getMoreState: {
          // context 包含了命名空间的所有 state, getters, mutations, actions,
          // dispatch, commit, rootState, rootGetters
          // 或根据需要写成形如 { commit } 的形式
          handler (context) {
            // ...

            // 调用命名空间的 someOtherAction
            context.dispatch('someOtherAction')

            // 调用全局空间中的 someOtherAction，载荷为 null，即没有载荷
            context.dispatch('someOtherAction', null, { root: true })
          }
        }
      }
      // ...
    }
  }
})
```

#### 命名空间内注册全局 action

在注册时，添加 `root: true` 选项。

```js
new Vuex.Store({
  modules: {
    moduleA: {
      // namespaced 选项限定了模块下的 mutations 和 actions 的命名空间（作用域）
      namespaced: true
      //...
      actions: {
        getMoreState: {
          root: true,
          // context 包含了命名空间的所有 state, getters, mutations, actions, 
          // dispatch, commit, rootState, rootGetters
          handler (context) {
            // ...
          }
        }
      }
      // ...
    }
  }
})
```

#### 兄弟命名空间调用

```js
new Vuex.Store({
  modules: {
    moduleA: {
      namespaced: true,
      //...
      mutations: {
        getSomeState (state) {
          // ...
        }
      }
      // ...
    },

    moduleB: {
      namespaced: true,
      actions: {
        editModuleAState ({ commit }) {
          // 补全命名空间路径，并指明 { root: true }
          commit('moduleA/getSomeState', someDate, { root: true })
        }
      }
    }
  }
})
```

由示例可知，兄弟命名空间的调用可通过全局调用 `{ root: true }` 来完成。

[mapState]:https://vuex.vuejs.org/zh-cn/state.html

[mapGetters]:https://vuex.vuejs.org/zh-cn/getters.html

[action]:https://vuex.vuejs.org/zh-cn/actions.html

[destructuring]:http://es6.ruanyifeng.com/#docs/destructuring#%E5%87%BD%E6%95%B0%E5%8F%82%E6%95%B0%E7%9A%84%E8%A7%A3%E6%9E%84%E8%B5%8B%E5%80%BC

[async]:http://es6.ruanyifeng.com/#docs/async
