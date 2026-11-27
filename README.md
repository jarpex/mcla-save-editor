# MCLA Save Editor (`mc4.sav`)

Browser-based save editor and format documentation for **Midnight Club: Los Angeles** (Xbox 360, Complete Edition), as written by the [MC_LA_Recompiled](https://github.com/robertoaraujo77/MC_LA_Recompiled) PC runtime.

## Features

- **Zero build step & 100% client-side**: works directly via `file://` or any static web server (GitHub Pages, Nginx, `python -m http.server`). Nothing is ever uploaded, and the patched `mc4.sav` preserves the exact original byte size.
- **Garage & Wallet**: money, reputation, 31 garage slots (vehicle prefab, label, license plate, stock appearance reset), and an interactive **Performance Shop** with dyno curves and vendor selection.
- **Career & Stats**: 43+ progression flags, Time Trial & Race targets, Game Stats (`g*`), Vehicle Stats (`vWIN`/`vkDT`), Race Stats (`r:TI`), Collectables (60 items across 4 zones), and Career Stats (`k*`).
- **Hex Sections (Built-in Documentation)**: byte-level **Almanac** tiling the entire file, **Save Coverage** meter, and **Useful Data** reference tables (vehicles, tuning weights, mechanics/formulas, stock appearances, FourCC codes, race memory order).
- **Languages**: English (default), Russian, and Portuguese.

## Save File Location

```text
<game folder>\userdata\B13EBABEBABEBABE\545407F8\00000001\mc4.sav\mc4.sav
```

Close the game before editing. The editor validates the section walk up to EOF before allowing download.

## Architecture

Scripts are written in modern ES6+ and organized into a single `MCLA` namespace (`src/namespace.js`) loaded with `<script defer>` so the app works identically on `file://` and HTTP servers without a bundler:

- `src/data/` — pure reference tables and performance/dyno math (`offsets.js`, `vehicles.js`, `stats-meta.js`, `perf.js`)
- `src/format/` — pure binary `mc4.sav` readers/writers with no DOM dependencies (`binary.js`, `slots.js`, `tuning.js`, `stats.js`, `career.js`)
- `src/ui/` — UI views, localization, Almanac, Useful Data, Coverage, and navigation (`i18n.js`, `dom.js`, `xray.js`, `wallet.js`, `garage.js`, `shop.js`, `career-view.js`, `almanac.js`, `useful.js`, `coverage.js`, `nav.js`)
- `src/main.js` — file I/O and application bootstrap

## Tests

Pure binary and data modules are tested directly with Node's built-in test runner (`node:test`, zero dependencies):

```sh
node --test tests/*.test.js
```

## Credits

Based on [onlyzennnn / mcla-save-editor](https://github.com/onlyzennnn/mcla-save-editor), which built upon:

- **[robertoaraujo77 / MC_LA_Recompiled](https://github.com/robertoaraujo77/MC_LA_Recompiled)** - the recompiled PC runtime this work is based on.
- **holdmysocks** - the original MCLA recompilation, and **RenanQueiroz** for the fork `MC_LA_Recompiled` builds on.
- **u/leveldock6** - the [r/midnightclub guide](https://www.reddit.com/r/midnightclub/comments/17hht3b/guide_unlocking_the_audi_r8_for_purchase_in_mcla/) that located the Audi R8 lock in `tune/vehicle/0xe94bde63` inside `xarchive_cache.rpf`.
- **[nicolas-found42 / carmodels#38](https://github.com/nicolas-found42/carmodels/pull/38)** - documented the RPF3 container and Jenkins one-at-a-time name hashing.
