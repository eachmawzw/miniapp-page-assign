# 微信小程序注册页面中间件

## Install

npm install miniapp-page-assign

## Usage

由于微信小程序的import模块从node_modules目录引入文件会有问题，可以直接下载miniapp-page-assign.js（build目录下）放到/utils文件夹下。

In app.js
```
import {setRoute, pageAssign} from './utils/miniapp-page-assign';
App({
  mixin: [],
  onShow: function (options) {
    // 保存进入页面的信息
    setRoute(options);
    // ...other code
  },
  onLaunch: function () {
    // 注册simpleAssign到wx全局
    wx.pageAssign = pageAssign;
    // ...other code
  }
  // ...other code
});
```

In index/index.js （或者任意小程序页面）
```
Page(new wx.pageAssign({
  data: {
    
  },
  // 微信注册页面生命周期函数、事件处理函数
  // 包括onLoad, onShow, onReady, onHide, onUnload, onPullDownRefresh, onReachBottom, onShareAppMessage, onPageScroll, onTabItemTap
  onLoad: funtion (options) {
  },
  // others
  methods: {
    // 自定义事件
  }
}));
```


## API
### 使用this.$data代理this.data
```
// 原生小程序语法：
this.setData({key: 'value'});
// 中间件用法：
this.$data.key = 'value';
```

### 使用this.$route访问页面路由信息
访问当前route可以得到当前的页面路由，传参和上一个页面的路由

在app.js中调用的
`setRoute(options);`
是很重要的一步，它用于保存用户进入小程序的场景值、shareTicket等信息

```
// other code
onLoad () {
  console.log(this.$route.pagePath) //当前小程序页面路径
  console.log(this.$route.query)  //当前小程序页面参数
  console.log(this.$route.pageLen)  //当前小程序页面栈位置
  console.log(this.$route.fromPagePath)  //上一个小程序页面路径
  console.log(this.$route.fromQuery)  //上一个小程序页面参数
  console.log(this.$route.fromPageLen)  //上一个小程序页面栈位置
  console.log(this.$route.scene)  // 进入页面场景值
  console.log(this.$route.shareTicket) // 进入页面带上的shareTicket
  console.log(this.$route.referrerInfo) // 进入小程序带上的卡券信息
  // other code
},
```
> Tip
>- 页面跳转的两个页面必须都使用wx.pageAssign注册
>- 页面场景值，shareTicket，卡券信息等只会在特殊的情况进入小程序才会获得，具体参考小程序文档

### 使用mixin
在框架中，允许使用mixin引用外部定义的公共数据和方法
```
// common.js
export default {
  data: {
    hello: 'hello world'
  },
  methods: {
    sayHello: function () {
      console.log(this.$data.hello);
    }
  }
}

// index.js
import commonMixin from 'common';
Page(new wx.pageAssign({
  mixin: [commonMixin],
  data: {
    demoVal: 'demo',
    demoObj: {
      val: 'demoObj'
    },
    FibonacciArr: []
  },
  onLoad () {
    this.sayHello();
    // other code
  },
}));
```

### this.onModel方法双向绑定数据
在页面标签上添加data-key和data-value,然后在触发更新的事件上绑定onModel方法，一些原生组件则不需要添加data-value，具体用法如下
```
<!-- index.wxml -- >
<view>测试数据:{{demoVal}}</view>  

<input 
  value="{{demoVal}}" 
  data-key="demoVal" 
  bindinput="onModel"></input>

<textarea
  value="{{demoVal}}" 
  data-key="demoVal" 
  bindinput="onModel"></textarea>

<button 
  data-key="demoVal" 
  data-value="hello world" 
  bindtap="onModel">设置value为“hello world”</button>
  
<view>测试数据2:{{demoObj.val}}</view>  

<input 
  class="border"
  value="{{demoObj.val}}" 
  data-key="demoObj.val" 
  bindinput="onModel"></input>
```

```
// index.js
data: {
  demoVal: 'demo',
  demoObj: {
    val: 'demoObj'
  }
}
```

## Introduction
为什么使用它？
如果你是使用的原生小程序做开发，使用miniapp-page-assign，你可以获得以下好处

### 无需重新选择其他架构，比如mpvue
如果你的小程序使用原生小程序开发到一半，此时你重构使用mpvue可能成本过高，或者使用新的框架会有很多坑。但如果是构建新项目，还是推荐mpvue，毕竟好用的多。

### 可以即插即用，并不影响原生小程序的结构和用法
this.$data使用的是Proxy对象代理this.data,它可以和this.setData共存。并且你可以在新的页面引入和使用这套中间件（但是路由信息需要手动控制）。

### 对整个页面的生命周期或方法进行了一次封装
这将是一个巨大的好处，比如分享，你甚至可以在所有的页面定制同一个分享内容，或者根据参数定制分享内容，而无需在每一个小程序页面定制onShareAppMessage方法，只要你稍稍阅读一下源码就能发现其中的好处。比如你想要在所有的页面分享调用微信的自定义数据统计，你也可以直接在源码中修改。

### 使用mixin
mixin允许你从外部引入一些公用的data和methods，这将大大的减少代码量，因为你可以抽取很多的公用方法。

### 更多功能
正在整理开发中

### 欢迎拍砖
请轻拍～
