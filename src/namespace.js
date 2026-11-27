(() => {
  "use strict";

  globalThis.MCLA = {
    data: {},
    format: {},
    ui: {},
    state: {
      bytes: null,
      view: null,
      secs: null,
      fileName: "mc4.sav",
      lang: "en",
      activeTab: "garage",
      garageFilter: "all",
      ttBase: null,
      shop: null,
      stats: [],
      gameKeys: [],
      vehKeys: [],
      raceKeys: [],
      vehRows: [],
      raceOpen: {},
      collectOpen: {},
      sectionsDirty: false
    }
  };
})();
