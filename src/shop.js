// ---------- Performance Shop Modal ----------

var SHOP_STATE = null;

function isShopOpen() {
  return !el("shopModal").hidden && SHOP_STATE !== null;
}

function getVehiclePerfProfile(car, moto) {
  var custom = VEHICLE_PERF_STATS[car];
  var fallback = moto ? DEFAULT_MOTO_PERF : DEFAULT_CAR_PERF;
  if (!custom) return fallback;
  return {
    accel: Array.isArray(custom.accel) && custom.accel.length === 2 ? custom.accel : fallback.accel,
    speed: Array.isArray(custom.speed) && custom.speed.length === 2 ? custom.speed : fallback.speed,
    hand:  Array.isArray(custom.hand)  && custom.hand.length === 2  ? custom.hand  : fallback.hand
  };
}
