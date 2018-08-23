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