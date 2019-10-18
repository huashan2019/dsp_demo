// pages/main/main.js
var BLE = require("../../utils/BLE_pro.js");
const app = getApp()
var windowWidth = app.Data.sysInfo.windowWidth;
var language = app.Data.language;
var Timer;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    language: language,
    isShowDialog: 0,///0--无 1--password 2--rename
    isLogin: app.Data.isLogin,
    isBleWork: app.Data.isBleWork,
    mainColor: app.Data.mainColor,
    musicPlayer: app.Data.musicPlayer,
    switch_zoom: windowWidth/375,
    mute: app.Data.dsp_data.MainMute,
    volume: app.Data.dsp_data.MainVol,
    volumeLock: app.Data.dsp_data.LockVol,
    vol: app.Data.dsp_data.Vol,
    volMax: app.Data.dsp_data.VolMax,
    volLockChecked:false,
    rename: app.Data.dsp_data.ReName,
    mode_list: app.Data.dsp_data.ModeName,
    curr_mode: app.Data.dsp_data.CurrMode,
  },
/**
 * 页面数据更新
 */
  updataShow: function () {
    this.data.rename =  app.Data.dsp_data.ReName,
    this.data.mute = app.Data.dsp_data.MainMute,
    this.data.mode_list = app.Data.dsp_data.ModeName,
    this.data.isBleWork = app.Data.isBleWork,
    this.data.curr_mode = app.Data.dsp_data.CurrMode,
    this.setData({
      mute: this.data.mute,
      mode_list: this.data.mode_list,
      isBleWork: this.data.isBleWork,
      curr_mode: this.data.curr_mode,
      rename: this.data.rename,
    })
  },
  updataShow_slider: function(){
    console.log('updataShow_slider')
    this.data.volume = app.Data.dsp_data.MainVol,
    this.data.volumeLock = app.Data.dsp_data.LockVol,
    this.data.vol = app.Data.dsp_data.Vol,
    this.data.volMax = app.Data.dsp_data.VolMax,
    this.setData({
        vol: this.data.vol,
        volMax: this.data.volMax,
        volume: this.data.volume,
        volumeLock: this.data.volumeLock,
    })
  },

  /**
   * 重命名
   */
  setRename: function () {
    this.data.isShowDialog = 2
    this.setData({
      isShowDialog: this.data.isShowDialog
    })
  },
  confirmRename: function (e) {
    console.log('confirmRename:' + e.detail.value)
    var name = e.detail.value
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x09
    buffer[2] = 0x00
    buffer[3] = 0x00
    buffer[4] = 0x20
    buffer[5] = 0x00
    buffer[6] = 0x20
    buffer[7] = 0x00
    buffer[8] = 0x20
    buffer[9] = 0x00
    buffer[10] = 0x20
    for (let index in name){
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
   * 获取ARM蓝牙MCU版本号
   */
  getMcuVersion: function () {
    var buffer = []
    buffer[0] = 0x01
    buffer[1] = 0x04
    app.BLE_TxData(buffer, function () {
      console.log('success: getMcuVersion')
    }, function () {
      console.log('fail: getMcuVersion')
    })
  },
  getArmVersion: function () {
    var buffer = []
    buffer[0] = 0x01
    buffer[1] = 0x11
    app.BLE_TxData(buffer, function () {
      console.log('success: getArmVersion')
    }, function () {
      console.log('fail: getArmVersion')
    })
  }, 
  getBtVersion: function () {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x0C
    buffer[2] = 0x01
    app.BLE_TxData(buffer, function () {
      console.log('success: getBtVersion')
    }, function () {
      console.log('fail: getBtVersion')
    })
  },
  /**
   * 场景重置 
   */
  resetMode: function () {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x01
    buffer[2] = 0x01
    app.BLE_TxData(buffer, function () {
      console.log('success: resetMode')
    }, function () {
      console.log('fail: resetMode')
    })
  },
  /**
   * 用户点击右上角菜单
   */
  about: function () {
    this.getMcuVersion()
    this.getArmVersion()
    this.getBtVersion()
    wx.showModal({
      title: app.Data.aboutTitle,
      content: language.currVersion + app.Data.version + 
                language.armVersion + app.Data.arm_version + 
                language.machineVersion + app.Data.mcu_version + 
                language.machineId + app.Data.ble_id,
      success: function (res) {
        if (res.confirm) {
          console.log('confirm: clicked');
        }
      },
      showCancel: false,
      confirmColor: this.data.mainColor
    })
  },
  showMenu: function () {
    var that = this
    if (app.Data.isLogin){
      wx.showActionSheet({
        itemList: [language.modeReset, language.reName, language.loudSpeakerOutput8, language.loudSpeakerOutput6, language.about],
        success: function (res) {
          switch (res.tapIndex) {
            case 0:/*场景重置*/ 
              that.resetMode()
              break;
            case 1:/*重命名*/
              that.setRename()
              break;
            case 2:/*8喇叭输出*/
              app.channelNumSet(8);
              break;
            case 3:/*6喇叭输出*/
              app.channelNumSet(6);
              break;
            case 4:/*关于*/
              that.about();
              break;
            default: break;
          }
        }
      })
    } else {
      wx.showActionSheet({
        itemList: [language.about],
        success: function (res) {
          that.about();
        }
      })
    }
  },
  /**
   * 音乐
   */
  showMusic: function (e) {
    wx.navigateTo({
      url: '/pages/music/music',
    })
  },
  /**
   * 高级设置--密码
   */
  advancedSet: function (e) {
    if (app.Data.isLogin){
      wx.showToast({
        icon: 'none',
        title: language.advancedFeaturesEnabled,
      })
    } else {
      this.data.isShowDialog = 1
      this.setData({
        isShowDialog: this.data.isShowDialog
      })
    }
  },
  confirmPassword: function (e) {
    if (e.detail.value){
      app.Data.isLogin = true
      this.data.isLogin = true
      this.setData({isLogin: this.data.isLogin})
      wx.showTabBar()
    }
  },
  hideMask: function (e) {
    this.data.isShowDialog = 0
    this.setData({
      isShowDialog: this.data.isShowDialog
    })
  },
  /**
   * 用户断开蓝牙连接
   */
  disconnectBT: function (e) {
    wx.showModal({
      title: '提示',
      content: '断开蓝牙连接？',
      confirmColor: this.data.mainColor,
      success: function (res) {
        if (res.confirm) {
          wx.closeBLEConnection({
            deviceId: app.Data.connectId,
            success: function (res) {
              app.Data.isBleWork = false
              wx.showToast({
                title: language.disconnectedBluetooth,
              })
            },
            fail: function () {
              console.log(language.disconnectBLEfailure)
            }
          })
        } else if (res.cancel) {
          console.log('cancel disconnectBT')
        }
      }
    })
    this.data.isBleWork = app.Data.isBleWork
    this.setData({
      isBleWork: this.data.isBleWork
    })
  },
  /**
   * 用户点击蓝牙
   */
  gotoBT:function (e){
    wx.navigateTo({
      url: '/pages/bt_search/bt_search',
    })
  },
  /**
   * 模式切换存储
   */
  getCurrMode: function () {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x00
    buffer[2] = 0x00
    app.BLE_TxData(buffer, function () {
      console.log('ok: getCurrMode ')
    }, function () {
      console.log('fail: getCurrMode ')
    })
  },
  setMode: function (e) {
    console.log('setMode')
    /*this.data.curr_mode = e.currentTarget.id
    this.setData({
      curr_mode: this.data.curr_mode
    })*/
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x00
    buffer[2] = 0x02
    buffer[3] = e.currentTarget.id
    app.Data.dsp_data.ReName = ''
    this.data.rename = app.Data.dsp_data.ReName;
    this.setData({ rename: this.data.rename })
    app.BLE_TxData(buffer, function () {
      console.log('ok: set mode ' + e.currentTarget.id)
      app.Data.dsp_data.CurrState = 0x01
      wx.showLoading({ title: language.switchoverSceneIng,mask: true})
    }, function () {
      console.log('fail: set mode ' + e.currentTarget.id)
    })
  },
  storeMode: function (e) {
    console.log('storeMode')
    /*this.data.curr_mode = e.currentTarget.id
    this.setData({
      curr_mode: this.data.curr_mode
    })*/
    wx.showModal({
      title: language.storeModeTitle,
      content: language.storeModeContent + e.currentTarget.id,
      confirmColor: this.data.mainColor,
      success: function (res) {
        if (res.confirm) {
          console.log('storeMode' + e.currentTarget.id)
          var buffer = []
          buffer[0] = 0x0A
          buffer[1] = 0x00
          buffer[2] = 0x01
          buffer[3] = e.currentTarget.id
          app.BLE_TxData(buffer, function () {
            console.log('ok: store mode ' + e.currentTarget.id)
            app.Data.dsp_data.CurrState = 0x02
            wx.showToast({ title: language.reflashModeIng, icon: 'loading', duration: 5000, mask: true })
          }, function () {
            console.log('fail: store mode ' + e.currentTarget.id)
          })
        } else if (res.cancel) {
          console.log('cancel storeMode' + e.currentTarget.id)
        }
      }
    })
  },
  /**
   * 音量锁操作
   */
  volLockSwitch: function (e) {
    this.data.volLockChecked = e.detail.value
    this.setData({
      volLockChecked: this.data.volLockChecked
    })
  },
  /**
   * 静音操作
   */
  muteOrunmute: function (e) {
    this.data.mute = !this.data.mute;
    this.setData({
      mute: this.data.mute
    })
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x08
    buffer[2] = 0x00
    buffer[3] = this.data.mute ? 0x00 : 0x01
    app.BLE_TxData(buffer, function () {
      console.log('ok: muteOrunmute ')
    }, function () {
      console.log('fail: muteOrunmute ')
    })
  },
  /**
   * 音量数据发送/请求
   */
  VolDataTx: function () {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x0D
    buffer[2] = 0x01
    buffer[3] = this.data.vol
    clearTimeout(Timer)
    app.BLE_TxData(buffer, function () {
      console.log('ok: VolDataTx ')
    }, function () {
      console.log('fail: VolDataTx ')
    })
  },
  changeSliderVol: function (e) {
    this.data.vol = e.detail.value
    this.setData({
      vol: this.data.vol
    })
    this.VolDataTx();
  },
  changingSliderVol: function (e) {
    this.setData({ vol: e.detail.value })
  },
  setVolUp: function (e) {
    this.data.vol += 1;
    this.data.vol = Math.min(this.data.volMax, this.data.vol)
    this.setData({
      vol: this.data.vol
    })
    this.VolDataTx();
  },
  setVolDown: function (e) {
    this.data.vol -= 1;
    this.data.vol = Math.max(0, this.data.vol)
    this.setData({
      vol: this.data.vol
    })
    this.VolDataTx();
  },
  VolumeDataTx: function () {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x06
    buffer[2] = 0x00
    buffer[3] = this.data.volume >> 8 & 0xFF
    buffer[4] = this.data.volume & 0xFF
    buffer[5] = this.data.volumeLock >> 8 & 0xFF
    buffer[6] = this.data.volumeLock & 0xFF
    clearTimeout(Timer)
    app.BLE_TxData(buffer, function () {
      console.log('ok: VolumeDataTx ')
    }, function () {
      console.log('fail: VolumeDataTx ')
    })
  },
  /**
   * 用户音量条(DB)---滑动
   */
  changeSlider: function (e) {
    if (this.data.volLockChecked) {
      this.data.volumeLock = e.detail.value * 100 + 8000
    } else {
      this.data.volume = e.detail.value * 100 + 8000
    }
    this.setData({
      volume: this.data.volume,
      volumeLock: this.data.volumeLock
    })
    this.VolumeDataTx();
  },
  changingSlider: function (e) {
    if (this.data.volLockChecked) {
      this.setData({ volumeLock: e.detail.value * 100 + 8000 })
    } else {
      this.setData({ volume: e.detail.value * 100 + 8000 })
    }
  },
  /**
   * 音量调节---加减
   */
  setVolumeUp: function (e) {
    if (this.data.volLockChecked) {
      this.data.volumeLock += 10;
      this.data.volumeLock = Math.min(8000, this.data.volumeLock)
    } else {
      this.data.volume += 10;
      this.data.volume = Math.min(8000, this.data.volume)
    }
    this.setData({
      volume: this.data.volume,
      volumeLock: this.data.volumeLock
    })
    this.VolumeDataTx();
  },
  setVolumeDown: function (e) {
    if (this.data.volLockChecked) {
      this.data.volumeLock -= 10;
      this.data.volumeLock = Math.max(0, this.data.volumeLock)
    } else {
      this.data.volume -= 10;
      this.data.volume = Math.max(0, this.data.volume)
    }
    this.setData({
      volume: this.data.volume,
      volumeLock: this.data.volumeLock
    })
    this.VolumeDataTx();
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
      title: language.mainBarTitle
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('Main-onShow')
    if (app.Data.isLogin) {
      wx.showTabBar()
    } else {
      wx.hideTabBar()
    }
    this.updataShow();
    var that = this
    wx.onBLEConnectionStateChange(function (res) {
      if (!res.connected) {
        wx.showToast({
          icon: 'none',
          title: language.bluetoothConnectionDisconnected,
        })
        app.Data.isBleWork = false
        that.data.isBleWork = false
        app.playerDataInit()
        app.updataFlagClear()
      } else {// 每次建立连接后，关闭高级功能
        ///wx.hideTabBar()
        app.Data.isBleWork = true
        that.data.isBleWork = true
      }
      that.setData({
        isBleWork: that.data.isBleWork
      })
    })
    if (app.Data.isBleWork == false) {
      this.openBluetoothAdapter();
    }else{
      if (app.Data.dsp_data.UpdataFlag.Main == false) {
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
    var that = this
    if (backData.length) {
      for (let item of backData) {
        switch (item) {
          case '0':
            this.updataShow();
            if (app.Data.dsp_data.CurrState == 0xFF) {
              wx.showToast({ title: language.error })
            }
            break;
          case '1':
            wx.hideLoading();
            break;
          case '3':
            clearTimeout(Timer)
            Timer = setTimeout(function () {
                that.updataShow_slider();
            }, 1000);
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
  synchronousData: function(){
    console.log('synchronousData')
    if (app.Data.isBleWork == true) {
      app.Data.dsp_data.UpdataFlag.Main = true
      wx.showLoading({ title: '加载中...', mask: true })
      this.getCurrMode()
      ///app.getModeName()
      ///app.getMainVol()
      ///app.getMainMute()
      this.getMcuVersion()
      this.getArmVersion()
      this.getBtVersion()
    }
  },
  /**
   * 蓝牙自动连接
   */
  openBluetoothAdapter: function () {
    var that = this
    wx.openBluetoothAdapter({
      success: function (res) {
        console.log('success openBluetoothAdapter');
        BLE.createBLEConnection(app.Data.connectId,data=>{
          that.synchronousData();
        });
      },
      fail: function (res) {
        BLE.openBluetoothAdapter_fail(res)
      }
    })
  },
})