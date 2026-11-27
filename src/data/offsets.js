(() => {
  "use strict";

  const OFF = {
    money: 0x2D9,
    rep: 0x2E1,
    progCount: 0x2E5,
    progBase: 0x2E9,
    progStride: 65,
    cars: 0x53F,
    carsIdx: 0x543,
    slot0: 0x24FD,
    slotStride: 8176,
    slotLabel: 32,
    slotPlate: 2186,
    /* Appearance block (wheels and body details), 12 scattered bytes:
       +446,+450,+454,+458, +1734..+1974 step 48, +2177..+2178. */
    appear: [446, 450, 454, 458, 1734, 1782, 1830, 1878, 1926, 1974, 2177, 2178],
    /* The plate array starts one stride before slot 0, like the tune one:
       slot N's plate is at slotAt(N) - slotStride + slotPlate. */
    plateStrideBack: 1,

    tuneBase: 1293,
    tuneN: 13,
    tuneLv: 95,
    tunePct: 126,
    /* 13 vendor index bytes at +0x6E and 13 float multipliers at +0x27. */
    tuneVendor: 110,
    tuneVendorF: 0x27,

    ttRecord: 0x578,
    ttEventRec: 0x6A8,

    ttTarget: 0x727D,
    ttTargetStride: 4,
    ttTargetCount: 4,

    /* Collectables: 60 0/1 bytes in LocalOptions, in menu order
       (Hollywood 20, Beach 15, Downtown 15, Hills 10). */
    collect: 0x3DF84,
    collectN: 60
  };

  const MAX_WALLET = 2000000000;
  const RACE_TARGETS = 16;

  const TUNE_CATS = [
    "Exhaust system", "Headers", "Cold Air Intake", "Forced Induction",
    "Engine Upgrade", "Electronics", "Nitrous", "Clutch", "Gear Kit",
    "Shocks/Springs", "Swaybars", "Brakes", "Tires"
  ];

  const MOTO_CATS = [0, 4, 5, 6, 8, 12];

  const MOTO = {
    vp_duc_999r_06: 1,
    vp_duc_monster_s4r_07: 1,
    vp_kaw_ninja_zx14_06: 1,
    vpd_duc_1098_07: 1
  };

  const DEFAULT_CAR_PERF = { accel: [34, 66], speed: [38, 70], hand: [28, 56] };
  const DEFAULT_MOTO_PERF = { accel: [65, 86], speed: [40, 56], hand: [48, 72] };

  Object.assign(MCLA.data, {
    OFF,
    MAX_WALLET,
    RACE_TARGETS,
    TUNE_CATS,
    MOTO_CATS,
    MOTO,
    DEFAULT_CAR_PERF,
    DEFAULT_MOTO_PERF
  });
})();
