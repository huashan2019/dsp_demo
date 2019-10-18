const Fs = 192000;

function duoxiangshi_com_order(w, b0, b1, b2) {
  var cos_w = Math.cos(w);
  var sin_w = Math.sin(w);
  var r = b0 + b1 * cos_w + b2 * (cos_w * cos_w - sin_w * sin_w);
  var n_i = 0 - (b1 + 2 * b2 * cos_w) * sin_w;
  var m = Math.sqrt(r * r + n_i * n_i);
  return m;
}

function get_Db(f, a0_fenmu, a1_fenmu, a2_fenmu, b0_fenzi, b1_fenzi, b2_fenzi) {
  var w_a = f * 2.0 * Math.PI;
  var w_d = 2.0 * Math.atan(w_a / 2.0 / Fs);
  var fenzi_m = duoxiangshi_com_order(w_d, b0_fenzi, b1_fenzi, b2_fenzi);
  var fenmu_m = duoxiangshi_com_order(w_d, a0_fenmu, a1_fenmu, a2_fenmu);
  var db_lg = 20 * Math.log10(fenzi_m / fenmu_m);
  return db_lg;
}


function computeDb_1st_Order_Butterworth(f, HPLP, freq, gain) {
  var gainLinear = Math.pow(10, gain / 20);
  var w0 = 2 * Math.PI * freq / Fs;
  if (HPLP == 0) {///高通
    var a0_fenmu = Math.sin(w0) + Math.cos(w0) + 1;
    var a1_fenmu = (Math.sin(w0) - Math.cos(w0) - 1);
    var b0_fenzi = gainLinear * (1 + Math.cos(w0));
    var b1_fenzi = -b0_fenzi;
  } else {
    var a0_fenmu = Math.sin(w0) + Math.cos(w0) + 1;
    var a1_fenmu = (Math.sin(w0) - Math.cos(w0) - 1);
    var b0_fenzi = gainLinear * Math.sin(w0);
    var b1_fenzi = b0_fenzi;
  }
  return get_Db(f, a0_fenmu, a1_fenmu, 0, b0_fenzi, b1_fenzi, 0);
}

function computeDb_2st_Order_Butterworth(f, HPLP, freq, gain) {
  var gainLinear = Math.pow(10, gain / 20);
  var w0 = 2 * Math.PI * freq / Fs;
  var alpha = Math.sin(w0) / (2 * (1 / Math.sqrt(2)));
  if (HPLP == 0) {///高通
    var a0_fenmu = 1 + alpha;
    var a1_fenmu = 0 - 2 * Math.cos(w0);
    var a2_fenmu = 1 - alpha;
    var b1_fenzi = 0 - (1 + Math.cos(w0)) * gainLinear;
    var b0_fenzi = 0 - b1_fenzi / 2;
    var b2_fenzi = b0_fenzi;
  } else {
    var a0_fenmu = 1 + alpha;
    var a1_fenmu = 0 - 2 * Math.cos(w0);
    var a2_fenmu = 1 - alpha;
    var b1_fenzi = (1 - Math.cos(w0)) * gainLinear;
    var b0_fenzi = b1_fenzi / 2;
    var b2_fenzi = b0_fenzi;
  }
  return get_Db(f, a0_fenmu, a1_fenmu, a2_fenmu, b0_fenzi, b1_fenzi, b2_fenzi);
}

function computeDb_High_Order_Butterworth(f, HPLP, freq, gain, orderIndex, i) {
  var gainLinear = Math.pow(10, gain / 20);
  var w0 = 2 * Math.PI * freq / Fs;
  var orderangle = (Math.PI / orderIndex) * (i + 0.5);
  var alpha = Math.sin(w0) / (2 * (1 / (2 * Math.sin(orderangle))));
  if (HPLP == 0) {///高通
    var a0_fenmu = 1 + alpha;
    var a1_fenmu = 0 - 2 * Math.cos(w0);
    var a2_fenmu = 1 - alpha;
    var b1_fenzi = 0 - (1 + Math.cos(w0)) * gainLinear;
    var b0_fenzi = 0 - b1_fenzi / 2;
    var b2_fenzi = b0_fenzi;
  } else {
    var a0_fenmu = 1 + alpha;
    var a1_fenmu = 0 - 2 * Math.cos(w0);
    var a2_fenmu = 1 - alpha;
    var b1_fenzi = (1 - Math.cos(w0)) * gainLinear;
    var b0_fenzi = b1_fenzi / 2;
    var b2_fenzi = b0_fenzi;
  }
  return get_Db(f, a0_fenmu, a1_fenmu, a2_fenmu, b0_fenzi, b1_fenzi, b2_fenzi);
}

