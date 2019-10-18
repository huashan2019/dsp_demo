// pages/channel/channel.js
var util = require("../../utils/util.js");
const app = getApp()
var language = app.Data.language;
var windowWidth = app.Data.sysInfo.windowWidth;
var windowHeight = app.Data.sysInfo.windowHeight;
const all_channel_list = app.Data.dsp_data.Filters_T;
const all_mute_list = app.Data.dsp_data.Mute;
const all_volume_list = app.Data.dsp_data.SingleData;
const channel_out_name = app.Data.dsp_data.ChannelName;
const slope_info = [
  [],
  ['12db/Oct', '24db/Oct', '36db/Oct', '48db/Oct'],///宁克
  ['12db/Oct', '18db/Oct', '24db/Oct'],///贝塞尔
  ['12db/Oct', '18db/Oct', '24db/Oct'],///巴特沃斯
];
Page({
  /**
   * 页面的初始数据
   */
  data: {
    language: language,
    filter_name:{
      type: language.filter_name_type,
      slope: ['预留', '12db/Oct', '18db/Oct', '24db/Oct', '30db/Oct', '36db/Oct', '42db/Oct','48db/Oct']
    },
    switch_zoom: windowWidth/375,
    channel_scroll: {
      channels: app.Data.channels,
      label_width: Math.max(windowWidth / app.Data.channel_out_num, 70),
      bg_color: app.Data.mainColor,
      channelVal: 0,
    },
    isShowDialog: 0,///0--无 1--slider 2--input 3--channelname
    mainColor: app.Data.mainColor,
    dialog_id: 0,
    volume: all_volume_list[0],
    channel_mute: all_mute_list[0],
    filter_data: all_channel_list[0],
    channel_out_name: channel_out_name[0],
    is_joint: app.Data.dsp_data.IsJoint[0],
  }, 
  /**
   * 页面数据更新
   */
  updataShow: function () {
    this.data.volume = all_volume_list[this.data.channel_scroll.channelVal]
    this.data.filter_data = all_channel_list[this.data.channel_scroll.channelVal]
    this.data.channel_mute = all_mute_list[this.data.channel_scroll.channelVal]
    this.data.channel_out_name = channel_out_name[this.data.channel_scroll.channelVal]
    this.data.is_joint = app.Data.dsp_data.IsJoint[this.data.channel_scroll.channelVal]
    this.setData({
      volume: this.data.volume,
      filter_data: this.data.filter_data,
      channel_mute: this.data.channel_mute,
      channel_out_name: this.data.channel_out_name,
      is_joint: this.data.is_joint
    })
  },
  /**
   * 切换通道
   */
  radioCheckedChange: function (e) {
    this.data.channel_scroll.channelVal = e.detail.value
    this.setData({
      channel_scroll: this.data.channel_scroll
    })
    this.updataShow(); 
    if (app.Data.isBleWork == true) {
      if (app.Data.dsp_data.UpdataFlag.Channel[this.data.channel_scroll.channelVal] == false) {
        this.synchronousData()
      }
    }
  },
  /**
   * 滤波器数据发送
   */
  FilterJoint: function (id){
    var channel_from = parseInt(this.data.channel_scroll.channelVal)
    var channel_to = (channel_from % 2) ? (channel_from - 1) : (channel_from + 1)
    if ((app.Data.dsp_data.IsJoint[channel_from] == true) && (app.Data.dsp_data.IsJoint[channel_to] == true)) {
      var id_from = parseInt(this.data.channel_scroll.channelVal) * 2 + parseInt(id);
      var id_to = (id_from % 4 >= 2) ? (id_from - 2) : (id_from + 2);
      var filter_data = new Object;
      filter_data.Phase = app.Data.dsp_data.Filters_T[channel_to][id].Phase;
      filter_data.Type  = this.data.filter_data[id].Type;
      filter_data.Slope = this.data.filter_data[id].Slope;
      filter_data.Freq  = this.data.filter_data[id].Freq;
      filter_data.En    = this.data.filter_data[id].En;
      filter_data.Gain  = this.data.filter_data[id].Gain;
      this.FilterDataTxPro(id_to, filter_data);
    }
  },
  FilterDataTxPro: function (id_num, filter_data){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x03
    buffer[2] = id_num
    buffer[3] = (filter_data.En ? 0x01 : 0x00) | (filter_data.Phase ? 0x00 : 0x10)
    buffer[4] = filter_data.Type
    buffer[5] = filter_data.Slope
    buffer[6] = filter_data.Freq >> 24 & 0xFF
    buffer[7] = filter_data.Freq >> 16 & 0xFF
    buffer[8] = filter_data.Freq >> 8 & 0xFF
    buffer[9] = filter_data.Freq & 0xFF
    buffer[10] = 0x00
    buffer[11] = 0x00
    app.BLE_TxData(buffer, function () {
      console.log('ok: FilterDataTx ')
    }, function () {
      console.log('fail: FilterDataTx ')
    })
  },
  FilterDataTx: function (id) {
    var id_num = parseInt(this.data.channel_scroll.channelVal) * 2 + parseInt(id)
    this.FilterDataTxPro(id_num, this.data.filter_data[id])
  },
  /**
   * 直通操作
   */
  switchPass: function (e) {
    this.data.filter_data[e.currentTarget.id].En = e.detail.value;
    this.setData({
      filter_data: this.data.filter_data
    })
    this.FilterDataTx(e.currentTarget.id)
    this.FilterJoint(e.currentTarget.id)
  },
  /**
   * 模式选择
   */
  changeType: function (e) {
    var that = this
    wx.showActionSheet({
      itemList: that.data.filter_name.type.slice(1),
      success: function (res) {
        that.data.filter_data[e.currentTarget.id].Type = res.tapIndex + 1;
        var Type = that.data.filter_data[e.currentTarget.id].Type
        var Slope = that.data.filter_data[e.currentTarget.id].Slope
        if (util.isInArray(slope_info[Type], that.data.filter_name.slope[Slope]) == -1){
          that.data.filter_data[e.currentTarget.id].Slope = 1
        }
        that.setData({
          filter_data: that.data.filter_data
        })
        that.FilterDataTx(e.currentTarget.id)
        that.FilterJoint(e.currentTarget.id)
      }
    })
  },
  /**
   * 频率选择 -- input
   */
  changeFreqInput: function (e) {
    console.log('changeFreqInput')
    this.data.isShowDialog = 2
    this.data.dialog_id = e.currentTarget.id
    this.setData({
      isShowDialog: this.data.isShowDialog,
      dialog_id: this.data.dialog_id
    })
  },
  /**
   * 频率选择 -- slider
   */
  changeFreq: function (e) {
    this.data.isShowDialog = 1
    this.data.dialog_id = e.currentTarget.id
    this.setData({
      isShowDialog: this.data.isShowDialog,
      dialog_id: this.data.dialog_id
    })
  },
  confirmFreq: function (e) {
    this.data.filter_data[this.data.dialog_id].Freq = e.detail.value
    this.setData({
      filter_data: this.data.filter_data
    })
    this.FilterDataTx(this.data.dialog_id)
    this.FilterJoint(this.data.dialog_id)
  },
  hideMask: function (e) {
    this.data.isShowDialog = 0
    this.setData({
      isShowDialog: this.data.isShowDialog
    })
  },
  /**
   * 斜率选择
   */
  changeSlope: function(e){
    var that = this
    var itemList = slope_info[that.data.filter_data[e.currentTarget.id].Type]
    wx.showActionSheet({
      itemList: itemList,
      success: function (res) {
        that.data.filter_data[e.currentTarget.id].Slope = res.tapIndex + 1;
        for (let index in that.data.filter_name.slope)
        {
          if (that.data.filter_name.slope[index] == itemList[res.tapIndex])
          {
            that.data.filter_data[e.currentTarget.id].Slope = parseInt(index);
            break;
          }
        }
        that.setData({
          filter_data: that.data.filter_data
        })
        that.FilterDataTx(e.currentTarget.id)
        that.FilterJoint(e.currentTarget.id)
      }
    })
  },
  /**
   * 音量数据发送
   */
  getVolumeData: function (){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x86
    buffer[2] = 1 + parseInt(this.data.channel_scroll.channelVal)
    app.BLE_TxData(buffer, function () {
      console.log('ok: getVolumeData ')
    }, function () {
      console.log('fail: getVolumeData ')
    })
  },
  VolumeDataTx: function () {
    var channel_from = parseInt(this.data.channel_scroll.channelVal)
    var channel_to = (channel_from % 2) ? (channel_from - 1) : (channel_from + 1)
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x06
    buffer[2] = 1 + channel_from
    buffer[3] = this.data.volume >> 8 & 0xFF
    buffer[4] = this.data.volume & 0xFF
    app.BLE_TxData(buffer, function () {
      console.log('ok: VolumeDataTx ')
    }, function () {
      console.log('fail: VolumeDataTx ')
    })
    if ((app.Data.dsp_data.IsJoint[channel_from] == true) && (app.Data.dsp_data.IsJoint[channel_to] == true)) {
      buffer[2] = 1 + channel_to
      app.BLE_TxData(buffer, function () {
        console.log('ok: VolumeDataTx ')
      }, function () {
        console.log('fail: VolumeDataTx ')
      })
    }
  },
  /**---
   * 调节音量值---加减按键
   */
  setVolumeUp: function (e) {
    this.data.volume += 10;
    this.data.volume = Math.min(8000, this.data.volume)
    this.setData({
      volume: this.data.volume
    })
    this.VolumeDataTx()
  },
  setVolumeDown: function (e) {
    this.data.volume -= 10;
    this.data.volume = Math.max(0, this.data.volume)
    this.setData({
      volume: this.data.volume
    })
    this.VolumeDataTx()
  },
  /**
   * 通道增益（音量）调节
   */
  changeSlider: function (e) {
    this.data.volume = e.detail.value * 100 + 8000
    this.setData({
      volume: this.data.volume
    })
    this.VolumeDataTx()
  },
  changingSlider: function (e) {
    this.setData({
      volume: e.detail.value * 100 + 8000
    })
  },
  /**
   * 正相反相操作
   */
  changePhase: function (e) {
    this.data.filter_data[0].Phase = !this.data.filter_data[0].Phase;
    this.setData({
      filter_data: this.data.filter_data
    })
    this.FilterDataTx(0)
  },
  /**
   * 修改通道名
   */
  channelNameChange: function(e){
    console.log('channelNameChange')
    this.data.isShowDialog = 3
    this.setData({
      isShowDialog: this.data.isShowDialog
    })
  },
  getChannelName: function(){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x89
    buffer[2] = 1 + parseInt(this.data.channel_scroll.channelVal)
    app.BLE_TxData(buffer, function () {
      console.log('success: getChannelName')
    }, function () {
      console.log('fail: getChannelName')
    })
  },
  confirmRename: function (e) {
    console.log(e.detail.value)
    var name = e.detail.value
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x09
    buffer[2] = 1 + parseInt(this.data.channel_scroll.channelVal)
    buffer[3] = 0x00
    buffer[4] = 0x20
    buffer[5] = 0x00
    buffer[6] = 0x20
    buffer[7] = 0x00
    buffer[8] = 0x20
    buffer[9] = 0x00
    buffer[10] = 0x20
    for (let index in name) {
      buffer[3 + 2 * index] = name.charCodeAt(index) % 256
      buffer[4 + 2 * index] = name.charCodeAt(index) >> 8
    }
    app.BLE_TxData(buffer, function () {
      console.log('success: confirmRename')
    }, function () {
      console.log('fail: confirmRename')
    })
  },
  /**
   * 静音操作
   */
  getMuteData: function(){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x88
    buffer[2] = 1 + parseInt(this.data.channel_scroll.channelVal)
    app.BLE_TxData(buffer, function () {
      console.log('ok: getMuteData ')
    }, function () {
      console.log('fail: getMuteData ')
    })
  },
  muteOrunmute: function(e) {
    this.data.channel_mute = !this.data.channel_mute;
    this.setData({
      channel_mute: this.data.channel_mute
    })
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x08
    buffer[2] = 1 + parseInt(this.data.channel_scroll.channelVal)
    buffer[3] = this.data.channel_mute ? 0x00 : 0x01
    app.BLE_TxData(buffer, function () {
      console.log('ok: muteOrunmute ')
    }, function () {
      console.log('fail: muteOrunmute ')
    })
  },
  /**
   * 重置操作
   */
  dataReset: function (e) {
    var channel_from = parseInt(this.data.channel_scroll.channelVal)
    var channel_to = (channel_from % 2) ? (channel_from - 1) : (channel_from + 1)
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x01
    buffer[2] = 0x04
    buffer[3] = 1 + channel_from
    app.BLE_TxData(buffer, function () {
      console.log('ok: dataReset ')
    }, function () {
      console.log('fail: dataReset ')
    })
    if ((app.Data.dsp_data.IsJoint[channel_from] == true) && (app.Data.dsp_data.IsJoint[channel_to] == true)) {
      buffer[3] = 1 + channel_to
      app.BLE_TxData(buffer, function () {
        console.log('ok: dataReset ')
      }, function () {
        console.log('fail: dataReset ')
      })
    }
  },
  /**
   * 联动操作
   */
  JointDataTx: function (id_from, id_to){
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x0A
    buffer[2] = id_from
    buffer[3] = id_to
    console.log(buffer)
    app.BLE_TxData(buffer, function () {
      console.log('ok: switchJoint ')
    }, function () {
      console.log('fail: switchJoint ')
    })
  },
  switchJoint: function (e) {
    var that = this
    var id_from = 1 + parseInt(this.data.channel_scroll.channelVal)
    var id_to = (this.data.channel_scroll.channelVal % 2) ? (id_from - 1) : (id_from + 1)
    if (e.detail.value) {
      if (app.Data.dsp_data.IsJoint[id_to - 1] == true) {
        wx.showModal({
          title: language.switchJointTitle,
          content: language.jointOpen + language.jointChannel + id_from + ' ' + language.jointChannel + id_to + language.joint,
          confirmColor: that.data.mainColor,
          success: function (res) {
            if (res.confirm) {
              that.data.is_joint = true;
              app.Data.dsp_data.IsJoint[that.data.channel_scroll.channelVal] = true;
              app.Data.dsp_data.UpdataFlag.Eq[id_from - 1] = false
              app.Data.dsp_data.UpdataFlag.Eq[id_to - 1] = false
              app.Data.dsp_data.UpdataFlag.Channel[id_from - 1] = false
              app.Data.dsp_data.UpdataFlag.Channel[id_to - 1] = false
            } else if (res.cancel) {
              that.data.is_joint = false;
              console.log('cancel switchJoint')
            }
            that.setData({ is_joint: that.data.is_joint })
          }
        })
      } else {
        wx.showModal({
          title: language.switchJointTitle,
          content: language.copy + language.jointChannel + id_from + language.data + language.to + language.jointChannel + id_to + ' ?',
          confirmColor: that.data.mainColor,
          success: function (res) {
            if (res.confirm) {
              that.JointDataTx(id_from, id_to)
              that.data.is_joint = true;
              app.Data.dsp_data.IsJoint[that.data.channel_scroll.channelVal] = true;
              app.Data.dsp_data.UpdataFlag.Eq[id_from - 1] = false
              app.Data.dsp_data.UpdataFlag.Eq[id_to - 1] = false
              app.Data.dsp_data.UpdataFlag.Channel[id_from - 1] = false
              app.Data.dsp_data.UpdataFlag.Channel[id_to - 1] = false
            } else if (res.cancel) {
              that.data.is_joint = false;
              console.log('cancel switchJoint')
            }
            that.setData({ is_joint: that.data.is_joint })
          }
        })
      }
    }else{
      if (app.Data.dsp_data.IsJoint[id_to-1] == true){
        wx.showModal({
          title: language.switchJointTitle,
          content: language.close + language.jointChannel + id_from + ' ' + language.jointChannel + id_to + language.joint,
          confirmColor: that.data.mainColor,
          success: function (res) {
            if (res.confirm) {
              that.data.is_joint = false;
              app.Data.dsp_data.IsJoint[that.data.channel_scroll.channelVal] = false;
            } else if (res.cancel) {
              that.data.is_joint = true;
              console.log('cancel switchJoint')
            }
            that.setData({ is_joint: that.data.is_joint })
          }
        })
      } else {
        that.data.is_joint = false;
        app.Data.dsp_data.IsJoint[this.data.channel_scroll.channelVal] = false;
        that.setData({ is_joint: that.data.is_joint })
      }
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(windowWidth);
    console.log(windowHeight);
    console.log(this.data.filter_data);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: language.channelBarTitle
    })
  },
  /**
   * 同步数据
   */
  synchronousData: function () {
    console.log('synchronousData')
    if (app.Data.isBleWork == true) {
      app.Data.dsp_data.UpdataFlag.Channel[this.data.channel_scroll.channelVal] = true
      wx.showLoading({ title: '加载中...', mask: true })
      app.getFilterData(this.data.channel_scroll.channelVal)
      this.getMuteData()
      this.getVolumeData()
      this.getChannelName()
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.data.channel_scroll.channels = app.Data.channels;
    this.setData({
      channel_scroll: this.data.channel_scroll
    })
    this.updataShow();
    var that = this
    if (app.Data.isBleWork == true) {
      if (app.Data.dsp_data.UpdataFlag.Channel[this.data.channel_scroll.channelVal] == false) {
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
    console.log('processMcuData')
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
    console.log('onUnload')
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