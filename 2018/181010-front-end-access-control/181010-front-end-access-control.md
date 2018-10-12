---
title:  "权限控制的实现"
date:   2018-10-10
author: "Bowen"
tags:
    - 前端开发
---

## 基于 vue-router 的前端路由权限控制

在常见的中台 `dashboard` 业务实现中，必不可少的权限控制需求。现阶段，`SPA` 应用下的权限路由控制，是经由前端路由结合后端的权限验证来实现。

基本思路是：

1. 若本地存储中存在 `token` 则进入第二步，否则获取当前用户的 `token`。

2. 验证当前用户的 `token` 以获得当前用户的 `access`，并以 `role` 变量临时存储该 `access`。

    - 此处值得注意的是，我们将用户登陆与获取用户的 `access` 操作是分离开来，这样利于功能解耦。在用户登陆时，仅返回用户对应的 `token`。

3. 根据之前获得的 `role` 过滤本地的 `dynamic routes map`（一个初始路由表，并不参与初始路由的构建） 来获得当前用户可访问的路由表动态私有部分。

4. 将过滤后私有的动态路由表和本地公有的静态路由表合并组成最终的全局路由表（或者服务端动态返回当前用户的路由表并与本地的静态路由表合并形成最终路由表）。

5. 根据生成的全局路由表，使用递归组件实现路由列表的动态渲染。

## 权限控制的基本实现

```js
import commonRoutes from 'ROUTER/routes/common'
const LOGIN_PATH = '/login'

// 前端路由的全局前置导航守卫
router.beforeEach((to, from, next) => {
  // 过滤特定页面的权限检测，如首页，登陆页等
  if (to.path === '/') {
    next()
    return
  }

  // 验证本地存储是否存在相应的 token，即判断用户是否已经登陆
  if (getTokenFromLocal()) {
    if (!store.getters['login/role'].length) {
      store.dispatch('login/fetchUserRole')
        .then({ data } => {
          store.commit('login/SET_ROLE', data.role)
          return data.role
        })

        // 通过响应的数据 role 来过滤私有动态路由表，形成当前用户的私有路由表 addRoutes
        .then(role => store.dispatch('login/createExtraRoutes', role))

        // 添加私有路由表至全局路由表中，并存储于临时变量 store.state.login.routes 中
        // 借助 router.addRoutes(store.state.login.routes) 实现动态添加路由表
        .then(() => store.dispatch(
          'login/createGlobalRoutes',
          store.getter['login/addRoutes']
        ))
        .catch(console.error)

        // 路由递归组件中存在对 store.state.login.routes 的依赖，那么递归组件此时将动
        // 态渲染出当前用户的有效路由
    }
  } else {
    // 无法获取当前用户 token 时，重定向至登陆页
    next({
      path: `${LOGIN_PATH}?${to.path}`,
      replace: true
    })
  }
})
```

## 响应数据的动态路由表的合并

```js
import router from 'ROUTER' // ROUTER is an alias name
const ADMINISTRATOR = 'admin'

export default {
  /**
   * @description 根据服务端响应的 access 来过滤前端动态路由表
   * @param {String[]} role 服务端响应的当前用户 access
   */
  createExtraRoutes ({ commit }, role) {
    // 在当前用户获得 `admin` 时，将默认获取所有的私有动态路由，即跳过动态路由过滤
    const addRoutes = role.includes(ADMINISTRATOR)
      ? dynamicRoutes
      : filterRoutes(dynamicRoutes, role)

    commit('SET_ADD_ROUTES', addRoutes)
  },
  createGlobalRoutes ({ commit, dispatch }, addRoutes) {
    // SET_ROUTES is a mutation type in module `login`
    /**
     * 1. 将过滤后的 addRoutes 与静态公有路由表合并为全局的最终路由表
     * 2. SET_ROUTES mutation 将在当前会话中临时存储动态的私有路由表 addRoutes 和
     * 全局最终的路由表 routes，全局的 routes 将用于递归组件的 UI 渲染，addRoutes 将
     * 用于传入 router.addRoutes 添加路由
     */
    commit('SET_ROUTES', addRoutes)
    router.addRoutes(addRoutes)
  }
}

/**
 * @param {Object[]} routes 路由表
 * @param {String[]} role 服务端响应的当前用户 access
 */
function filterRoutes (routes, role) {
  const formatRoutes = []
  routes.forEach(route => {
    // 使用副本传递，而非引用，避免引用同一路由对象
    const routeCopy = { ...route }
    if (hasAccess(route, role)) {
      if (route.children && route.children.length !== 0) {
        routeCopy.children = filterRoutes(routeCopy.children, role)
      }
      formatRoutes.push(routeCopy)
    }
  })
}

/**
 * @param {Object} route 单个路由
 * @param {String[]} role 服务端响应的当前用户 access
 */
function hasAccess (route, role) {
  // 当在预设默认动态路由表中不存在 meta.role 设置时，将默认为对所有权限开放
  return role.meta && Array.isArray(role.meta.role)
    ? role.some(item => route.meta.role.includes(item))
    : true
}
```

