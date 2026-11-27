var OFF = {
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
  /* A row of 13 bytes with each category's vendor index and a table of 13
     floats (4 bytes each) with its multiplier. The bytes sit at +0x6E and
     the floats at +0x27. */
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

/* ---------- Known offsets, per section ----------
   Each entry is shown in the Hex Sections panel when the section is expanded.
   `at` is relative to the section start; `k` is the i18n key with the text. */
var SECTION_NOTES = {
  Career: [
    { at: 0x2D9, size: 4, k: "offMoney" },
    { at: 0x2E1, size: 4, k: "offRep" },
    { at: 0x2E5, size: 4, k: "offProgCount" },
    { at: 0x2E9, size: 65, k: "offProgBase" },
    { at: 0x727D, size: 4, k: "offTtTarget" }
  ],
  Stats: [
    /* The record table starts at +0xC (16-aligned) with one 16-byte row per
       FourCC. The r:TI, vWIN and vkDT rows have no fixed offset: they move
       with the number of earlier records, so the editor finds each by code,
       not by position. */
    { at: 0xC, size: 16, k: "offStatRec" },
    { at: 0xC, size: 4, k: "offStatKey" },
    { at: 0x14, size: 1, k: "offStatKind" },
    { at: 0x18, size: 4, k: "offStatVal" },
    { at: 0x578, size: 4, k: "offTtRecord" },
    { at: 0x6A8, size: 4, k: "offTtEventRec" }
  ],
  LocalOptions: [
    { at: 0x53F, size: 1, k: "offCars" },
    { at: 0x543, size: 4, k: "offCarsIdx" },
    { at: 0x24FD, size: 8176, k: "offSlot0" },
    { at: 0x24FD, size: 32, k: "offSlotName", sub: true },
    { at: 0x24FD, size: 32, k: "offSlotLabel", sub: true, add: 32 },
    { at: 0x24FD, size: 13, k: "offTuneLv", sub: true, add: 95 },
    { at: 0x24FD, size: 1, k: "offTunePct", sub: true, add: 126 },
    { at: 0x24FD, size: 12, k: "offAppear", sub: true, add: 446 },
    { at: 0x24FD, size: 7, k: "offPlate", sub: true, add: 2186, back: 1 },
    { at: 1293, size: 13, k: "offTuneBase" },
    { at: 0x3DF84, size: 60, k: "offCollect" }
  ]
};

var ROSTER = [
  "vp_am_vantage_07","vp_aud_r8_08","vp_aud_rs4_07","vp_buk_grandnational_87",
  "vp_chv_camaro_06","vp_chv_camaro_06_DUB","vp_chv_camaross_69","vp_chv_cobalt_05",
  "vp_chv_corvettez06_07","vp_chv_impala_96","vp_chv_police_96","vp_citybus_07",
  "vp_cry_300c_06","vp_dge_challenger_06","vp_dge_challenger_06_DUB",
  "vp_dge_challenger_70","vp_dge_charger_06","vp_dsn_280z_75","vp_duc_999r_06",
  "vp_duc_monster_s4r_07","vp_frd_boss302_69","vp_frd_cobra_04","vp_frd_focus_04",
  "vp_frd_gt_06","vp_frd_mustang_06","vp_kaw_ninja_zx14_06","vp_lam_gallardo_06",
  "vp_lam_miura_71","vp_lam_murcielago_06","vp_lam_murcielago_06_DUB",
  "vp_mbz_s600_07","vp_mbz_s600_07_DUB","vp_mbz_sl65_07","vp_mit_3000gt_99",
  "vp_mit_eclipse_99","vp_mit_evo_06","vp_mzd_rx7_95","vp_mzd_rx8_06",
  "vp_nsn_240sx_98","vp_nsn_350z_06","vp_nsn_skyline_99","vp_pon_solstice_06",
  "vp_pon_transam_79","vp_sln_s281_06","vp_sln_s7_06","vp_vw_golf_07",
  "vp_vw_golf_83","vp_vw_scirocco_88",
  "vpd_buk_riviera_63","vpd_chv_belair_55","vpd_chv_chevelle_70",
  "vpd_chv_impala_64","vpd_chv_malibu_65","vpd_pon_gto_66",
  "vp_se_chv_plc_96",
  "vpd_am_db9_08","vpd_aud_s5_08","vpd_cad_xlrv_08","vpd_duc_1098_07",
  "vpd_mbz_clk63amg_08","vpd_mbz_cl65amg_08","vpd_mit_eclipse_09",
  "vpd_mit_evox_08",
  "vpd_lr_hse_08","vpd_lr_sport_08",
  "vp_se_dge_chp_06","vp_se_dge_plc_06","vp_se_dge_ubp_06",
  "vp_se_chv_chp_96"
];

var CAR_TITLES = {
  vp_am_vantage_07: "2007 Aston Martin V8 Vantage",
  vp_aud_r8_08: "2008 Audi R8",
  vp_aud_rs4_07: "2007 Audi RS 4",
  vp_buk_grandnational_87: "1987 Buick Grand National GNX",
  vp_chv_camaro_06: "2006 Chevrolet Camaro Concept",
  vp_chv_camaro_06_DUB: "2006 Chevrolet Camaro Concept DUB",
  vp_chv_camaross_69: "1969 Chevrolet Camaro RS SS",
  vp_chv_cobalt_05: "2006 Chevrolet Cobalt SS",
  vp_chv_corvettez06_07: "2007 Chevrolet Corvette Z06",
  vp_chv_impala_96: "1996 Chevrolet Impala SS",
  vp_chv_police_96: "1996 Chevrolet Impala Police",
  vp_citybus_07: "2007 City Bus",
  vp_cry_300c_06: "2006 Chrysler 300C SRT-8",
  vp_dge_challenger_06: "2006 Dodge Challenger Concept",
  vp_dge_challenger_06_DUB: "2006 Dodge Challenger Concept DUB",
  vp_dge_challenger_70: "1970 Dodge Challenger R/T",
  vp_dge_charger_06: "2006 Dodge Charger SRT-8",
  vp_dsn_280z_75: "1975 Datsun 280Z",
  vp_duc_999r_06: "2006 Ducati 999R",
  vp_duc_monster_s4r_07: "2007 Ducati Monster S4R",
  vp_frd_boss302_69: "1969 Ford Mustang Boss 302",
  vp_frd_cobra_04: "2004 Ford SVT Cobra",
  vp_frd_focus_04: "2004 Ford Focus SVT",
  vp_frd_gt_06: "2006 Ford GT",
  vp_frd_mustang_06: "2006 Ford Mustang GT",
  vp_kaw_ninja_zx14_06: "2006 Kawasaki Ninja ZX-14",
  vp_lam_gallardo_06: "2006 Lamborghini Gallardo Spyder",
  vp_lam_miura_71: "1971 Lamborghini Miura SV",
  vp_lam_murcielago_06: "2006 Lamborghini Murcielago Roadster",
  vp_lam_murcielago_06_DUB: "2006 Lamborghini Murcielago Roadster DUB",
  vp_mbz_s600_07: "2007 Mercedes-Benz S600",
  vp_mbz_s600_07_DUB: "2007 Mercedes-Benz S600 DUB",
  vp_mbz_sl65_07: "2007 Mercedes-Benz SL65 AMG",
  vp_mit_3000gt_99: "1999 Mitsubishi 3000GT VR-4",
  vp_mit_eclipse_99: "1999 Mitsubishi Eclipse GSX",
  vp_mit_evo_06: "2006 Mitsubishi Lancer Evolution IX MR",
  vp_mzd_rx7_95: "1995 Mazda RX-7",
  vp_mzd_rx8_06: "2006 Mazda RX-8 Shinka",
  vp_nsn_240sx_98: "1998 Nissan 240SX",
  vp_nsn_350z_06: "2006 Nissan 350Z Roadster",
  vp_nsn_skyline_99: "1999 Nissan Skyline GT-R V-Spec",
  vp_pon_solstice_06: "2006 Pontiac Solstice",
  vp_pon_transam_79: "1979 Pontiac Firebird Trans Am",
  vp_sln_s281_06: "2006 Saleen S281 Extreme",
  vp_sln_s7_06: "2006 Saleen S7 Twin-Turbo",
  vp_vw_golf_07: "2007 Volkswagen R32",
  vp_vw_golf_83: "1983 Volkswagen Golf GTI",
  vp_vw_scirocco_88: "1988 Volkswagen Scirocco",
  vp_se_chv_plc_96: "1996 Chevrolet Impala SS Police",
  vpd_buk_riviera_63: "1963 Buick Riviera",
  vpd_chv_belair_55: "1955 Chevrolet Bel Air",
  vpd_chv_chevelle_70: "1970 Chevrolet Chevelle SS",
  vpd_chv_impala_64: "1964 Chevrolet Impala",
  vpd_chv_malibu_65: "1965 Chevrolet Malibu",
  vpd_pon_gto_66: "1966 Pontiac GTO",
  vpd_am_db9_08: "2007 Aston Martin DB9",
  vpd_aud_s5_08: "2008 Audi S5",
  vpd_cad_xlrv_08: "2008 Cadillac XLR-V",
  vpd_duc_1098_07: "2008 Ducati 1098R",
  vpd_mbz_clk63amg_08: "2008 Mercedes-Benz CLK 63 AMG Black",
  vpd_mbz_cl65amg_08: "2008 Mercedes-Benz CL 65 AMG",
  vpd_mit_eclipse_09: "2009 Mitsubishi Eclipse Spyder GT",
  vpd_mit_evox_08: "2008 Mitsubishi Lancer Evolution X",
  vpd_lr_hse_08: "2008 Land Rover Range Rover Supercharged",
  vpd_lr_sport_08: "2008 Land Rover Range Rover Sport Supercharged",
  vp_se_dge_chp_06: "2006 Dodge Charger SRT-8 Police CHP",
  vp_se_dge_plc_06: "2006 Dodge Charger SRT-8 Police",
  vp_se_dge_ubp_06: "2006 Dodge Charger SRT-8 Police Border Patrol",
  vp_se_chv_chp_96: "1996 Chevrolet Impala SS Police CHP"
};

/* Stock and max performance for the shop bars, per car.
   Shape: { accel: [stock, max], speed: [stock, max], hand: [stock, max] }, 0..100.
   null falls back to DEFAULT_CAR_PERF or DEFAULT_MOTO_PERF. */
var DEFAULT_CAR_PERF  = { accel: [34, 66], speed: [38, 70], hand: [28, 56] };
var DEFAULT_MOTO_PERF = { accel: [65, 86], speed: [40, 56], hand: [48, 72] };

var VEHICLE_PERF_STATS = {
  vp_am_vantage_07: { accel: [37, 46], speed: [69, 88], hand: [47, 66] },
  vp_aud_r8_08: null,
  vp_aud_rs4_07: { accel: [31, 42], speed: [48, 76], hand: [36, 52] },
  vp_buk_grandnational_87: { accel: [25, 40], speed: [35, 56], hand: [19, 31] },
  vp_chv_camaro_06: { accel: [32, 43], speed: [44, 70], hand: [40, 56] },
  vp_chv_camaro_06_DUB: { accel: [37, 43], speed: [55, 70], hand: [48, 56] },
  vp_chv_camaross_69: { accel: [31, 50], speed: [37, 60], hand: [23, 36] },
  vp_chv_cobalt_05: { accel: [30, 39], speed: [34, 54], hand: [27, 47] },
  vp_chv_corvettez06_07: { accel: [49, 66], speed: [67, 89], hand: [63, 79] },
  vp_chv_impala_96: { accel: [23, 33], speed: [35, 57], hand: [20, 29] },
  vp_chv_police_96: { accel: [23, 33], speed: [35, 57], hand: [46, 76] },
  vp_citybus_07: null,
  vp_cry_300c_06: { accel: [32, 43], speed: [53, 76], hand: [32, 43] },
  vp_dge_challenger_06: { accel: [33, 46], speed: [53, 76], hand: [41, 57] },
  vp_dge_challenger_06_DUB: { accel: [35, 46], speed: [62, 76], hand: [48, 57] },
  vp_dge_challenger_70: { accel: [40, 56], speed: [31, 56], hand: [23, 36] },
  vp_dge_charger_06: { accel: [31, 43], speed: [51, 72], hand: [35, 55] },
  vp_dsn_280z_75: { accel: [19, 30], speed: [24, 48], hand: [15, 36] },
  vp_duc_999r_06: { accel: [77, 91], speed: [54, 66], hand: [60, 73] },
  vp_duc_monster_s4r_07: { accel: [66, 78], speed: [39, 51], hand: [50, 64] },
  vp_frd_boss302_69: { accel: [29, 42], speed: [31, 53], hand: [23, 35] },
  vp_frd_cobra_04: { accel: [57, 68], speed: [67, 92], hand: [64, 79] },
  vp_frd_focus_04: { accel: [22, 35], speed: [38, 54], hand: [27, 49] },
  vp_frd_gt_06: { accel: [49, 66], speed: [72, 93], hand: [69, 84] },
  vp_frd_mustang_06: { accel: [32, 50], speed: [44, 65], hand: [35, 50] },
  vp_kaw_ninja_zx14_06: { accel: [87, 97], speed: [84, 96], hand: [87, 93] },
  vp_lam_gallardo_06: { accel: [43, 60], speed: [69, 89], hand: [71, 82] },
  vp_lam_miura_71: { accel: [40, 50], speed: [61, 88], hand: [57, 71] },
  vp_lam_murcielago_06: { accel: [43, 59], speed: [75, 93], hand: [76, 86] },
  vp_lam_murcielago_06_DUB: { accel: [47, 55], speed: [83, 93], hand: [80, 86] },
  vp_mbz_s600_07: { accel: [36, 47], speed: [61, 80], hand: [37, 52] },
  vp_mbz_s600_07_DUB: { accel: [40, 47], speed: [70, 84], hand: [44, 52] },
  vp_mbz_sl65_07: { accel: [42, 55], speed: [65, 84], hand: [54, 70] },
  vp_mit_3000gt_99: { accel: [23, 33], speed: [46, 72], hand: [38, 67] },
  vp_mit_eclipse_99: { accel: [22, 26], speed: [27, 50], hand: [32, 48] },
  vp_mit_evo_06: { accel: [28, 42], speed: [52, 79], hand: [51, 69] },
  vp_mzd_rx7_95: { accel: [28, 39], speed: [47, 73], hand: [48, 65] },
  vp_mzd_rx8_06: { accel: [22, 31], speed: [38, 58], hand: [30, 50] },
  vp_nsn_240sx_98: { accel: [15, 23], speed: [14, 39], hand: [17, 25] },
  vp_nsn_350z_06: { accel: [27, 37], speed: [44, 72], hand: [44, 64] },
  vp_nsn_skyline_99: { accel: [27, 40], speed: [50, 76], hand: [40, 63] },
  vp_pon_solstice_06: { accel: [26, 34], speed: [34, 53], hand: [29, 46] },
  vp_pon_transam_79: { accel: [24, 42], speed: [37, 56], hand: [16, 29] },
  vp_sln_s281_06: { accel: [35, 49], speed: [56, 77], hand: [57, 71] },
  vp_sln_s7_06: { accel: [69, 84], speed: [73, 94], hand: [74, 84] },
  vp_vw_golf_07: { accel: [25, 40], speed: [48, 75], hand: [40, 57] },
  vp_vw_golf_83: { accel: [18, 28], speed: [37, 49], hand: [23, 39] },
  vp_vw_scirocco_88: { accel: [23, 37], speed: [30, 48], hand: [13, 27] },
  vp_se_chv_plc_96: { accel: [23, 33], speed: [35, 57], hand: [46, 76] },
  vpd_buk_riviera_63: { accel: [23, 40], speed: [33, 52], hand: [10, 24] },
  vpd_chv_belair_55: { accel: [16, 25], speed: [17, 50], hand: [8, 19] },
  vpd_chv_chevelle_70: { accel: [35, 53], speed: [37, 60], hand: [22, 37] },
  vpd_chv_impala_64: { accel: [24, 41], speed: [32, 54], hand: [13, 27] },
  vpd_chv_malibu_65: { accel: [28, 45], speed: [33, 54], hand: [17, 30] },
  vpd_pon_gto_66: { accel: [31, 53], speed: [34, 58], hand: [21, 36] },
  vpd_am_db9_08: { accel: [36, 46], speed: [71, 90], hand: [49, 68] },
  vpd_aud_s5_08: { accel: [25, 37], speed: [48, 74], hand: [33, 50] },
  vpd_cad_xlrv_08: { accel: [34, 42], speed: [65, 86], hand: [54, 70] },
  vpd_duc_1098_07: { accel: [84, 93], speed: [76, 91], hand: [77, 85] },
  vpd_mbz_clk63amg_08: { accel: [39, 51], speed: [63, 84], hand: [41, 57] },
  vpd_mbz_cl65amg_08: { accel: [37, 47], speed: [61, 81], hand: [33, 49] },
  vpd_mit_eclipse_09: { accel: [25, 40], speed: [48, 66], hand: [35, 66] },
  vpd_mit_evox_08: { accel: [27, 42], speed: [54, 81], hand: [52, 68] },
  vpd_lr_hse_08: { accel: [23, 34], speed: [38, 60], hand: [30, 43] },
  vpd_lr_sport_08: { accel: [19, 30], speed: [35, 57], hand: [30, 45] },
  vp_se_dge_chp_06: { accel: [45, 57], speed: [75, 75], hand: [57, 57] },
  vp_se_dge_plc_06: { accel: [31, 43], speed: [53, 75], hand: [37, 57] },
  vp_se_dge_ubp_06: { accel: [39, 47], speed: [65, 77], hand: [49, 59] },
  vp_se_chv_chp_96: { accel: [33, 33], speed: [57, 57], hand: [76, 76] },
};


/* ---------- Stock appearance (wheels + body details) ----------
   The 12 bytes the game writes when you buy a car in the shop:
   +446,+450,+454,+458 (4 detail bytes), +1734..+1974 (6 values,
   step 48), +2177..+2178 (wheel diameter, 2 bytes).

   Taken from real saves with stock cars (Saves example/stock cars +
   mc4.sav.COMPLETED). Missing: vp_aud_r8_08 (Social Club reward),
   vp_chv_police_96 and vp_citybus_07, which no save had.
   With no entry here the editor writes nothing and the car keeps the
   previous slot's block.
*/
/* Vendors per category. Only the Escape (category 0) was collected from
   the game, and only at level 1: each part has its own set, the other 12
   are not dumped yet. `floats` is the multiplier the game writes to
   tuneVendorF; `stock` is the "no part" value. */
var TUNE_VENDORS = {
  0: {
    stock: 0.6789,
    names: ["5zigen", "Apexi", "Borla", "Buschur Racing", "DC Sport", "Espelir",
            "Flowtech", "HKS", "Hooker", "Injen Technology", "MAC", "Moroso",
            "Turbo XS"],
    floats: [0.9601, 1.2050, 1.4018, 1.6667, 1.8965, 2.0837, 2.5040,
             2.7283, 2.9350, 3.1073, 3.3497, 3.5802, 3.7519]
  }
};

var STOCK_APPEARANCE = {
  vp_am_vantage_07: [0x03,0x01,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x13,0x13],
  vp_aud_rs4_07: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x11,0x11],
  vp_buk_grandnational_87: [0x03,0x03,0x01,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0D,0x0D],
  vp_chv_camaro_06: [0x01,0x01,0x01,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x18,0x19],
  vp_chv_camaro_06_DUB: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x14,0x14],
  vp_chv_camaross_69: [0x03,0x03,0x01,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0E,0x0E],
  vp_chv_cobalt_05: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x12,0x12],
  vp_chv_corvettez06_07: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x14,0x14],
  vp_chv_impala_96: [0x00,0x00,0x01,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x0F,0x0F],
  vp_cry_300c_06: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x12,0x12],
  vp_dge_challenger_06: [0x01,0x00,0x01,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x17,0x19],
  vp_dge_challenger_06_DUB: [0x01,0x03,0x01,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x14,0x14],
  vp_dge_challenger_70: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x11,0x11],
  vp_dge_charger_06: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x14,0x15],
  vp_dsn_280z_75: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0E,0x0E],
  vp_duc_999r_06: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x12,0x12],
  vp_duc_monster_s4r_07: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x11,0x11],
  vp_frd_boss302_69: [0x00,0x00,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x0F,0x0F],
  vp_frd_cobra_04: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x12,0x13],
  vp_frd_focus_04: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x12,0x12],
  vp_frd_gt_06: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x13,0x14],
  vp_frd_mustang_06: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x15,0x16],
  vp_kaw_ninja_zx14_06: [0x01,0x00,0x01,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0F,0x0F],
  vp_lam_gallardo_06: [0x03,0x03,0x03,0x03,0x02,0x02,0x02,0x02,0x02,0x02,0x12,0x12],
  vp_lam_miura_71: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x12,0x12],
  vp_lam_murcielago_06: [0x03,0x00,0x01,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x16,0x16],
  vp_lam_murcielago_06_DUB: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x12,0x13],
  vp_mbz_s600_07: [0x03,0x00,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x19,0x19],
  vp_mbz_s600_07_DUB: [0x03,0x03,0x03,0x03,0x02,0x02,0x02,0x02,0x02,0x02,0x0F,0x0F],
  vp_mbz_sl65_07: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x13,0x14],
  vp_mit_3000gt_99: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x10,0x10],
  vp_mit_eclipse_99: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x12,0x12],
  vp_mit_evo_06: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x14,0x14],
  vp_mzd_rx7_95: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x12,0x12],
  vp_mzd_rx8_06: [0x00,0x00,0x00,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x11,0x11],
  vp_nsn_240sx_98: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x0E,0x0E],
  vp_nsn_350z_06: [0x01,0x01,0x01,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x11,0x11],
  vp_nsn_skyline_99: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x13,0x13],
  vp_pon_solstice_06: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x11,0x11],
  vp_pon_transam_79: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x11,0x11],
  vp_sln_s281_06: [0x03,0x03,0x01,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x13,0x13],
  vp_sln_s7_06: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x11,0x11],
  vp_vw_golf_07: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x13,0x13],
  vp_vw_golf_83: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0F,0x0F],
  vp_vw_scirocco_88: [0x01,0x00,0x01,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0E,0x0F],
  vpd_buk_riviera_63: [0x01,0x01,0x01,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x0F,0x0F],
  vpd_chv_belair_55: [0x03,0x03,0x01,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0F,0x0F],
  vpd_chv_chevelle_70: [0x03,0x03,0x03,0x03,0x02,0x02,0x02,0x02,0x02,0x02,0x15,0x15],
  vpd_chv_impala_64: [0x00,0x01,0x00,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0E,0x0E],
  vpd_chv_malibu_65: [0x03,0x00,0x01,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0E,0x0E],
  vpd_pon_gto_66: [0x03,0x00,0x01,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0E,0x0E],
  vp_se_chv_plc_96: [0x03,0x00,0x01,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0E,0x0E],
  vpd_am_db9_08: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x14,0x14],
  vpd_aud_s5_08: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x12,0x12],
  vpd_cad_xlrv_08: [0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x13,0x13],
  vpd_duc_1098_07: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x13,0x13],
  vpd_mbz_clk63amg_08: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x14,0x14],
  vpd_mbz_cl65amg_08: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x13,0x13],
  vpd_mit_eclipse_09: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x13,0x13],
  vpd_mit_evox_08: [0x01,0x01,0x01,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x13,0x13],
  vpd_lr_hse_08: [0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x03,0x15,0x15],
  vpd_lr_sport_08: [0x03,0x00,0x03,0x03,0x02,0x02,0x02,0x02,0x02,0x02,0x12,0x12],
  vp_se_dge_chp_06: [0x03,0x03,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x14,0x14],
  vp_se_dge_plc_06: [0x03,0x01,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0E,0x0E],
  vp_se_dge_ubp_06: [0x03,0x03,0x03,0x01,0x03,0x03,0x03,0x03,0x03,0x03,0x16,0x16],
  vp_se_chv_chp_96: [0x03,0x01,0x03,0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x0E,0x0E],
};

