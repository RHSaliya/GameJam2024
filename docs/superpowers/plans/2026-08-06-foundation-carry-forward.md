# Foundation Plan — Carry-Forward Notes

Written at the close of Plan 1 (`docs/superpowers/plans/2026-08-06-foundation-design-system.md`,
commits `041c08a..eadd81b`). These are the items the follow-on plans need and
that would otherwise have been lost with the git-ignored execution workspace.

## 1. Non-obvious facts about this codebase

**`layout.cameraTop` is never positive.** The game renders a fixed 1280×600
logical canvas and the camera expands *symmetrically* around its centre, so
`cameraTop = GAME_CENTER_Y - cameraHeight / 2` is 0 on phones and ultrawide
displays and negative on anything taller (−60 at 1920×1080, −100 at 1440×900,
−180 on a 1024×768 iPad).

Consequences, which cost this plan a reverted task:

- `x = 640` is already correct at every aspect ratio. Centred content needs no
  layout listener.
- Anchoring a header to `cameraTop + offset` moves it *away* from its content on
  large screens rather than adapting it.
- Only genuinely edge-hugging elements need `watchResponsiveLayout`, and they
  should anchor to `safeLeft` / `safeRight` / `safeTop` / `safeBottom`, not the
  raw camera edges. `addBackButton` in `src/ui/button.js` is the reference.

**`src/ui.js` is a barrel using `export *` across 10 modules.** No exported name
may collide — a duplicate is silently dropped by some bundlers and a hard error
in others. `test/ui-barrel.test.js` checks module presence but **does not detect
name collisions**. Check by hand when adding exports.

**Modules loaded by `node --test` must not import Phaser** (no DOM available):
`theme.js`, `format.js`, `text.js`, `variants.js`, `transitions.js`. The other
`src/ui/*` modules may import it freely.

**Phaser's `loaderTimeout` defaults to 0 (disabled).** A request that stalls
without resolving or erroring will never fire `complete`. `SplashScene` carries
an 8s failsafe for exactly this reason.

## 2. Work deferred out of Plan 1

### Splash progress bar does not yet measure anything (spec §5)

`SplashScene.preload()` downloads roughly 3.3 MB — two large images plus *all
fifteen* audio files via `preloadAudio(this)` with no key list — before `create()`
runs. Phaser only calls `create()` after preload completes, so the real download
still happens on a blank canvas exactly as it did before. The progress bar added
in `create()` then re-requests the same two images under different keys; they
come off the HTTP cache instantly, so the bar reads full on arrival and its fill
animation is never seen.

Net effect so far: the splash's visible duration dropped from ~3s to ~640ms, and
a bar was added that is always full. **The spec's intent is not delivered.**

To finish it: move `preloadAudio(this)` and the two heavy images out of
`preload()` into the `create()`-time batch, leaving `preload()` with only what
the splash itself needs to draw. `SPLASH_FAILSAFE_MS` must then be raised — 8s
cannot cover 3.3 MB on a slow connection and would start truncating real loads.

### Split `background.js` before it grows (do this early in Plan 2)

`src/ui/background.js` currently holds the backdrop factory, the brand lockup,
the page-header component (`addTitle`), **and** the fade-in half of the
transition system. Two problems:

- Plan 2–4 restyle every scene header, which means editing `addTitle` inside a
  file named `background.js`.
- The fade-in is a hidden side effect of adding a backdrop. Any new scene that
  does not call `addSpaceBackground` — plausibly Plan 3's `StarMapScene` or
  Plan 2's HUD work — silently gets no fade-in and hard-pops out of black.

Recommended: move `addTitle` / `addBrandTitle` to `src/ui/header.js`, and export
a `fadeInScene(scene)` from `transitions.js` that `addSpaceBackground` calls.
The barrel absorbs both moves with zero scene changes. Cheap now, expensive after
three plans have edited these files.

### Type-scale migration is a judgement call, not find-and-replace

The six tokens are defined and tested, but almost nothing uses them yet. Existing
text uses sizes 42, 30, 29, 25, 23, 21, 19, 17, 16, 15, 13 — none of which map
cleanly. `addTitle` uses 42px, so moving screen titles to the `title` token (32)
shrinks every one of them. Budget per-scene visual judgement.

### `test/player-profile.test.js` blocks the mission renumbering (Plan 3)

Lines 21-22 encode "there are exactly 6 levels":

```js
assert.equal(profile.unlockedLevel, 6);          // clamp target, becomes 12
assert.deepEqual(profile.completedLevels, [1]);  // 9 is invalid today, becomes valid
```

Both must be updated when `LEVELS` grows to 12. This is the only place in the
suite that hardcodes the level count.

## 3. Known-inert issues, deliberately not fixed

- `src/ui/variants.js` — the disabled branch hardcodes `strokeWidth: 2` where the
  pre-refactor code used `(hovered || selected) ? 3 : 2` even when disabled.
  Unreachable: `setSelected` is only called on HangarScene's two tabs, which are
  never disabled. Commented in place; do not "restore" it.
- `src/scenes/PlayScene.js` — `this.kills > 0 &&` in `maybeSpawnWeaponPowerUp` is
  always true, since `hitAsteroid` increments `kills` before calling it. Harmless,
  and it keeps the method safe to call from a future site that does not.
- `SPACING` in `theme.js` and `formatTime` in `format.js` have no consumers yet.
- Two accepted lint warnings, pinned as the gate: unused `text` at
  `src/scenes/Credits.js:41` and unused `sectorColor` at
  `src/scenes/LevelSelectScene.js:29`. `LevelSelectScene.js` is replaced wholesale
  by the Star Map in Plan 3.
- The `credits` scene is registered in `main.js` but nothing navigates to it.

## 4. What has never been verified

**No browser smoke test was executed for any task in Plan 1.** There was no
browser driver available. Static verification was substituted throughout: dev
server module resolution, production bundle inspection, Phaser source tracing,
and a mutation-tested unit suite. That catches import, resolution, and logic
failures — it cannot catch a scene that renders wrong.

Before building on this foundation, run `npm start` and check:

- **Splash** — cold and warm load. If it sits for exactly 8 seconds, `complete`
  never fired and the failsafe is carrying the app. That is the single most
  important thing to confirm.
- **Menu navigation** — Menu → Hangar → BACK → Achievements → BACK → Options →
  BACK, twice around. A permanently black screen means a scene faded out and its
  target never faded in.
- **Debrief** — finish a run. All four stat cards must show a drawn crosshair /
  coin / clock / gem. A missing icon means a painter name typo (which now
  `console.warn`s).
- **Leaderboard** — needs three scores. Ranks 1-3 show a gold/silver/bronze star.
  This is the only live consumer of the `star` painter and the colour-tint path.
- **Hangar** — the UPGRADES/SHIPS tabs are the only live exercise of
  `resolveButtonStyle`'s `selected` path; MAXED/EQUIPPED buttons the only
  exercise of its `disabled` path.
- **Native** — `npm run mobile:sync` end to end; confirm `versionCode` is 20100.
