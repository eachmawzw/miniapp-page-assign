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
    console.log(this.$route.pagePath) //当前小程序页面路径
    console.log(this.$route.query)  //当前小程序页面参数
    console.log(this.$route.pageLen)  //当前小程序页面栈位置
    console.log(this.$route.fromPagePath)  //上一个小程序页面路径
    console.log(this.$route.fromQuery)  //上一个小程序页面参数
    console.log(this.$route.fromPageLen)  //上一个小程序页面栈位置
    console.log(this.$route.scene)  // 进入页面场景值
    console.log(this.$route.shareTicket) // 进入页面带上的shareTicket
    console.log(this.$route.referrerInfo) // 进入小程序带上的卡券信息
    this.setData({
      FibonacciArr: [0, 1]
    });
    // other code
  },
  methods: {
    tapPush () {
      let fibonacciArr = this.$data.FibonacciArr;
      let len = fibonacciArr.length;
      fibonacciArr[len] = fibonacciArr[len-1] + fibonacciArr[len-2];
      this.$data.FibonacciArr = fibonacciArr;
    }
  }
}));