//app.js
var chinese = require("./utils/zh_CN.js");
var english = require("./utils/zh_EN.js");
var config = require("./utils/config.js");
var util = require("./utils/util.js");
var default_eq_freq = [ 20,   25,   32,   40,   50,   63,   80,   100,   125,   160, 
                       200,  250,  315,  400,  500,  630,  800,  1000,  1250,  1600, 
                      2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 
                     20000];
const CHANNEL_IN_NUM = 10;
const CHANNEL_IN_NAME = ['IN1', 'IN2', 'IN3', 'IN4', 'IN5', 'IN6', 'IN7', 'IN8', 'spd0', 'spd1'];
const CHANNEL_OUT_NUM = 8;
const CHANNEL_OUT_NAME = ['CH1', 'CH2', 'CH3', 'CH4', 'CH5', 'CH6', 'CH7', 'CH8'];
var BLE_Rx_Buff = [];
var BLE_Tx_Buff = [];
var Ble_backData = [];
var Sequence = 0
App({
  Data: {
    isLogin: false,
    isBleWork: false,
    aboutTitle: config.aboutTitle,
    ble_id: chinese.Content.unknow,
    version: 'V2.5',
    language: chinese.Content,
    mcu_version: chinese.Content.unknow,///未知
    arm_version: chinese.Content.unknow,///未知
    mainColor: config.mainColor,
    musicPlayer: config.musicPlayer,
    channel_out_num: config.channel_out_num,
    channels: CHANNEL_OUT_NAME,
    channel_out_name: CHANNEL_OUT_NAME,
    sysInfo: new Object,
    ServiceId: '0000FFF0-0000-1000-8000-00805F9B34FB',
    NotifyId: '0000FFF1-0000-1000-8000-00805F9B34FB',
    WriteId: '0000FFF2-0000-1000-8000-00805F9B34FB',
    connectId: '',
    player_data:{
      PlayNum:-1,     ///当前播放歌曲编号
      SongCnt:0,     ///总歌曲数
      PlayPause_S: 0,///播放暂停状态
      Cycle_S:0,     ///循环状态
      SongName: '未知名称',///歌曲名
      SongNameList: [],///歌曲列表
      CurrTime:0,   ///当前播放时间
      TotalTime:0,  ///总时间
    },
    dsp_data:{
      UpdataFlag: {
        Main: false,
        Channel: [false, false, false, false, false, false, false, false],
        Delay: false,
        Eq: [false, false, false, false, false, false, false, false],
        Mix: [false, false, false, false, false, false, false, false],
      },
      CurrState: 0,
      CurrMode: 0,
      MainVol: 7470,
      Vol: 30,
      VolMax: 40,
      LockVol: 8000,
      MainMute: false,
      ReName: '',
      ModeName: [[{},{},{}],[{},{},{}]],
      MixData: [],
      Filters_T: [],
      Mute: [],
      SingleData: [],
      EQ_Data: [],
      DelayData: [],
      OutPutChl: [],
      ChannelName: [],
      IsJoint:[],
    },
  },
  channelNumSet: function(num){
    this.Data.channel_out_num = num;
    this.Data.channels = CHANNEL_OUT_NAME.slice(0, num);
    wx.setStorageSync('channel_out_num', num)
  },
  onLaunch: function () {
    var that = this
    this.Data.sysInfo = wx.getSystemInfoSync()
    if (this.Data.sysInfo.language == 'en'){
      this.Data.language = english.Content
      this.Data.aboutTitle = config.aboutTitleEnglish
      wx.setTabBarItem({ index: 0, text: this.Data.language.delayBarTitle, })
      wx.setTabBarItem({ index: 1, text: this.Data.language.channelBarTitle, })
      wx.setTabBarItem({ index: 2, text: this.Data.language.mainBarTitle, })
      wx.setTabBarItem({ index: 3, text: this.Data.language.eqBarTitle, })
      wx.setTabBarItem({ index: 4, text: this.Data.language.mixBarTitle, })
    } else{///默认中文
      this.Data.language = chinese.Content
    }
    console.log(this.Data.sysInfo.language)
    let index = wx.getStorageSync('channel_out_num') || ''
    if (index) {
      this.Data.channel_out_num = index
    }
    if (this.Data.channel_out_num != CHANNEL_OUT_NUM) {
      this.channelNumSet(this.Data.channel_out_num);
    }
    for (var i = 0; i < CHANNEL_OUT_NUM; i++){///channel 循环
      this.Data.dsp_data.EQ_Data[i] = new Array;
      for(var j=0; j<31; j++){
        this.Data.dsp_data.EQ_Data[i][j] = new Object;
        this.Data.dsp_data.EQ_Data[i][j].id    = j+1;
        this.Data.dsp_data.EQ_Data[i][j].freq  = default_eq_freq[j];
        this.Data.dsp_data.EQ_Data[i][j].boost = 2400;
        this.Data.dsp_data.EQ_Data[i][j].q     = 141;
        this.Data.dsp_data.EQ_Data[i][j].isThrough = false;
        this.Data.dsp_data.EQ_Data[i][j].Gain = 1500;
      }
      this.Data.dsp_data.MixData[i] = new Array;
      for (var j = 0; j < CHANNEL_IN_NUM; j++) {
        this.Data.dsp_data.MixData[i][j] = new Object;
        this.Data.dsp_data.MixData[i][j].name = CHANNEL_IN_NAME[j];
        this.Data.dsp_data.MixData[i][j].vol = (i==j) ? 144 : 0;
      }
      this.Data.dsp_data.Filters_T[i] = new Array;
      for (var j = 0; j < 2; j++) {
        this.Data.dsp_data.Filters_T[i][j] = new Object;
        this.Data.dsp_data.Filters_T[i][j].En = true;
        this.Data.dsp_data.Filters_T[i][j].Phase = true;///true-正相 false-反相
        this.Data.dsp_data.Filters_T[i][j].Name = j == 0 ? this.Data.language.highPass : this.Data.language.lowPass;
        this.Data.dsp_data.Filters_T[i][j].Type = 1;
        this.Data.dsp_data.Filters_T[i][j].Slope = 3;
        this.Data.dsp_data.Filters_T[i][j].Freq = j == 0 ? 20 : 20000;
        this.Data.dsp_data.Filters_T[i][j].Gain = 0;
      }
      this.Data.dsp_data.Mute[i] = false;
      this.Data.dsp_data.SingleData[i] = 8000;
      this.Data.dsp_data.DelayData[i] = 0;
      this.Data.dsp_data.ChannelName[i] = 'CH' + (i+1);
      this.Data.dsp_data.IsJoint[i] = false;
    }
    this.Data.dsp_data.ModeName.forEach((item, i) =>
      item.forEach((item, j) => {
        item.id = i * 3 + j + 1
        item.name = ''
        item.defaultName = this.Data.language.modeName[i][j]
      })
    )
    this.Data.connectId = wx.getStorageSync('connectId') || ''
    var i = setInterval(function () {///定时器任务==BLE发送数据
      if (BLE_Tx_Buff.length) {
        that.BleDataTxPro();
      }
    }, 200)
    console.log(chinese.Content.aboutTitle)
  },
  /**
 * BLE写入数据
 */
  BLE_TxData: function (buffer, successCb, failCb){
    var len = buffer.length
    let buff = new ArrayBuffer(5 + len)
    let data = new Uint8Array(buff)
    data[0] = 0xaa
    data[1] = 0x55
    data[2] = len + 5
    data[3] = Sequence++
    buffer.forEach((item, index) => data[index+4] = item)
    data[len + 4] = util.checkSum(data, len + 4)
    BLE_Tx_Buff.push({ 'buff': buff, 'successCb': successCb, 'failCb': failCb})
    ///this.writeBLECharacteristicValue(buff, successCb, failCb)
  },
  BleDataTxPro: function () {
    var Data = BLE_Tx_Buff.splice(0, 1)[0];
    console.log('BLE Tx :' + util.ab2hex(Data.buff))
    this.writeBLECharacteristicValue(Data.buff, Data.successCb, Data.failCb)
  },
  writeBLECharacteristicValue: function (buffer, successCb, failCb) {
    wx.writeBLECharacteristicValue({
      deviceId: this.Data.connectId,
      serviceId: this.Data.ServiceId,
      characteristicId: this.Data.WriteId,
      value: buffer,
      success: function (res) {
        typeof successCb == "function" && successCb()
      },
      fail: function () {
        typeof failCb == "function" && failCb()
      }
    })
  },
  /**
   * BLE接收数据解析======================================================================start=====BLE接收数据解析===============
   */
  // 发送ACK
  sendACK: function (sequence) {
    var that = this
    let buffer = new ArrayBuffer(6)
    let data = new Uint8Array(buffer)
    data[0] = 0xAA
    data[1] = 0x55
    data[2] = 0x06
    data[3] = sequence
    data[4] = 0xFF
    data[5] = util.checkSum(data, 5)
    wx.writeBLECharacteristicValue({
      deviceId: this.Data.connectId,
      serviceId: this.Data.ServiceId,
      characteristicId: this.Data.WriteId,
      value: buffer,
      success: function (res) {
        console.log('return ACK success')
      },
      fail: function () {
        console.log('return ACK fail')
      }
    })
  },
  ///===协议解析
  /*0-刷新 1-加载结束 2-重新同步 */
  protocolAnalysis: function(array){
    var backData = true
    switch (array[4])
    {
      case 0xFF:
        backData = false
        break;
      case 0x01:
        if (Ble_backData.indexOf('0') == -1) {Ble_backData.push('0')}
        this.sendACK(array[3])
        if(array[5] == 0x03){
          this.Data.mcu_version = ''
          for (var i = 6; i < array[2]-2; i++) {
            this.Data.mcu_version += String.fromCharCode(array[i])
          }
          console.log(this.Data.mcu_version)
        } else if (array[5] == 0x11){
          this.Data.arm_version = ''
          for (var i = 6; i < array[2] - 2; i++) {
            this.Data.arm_version += String.fromCharCode(array[i])
          }
          console.log(this.Data.arm_version)
        }
        break;
      case 0x0A:
        if (Ble_backData.indexOf('0') == -1) { Ble_backData.push('0') }
        this.sendACK(array[3])
        switch (array[5]) {///subID
          case 0x00:/*编号状态*/
            if (array[6] == 0x00) {///当前状态
              this.Data.dsp_data.CurrState = 0;
              if (this.Data.dsp_data.CurrMode != array[7]){
                this.updataFlagClear();///切换场景后需更新数据
                this.Data.dsp_data.UpdataFlag.Main = true
                this.Data.dsp_data.CurrMode = array[7];
                for (var i = 0; i < CHANNEL_OUT_NUM; i++) {
                  this.Data.dsp_data.IsJoint[i] = false;
                }
              }
              console.log('CurrMode:' + this.Data.dsp_data.CurrMode)
              this.getModeName();
              this.getMainVol();
              this.getVol();
              this.getMainMute();
            } else if (array[6] == 0x01) {///存储当前状态中 ING
              this.Data.dsp_data.CurrState = 1;
            } else if (array[6] == 0x02) {///加载编号状态中 ING
              this.Data.dsp_data.CurrState = 2;
            } else if (array[6] == 0xFF) {///出错
              this.Data.dsp_data.CurrState = 0xFF;
            }
            break;
          case 0x01:/*DSP状态*/
            break;
          case 0x02:/*混音状态*/
            for (let index = 0; index < CHANNEL_IN_NUM; index++) {
              let data = array[8 + index]
              data = Math.round(data/1.44)*1.44
              this.Data.dsp_data.MixData[array[6] - 1][index].vol = data
              if (Ble_backData.indexOf('1') == -1) { Ble_backData.push('1') }
              console.log('MixData ' + (array[6] - 1) + ':' + data)
            }
            break;
          case 0x03:/*Filter*/
            let num = parseInt(array[6] / 2)
            this.Data.dsp_data.Filters_T[num][array[6] % 2].En = (array[7] & 0x01) ? true : false
            this.Data.dsp_data.Filters_T[num][array[6] % 2].Phase = (array[7] & 0x10) ? false : true
            this.Data.dsp_data.Filters_T[num][array[6] % 2].Type = array[8]
            this.Data.dsp_data.Filters_T[num][array[6] % 2].Slope = array[9]
            this.Data.dsp_data.Filters_T[num][array[6] % 2].Freq = array[10] * Math.pow(256, 3) + array[11] * Math.pow(256, 2) + array[12] * 256 + array[13]
            this.Data.dsp_data.Filters_T[num][array[6] % 2].Gain = array[14] * 256 + array[15]
            console.log('Filters_T ' + num + '-' + array[6] % 2 + ' :')
            console.log(this.Data.dsp_data.Filters_T[num][array[6] % 2])
            break;
          case 0x04:/*Eq*/
            if (array[6] % 32 == 31)
              break;
            var num = parseInt(array[6] / 32)
            this.Data.dsp_data.EQ_Data[num][array[6] % 32].isThrough = (array[7] & 0x01) ? false : true
            this.Data.dsp_data.EQ_Data[num][array[6] % 32].boost = array[9] * 256 + array[10]
            this.Data.dsp_data.EQ_Data[num][array[6] % 32].freq = array[11] * Math.pow(256, 3) + array[12] * Math.pow(256, 2) + array[13] * 256 + array[14]
            this.Data.dsp_data.EQ_Data[num][array[6] % 32].Gain = array[15] * 256 + array[16]
            this.Data.dsp_data.EQ_Data[num][array[6] % 32].q = array[17] * 256 + array[18]
            if (array[6] % 32 == 30)
              if (Ble_backData.indexOf('1') == -1) { Ble_backData.push('1') }
            console.log('EQ_Data ' + num + '-' + array[6] % 32 + ' :')
            console.log(this.Data.dsp_data.EQ_Data[num][array[6] % 32])
            break;
          case 0x05:/*Delay*/
            this.Data.dsp_data.DelayData[array[6] - 1] = array[7] * 256 + array[8]
            if (array[6] == CHANNEL_OUT_NUM)
              if (Ble_backData.indexOf('1') == -1) { Ble_backData.push('1') }
            console.log('Delay: ' + (array[6] - 1), this.Data.dsp_data.DelayData[array[6] - 1])
            break;
          case 0x06:/*Single*/
            if(array[6]==0x00){
              this.Data.dsp_data.MainVol = array[7] * 256 + array[8]
              this.Data.dsp_data.LockVol = array[9] * 256 + array[10]
              if (Ble_backData.indexOf('3') == -1) { Ble_backData.push('3') }
              console.log('MainVol: ' + this.Data.dsp_data.MainVol)
              console.log('LockVol: ' + this.Data.dsp_data.LockVol)
            }else{
              this.Data.dsp_data.SingleData[array[6] - 1] = array[7] * 256 + array[8]
              console.log('SingleData: ' + (array[6] - 1) + this.Data.dsp_data.SingleData[array[6] - 1])
            }
            break;
          case 0x08:/*Mute*/
            if (array[6] == 0x00) {
              this.Data.dsp_data.MainMute = array[7] == 0 ? true : false
              if (Ble_backData.indexOf('1') == -1) { Ble_backData.push('1') }
              console.log('MainMute: ' + this.Data.dsp_data.MainMute)
            } else {
              this.Data.dsp_data.Mute[array[6] - 1] = array[7] == 0 ? true : false
              console.log('Channel' + array[6] +'Mute: ' + this.Data.dsp_data.Mute[array[6] - 1])
            }
            break;
          case 0x09:/*rename重命名 */
            var char1 = String.fromCharCode(array[7] + array[8] * 256)
            var char2 = String.fromCharCode(array[9] + array[10] * 256)
            var char3 = String.fromCharCode(array[11] + array[12] * 256)
            var char4 = String.fromCharCode(array[13] + array[14] * 256)
            var name = (char1 + char2 + char3 + char4).trim()
            if (array[6] == 0x00){
              this.Data.dsp_data.ReName = name
            } else if (array[6] > 0x80) {
              var num = (array[6]&0x7F)-1
              this.Data.dsp_data.ModeName[parseInt(num / 3)][num % 3].name = name
            } else if (array[6] <= 0x08) {
              var num = array[6] - 1
              this.Data.dsp_data.ChannelName[num] = name
              if (Ble_backData.indexOf('1') == -1) { Ble_backData.push('1') }
            }
            break;
          case 0x0C:
            if(array[6] == 0x01){///bt addr
              this.Data.ble_id = ''
              for (var i = 7; i < array[2] - 1; i++) {
                this.Data.ble_id += String.fromCharCode(array[i])
              }
              console.log('ble_id:' + this.Data.ble_id)
            }
            break;
          case 0x0D:
            if (array[6] == 0x01) {
              this.Data.dsp_data.Vol = array[7]
              this.Data.dsp_data.VolMax = array[8]
              if (Ble_backData.indexOf('3') == -1) { Ble_backData.push('3') }
              console.log('Vol:' + this.Data.Vol + ' VolMax' + this.Data.VolMax)
            }
            break;
          default:break;
        }
        break;
      case 0x0C:
        if (Ble_backData.indexOf('0') == -1) { Ble_backData.push('0') }
        this.sendACK(array[3])
        switch (array[5]) {///subID
          case 0x01:///
            if(array[6] == 0xF1){
              this.playerDataInit()
              if (Ble_backData.indexOf('2') == -1) { Ble_backData.push('2') }
            }
            break;
          case 0x02:///
            this.Data.player_data.PlayPause_S = array[6];
            break;
          case 0x03:///
            this.Data.player_data.Cycle_S = array[6];
            break;
          case 0x04:
            this.Data.player_data.CurrTime = array[6] * 256 + array[7]
            this.Data.player_data.TotalTime = array[8] * 256 + array[9]
            break;
          case 0x07:
            this.Data.player_data.SongCnt = array[6] * 256 + array[7]
            console.log('SongCnt:'+this.Data.player_data.SongCnt)
            break;
          case 0x08:///
            var arrayBuffer = array.slice(6,-1)
            var unit8Arr = new Uint8Array(arrayBuffer);
            var encodedString = String.fromCharCode.apply(null, unit8Arr),
            decodedString = decodeURIComponent(escape((encodedString)));//没有这一步中文会乱码
            console.log(decodedString);
            this.Data.player_data.SongName = decodedString
            break;
          case 0x0B:
            var num = array[6] * 256 + array[7]
            try {
              var arrayBuffer = array.slice(8, -1)
              var decodedString = util.ab2string(arrayBuffer)
            } catch(e){
              try {
                var arrayBuffer = array.slice(8, -2)
                var decodedString = util.ab2string(arrayBuffer)
              } catch (e) {
                var arrayBuffer = array.slice(8, -3)
                var decodedString = util.ab2string(arrayBuffer)
              }
            }
            console.log(decodedString);
            this.Data.player_data.SongNameList[num-1] = decodedString;
            break;
          case 0x0C:///
            this.Data.player_data.PlayNum = array[6] * 256 + array[7]
            break; 
          default:break;
        }
        break;
    }
    return backData
  },
  ///===数据解析
  resolutionProtocol: function(){
    var backData = false
    if (BLE_Rx_Buff.length <= 6)
      return backData;
    if (BLE_Rx_Buff[0] == 0x55){
      if (BLE_Rx_Buff[1] == 0xAA) {
        var len = BLE_Rx_Buff[2]
        if (BLE_Rx_Buff.length >= len){
          if (util.checkSum(BLE_Rx_Buff, len - 1) == BLE_Rx_Buff[len-1]){
            console.log('checksum ok')
            backData = this.protocolAnalysis(BLE_Rx_Buff);
          }else{
            console.log('checksum error')
          }
          BLE_Rx_Buff = BLE_Rx_Buff.slice(len)
          if (backData == false) {
            backData = this.resolutionProtocol()
          }
        }else{
          return backData;
        }
      } else {
        BLE_Rx_Buff = BLE_Rx_Buff.slice(2)
        backData = this.resolutionProtocol()
      }
    } else {
      BLE_Rx_Buff = BLE_Rx_Buff.slice(1)
      backData = this.resolutionProtocol()
    }
    return backData
  },
  ///===数据接收
  judgeMcuData: function (arraybuffer, cbCheckSumOk) {
    var array = util.ab2array(arraybuffer)
    console.log('BLE Rx :' + util.ab2hex(array))
    BLE_Rx_Buff = BLE_Rx_Buff.concat(array)
    Ble_backData = [];
    while (this.resolutionProtocol());
    typeof cbCheckSumOk == "function" && cbCheckSumOk(Ble_backData)
  },
  /**
   * BLE接收数据解析======================================================================end======BLE接收数据解析==============
   */
  /**
   * 获取模式名称
   */
  getModeName: function () {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x89
    buffer[2] = 0x80
    for (var index = 0; index <= 6; index++) {
      buffer[2] = index ? (0x80 + index) : index
      this.BLE_TxData(buffer, function () {
        console.log('ok: getModeName ' + index)
      }, function () {
        console.log('fail: getModeName ' + index)
      })
    }
  },
  /**
   * 获取主音量
   */
  getMainVol: function () {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x86
    buffer[2] = 0x00
    this.BLE_TxData(buffer, function () {
      console.log('ok: getMainVol')
    }, function () {
      console.log('fail: getMainVol')
    })
  },
  getVol: function () {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x8D
    buffer[2] = 0x01
    this.BLE_TxData(buffer, function () {
      console.log('ok: getVol')
    }, function () {
      console.log('fail: getVol')
    })
  },
  /**
   * 获取主静音
   */
  getMainMute: function () {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x88
    buffer[2] = 0x00
    this.BLE_TxData(buffer, function () {
      console.log('ok: getMainMute')
    }, function () {
      console.log('fail: getMainMute')
    })
  },
  getMuteData: function (channel) {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x88
    buffer[2] = channel
    this.BLE_TxData(buffer, function () {
      console.log('ok: getChannelMute ')
    }, function () {
      console.log('fail: getChannelMute ')
    })
  },
  /**
   * 滤波器数据发送
   */
  getFilterData: function (channel) {
    var buffer = []
    buffer[0] = 0x0A
    buffer[1] = 0x83
    buffer[2] = parseInt(channel) * 2
    this.BLE_TxData(buffer, function () {
      console.log('ok: getFilterData ')
    }, function () {
      console.log('fail: getFilterData ')
    })
    buffer[2] = parseInt(channel) * 2 + 1
    this.BLE_TxData(buffer, function () {
      console.log('ok: getFilterData ')
    }, function () {
      console.log('fail: getFilterData ')
    })
  },
  playerDataInit: function (){
    this.Data.player_data.PlayNum = -1
    this.Data.player_data.SongCnt = 0     ///总歌曲数
    this.Data.player_data.PlayPause_S = 0///播放暂停状态
    this.Data.player_data.Cycle_S = 0     ///循环状态
    this.Data.player_data.SongName = '未知名称'///歌曲名
    this.Data.player_data.SongNameList = []///歌曲列表
  },
  updataFlagClear: function (){
    console.log('updataFlagClear')
    this.Data.dsp_data.UpdataFlag.Main = false
    for (let index in this.Data.dsp_data.UpdataFlag.Channel){
      this.Data.dsp_data.UpdataFlag.Channel[index] = false
    }
    this.Data.dsp_data.UpdataFlag.Delay = false
    for (let index in this.Data.dsp_data.UpdataFlag.Eq) {
      this.Data.dsp_data.UpdataFlag.Eq[index] = false
    }
    for (let index in this.Data.dsp_data.UpdataFlag.Mix) {
      this.Data.dsp_data.UpdataFlag.Mix[index] = false
    }
  }
})