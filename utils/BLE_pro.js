const app = getApp()
var language = app.Data.language;

function openBluetoothAdapter_fail(res){
  console.log('fail openBluetoothAdapter:errCode = ' + res.errCode);
  switch (res.errCode) {
    case 10001:
      var content = language.openBluetoothAdapterContent0;
      break;
    case 10009:
      var content = language.openBluetoothAdapterContent1;
      break;
    default:
      var content = language.openBluetoothAdapterContent2;
      break;
  }
  wx.showModal({
    title: language.openBluetoothAdapterTitle,
    content: content,
    confirmColor: app.Data.mainColor,
    showCancel: false
  })
}

function createBLEConnection(connectId, backData) {
  ///console.log(connectId)
  wx.createBLEConnection({
    deviceId: connectId,
    success: (res) => {
      console.log('success connection')
      getBLEDeviceServices(connectId, backData);
    },
    fail: function () {
      console.log('fail connection')
      wx.showToast({
        title: language.failConnection,
      })
    }
  })
}

function getBLEDeviceServices(deviceId, backData) {
  wx.getBLEDeviceServices({
    deviceId,
    success: (res) => {
      ///console.log(res.services)
      getBLEDeviceCharacteristics(deviceId, app.Data.ServiceId, backData);
    }
  })
}

function getBLEDeviceCharacteristics(deviceId, serviceId, backData) {
  wx.getBLEDeviceCharacteristics({
    deviceId,
    serviceId,
    success: function (res) {
      console.log('success getBLEDeviceCharacteristics')
      notify(deviceId, serviceId, backData);
    },
    fail: function () {
      console.log('fail getBLEDeviceCharacteristics')
      wx.showToast({
        title: language.failGetBLEDeviceCharacteristics,
      })
    }
  })
}

function notify(deviceId, serviceId, backData) {
  // 最后一步，成功返回主页，失败则提示，故一定要先隐藏Loading弹窗
  wx.notifyBLECharacteristicValueChange({
    deviceId,
    serviceId,
    characteristicId: app.Data.NotifyId,
    state: true,
    success: function (res) {
      console.log('success notify')
      app.Data.connectId = deviceId;
      app.Data.isBleWork = true
      console.log('connectId:' + app.Data.connectId)
      wx.showToast({
        title: language.boundSuccess,
      })
      typeof backData == "function" && backData()
    },
    fail: function () {
      console.log('fail notify')
      wx.showToast({
        title: language.failNotify,
      })
    }
  })
}


module.exports = {
  createBLEConnection: createBLEConnection,
  openBluetoothAdapter_fail: openBluetoothAdapter_fail
}