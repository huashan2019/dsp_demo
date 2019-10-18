// pages/bt_search/bt_search.js
var util = require("../../utils/util.js");
var BLE = require("../../utils/BLE_pro.js");
const app = getApp()
var language = app.Data.language;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    language: language,
    mainColor: app.Data.mainColor,
    isScanning: false,
    isBleWork: app.Data.isBleWork,
    devices_list: [],
  },
  /**
   * 页面数据更新
   */
  updataShow: function () {
    this.data.isBleWork = app.Data.isBleWork
    this.setData({
      isBleWork: this.data.isBleWork,
      isScanning: this.data.isScanning,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.openBluetoothAdapter()
  },
  openBluetoothAdapter: function () {
    wx.openBluetoothAdapter({
      success: function (res) {
        console.log('打开蓝牙成功');
      },
      fail: function (res) {
        BLE.openBluetoothAdapter_fail(res)
      }
    })
  },
  /**
   * 断开蓝牙
   */
  breakBle: function () {
    wx.closeBLEConnection({
      deviceId: app.Data.connectId,
      success: function (res) {
        app.Data.isBleWork = false
        console.log('断开BLE成功')
      },
      fail: function () {
        console.log('断开BLE失败')
      }
    })
  },
  /**
   * 停止搜索
   */
  stopScan: function () {
    var that = this
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        console.log('停止扫描成功')
        that.data.isScanning = false
        wx.hideLoading()
        that.setData({
          isScanning: that.data.isScanning,
        })
      },
      fail: function (res) {
        console.log('停止扫描失败')
      }
    })
  },
  /**
   * 按钮 搜索/停止
   */
  startOrStopScan: function(){
    if (this.data.isScanning) {
      this.stopScan()
    } else {
      // ios平台需要先断开BLE连接，而android平台则会在扫描设备时自动断开
      if (app.Data.isBleWork && app.Data.sysInfo.platform == 'ios') {
        this.breakBle();
      }
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        success: (res) => {
          console.log('startBluetoothDevicesDiscovery success', res)
          this.data.isScanning = true
          wx.showToast({
            title: language.searchIng,
            icon: 'loading', //图标，支持"success"、"loading"
            duration: 2000,//显示时长
          })
          this.updataShow();
          this.onBluetoothDeviceFound()
        },
      })
    }
  },
  onBluetoothDeviceFound() {
    var that = this
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        if (util.isInArrayKey(that.data.devices_list, 'deviceId', device.deviceId)==-1)
        {
          device.advertisData = util.ab2hex(device.advertisData)
          if (device.advertisData)
          {
            that.data.devices_list.push(device);
            console.log(device.name + '--' + device.deviceId);
            console.log(that.data.devices_list)
            that.setData({
              devices_list: that.data.devices_list
            })
          }
        }
      })
    })
  },
  /**
   * 建立BLE连接
   */
  createBLEConnection(e) {
    var deviceId = e.currentTarget.dataset.deviceid
    var connectDevice = this.data.devices_list[e.currentTarget.id]
    console.log(deviceId)
    wx.showToast({
      title: '正在连接设备: ' + connectDevice.name + '\r\nID: ' + connectDevice.advertisData,//提示文字
      duration: 20000,//显示时长
      mask: true,//是否显示透明蒙层，防止触摸穿透，默认：false  
      icon: 'none', //图标，支持"success"、"loading"
    })
    BLE.createBLEConnection(deviceId, data=>{
      wx.setStorageSync('connectId', deviceId)
      setTimeout(function () {
        wx.navigateBack({
          delta: 1
        })
      }, 500)
    })
    this.stopBluetoothDevicesDiscovery()
  },
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: language.searchEquipment
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.updataShow();
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