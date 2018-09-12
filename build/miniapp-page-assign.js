'use strict';

// 当前代理模式：Proxy、defineProperties
var proxyType = 'Proxy';

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
  if (typeof Proxy == 'undefined') {
    /* 如果当前环境不支持Proxy对象，提示用户升级IOS版本 */
    console.warn('The Proxy is not supported, try to upgrade system.');
    console.warn('If use android, upgrade system version up 4.4.4');
    console.warn('If use IPhone, upgrade system version up 10.2');
    // wx.showModal({
    //   title: '提示',
    //   content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
    // });
    return null;
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

var addProperty = function addProperty(data, self) {
  if (typeof Object.defineProperties == 'undefined') {
    console.warn('The Object.defineProperties is not supported, try to upgrade wechat.');
    wx.showModal({
      title: '提示',
      content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
    });
    return null;
  }

  var _data = JSON.parse(JSON.stringify(data));

  var initProp = function initProp(obj, name) {
    return {
      configurable: true,
      enumerable: true,
      get: function get() {
        if (Object.prototype.toString.call(obj[name]) == '[object Object]') {
          // 如果当前读取的键是对象，
          // 则无法知晓当前是set还是get，
          // 在下一个事件轮询时检查数据有没有变化，
          // 有变化则重新赋值
          var preSave = JSON.stringify(obj[name]);
          setTimeout(function () {
            if (preSave !== JSON.stringify(obj[name])) {
              proxyKeys[0] = name;
              proxyVal = obj[name];
              setData(self);
            }
          }, 0);
        }
        return obj[name];
      },
      set: function set(val) {
        obj[name] = val;
        proxyKeys[0] = name;
        proxyVal = obj[name];
        setData(self);
      }
    };
  };

  var defineProperties = function defineProperties(obj, s_obj, obj_name) {
    var props = {};
    Object.keys(obj).forEach(function (key) {
      props[key] = initProp(s_obj, key);
    });

    return Object.defineProperties(obj, props);
  };

  defineProperties(_data, data);

  return _data;
};

var setLaunchInfo = function setLaunchInfo(launchInfo) {
  wx.$launchInfo = launchInfo;
};

// 设置路由信息，会注册到this上下文和wx全局
var setRoute = function setRoute() {
  var routeInfo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { query: {} };
  var self = arguments[1];

  var router = [];
  var currentPages = getCurrentPages();
  if (currentPages.length > 0) {
    currentPages.forEach(function (page) {
      router.push({
        query: page.options,
        path: page.route
      });
    });
  }

  if (router.length == 0) {
    wx.$route = {};
  }
  if (router.length == 1) {
    wx.$route = router[0];
  } else if (router.length > 1) {
    var fromPage = router[router.length - 2];
    wx.$route = router[router.length - 1];
    wx.$route.fromQuery = fromPage.query;
    wx.$route.fromPath = fromPage.path;
  }

  Object.keys(wx.$launchInfo).forEach(function (key) {
    wx.$route[key] = wx.$launchInfo[key];
  });

  Object.keys(routeInfo).forEach(function (key) {
    wx.$route[key] = routeInfo[key];
  });

  if (self) {
    self.$route = wx.$route;
  }
};

var getPagePostion = function getPagePostion() {
  var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'pages/index/index';

  // 获取当前指定页面滚动位置
  var pagePosition = wx.getStorageSync('pagePosition');
  if (!pagePosition[page]) {
    return {};
  }
  return pagePosition[page];
};

var updatePagePosition = function updatePagePosition() {
  var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'pages/index/index';
  var init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var pagePosition = wx.getStorageSync('pagePosition');
  if (!pagePosition) {
    pagePosition = {};
  }
  if (!pagePosition[page]) {
    pagePosition[page] = {};
  }

  if (init) {
    pagePosition[page]['scrollTop'] = 0;
    pagePosition[page]['maxScrollTop'] = 0;
    wx.setStorageSync('pagePosition', pagePosition);
  } else {
    wx.createSelectorQuery().selectViewport().scrollOffset(function (position) {
      var scrollTop = position.scrollTop;
      var maxScrollTop = pagePosition[page]['maxScrollTop'] || 0;
      if (scrollTop > maxScrollTop) {
        maxScrollTop = scrollTop;
      }
      pagePosition[page]['scrollTop'] = scrollTop;
      pagePosition[page]['maxScrollTop'] = maxScrollTop;

      wx.setStorageSync('pagePosition', pagePosition);
    }).exec();
  }
};

var scrollToPosition = function scrollToPosition() {
  var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'pages/index/index';

  wx.pageScrollTo({ scrollTop: getPagePostion(page).scrollTop });
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
   * 禁止一些被使用的方法名
   * onModel 监听数据更新，双向绑定
   * getPagePostion 获取页面位置
   * updatePagePosition 更新页面位置
   * scrollToPosition 滚动至页面位置
   * checkVersion 检查小程序版本
  */
  var glbalMethods = ['onModel', 'getPagePostion', 'updatePagePosition', 'scrollToPosition', 'checkVersion'];

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
  var forbidMethods = [].concat(callbackList).concat(glbalMethods);
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
    proxyType = 'Proxy';
    if (!this.$data) {
      // 当前环境不支持Proxy
      this.$data = addProperty(this.data, this);
      proxyType = 'defineProperties';
    }
    if (!this.$data) {
      // 当前环境不支持Object.defineProperties
      this.$data = {};
    }

    /* 更新路由信息 */
    this.setRoute({ query: options }, this);

    if (this._onLoad) {
      this._onLoad(options);
    }
  };

  this.onShow = function () {
    // 微信小程序的页面并不会被销毁，在点击返回按钮时，需要更新路由信息
    this.setRoute({ query: this.options, path: this.route });

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
        title: '这是一个分享标题',
        path: '/pages/index/index'
      };
    }
  };

  this.onPageScroll = function (obj) {
    // 页面滚动时记录页面位置
    updatePagePosition(this.$route.pagePath);

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
    if (proxyType == 'Proxy') {
      this.$data[key] = value;
    } else {
      proxyKeys = key.split('.');
      proxyVal = value;
      setData(this);
    }
  };

  // 注册setRoute
  this.setRoute = setRoute;
  // 注册获取页面位置方法
  this.getPagePostion = getPagePostion;
  // 注册更新页面位置方法
  this.updatePagePosition = updatePagePosition;
  // 注册滚动至页面位置方法
  this.scrollToPosition = scrollToPosition;
  // 注册检查小程序版本方法
  this.checkVersion = checkVersion;
};

module.exports = {
  setLaunchInfo: setLaunchInfo,
  setRoute: setRoute,
  pageAssign: pageAssign,
  checkVersion: checkVersion
};