const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 判断元素是否在数组内
 */
function isInArray (arr, obj) {
  var i = arr.length;
  while (i--) {
    if (arr[i] === obj) {
      return i;
    }
  }
  return -1;
}
function isInArrayKey(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}
///hex to array
function ab2array (arraybuffer) {
  var array = Array.prototype.map.call(
    new Uint8Array(arraybuffer),
    function (bit) {
      return bit
    }
  )
  return array
}
// ArrayBuffer转16进度字符串示例
function ab2hex (buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join(' ');
}

// 奇偶校验
function checkSum (array, len) {
  var xor = 0x00
  for (var i = 0; i < len; i++) {
    xor ^= array[i]
  }
  return xor
}
function ab2string(arrayBuffer){
  var unit8Arr = new Uint8Array(arrayBuffer);
  var encodedString = String.fromCharCode.apply(null, unit8Arr),
    decodedString = decodeURIComponent(escape((encodedString)));//没有这一步中文会乱码
  return decodedString
}
module.exports = {
  formatTime: formatTime,
  isInArray: isInArray,
  ab2array: ab2array,
  ab2hex: ab2hex,
  ab2string, ab2string,
  checkSum: checkSum,
  isInArrayKey, isInArrayKey
}
