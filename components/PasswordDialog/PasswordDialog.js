// components/PasswordDialog/PasswordDialog.js
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
  },

  /**
   * 组件的初始数据
   */
  data: {
    password: '',
    language: language,
    mainColor: app.Data.mainColor,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    inputOver: function (e) {
      this.data.password = e.detail.value
    },
    confirm: function () {
      var that = this
      if (this.data.password.length === 4) {
        if (this.data.password == '1979')
        {
          wx.showToast({
            title: language.passwordAuthenticationSuccessful,///密码验证成功
          })
          setTimeout(function () {
            that.hideMask();
            var mDetail = { value: true }
            that.triggerEvent('_dragPassword', mDetail, {})
          }, 500)
        }else{
          wx.showToast({
            icon: 'none',
            title: language.wrongPassword,///'密码错误！',
          })
        }
      } else {
        wx.showToast({
          icon: 'none',
          title: language.pleaseEnter4Digits,///'请输入4位数字',
        })
      }
    },
    hideMask: function (e) {
      this.triggerEvent('confirm')
    },
  }
})
