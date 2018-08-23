import {setRoute, pageAssign} from './utils/miniapp-page-assign';
App({
  onShow: function (options) {
    // 保存进入页面的信息
    setRoute(options);
  },
  onLaunch: function () {
    // 注册simpleAssign到wx全局
    wx.pageAssign = pageAssign;
  }
});