/* ---------- Vehicles the editor has no slot for ----------
   These are in the game but absent from ROSTER, so VEHICLE_PERF_STATS above
   cannot hold them. Kept here so the data is not lost: when a slot is added,
   move the line up and drop the comment.

   Prefab names below are INFERRED from the vp_<maker>_<model>_<yy> pattern and
   are NOT verified against the game's own vehicle.lst. Fix them before use.
   The seven a real save confirmed (Bel Air, Riviera, Impala '64, Malibu, GTO,
   Chevelle, Impala SS Police) moved up into ROSTER, with their numbers in
   VEHICLE_PERF_STATS. The save's vp_se_chv_plc_96 is the D-Class $20,000
   regular car (35/23/46 -> 57/33/76); the B-Class $40,000 CHP is a different
   prefab and is still missing.
   Columns: prefab | name | class | group | type | cost | stock speed/accel/hand
            -> max speed/accel/hand
   (the table's own column order, speed first; VEHICLE_PERF_STATS stores
   [stock, max] per accel / speed / hand, so the two are swapped on the way in)

  vp_lnd_rangerover_sc           Land Rover RANGE ROVER SUPERCHARGED    C-Class  Group 3  SUV            $94,000  38/23/30 -> 60/34/43
  vp_lnd_rangerover_sport        Land Rover RANGE ROVER SPORT           C-Class  Group 3  SUV            $72,000  35/19/30 -> 57/30/45
  vp_mit_eclipse_spyder_09       Mitsubishi 2009 ECLIPSE SPYDER GT      C-Class  Group 3  Tuner          $30,000  48/25/35 -> 66/40/66
  vp_aud_s5_08                   Audi 2008 S5                           B-Class  Group 3  Luxury         $54,000  48/25/33 -> 74/37/50
  vp_mit_evo_x_08                Mitsubishi 2008 EVOLUTION X            B-Class  Group 3  Tuner          $34,000  54/27/52 -> 81/42/68
  vp_cad_xlrv_08                 Cadillac 2008 XLRV                     B-Class  Group 4  Luxury        $105,000  65/34/54 -> 86/42/70
  vp_mbz_clk63_08                Mercedes-Benz 2008 CLK63 AMG BLACK     B-Class  Group 4  Luxury        $136,000  63/39/41 -> 84/51/57
  vp_mbz_cl65_08                 Mercedes-Benz 2008 CL65 AMG            B-Class  Group 4  Luxury        $205,000  61/37/33 -> 81/47/49
  vp_am_db9_07                   Aston Martin 2007 DB9                  B-Class  Group 4  Exotic        $169,000  71/36/49 -> 90/46/68
  vp_duc_1098r_08                Ducati 2008 1098R                      A-Class  Group 4  Sports Bike    $15,000  76/84/77 -> 91/93/85
  vp_dge_charger_police          Dodge CHARGER POLICE                   C-Class  Group 3  Police         $38,000  53/31/37 -> 75/43/57
  vp_dge_charger_police_BP       Dodge CHARGER POLICE BP                B-Class  Group 3  Police         $50,000  65/39/49 -> 77/47/59
  vp_dge_charger_police_CHP      Dodge CHARGER POLICE CHP               B-Class  Group 4  Police         $65,000  75/45/57 -> 75/45/57
*/
