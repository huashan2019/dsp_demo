// components/SliderDialog/SliderDialog.js
const app = getApp()
var language = app.Data.language;
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isShowDialog: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: ''
    },
    value: {
      type: Number,
      value: 20
    },
    step: {
      type: Number,
      value: 1
    },
    min: {
      type: Number,
      value: 20
    },
    max: {
      type: Number,
      value: 20000
    },
    toFixed: {
      type: Number,
      value: 0
    },
    ratio: {///比例
      type: Number,
      value: 1
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    language: language,
    mainColor: app.Data.mainColor,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    _dragSlidering: function (e) {
      // 有时e.detail.value传上来的值存在好多个小数位需要处理
      var value = e.detail.value.toFixed(this.data.toFixed)
      this.setData({ value: value })
    },
    _dragSlider: function (e) {
      this.data.value = e.detail.value.toFixed(this.data.toFixed)
      this.setData({ value: this.data.value})
      var mDetail = { value: this.data.value }
      this.triggerEvent('_dragSlider', mDetail, {})
    },
    set_dragDown: function (e) {
      var value = this.data.value - this.data.step
      value = value.toFixed(this.data.toFixed)
      value = Math.max(this.data.min, value)
      this.setData({ value: value })
      var mDetail = { value: this.data.value }
      this.triggerEvent('_dragSlider', mDetail, {})
    },
    set_dragUp: function (e) {
      var value = this.data.value + this.data.step
      value = value.toFixed(this.data.toFixed)
      value = Math.min(this.data.max, value)
      this.setData({ value: value })
      var mDetail = { value: this.data.value }
      this.triggerEvent('_dragSlider', mDetail, {})
    },
    hideMask: function (e) {
      this.triggerEvent('confirm')
    },
  }
})
