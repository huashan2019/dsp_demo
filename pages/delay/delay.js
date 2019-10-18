// pages/delay/delay.js
var config = require("../../utils/config.js");
const app = getApp()
var language = app.Data.language;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    language: language,
    mainColor: app.Data.mainColor,
    channelMute: app.Data.dsp_data.Mute,
    channelOutName: app.Data.channel_out_name,
    button_position: config.button_position,
    uniteFlag: 0,
    uniteList:[
      { 'name': language.millisecond, 'ratio': 48 },    ///毫秒
      { 'name': language.centimeter,  'ratio': 48 / 34 },  /*厘米*/
      { 'name': language.inch,        'ratio': 48 / 34 * 2.54 }/*英寸*/
    ],
    delayData: app.Data.dsp_data.DelayData,
    isShowDialog: 0,///0-不显示 1/2-Freq 3/4-Q 5-boost
    dialog_id: 0,
  },
  /**
   * 页面数据更新
   */
  updataShow: function () {
    this.data.delayData = app.Data.dsp_data.DelayData
    this.data.channelMute =  app.Data.dsp_data.Mute,
    this.setData({
      delayData: this.data.delayData,
      channelMute: this.data.channelMute
    })
  },

  uniteChoose: function(e){
    this.data.uniteFlag = e.currentTarget.id
    this.setData({
      uniteFlag: this.data.uniteFlag
    })
  },
  muteChange: function (e) {
    console.log(e.currentTarget.id)
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x08
    buffer[2] = 1 + parseInt(e.currentTarget.id)
    buffer[3] = this.data.channelMute[e.currentTarget.id] ? 0x01 : 0x00
    app.BLE_TxData(buffer, function () {
      console.log('ok: muteChange ')
    }, function () {
      console.log('fail: muteChange ')
    })
  },
  getDelayData: function (){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x85
    for (let index in this.data.delayData){
      buffer[2] = 1 + parseInt(index)
      app.BLE_TxData(buffer, function () {
        console.log('ok: getDelayData ')
      }, function () {
        console.log('fail: getDelayData ')
      })
    }
  },
  DelayDataTx: function (id){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x05
    buffer[2] = 1 + parseInt(id)
    buffer[3] = this.data.delayData[id] >> 8 & 0xff
    buffer[4] = this.data.delayData[id] & 0xff
    buffer[5] = 0x00
    app.BLE_TxData(buffer, function () {
      console.log('ok: DelayDataTx ')
    }, function () {
      console.log('fail: DelayDataTx ')
    })
  },
  delayChange: function (e) {
    console.log('delayChange')
    this.data.isShowDialog = 1
    this.data.dialog_id = e.currentTarget.id
    this.setData({
      isShowDialog: this.data.isShowDialog,
      dialog_id: this.data.dialog_id
    })
  },
  confirmDelay: function (e) {
    console.log('---' + e.detail.value)
    this.data.delayData[this.data.dialog_id] = e.detail.value
    this.setData({
      delayData: this.data.delayData
    })
    this.DelayDataTx(this.data.dialog_id)
  },
  hideMask: function (e) {
    this.data.isShowDialog = 0
    this.setData({
      isShowDialog: this.data.isShowDialog
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: language.delayBarTitle
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('Delay-onShow')
    this.updataShow();
    if (app.Data.isBleWork == true) {
      if (app.Data.dsp_data.UpdataFlag.Delay == false) {
        this.synchronousData()
      }
    }
    var that = this
    wx.onBLECharacteristicValueChange(function (res) {
      ///console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
      app.judgeMcuData(res.value, backData => {
        that.processMcuData(backData)
      })
    })
  },
  processMcuData: function (backData) {
    console.log('回调函数执行')
    if (backData.length) {
      for (let item of backData) {
        switch (item) {
          case '0':
            this.updataShow();
            break;
          case '1':
            wx.hideLoading();
            break;
          default: break;
        }
      }
    }
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('onHide')
    this.hideMask()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.synchronousData()
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 同步数据
   */
  synchronousData: function () {
    console.log('synchronousData')
    if (app.Data.isBleWork == true) {
      app.Data.dsp_data.UpdataFlag.Delay = true
      wx.showLoading({ title: '加载中...', mask: true })
      this.data.button_position.forEach((item, index) => app.getMuteData(item.id))
      this.getDelayData();
    }
  },
})