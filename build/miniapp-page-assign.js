'use strict';

// 全局定义proxy键值对
var proxyKeys = [];
var proxyVal = '';

// 封装微信setData方法
var setData = function setData(self) {
  if (!self) {
    return;
  }
  if (!self.data) {
    self.data = {};
  }
  if (self.setData) {
    var data = {};
    // 设置setData键
    var keysStr = proxyKeys.join('.');
    // 设置setData值
    data[keysStr] = proxyVal;
    // 调用setData更新数据
    self.setData(data);
    // proxyKeys，proxyVal初始化
    proxyKeys = [];
    proxyVal = '';
  }
};

// Proxy监听set,get方法
var addProxy = function addProxy(obj, self) {
  if (Object.prototype.toString.call(Proxy) == '[object Undefined]') {
    /* 如果当前环境不支持Proxy对象，提示用户升级微信 */
    console.warn('The Proxy is not supported, try to upgrade wechat.');
    wx.showModal({
      title: '提示',
      content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
    });
    return {};
  }
  return new Proxy(obj, {
    get: function get(target, key) {
      if (target[key] && Object.prototype.toString.call(target[key]) == '[object Object]') {
        // 添加proxy键到proxyKeys数组
        proxyKeys.push(key);
        return addProxy(target[key], self);
      } else {
        // 如果是代理访问数据，proxyKeys数组清空
        proxyKeys = [];
        return target[key];
      }
    },
    set: function set(target, key, value) {
      target[key] = value;

      // 添加要代理更新的键到proxyKeys数组
      proxyKeys.push(key);
      // 赋值需要代理更新的值
      proxyVal = value;
      setData(self);

      return true;
    }
  });
};

// 设置路由信息，会注册到this上下文和wx全局
var setRoute = function setRoute() {
  var routeInfo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { query: {} };
  var self = arguments[1];

  // 保存路由信息
  if (wx.$route) {
    Object.keys(wx.$route).forEach(function (key) {
      if (!routeInfo[key]) {
        routeInfo[key] = wx.$route[key];
      }
    });

    // 保存上一个页面参数
    routeInfo.fromQuery = JSON.parse(JSON.stringify(wx.$route.query));
    routeInfo.fromPageLen = wx.$route.pageLen || 0;
    routeInfo.fromPagePath = wx.$route.pagePath || '';
  }

  // 保存当前页面参数
  routeInfo.pageLen = getCurrentPages().length;
  // 保存pathPath
  var page = getCurrentPages().pop();
  var pagePath = void 0;
  if (page) {
    pagePath = page.__route__;
  }
  routeInfo.pagePath = pagePath;

  // 注册到wx全局变量
  wx.$route = routeInfo;
  // 注册到self上下文
  if (self) {
    self.$route = wx.$route;
  }
};

var checkVersion = function checkVersion() {
  if (wx.getUpdateManager) {
    var updateManager = wx.getUpdateManager();
    updateManager.onUpdateReady(function (readyCb) {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: function success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate();
          }
        }
      });
    });
    updateManager.onUpdateFailed(function (failedCb) {
      console.warn('Present version is not now but upgrade fail.');
    });
  } else {
    console.warn('Please update miniapp version more than 1.9.90');
  }
};