function computeDb_2st_Order_Bessel(f, HPLP, freq, gain){
  var gainLinear = Math.pow(10, gain / 20);
  var w0 = 2 * Math.PI * freq / Fs;
  var alpha = Math.sin(w0) / (2 * (1 / Math.sqrt(3)));
  if (HPLP == 0) {///高通
    var a0_fenmu = 1 + alpha;
    var a1_fenmu = 0 - 2 * Math.cos(w0);
    var a2_fenmu = 1 - alpha;
    var b1_fenzi = 0 - (1 + Math.cos(w0)) * gainLinear;
    var b0_fenzi = 0 - b1_fenzi / 2;
    var b2_fenzi = b0_fenzi;
  } else {
    var a0_fenmu = 1 + alpha;
    var a1_fenmu = 0 - 2 * Math.cos(w0);
    var a2_fenmu = 1 - alpha;
    var b1_fenzi = (1 - Math.cos(w0)) * gainLinear;
    var b0_fenzi = b1_fenzi / 2;
    var b2_fenzi = b0_fenzi;
  }
  return get_Db(f, a0_fenmu, a1_fenmu, a2_fenmu, b0_fenzi, b1_fenzi, b2_fenzi);
}

function computeDb_Filter(f, HPLP, filter) {
  var db = 0;
  if (filter.En == false){
    return db;
  }
  if ((filter.Type == 1) && (filter.Slope == 1)) {///LINKWITZ  12dB_Oct
    db += computeDb_1st_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain);
    db += computeDb_1st_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain);
  } else if ((filter.Type == 1) && (filter.Slope == 3)) {///LINKWITZ  24dB_Oct
    db += computeDb_2st_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain);
    db += computeDb_2st_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain);
  } else if ((filter.Type == 1) && (filter.Slope == 5)) {///LINKWITZ  36dB_Oct
    db += computeDb_High_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain, 3, 0);
    db += computeDb_1st_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain);
    db += computeDb_High_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain, 3, 0);
    db += computeDb_1st_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain);
  } else if ((filter.Type == 1) && (filter.Slope == 7)) {///LINKWITZ  36dB_Oct
    db += computeDb_High_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain, 4, 0);
    db += computeDb_High_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain, 4, 1);
    db += computeDb_High_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain, 4, 0);
    db += computeDb_High_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain, 4, 1);
  } else if ((filter.Type == 2) && (filter.Slope == 1)) {///BESSEL  12dB_Oct
    db += computeDb_2st_Order_Bessel(f, HPLP, filter.Freq, filter.Gain);
  } else if ((filter.Type == 2) && (filter.Slope == 2)) {///BESSEL  18dB_Oct
    db += computeDb_2st_Order_Bessel(f, HPLP, filter.Freq, filter.Gain);
    db += computeDb_1st_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain);
  } else if ((filter.Type == 2) && (filter.Slope == 3)) {///BESSEL  24dB_Oct
    db += computeDb_2st_Order_Bessel(f, HPLP, filter.Freq, filter.Gain);
    db += computeDb_2st_Order_Bessel(f, HPLP, filter.Freq, filter.Gain);
  } else if ((filter.Type == 3) && (filter.Slope == 1)) {///BUTTERWORTH  12dB_Oct
    db += computeDb_2st_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain);
  } else if ((filter.Type == 3) && (filter.Slope == 2)) {///BUTTERWORTH  18dB_Oct
    db += computeDb_High_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain, 3, 0);
    db += computeDb_1st_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain);
  } else if ((filter.Type == 3) && (filter.Slope == 3)) {///BUTTERWORTH  24dB_Oct
    db += computeDb_High_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain, 4, 0);
    db += computeDb_High_Order_Butterworth(f, HPLP, filter.Freq, filter.Gain, 4, 1);
  }
  return db;
}

function computeDb_EqPeaking(f, boost, f0, Q, gain) {
  var w0 = 2 * Math.PI * f0 / Fs;
  var alpha = Math.sin(w0) / (2 * Q);
  var A = Math.pow(10, boost / 40);
  var a0_fenmu = 1 + alpha / A;
  var a1_fenmu = 0 - 2 * Math.cos(w0);
  var a2_fenmu = 1 - alpha / A;
  var mGainLinear = Math.pow(10, gain / 20);
  var b0_fenzi = (1 + alpha * A) * mGainLinear;
  var b1_fenzi = 0 - (2 * Math.cos(w0)) * mGainLinear;
  var b2_fenzi = (1 - alpha * A) * mGainLinear;
  return get_Db(f, a0_fenmu, a1_fenmu, a2_fenmu, b0_fenzi, b1_fenzi, b2_fenzi);
}

module.exports = {
  computeDb_Filter: computeDb_Filter,
  computeDb_EqPeaking: computeDb_EqPeaking
}