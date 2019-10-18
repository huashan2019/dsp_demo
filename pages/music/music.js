// pages/music/music.js
const app = getApp()
var language = app.Data.language;
var windowWidth = app.Data.sysInfo.windowWidth;
var windowHeight = app.Data.sysInfo.windowHeight;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    language: language,
    mainColor: app.Data.mainColor,
    player_data: app.Data.player_data,
  },
  /**
   * 页面数据更新
   */
  updataShow: function () {
    this.data.player_data = app.Data.player_data;
    this.setData({
      player_data: this.data.player_data
    })
  },
  /**
   * 循环状态
   */
  get_Cycle_state: function(){
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x03
    buffer[2] = 0x00
    app.BLE_TxData(buffer, function () {
      console.log('ok: get_Cycle_state ')
    }, function () {
      console.log('fail: get_Cycle_state ')
    })
  },
  Cycle_random: function(e){
    this.data.player_data.Cycle_S = 4
    this.setData({
      player_data: this.data.player_data
    })
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x01
    buffer[2] = 0x0D
    app.BLE_TxData(buffer, function () {
      console.log('ok: Cycle_random ')
    }, function () {
      console.log('fail: Cycle_random ')
    })
  },
  Cycle_one: function (e) {
    this.data.player_data.Cycle_S = 2
    this.setData({
      player_data: this.data.player_data
    })
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x01
    buffer[2] = 0x0A
    app.BLE_TxData(buffer, function () {
      console.log('ok: Cycle_one ')
    }, function () {
      console.log('fail: Cycle_one ')
    })
  },
  Cycle_all: function (e) {
    this.data.player_data.Cycle_S = 3
    this.setData({
      player_data: this.data.player_data
    })
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x01
    buffer[2] = 0x0B
    app.BLE_TxData(buffer, function () {
      console.log('ok: Cycle_all ')
    }, function () {
      console.log('fail: Cycle_all ')
    })
  },
  /**
   * 播放暂停
   */
  get_PlayPause: function () {
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x02
    buffer[2] = 0x00
    app.BLE_TxData(buffer, function () {
      console.log('ok: get_PlayPause ')
    }, function () {
      console.log('fail: get_PlayPause ')
    })
  },
  Ctl_play: function (e) {
    this.data.player_data.PlayPause_S = this.data.player_data.PlayPause_S == 1 ? 2 : 1
    this.setData({
      player_data: this.data.player_data
    })
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x01
    buffer[2] = 0x02
    app.BLE_TxData(buffer, function () {
      console.log('ok: Ctl_play ')
    }, function () {
      console.log('fail: Ctl_play ')
    })
  },
  Ctl_prev: function (e) {
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x01
    buffer[2] = 0x04
    app.BLE_TxData(buffer, function () {
      console.log('ok: Ctl_prev ')
    }, function () {
      console.log('fail: Ctl_prev ')
    })
  },
  Ctl_next: function (e) {
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x01
    buffer[2] = 0x03
    app.BLE_TxData(buffer, function () {
      console.log('ok: Ctl_next ')
    }, function () {
      console.log('fail: Ctl_next ')
    })
  },
  /**
   * 选曲
   */
  getSongCnt: function () {
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x07
    buffer[2] = 0x00
    app.BLE_TxData(buffer, function () {
      console.log('ok: getSongCnt ')
    }, function () {
      console.log('fail: getSongCnt ')
    })
  },
  getCurrSongNum: function(){
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x0C
    buffer[2] = 0x00
    app.BLE_TxData(buffer, function () {
      console.log('ok: getCurrSongNum ')
    }, function () {
      console.log('fail: getCurrSongNum ')
    })
  },
  getCurrSongName: function () {
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x08
    buffer[2] = 0x00
    app.BLE_TxData(buffer, function () {
      console.log('ok: getCurrSongName ')
    }, function () {
      console.log('fail: getCurrSongName ')
    })
  },
  Choose_Song: function (e) {
    console.log(e.currentTarget.id)
    this.data.player_data.PlayNum = e.currentTarget.id-1
    this.setData({
      player_data: this.data.player_data
    })
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x01
    buffer[2] = 0x80
    buffer[3] = e.currentTarget.id >> 8 & 0xFF
    buffer[4] = e.currentTarget.id & 0xFF
    app.BLE_TxData(buffer, function () {
      console.log('ok: Choose_Song ')
    }, function () {
      console.log('fail: Choose_Song ')
    })
  },
  /**
   * 歌曲列表
   */
  get_SongList: function(first, end){
    var buffer = []
    buffer[0] = 0x0C
    buffer[1] = 0x0B
    buffer[2] = first >> 8 & 0xFF
    buffer[3] = first & 0xFF
    buffer[4] = end >> 8 & 0xFF
    buffer[5] = end & 0xFF
    app.BLE_TxData(buffer, function () {
      console.log('ok: get_SongList ')
    }, function () {
      console.log('fail: get_SongList ')
    })
  },
  searchScrollLower:function(e){
    console.log('searchScrollLower')
    var num = this.data.player_data.SongNameList.length
    if (this.data.player_data.SongCnt){
      if (num < this.data.player_data.SongCnt) {
        this.get_SongList(num, num + 10)
      }else {
        wx.showToast({
          icon: 'none',
          title: language.noMoreSongs,
        })
      }
    }else{
      this.getSongCnt();
    }
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
    console.log('音乐--页面初次渲染完成')
    wx.setNavigationBarTitle({
      title: language.musicBarTitle
    })
    var scroll_height = wx.getSystemInfoSync().windowHeight;
    this.setData({
      scroll_height: scroll_height - 50 - windowWidth * 410 / 750
    })
  },

  /**
   * 同步数据
   */
  synchronousData: function () {
    console.log('synchronousData')
    var that = this
    this.getCurrSongNum();
    this.getSongCnt();
    this.get_PlayPause();
    this.get_Cycle_state();
    this.getCurrSongName();
    this.get_SongList(1, 15);
    var i = setInterval(function () {///定时器任务==
      var length = app.Data.player_data.SongNameList.length
      while(length--){
        if (app.Data.player_data.SongNameList[length] == null) {
          console.log('get_SongList:',length+1)
          that.get_SongList(length + 1, length + 1);
          return
        }
      }
    }, 1200)
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('music-onShow')
    if (app.Data.isBleWork == true) {
      this.synchronousData()
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
        switch(item){
          case '0':
            this.updataShow();
            ///wx.hideLoading();
            break;
          case '2':
            this.synchronousData()
            break;
          default:break;
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
    console.log('onPullDownRefresh')
    this.searchScrollLower();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('onReachBottom')
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})