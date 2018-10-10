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

## 动态渲染路由列表

## 响应数据的动态路由表的前端渲染

```js
// actions createExtraRoutes 和 createGlobalRoutes 的实现
```

## 注销后的全局路由表重置
