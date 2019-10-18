// components/InputDialog/InputDialog.js
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
    numberValue: {
      type: Number,
      value: 20
    },
    textValue: {
      type: String,
      value: ''
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
    type:{
      type: String,
      value: 'number'
    },
    warn: {
      type: String,
      value: ''
    }
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
    inputOver: function (e) {
      if (this.data.type == 'number') {
        this.data.numberValue = e.detail.value
      } else if (this.data.type == 'text') {
        this.data.textValue = e.detail.value
      }
    },
    confirm: function () {
      if (this.data.type == 'number') {
        console.log('numberValue' + this.data.numberValue)
        if ((this.data.numberValue > this.properties.max) 
          || (this.data.numberValue < this.properties.min)
          || (!this.data.numberValue)) {
          wx.showToast({
            icon: 'none',
            title: language.inputTitle0,
          })
        } else {
          this.hideMask();
          this.data.numberValue = parseFloat(parseFloat(this.data.numberValue).toFixed(this.properties.toFixed))
          var mDetail = { value: this.data.numberValue }
          this.triggerEvent('_dragInput', mDetail, {})
        }
      } else if (this.data.type == 'text') {
        if (this.data.textValue.length) {
          this.hideMask();
          var mDetail = { value: this.data.textValue }
          this.triggerEvent('_dragInput', mDetail, {})
        } else {
          wx.showToast({
            icon: 'none',
            title: language.inputTitle1,
          })
        }
      }
    },
    hideMask: function (e) {
      this.triggerEvent('confirm')
    },
  }
})
