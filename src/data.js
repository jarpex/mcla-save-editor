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
  /* O array de placas comeca um stride antes do slot 0, como o de tune:
     a placa do slot N esta em slotAt(N) - slotStride + slotPlate. */
  plateStrideBack: 1,

  tuneBase: 1293,
  tuneLv: 95,
  tunePct: 126,

  ttRecord: 0x578,
  ttEventRec: 0x6A8,

  ttTarget: 0x727D,
  ttTargetStride: 4,
  ttTargetCount: 4
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
  "vp_se_chv_plc_96"
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
  vpd_pon_gto_66: "1966 Pontiac GTO"
};

/* Заготовки стоковых (stock) и максимальных (max) характеристик для полосок
   в Performance Shop.
   Формат для каждой машины:
   { accel: [stock, max], speed: [stock, max], hand: [stock, max] } (значения 0..100).
   Пока стоит null, используются DEFAULT_CAR_PERF или DEFAULT_MOTO_PERF. */
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
};


/* ---------- Vehicles the editor has no slot for ----------
   These are in the game but absent from ROSTER, so VEHICLE_PERF_STATS above
   cannot hold them. Kept here so the data is not lost: when a slot is added,
   move the line up and drop the comment.

   Prefab names below are INFERRED from the vp_<maker>_<model>_<yy> pattern and
   are NOT verified against the game's own vehicle.lst — fix them before use.
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
