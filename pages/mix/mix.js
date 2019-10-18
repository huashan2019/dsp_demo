// pages/mix/mix.js
var config = require("../../utils/config.js");
const app = getApp()
var language = app.Data.language;
var windowWidth = app.Data.sysInfo.windowWidth;
var windowHeight = app.Data.sysInfo.windowHeight;
var all_MixData_list = app.Data.dsp_data.MixData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    channel_scroll: {
      channels: app.Data.channels,
      label_width: Math.max(windowWidth / app.Data.channel_out_num, 70),
      bg_color: app.Data.mainColor,
      channelVal: 0,
    },
    mainColor: app.Data.mainColor,
    scroll_height: windowHeight - 45,
    scroll_width: windowWidth - 20,
    channel_in_slider_width: windowWidth-180,
    channel_in_height: Math.max((windowHeight-145)/10, 75),
    channel_in_list: all_MixData_list[0].slice(0, config.channel_in_num),
  },
  /**
   * 页面数据更新
   */
  updataShow: function () {
    this.data.channel_in_list = all_MixData_list[this.data.channel_scroll.channelVal].slice(0, config.channel_in_num);
    this.setData({
      channel_in_list: this.data.channel_in_list
    })
  },
  /**---
   * 切换通道
   */
  radioCheckedChange: function (e) {
    this.data.channel_scroll.channelVal = e.detail.value
    this.setData({
      channel_scroll: this.data.channel_scroll
    })
    this.updataShow();
    if (app.Data.isBleWork == true) {
      if (app.Data.dsp_data.UpdataFlag.Mix[this.data.channel_scroll.channelVal] == false) {
        this.synchronousData()
      }
    }
  },
  bindScrollMix: function(){
    console.log('bindScrollMix')
  },
  /**
   * 混音数据发送
   */
  getMixData: function(){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x82
    buffer[2] = 1 + parseInt(this.data.channel_scroll.channelVal)
    app.BLE_TxData(buffer, function () {
      console.log('ok: getMixData')
    }, function () {
      console.log('fail: getMixData')
    })
  },
  MixDataTx: function(){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x02
    buffer[2] = 1 + parseInt(this.data.channel_scroll.channelVal)
    buffer[3] = 144
    this.data.channel_in_list.forEach((item, index) => buffer[index + 4] = Math.round(item.vol))
    app.BLE_TxData(buffer, function () {
      console.log('ok: MixDataTx')
    }, function () {
      console.log('fail: MixDataTx')
    })
  },
  /**---
   * 调节混音值---进度条
   */
  changeSlider: function (e) {
    this.data.channel_in_list[e.currentTarget.id].vol = e.detail.value * 1.44
    this.setData({
      channel_in_list: this.data.channel_in_list
    })
    this.MixDataTx()
  },
  changingSlider: function (e) {
    this.data.channel_in_list[e.currentTarget.id].vol = e.detail.value * 1.44
    this.setData({
      channel_in_list: this.data.channel_in_list
    })
  },
  /**---
   * 调节混音值---加减按键
   */
  setVolumeUp: function (e) {
    this.data.channel_in_list[e.currentTarget.id].vol += 1.44;
    this.data.channel_in_list[e.currentTarget.id].vol = Math.min(144, this.data.channel_in_list[e.currentTarget.id].vol)
    this.setData({
      channel_in_list: this.data.channel_in_list
    })
    this.MixDataTx()
  },
  setVolumeDown: function (e) {
    this.data.channel_in_list[e.currentTarget.id].vol -= 1.44;
    this.data.channel_in_list[e.currentTarget.id].vol = Math.max(0, this.data.channel_in_list[e.currentTarget.id].vol)
    this.setData({
      channel_in_list: this.data.channel_in_list
    })
    this.MixDataTx()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(windowWidth);
    console.log(windowHeight);
    console.log(app.Data.channels)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log('混音--页面初次渲染完成')
    wx.setNavigationBarTitle({
      title: language.mixBarTitle
    })
  },
  /**
   * 同步数据
   */
  synchronousData: function () {
    console.log('synchronousData')
    if (app.Data.isBleWork == true) {
      app.Data.dsp_data.UpdataFlag.Mix[this.data.channel_scroll.channelVal] == true
      wx.showLoading({ title: '加载中...', mask: true })
      this.getMixData()
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('Mix-onShow')
    this.data.channel_scroll.channels = app.Data.channels;
    this.setData({
      channel_scroll: this.data.channel_scroll
    })
    this.updataShow();
    var that = this
    if (app.Data.isBleWork == true) {
      if (app.Data.dsp_data.UpdataFlag.Mix[this.data.channel_scroll.channelVal] == false) {
        this.synchronousData()
      }
    }
    wx.onBLECharacteristicValueChange(function (res) {
      ///console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
      app.judgeMcuData(res.value, backData => {
        that.processMcuData(backData)
      })
    })
  },
  processMcuData: function (backData) {
    console.log('回调函数执行')
    app.Data.dsp_data.UpdataFlag.Mix[this.data.channel_scroll.channelVal] = true
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

  }
})