var pageAssign = function pageAssign(config) {
  var _this = this;

  /* 初始化config */
  if (!config) config = {};

  /* 初始化data */
  if (Object.prototype.toString.call(config.data) != '[object Object]') {
    config.data = {};
  }

  /* 初始化methods */
  if (Object.prototype.toString.call(config.methods) != '[object Object]') {
    config.methods = {};
  }

  /* 初始化mixin */
  if (!Array.isArray(config.mixin)) {
    config.mixin = [];
  }

  /*
   * 注册页面原生回调
   * onLoad 生命周期回调—监听页面加载
   * onShow 生命周期回调—监听页面显示
   * onReady 生命周期回调—监听页面初次渲染完成
   * onHide 生命周期回调—监听页面隐藏
   * onUnload 生命周期回调—监听页面卸载
   * onPullDownRefresh 监听用户下拉动作
   * onReachBottom 页面上拉触底事件的处理函数
   * onShareAppMessage 用户点击右上角转发
   * onPageScroll 页面滚动触发事件的处理函数
   * onTabItemTap 当前是 tab 页时，点击 tab 时触发
  */
  var callbackList = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload', 'onPullDownRefresh', 'onReachBottom', 'onShareAppMessage', 'onPageScroll', 'onTabItemTap'];

  /*
   * 原生小程序中一些按钮handler
   * bindGetUserInfo 用户点击该按钮时，会返回获取到的用户信息
   * bindContact 客服消息回调
   * bindGetPhoneNumber 获取用户手机号回调
   * bindError 当使用开放能力时，发生错误的回调
   * bindOpenSetting 在打开授权设置页后回调
   * PS: 更多按钮handler待补充
  */
  // const btnHanlder = [
  //   'bindGetUserInfo',
  //   'bindContact',
  //   'bindGetPhoneNumber',
  //   'bindError',
  //   'bindOpenSetting'
  // ];

  /* 添加mixin */
  /* mixin不对函数名进行重名检查，数组后面的mixin会覆盖数组前面的mixin相同的data和methods */
  if (config.mixin.length > 0) {
    config.mixin.forEach(function (mixItem) {
      if (Object.prototype.toString.call(mixItem.data) == '[object Object]') {
        config.data = Object.assign(config.data, mixItem.data);
      }
      if (Object.prototype.toString.call(mixItem.methods) == '[object Object]') {
        config.methods = Object.assign(config.methods, mixItem.methods);
      }
    });
  }

  /* 注册自定义事件 */
  var forbidMethods = [].concat(callbackList);
  // const forbidMethods = [].concat(callbackList).concat(btnHanlder);

  /* 页面原生回调注册 */
  Object.keys(config).forEach(function (item) {
    if (item == 'data') {
      // 初始化微信页面data
      _this.data = config['data'];
    } else if (item == 'methods') {
      Object.keys(config[item]).forEach(function (method) {
        if (forbidMethods.indexOf(method) != -1) {
          console.error('method [' + method + '] is a reserved word');
        } else {
          _this[method] = config[item][method];
        }
      });
    } else if (item == 'mixin') {
      /* no thing */
    } else {
      if (forbidMethods.indexOf(item) != -1) {
        /* 注册页面原生回调 */
        _this['_' + item] = config[item];
      } else {
        /* 页面中其他全局函数 */
        console.warn('method [' + item + '] is suggest register in methods');
        _this[item] = config[item];
      }
    }
  });

  // 注册页面原生回调中间件
  this.onLoad = function (options) {
    /* 添加Proxy代理data */
    this.$data = addProxy(this.data, this);

    /* 更新路由信息 */
    setRoute({ query: options }, this);

    if (this._onLoad) {
      this._onLoad(options);
    }
  };

  this.onShow = function () {
    if (this._onShow) {
      this._onShow();
    }
  };

  this.onReady = function () {
    if (this._onReady) {
      this._onReady();
    }
  };

  this.onHide = function () {
    if (this._onHide) {
      this._onHide();
    }
  };

  this.onUnload = function () {
    if (this._onUnload) {
      this._onUnload();
    }
  };

  this.onPullDownRefresh = function () {
    if (this._onPullDownRefresh) {
      this._onPullDownRefresh();
    }
  };

  this.onReachBottom = function () {
    if (this._onReachBottom) {
      this._onReachBottom();
    }
  };

  this.onShareAppMessage = function (obj) {
    if (this._onShareAppMessage) {
      return this._onShareAppMessage(obj);
    } else {
      return {
        title: '集合派',
        path: '/pages/index/index',
        imageUrl: 'https://jihepai-pro.oss-cn-hangzhou.aliyuncs.com/static/img/logo-square.jpeg'
      };
    }
  };

  this.onPageScroll = function (obj) {
    if (this._onPageScroll) {
      this._onPageScroll(obj);
    }
  };

  this.onTabItemTap = function (obj) {
    if (this._onTabItemTap) {
      this._onTabItemTap(obj);
    }
  };

  /* onModel用于监听数据更新，需要手动指定key,value值 */
  this.onModel = function (event) {
    if (!event) {
      return;
    }
    var key = event.currentTarget.dataset.key;
    var value = event.currentTarget.dataset.value;
    if (value == undefined) {
      value = event.detail.value;
    }
    if (!key) {
      return;
    }
    this.$data[key] = value;
  };
};

module.exports = {
  setRoute: setRoute,
  pageAssign: pageAssign,
  checkVersion: checkVersion
};