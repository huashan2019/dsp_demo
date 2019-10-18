// pages/eq/eq.js
var eq_curve = require("../../utils/eq_curve.js");
const app = getApp()
var language = app.Data.language;
var windowWidth=app.Data.sysInfo.windowWidth;
var windowHeight=app.Data.sysInfo.windowHeight;
const all_eq_list = app.Data.dsp_data.EQ_Data;
const all_channel_list = app.Data.dsp_data.Filters_T;
const DefaultLineFreq = [   20, 30, 40, 50, 60, 70, 80, 90, 
                    100, 200, 300, 400, 500, 600, 700, 800, 900,
                1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
Page({

  /**
   * 页面的初始数据
   */
  data: {
    language: language,
    channel_scroll: {
      channels: app.Data.channels,
      label_width: Math.max(windowWidth / app.Data.channel_out_num, 70),
      bg_color: app.Data.mainColor,
      channelVal: 0,
    },
    mainColor: app.Data.mainColor,
    canvas_height: 160,
    canvas_width: windowWidth - 40,
    eq_scroll_height: windowHeight - 315,
    eq_boost_lists: [
      12,9,6,3,0,-3,-6,-9,-12
    ],
    eq_name:{
      id: language.eq_id, freq: language.eq_freq, q: language.eq_q, boost: language.eq_boost, boost_min: '-12db', boost_0: '0', boost_max: '12db', isThrough: language.eq_isThrough
    },
    isShowDialog: 0,///0-不显示 1/2-Freq 3/4-Q 5-boost
    dialog_id: 0,
    isThroughAll: false,
    eqs: all_eq_list[0],
  },
  /**
   * 页面数据更新
   */
  updataShow: function () {
    this.data.eqs = all_eq_list[this.data.channel_scroll.channelVal]
    this.setData({
      eqs: this.data.eqs
    })
    this.drawGraphCurve(this.data.canvas_width, this.data.canvas_height)
  },
  /**
   * 切换通道
   */
  radioCheckedChange: function (e) {
    this.data.channel_scroll.channelVal = e.detail.value;
    this.setData({
      channel_scroll: this.data.channel_scroll
    })
    this.updataShow();
    if (app.Data.isBleWork == true) {
      if (app.Data.dsp_data.UpdataFlag.Eq[this.data.channel_scroll.channelVal] == false) {
        this.synchronousData()
      }
    }
  },
  /**
   * Eq数据发送
   */
  getEqData:function (){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x84
    buffer[2] = parseInt(this.data.channel_scroll.channelVal) * 32 + 31
    app.BLE_TxData(buffer, function () {
      console.log('ok: getEqData ')
    }, function () {
      console.log('fail: getEqData ')
    })
  },
  FilterJoint: function (id) {
    var channel_from = parseInt(this.data.channel_scroll.channelVal)
    var channel_to = (channel_from % 2) ? (channel_from - 1) : (channel_from + 1)
    if ((app.Data.dsp_data.IsJoint[channel_from] == true) && (app.Data.dsp_data.IsJoint[channel_to] == true)) {
      var id_from = parseInt(this.data.channel_scroll.channelVal) * 32 + parseInt(id);
      var id_to = (id_from % 64 >= 32) ? (id_from - 32) : (id_from + 32);
      this.EqDataTxPro(id_to, this.data.eqs[id]);
    }
  },
  EqDataTxPro: function (id_num, eqs){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x04
    buffer[2] = id_num
    buffer[3] = eqs.isThrough ? 0x00 : 0x01
    buffer[4] = 0x00
    buffer[5] = eqs.boost >> 8 & 0xFF // boost h
    buffer[6] = eqs.boost & 0xFF // boost l
    buffer[7] = eqs.freq >> 24 & 0xff // freq
    buffer[8] = eqs.freq >> 16 & 0xff // freq
    buffer[9] = eqs.freq >> 8 & 0xff // freq
    buffer[10] = eqs.freq & 0xff // freq
    buffer[11] = eqs.Gain >> 8 & 0xFF // gain h
    buffer[12] = eqs.Gain & 0xFF // gain l
    buffer[13] = eqs.q >> 8 & 0xff // Q h
    buffer[14] = eqs.q & 0xff // Q l
    app.BLE_TxData(buffer, function () {
      console.log('ok: EqDataTx ')
    }, function () {
      console.log('fail: EqDataTx ')
    })
  },
  EqDataTx: function (id) {
    var id_num = parseInt(this.data.channel_scroll.channelVal) * 32 + parseInt(id)
    this.EqDataTxPro(id_num, this.data.eqs[id]);
    this.FilterJoint(id)
    this.drawGraphCurve(this.data.canvas_width, this.data.canvas_height)
  },
  /**
   * 频率 Q值 增益 对话框
   */
  toShowDialog: function (id, dialog_id) {
    this.data.isShowDialog = id
    this.data.dialog_id = dialog_id
    this.setData({
      isShowDialog: this.data.isShowDialog,
      dialog_id: this.data.dialog_id
    })
  },
  changeFreq: function (e) {
    this.toShowDialog(1, e.currentTarget.id)
  },
  changeFreqInput: function (e) {
    this.toShowDialog(2, e.currentTarget.id)
  },
  changeQ: function (e) {
    this.toShowDialog(3, e.currentTarget.id)
  },
  changeQInput: function (e) {
    this.toShowDialog(4, e.currentTarget.id)
  },
  changeBoost: function (e) {
    this.toShowDialog(5, e.currentTarget.id)
  },
  changeBoostInput: function (e) {
    this.toShowDialog(6, e.currentTarget.id)
  },
  confirmFreq: function (e) {
    console.log('confirmFreq:' + e.detail.value)
    this.data.eqs[this.data.dialog_id].freq = e.detail.value;
    this.setData({eqs: this.data.eqs})
    this.EqDataTx(this.data.dialog_id)
  },
  confirmQ: function (e) {
    console.log('confirmQ:' + e.detail.value)
    this.data.eqs[this.data.dialog_id].q = e.detail.value * 100
    this.setData({eqs: this.data.eqs})
    this.EqDataTx(this.data.dialog_id)
  },
  confirmBoost: function (e) {
    console.log('confirmBoost:' + e.detail.value)
    this.data.eqs[this.data.dialog_id].boost = e.detail.value * 100 + 2400
    this.setData({eqs: this.data.eqs})
    this.EqDataTx(this.data.dialog_id)
  },
  hideMask: function (e) {
    this.data.isShowDialog = 0
    this.setData({
      isShowDialog: this.data.isShowDialog
    })
  },
  /**
   * eq增益调节
   */
  changeSlider: function (e) {
    this.data.eqs[e.currentTarget.id].boost = e.detail.value * 100 + 2400
    this.setData({eqs: this.data.eqs})
    this.EqDataTx(e.currentTarget.id)
  },
  changingSlider: function (e) {
    this.data.eqs[e.currentTarget.id].boost = e.detail.value * 100 + 2400
    this.setData({eqs: this.data.eqs})
  },
  /**
   * 直通调节
   */
  checkboxChange: function(e){
    this.data.eqs[e.currentTarget.id].isThrough = e.detail.value[0] ? true : false;
    this.setData({eqs: this.data.eqs})
    this.EqDataTx(e.currentTarget.id)
  },
  /**
   * 重置均衡
   */
  resetEQ: function(e){
    var channel_from = parseInt(this.data.channel_scroll.channelVal)
    var channel_to = (channel_from % 2) ? (channel_from - 1) : (channel_from + 1)
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x01
    buffer[2] = 0x02
    buffer[3] = 1 + channel_from
    app.BLE_TxData(buffer, function () {
      console.log('ok: resetEQ ')
    }, function () {
      console.log('fail: resetEQ ')
    })
    if ((app.Data.dsp_data.IsJoint[channel_from] == true) && (app.Data.dsp_data.IsJoint[channel_to] == true)) {
      buffer[3] = 1 + channel_to
      app.BLE_TxData(buffer, function () {
        console.log('ok: resetEQ ')
      }, function () {
        console.log('fail: resetEQ ')
      })
    }
  },
  /**
   * 直通所有
   */
  throughAll: function(e){
    this.data.isThroughAll = !this.data.isThroughAll
    this.setData({
      isThroughAll: this.data.isThroughAll
    })
    var channel_from = parseInt(this.data.channel_scroll.channelVal)
    var channel_to = (channel_from % 2) ? (channel_from - 1) : (channel_from + 1)
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x01
    buffer[2] = this.data.isThroughAll ? 0x03 : 0x05
    buffer[3] = 1 + channel_from
    app.BLE_TxData(buffer, function () {
      console.log('ok: throughAll ')
    }, function () {
      console.log('fail: throughAll ')
    })
    if ((app.Data.dsp_data.IsJoint[channel_from] == true) && (app.Data.dsp_data.IsJoint[channel_to] == true)) {
      buffer[3] = 1 + channel_to
      app.BLE_TxData(buffer, function () {
        console.log('ok: throughAll ')
      }, function () {
        console.log('fail: throughAll ')
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(windowWidth);
    console.log(windowHeight);
    console.log(this.data.eqs)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: language.eqBarTitle
    })
    // 画坐标轴和曲线
    this.drawGraphLine(this.data.canvas_width, this.data.canvas_height)
    this.drawGraphCurve(this.data.canvas_width, this.data.canvas_height)
  },

  synchronousData: function () {
    if (app.Data.isBleWork == true) {
      app.Data.dsp_data.UpdataFlag.Eq[this.data.channel_scroll.channelVal] = true
      console.log('UpdataFlag -   Eq:' + app.Data.dsp_data.UpdataFlag.Eq)
      wx.showLoading({ title: '加载中...', mask: true })
      this.getEqData();
      app.getFilterData(this.data.channel_scroll.channelVal);
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var data = eq_curve.computeDb_EqPeaking(500,6,500,1.41,0)
    console.log('EQ-onShow')
    this.data.channel_scroll.channels = app.Data.channels;
    this.setData({
      channel_scroll: this.data.channel_scroll
    })
    this.updataShow();
    if (app.Data.isBleWork == true) {
      if (app.Data.dsp_data.UpdataFlag.Eq[this.data.channel_scroll.channelVal] == false) {
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
   * 画坐标轴
   */
  getCoordinateX: function (freq) {
    var unitX = this.data.canvas_width / 3 /// 画布长度 除以(lg20000 - lg20)
    return parseFloat((unitX * (Math.log10(freq) - Math.log10(20))).toFixed(2))
  },
  transX2Freq: function (x) {
    var unitX = this.data.canvas_width / 3 /// 画布长度 除以(lg20000 - lg20)
    return parseFloat((Math.pow(10, x / unitX + Math.log10(20))).toFixed(2))
  },
  drawGraphTransverseLine: function (ctx, begin_y, width) {
    ctx.moveTo(0, begin_y)
    ctx.lineTo(width, begin_y)
  },
  drawGraphlongitudinalLine: function (ctx, begin_x, height) {
    ctx.moveTo(begin_x, 0)
    ctx.lineTo(begin_x, height)
  },
  drawGraphLine: function (width,height) {
    var h_step = height/8
    // 用canvas画坐标
    var ctx = wx.createCanvasContext('graph-line', this)
    // 画外框
    ctx.beginPath()
    ctx.setStrokeStyle('black')
    ctx.setLineWidth(2)
    this.drawGraphTransverseLine(ctx, 0, width);
    this.drawGraphTransverseLine(ctx, height, width);
    this.drawGraphlongitudinalLine(ctx, 0, height);
    this.drawGraphlongitudinalLine(ctx, width, height);
    ctx.stroke()
    // 画横纵轴
    ctx.beginPath()
    ctx.setStrokeStyle('black')
    ctx.setLineWidth(0.5)
    for (let index in this.data.eq_boost_lists) {
      this.drawGraphTransverseLine(ctx, h_step * index, width);
    }
    DefaultLineFreq.forEach((item, index) => {
      var begin_x = this.getCoordinateX(item)
      this.drawGraphlongitudinalLine(ctx, begin_x, height)
    })
    ctx.stroke()
    ctx.draw()
  },
  drawGraphCurve: function (width, height) {
    var ctx = wx.createCanvasContext('graph-curve', this)
    ctx.beginPath()
    ctx.setStrokeStyle(app.Data.mainColor)
    ctx.setLineWidth(2)
    for (let index = 0; index <= this.data.canvas_width; index++) {
      var db = 0;
      var f = this.transX2Freq(index)
      this.data.eqs.forEach((item, index) => {
        if (item.isThrough == false)
          db += eq_curve.computeDb_EqPeaking(f, item.boost / 100 - 24, item.freq, item.q / 100, 0)
      })
      db += eq_curve.computeDb_Filter(f, 0, all_channel_list[this.data.channel_scroll.channelVal][0]);
      db += eq_curve.computeDb_Filter(f, 1, all_channel_list[this.data.channel_scroll.channelVal][1]);
      var y = height / 2 - height / 24 * db 
      index === 0 ? ctx.moveTo(index, y) : ctx.lineTo(index, y)
    }
    ctx.stroke()
    ctx.draw()
  },
})

