(() => {
  "use strict";

  const STAT_NAMES = {
    /* Game Stats */
    gBRN: "Total Burnout",
    gCOL: "Collectables",
    gCPA: "Total Cops Activated",
    gCPL: "Total Cops Lost",
    gCPR: "Total Arrests",
    gCWN: "Non Career Consecutive Wins",
    gDAM: "Total Damage Points",
    gHOP: "Total Opponents Hit",
    gHPR: "Total Props Hit",
    gHTR: "Total Traffic Hit",
    gNIT: "Total Nitrous",
    gOUT: "Total Damage Out",
    gRCP: "Races Completed",
    gSST: "Total SST",
    gWIN: "Total Numbers of Wins",
    gWIP: "Total Wipeouts",
    gZON: "Total Zone Special Ability",
    ghTC: "Total Hours Cruising",
    ghTP: "Total Hours Played",
    gk2W: "Two Wheel Driving Distance (miles)",
    gkDS: "Total Distance Traveled (miles)",
    gkWL: "Total Wheelie Distance (miles)",
    gmJD: "Max. Jump Distance (meters)",
    gsJT: "Total Jump Time (seconds)",

    /* Career Stats */
    "k$CE": "Total Cash Earned",
    k$WA: "Wager Win Amount",
    "k%AG": "Percent Completed",
    k2ND: "Number of Second Place",
    k3RD: "Number of Third Place",
    "k:TB": "Time Trial Record",
    kARS: "Average Restarts",
    kCCW: "Most Consecutive Wins",
    kCWN: "Career Consecutive Wins",
    kDLT: "Total Deliveries",
    kEXW: "Exotic Wins",
    kFWN: "Freeway Wins",
    kHOK: "Hookmen Beaten",
    kLED: "Most Lead Changes",
    kLOW: "Lowrider Wins",
    kLUW: "Luxury Wins",
    kMOW: "Motorcycle Wins",
    kMRS: "Max Restarts in a Race",
    kMUW: "Muscle Wins",
    kPDS: "Payback Destroyed",
    kRCP: "Races Completed",
    kRLW: "Red Light Wins",
    kSUW: "SUV Wins",
    kTRS: "Total Restarts",
    kTUW: "Tuner Wins",
    kWIN: "Number of Wins",
    khTC: "Hours Cruising",

    /* Vehicle Stats */
    vWIN: "Number of Wins",
    vkDT: "Distance Traveled (miles)",

    /* Race Stats */
    "r:TI": "Race Time"
  };

  const RACE_NAMES = [
    "Century Mall", "Hollywood and Downtown", "Laurel Canyon Loop", "Promenade",
    "Theater Circuit", "University Loop", "Westwood", "Around Hollywood",
    "Central LA Showdown", "Century City Jumps", "Fairfax and Sunset", "Hollywood Drifts",
    "Laurel Canyon Run", "Macarthur Cut", "Old Hollywood Shortcuts", "Sunset and Vine",
    "Sunset River Run", "Valley Freeways", "Welcome to Hollywood", "West LA Challenge",
    "Wilshire Blvd.", "Wishire Sprint", "California Incline Loop", "Santa Monica Loop",
    "Under the 405", "Beaches and Beverly Run", "Ocean to LA River", "Old Route 66",
    "Sand and Surf", "University Cut", "Westside Ride", "Westwood and Brentwood",
    "6th St.", "Downtown Freeway Loop", "LA River Run", "Midtown",
    "Railyard", "4th Street Meet", "Civic Center Race", "Crossblocks",
    "Downtown to Pier", "Downtown Tour", "Downtown Vistas", "Figueroa and Grand",
    "Rags to Riches", "Coldwater Canyon", "Mullholland", "Hollywood, Valley and Beaches",
    "Mullholland and Beverly", "Mullholland Drive East", "Mullholland Drive West", "River Valley",
    "Up and Over Coldwater", "Ventura Loop", "10 and 405 is 110", "Figueroa and Vermont",
    "Round Baldwin", "South Central Speedway", "Track Circuit", "West Adams Loop",
    "Baldwin Crenshaw Run", "Campus Orientation", "Creenshaw and Back", "SC Touring Time",
    "South Central Tour", "Southeast Run", "Under the 10", "West Adams Match", ""
  ];

  const RACE_GROUPS = [
    {
      key: "stRaceOrdered",
      label: "stRaceOrdered",
      occ: [
        7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
        25, 26, 27, 28, 29, 30, 31, 37, 38, 39, 40, 41, 42, 43, 44,
        47, 48, 49, 50, 51, 52, 53, 60, 61, 62, 63, 64, 65, 66, 67
      ]
    },
    {
      key: "stRaceCircuit",
      label: "stRaceCircuit",
      occ: [0, 1, 2, 3, 4, 5, 6, 22, 23, 24, 32, 33, 34, 35, 36, 45, 46, 54, 55, 56, 57, 58, 59]
    },
    { key: "stRaceUnordered", label: "stRaceUnordered", occ: [] },
    { key: "stRaceLandmark", label: "stRaceLandmark", occ: [] },
    { key: "stRaceUnknown", label: "stRaceUnknown", hideEmpty: true, occ: [68] }
  ];

  const WIN_CAR_NAMES = [
    "1998 240SX", "1969 Camaro RS SS", "1969 BOSS 302", "2004 SVT Focus",
    "1999 Eclipse GSX", "2006 RX-8 \"SHINKA\"", "CHALLENGER CONCEPT \"DUB EDITION\"",
    "2008 R32", "1999 3000GT VR-4", "2006 S600 \"DUB EDITION\"", "1971 MIURA SV",
    "2008 R8", "2004 MURCIELAGO ROADSTER", "2004 MURCIELAGO \"DUB EDITION\"",
    "2007 S7", "2007 NINJA ZX14", "1964 IMPALA", "1965 MALIBU",
    "RANGE ROVER SPORT", "2008 S5", "2008 1098R"
  ];

  const CAR_ORDER_NAMES = [
    "1983 Golf/GTI", "1998 240SX", "1975 280Z", "1988 Scirocco",
    "1969 Camaro RS SS", "1969 BOSS 302", "1979 FIREBIRD", "1996 IMPALA SS",
    "1987 GRAND NATIONAL GNX", "1970 Challenger R/T", "2004 SVT Focus", "2006 SOLSTICE",
    "1999 Eclipse GSX", "2006 Cobalt SS", "2006 RX-8 \"SHINKA\"", "2007 MONSTER S4RS",
    "2005 Mustang GT Convertible", "Camaro Concept", "CAMARO CONCEPT \"DUB EDITION\"", "Charger SRT-8",
    "Challenger Concept", "CHALLENGER CONCEPT \"DUB EDITION\"", "2007 300C SRT-8", "2008 R32",
    "2006 350Z ROADSTER", "1999 3000GT VR-4", "1995 RX-7", "1999 SKYLINE GT-R V-SPEC",
    "2008 RS4", "2006 LANCER EVOLUTION IX", "2006 999R", "2006 S600",
    "2006 S600 \"DUB EDITION\"", "1971 MIURA SV", "2008 R8", "2007 V8 Vantage Roadster",
    "2007 SL65 AMG", "2007 Z06", "2008 S302 EXTREME", "2006 GALLARDO SPYDER",
    "2004 MURCIELAGO ROADSTER", "2004 MURCIELAGO \"DUB EDITION\"", "COBRA CONCEPT", "2006 GT",
    "2007 S7", "2007 NINJA ZX14", "1955 BEL AIR", "1963 RIVIERA",
    "1964 IMPALA", "1965 MALIBU", "1966 GTO", "1970 CHEVELLE SS",
    "RANGE ROVER SUPERCHARGED", "RANGE ROVER SPORT", "2009 ECLIPSE SPYDER GT", "2008 S5",
    "2008 EVOLUTION X", "2008 XLRV", "2008 CLK63 AMG BLACK", "2008 CL65 AMG",
    "2007 DB9", "2008 1098R", "1996 IMPALA SS POLICE", "1996 IMPALA SS POLICE CHP",
    "CHARGER POLICE", "CHARGER POLICE BP", "CHARGER POLICE CHP"
  ];

  const COLLECT_GROUPS = [
    { key: "colHollywood", n: 20, at: 0 },
    { key: "colBeach", n: 15, at: 20 },
    { key: "colDowntown", n: 15, at: 35 },
    { key: "colHills", n: 10, at: 50 }
  ];

  const FMT_LABEL = { int: "hintInt", dec: "hintDec", time: "timeKind", hours: "hintHours" };

  const CAREER_RECORDS = [
    { code: "k:TB", occ: 0, id: "careerRecord", titleKey: "ttHollywood", fmt: "time", stat: "k:TB" },
    { code: "k:TB", occ: 1, titleKey: "ttBeach", fmt: "time", stat: "k:TB" },
    { code: "k:TB", occ: 2, titleKey: "ttHills", fmt: "time", stat: "k:TB" },
    { code: "k:TB", occ: 3, titleKey: "ttDowntown", fmt: "time", stat: "k:TB" },
    { code: "k:TB", occ: 4, titleKey: "ttSouthCentral", fmt: "time", stat: "k:TB" },
    { code: "kCCW", titleKey: "careerMostWins", fmt: "int", stat: "kCCW" },
    { code: "kCWN", titleKey: "careerConsec", fmt: "int", stat: "kCWN" },
    { code: "k2ND", titleKey: "careerSecond", fmt: "int", stat: "k2ND" },
    { code: "k3RD", titleKey: "careerThird", fmt: "int", stat: "k3RD" },
    { code: "kRCP", titleKey: "careerRaces", fmt: "int", stat: "kRCP" },
    { code: "kWIN", titleKey: "careerWins", fmt: "int", stat: "kWIN" },
    { code: "kLED", titleKey: "careerLead", fmt: "int", stat: "kLED" },
    { code: "kHOK", titleKey: "careerHookmen", fmt: "int", stat: "kHOK" },
    { code: "kDLT", titleKey: "careerDeliveries", fmt: "int", stat: "kDLT" },
    { code: "kTRS", titleKey: "careerRestarts", fmt: "int", stat: "kTRS" },
    { code: "kARS", titleKey: "careerAvgRestart", fmt: "dec", stat: "kARS" },
    { code: "kFWN", titleKey: "careerFreeway", fmt: "int", stat: "kFWN" },
    { code: "kRLW", titleKey: "careerRedlight", fmt: "int", stat: "kRLW" },
    { code: "kMUW", titleKey: "careerMuscle", fmt: "int", stat: "kMUW" },
    { code: "kTUW", titleKey: "careerTuner", fmt: "int", stat: "kTUW" },
    { code: "kLOW", titleKey: "careerLowrider", fmt: "int", stat: "kLOW" },
    { code: "kLUW", titleKey: "careerLuxury", fmt: "int", stat: "kLUW" },
    { code: "kMOW", titleKey: "careerMoto", fmt: "int", stat: "kMOW" },
    { code: "kMRS", titleKey: "careerMaxRestart", fmt: "int", stat: "kMRS" },
    { code: "kPDS", titleKey: "careerPayback", fmt: "int", stat: "kPDS" },
    { code: "kSUW", titleKey: "careerSuv", fmt: "int", stat: "kSUW" },
    { code: "kEXW", titleKey: "careerExotic", fmt: "int", stat: "kEXW" },
    { code: "k$CE", titleKey: "careerCash", fmt: "int", stat: "k$CE" },
    { code: "k%AG", titleKey: "careerPercent", fmt: "int", stat: "k%AG" },
    { code: "k$WA", occ: 0, titleKey: "careerWagerHollywood", fmt: "int", stat: "k$WA" },
    { code: "k$WA", occ: 1, titleKey: "careerWagerBeach", fmt: "int", stat: "k$WA" },
    { code: "k$WA", occ: 2, titleKey: "careerWagerDowntown", fmt: "int", stat: "k$WA" },
    { code: "k$WA", occ: 3, titleKey: "careerWagerSouthCentral", fmt: "int", stat: "k$WA" },
    { code: "khTC", id: "careerHours", titleKey: "careerHours", fmt: "hours", stat: "khTC" }
  ];

  Object.assign(MCLA.data, {
    STAT_NAMES,
    RACE_NAMES,
    RACE_GROUPS,
    WIN_CAR_NAMES,
    CAR_ORDER_NAMES,
    COLLECT_GROUPS,
    FMT_LABEL,
    CAREER_RECORDS
  });
})();