在前端路由的全局前置导航守卫 `createExtraRoutes` 被调用时，将过滤当前用户的私有列表，并相继调用创建全局最终路由表的 `createGlobalRoutes` 的 `actions` 得到最终的全局路由表 `routes` 和私有列表 `addRoutes`。在前端路由中 `vue-router` 在初始化路由实例之后，支持通过调用实例方法 `router.addRoutes` 来向当前路由表添加私有列表 `addRoutes`。而之前合并生成的的全局路由表此时也与路由实例中的路由表保持了同步，并且此时临时存储在 `vuex` 中的全局路由表在后续将被递归组件调用，形成动态的路由列表渲染。

## 动态渲染路由列表

在经过上节的路由表合并之后，将结果路由表存储在 `store.state.login.routes` 中。在多个递归组件中注入 `routes` 路由表的单项，即可实现动态渲染出动态 `aside menu`。

循环生成多个递归组件，通过 `props` 注入向单个递归组件注入对应单个 `route` ，以实现递归渲染子列表。

```html
<!-- Aside.vue -->
<template>
  <!-- 只列出关键 props -->
  <el-menu
    :router="true"
  >
    <recursive-list
      v-for="route of routes"
      :key="route.path"
      :route="route"
      :basic-route="route.path"
    ></recursive-list>
  </el-menu>
</template>

<script>
import RecursiveList from '@/RecursiveList'
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('login', [
      'routes'
    ])
  }
}
</script>
```

在递归组件内部实现以下递归渲染逻辑：

```html
<template>
  <!-- meta.hidden 用于自定义需要排除渲染的列表项 -->
  <div class="list-item__wrapper" v-if="!route.meta.hidden">
    <template v-if="!route.children">
      <el-menu-item
        :index="resolvePath(route.path)"
      >{{route.meta.title}}</el-menu-item>
    </template>

    <el-submenu v-else :index="route.path">
      <!-- 菜单名 -->
      <template slot="title">
        <i class="el-icon-menu"></i>
        <span slot="title">{{route.meta.title}}</span>
      </template>

      <!-- 递归模板，核心 -->
      <template v-for="child of route.children">
      <!-- 当子路由存在子路由时，递归组件 -->
        <recursive-list
          :key="child.path"
          v-if="child.children"
          :route="child"
          :basic-route="resolvePath(child.path)"
        />
        <el-menu-item
          v-else
          :key="child.path"
          :index="resolvePath(child.path)"
        >{{child.meta.title}}</el-menu-item>
      </template>
    </el-submenu>
  </div>
</template>

<script>
// SFC 经 webpack 编译，那么可传入 node 编译环境中的 path 来作为工具函数
import path from 'path'

export default {
  // name 用于递归调用
  name: 'recursive-list',

  props: {
    route: {
      type: Object,
      required: true
    },

    // 用于传递给子组件，拼接子路由
    basicRoute: {
      type: String,
      default: ''
    }
  },

  methods: {
    resolvePath (target) {
      return path.resolve(this.basicRoute, target)
    }
  }
}
</script>
```

## 注销后的全局路由表重置

```js
// login/actions.js

export default {
  // replace 为编程式导航方法，即 router.replace
  // eg. 在 SFC 中以 this.$store.dispatch(
  //  'login/logout',
  // this.$router.replace.bind(this.$router)) 的形式调用
  logout ({}, replace) {
    removeTokenFromLocal()

    // 切换至登陆页
    replace('/login')

    // vue-router v3.0.1 仅支持动态添加路由方法 addRoutes，并不支持删除路由信息
    location.reload()
  }
}
```

值得注意的是，在当前 `vue-router` 版本 `v3.0.1` 中，并未支持动态删除路由。那么要在当前 `tab` 中实现删除路由就必须实现重置全局 `routes map`。另外在用户注销时，需要一并重置本地存储与临时存储（如 `vuex`）。那么，最终用户注销的实现是在调用编程式导航方法 `replace` 切换至目标页之后，调用 `location.reload()`实现全局 `routes map` 与全局状态重置。

另外，若在当前 `APP` 中使用 `sessionStorage` 来存储用户的 `token` 时，需要注意在同一 `tab` 中刷新页面时，不会清空 `sessionStorage`。那么也就是说当调用 `location.reload()` 时，并不会清空本地存储 `sessionStorage`。那么此时需要手动清除 `sessionStorage`。
