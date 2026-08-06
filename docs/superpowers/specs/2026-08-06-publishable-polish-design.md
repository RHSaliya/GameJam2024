# Quarrel Through The Cosmos — Publishable Polish & Content Design

**Date:** 2026-08-06
**Status:** Approved for planning
**Baseline:** commit `1675273`, 31 tests passing, `npm run build` clean

## Goal

Make the game read as a finished commercial product rather than a game-jam
project. Four threads, in priority order:

1. A shared design system applied to every scene, replacing per-scene ad-hoc styling.
2. Campaign grows from 6 to 12 missions across three acts, each capped by a boss.
3. In-game feel: streak scoring, hit feedback, off-screen threat awareness, refined touch controls.
4. Production hygiene: one version source, a real loading screen, scene transitions.

## Constraint

No existing feature may regress. Every current capability — campaign, endless,
upgrades, ships, weapon cores, achievements, leaderboard, offline play, both
touch modes, responsive layout, audio lifecycle handling — must still work. The
31 existing tests must continue to pass unmodified except where this document
explicitly says otherwise.

---

## 1 · Design system

### 1.1 Module layout

`src/ui.js` becomes a barrel file that re-exports from a new `src/ui/`
directory. Every scene currently imports `from '../ui'`; keeping `src/ui.js` as
the barrel means **zero import changes across the 11 scenes**.

```
src/ui.js            barrel — re-exports everything below
src/ui/theme.js      COLORS, TYPE, SPACING, RADII
src/ui/text.js       textStyle(), heading helpers
src/ui/panel.js      addPanel() + variants
src/ui/button.js     addButton(), addBackButton()
src/ui/icons.js      drawn vector icon factory
src/ui/background.js addSpaceBackground(), addBrandTitle(), addTitle()
src/ui/toast.js      showToast()
src/ui/transitions.js fadeToScene()
src/ui/format.js     formatNumber(), formatTime()
```

Public API of `src/ui.js` is a strict superset of today's. No existing exported
symbol changes signature or behaviour.

### 1.2 Type scale

Today there are roughly sixteen distinct font sizes chosen ad hoc
(13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 28, 30, 38, 42, 44). Replace
with six named steps:

| Token | Size | Letter-spacing | Use |
|---|---|---|---|
| `display` | 44 | 0 | Scene hero titles, final score |
| `title` | 32 | 0 | Screen titles |
| `heading` | 24 | 0 | Card and row titles |
| `body` | 18 | 0 | Descriptions |
| `label` | 14 | 0.16em | Uppercase metadata |
| `caption` | 12 | 0.22em | Uppercase eyebrow text |

`textStyle(size, color)` keeps its current numeric signature for compatibility,
and gains named-token support: `textStyle('heading', COLORS.cyan)`. Scenes
migrate to tokens; the numeric path stays working so migration can be
incremental and no scene is left broken mid-change.

### 1.3 Icons replace emoji

`EndScene.js:98-101` renders `🎯 🪙 ⏱ 💎` as text. These resolve to the host
OS emoji font — full-colour, inconsistent across Android/iOS/desktop, and
tonally wrong against hand-drawn sprite art. `src/ui/icons.js` provides a
`drawIcon(scene, name, x, y, size, color)` factory using Phaser `Graphics`:

`target`, `coin`, `clock`, `gem`, `skull`, `lock`, `star`, `chevron`, `pause`.

All emoji in gameplay and menu surfaces are replaced. The `◆` credits glyph and
`★` rating glyph stay as text — they are geometric, monochrome, and render
consistently.

### 1.4 Components

`addPanel` and `addButton` gain variants but keep their current positional
signatures and current default appearance contract:

- `addPanel(scene, x, y, w, h, alpha)` — plus optional `{ variant, accent }`
  where variant is `default | raised | inset | danger`.
- `addButton(scene, x, y, label, onPress, options)` — `options` gains
  `variant: primary | secondary | ghost | danger` and `size: sm | md | lg`.
  `primary` uses the gradient fill approved in the controls mockup.

Existing call sites pass no variant and receive today's styling, restyled once
centrally. `container.setSelected()` and the `background` / `label` properties
other scenes rely on are preserved.

### 1.5 Transitions

`fadeToScene(scene, key, data, duration = 220)` performs a camera fade-out,
then `scene.start`. Every `this.scene.start(...)` navigation call in menu-side
scenes routes through it. `PlayScene.finish()` keeps its existing
`delayedCall` timing and gains the fade.

---

## 2 · Campaign: 12 missions, three acts

### 2.1 Structure

| ID | Act | Name | Kind | Origin |
|---|---|---|---|---|
| 1 | I · The Inner Belt | First Flight | standard | existing id 1 |
| 2 | I | Meteor Shower | standard | existing id 2 |
| 3 | I | Red Horizon | standard | existing id 3 |
| 4 | I | **The Warden** | boss | new |
| 5 | II · The Void Reach | Gravity Well | standard | existing id 4 |
| 6 | II | Cosmic Storm | standard | existing id 5 |
| 7 | II | Ion Drift | standard | new |
| 8 | II | **The Hollow Choir** | boss | new |
| 9 | III · The Last Orbit | The Last Orbit | standard | existing id 6 |
| 10 | III | Ember Cascade | standard | new |
| 11 | III | Null Field | standard | new |
| 12 | III | **The Devourer** | boss | new |

Existing missions keep their tuning values (`targetKills`, `spawnDelay`,
`asteroidSpeed`, `collisionDamage`, `reward`, `parTime`, `maxSpeedBonus`)
unchanged. New standard missions are tuned to interpolate the existing curve:
mission 7 sits between old-5 and old-6 values; missions 10 and 11 escalate past
mission 9.

`LEVELS` entries gain two optional fields:

- `act: 1 | 2 | 3`
- `boss: <bossId>` — present only on missions 4, 8, 12. Boss missions have no
  `targetKills`; victory is the boss's death.

`getLevel(id)` behaviour is unchanged. A new `getAct(actId)` and
`isBossLevel(id)` are added.

### 2.2 Save migration (v2 → v3)

Renumbering is required because bosses cap each act. Saved profiles store level
**IDs** in `completedLevels` and `unlockedLevel`, so those must be remapped.

`PlayerProfile` gains a migration in `normalizeProfile` keyed on
`value.version`:

```
OLD_TO_NEW_LEVEL_ID = { 1:1, 2:2, 3:3, 4:5, 5:6, 6:9 }
```

Migration rules, applied only when the loaded profile's `version < 3`:

1. `completedLevels` → each id mapped through `OLD_TO_NEW_LEVEL_ID`; unmapped
   ids dropped; result deduped and sorted.
2. `unlockedLevel` → recomputed as the **lowest mission id not present in the
   migrated `completedLevels`**, clamped to `[1, LEVELS.length]`.
3. `version` set to 3.

Consequences that are accepted and intended:

- A player who cleared all six old missions keeps six cleared nodes (1, 2, 3, 5,
  6, 9) and is placed at mission 4 (The Warden). The Star Map will show cleared
  nodes beyond a locked one; this reads correctly as grandfathered progress.
- `credits`, `upgrades`, `unlockedSkins`, `achievements`, `endlessScores`, all
  lifetime counters, and `settings` are untouched by the migration.

`normalizeProfile` already clamps `unlockedLevel` to `LEVELS.length` and filters
`completedLevels` against known ids, so growing the array is otherwise safe.

`STORAGE_KEY` stays `quarrel-profile-v2` — the key is a storage slot, not a
schema version, and changing it would orphan every existing save.

### 2.3 Star Map scene

New `src/scenes/StarMapScene.js` replaces `LevelSelectScene.js`. **It registers
under the existing scene key `'levels'`** so every current navigation target
keeps working: `PlayScene.togglePause()` quit, `EndScene.go()`, and
`addBackButton` defaults.

Layout:

- Node positions are authored data in `src/config/starMap.js` — an
  `{ id, x, y }` per mission plus per-act label anchors. Chart width exceeds the
  1280 viewport; the chart pans horizontally.
- Path segments connect consecutive missions. Segment styling by state: cleared
  = solid green; next = dashed cyan with a marching-ants tween; locked = dim
  grey dashed.
- Node styling by state: cleared (green ring + star count), next (cyan, pulsing
  halo), boss (larger radius, red ring, skull icon), locked (dim, lock icon).
- Boss nodes render at 1.35× standard node radius.
- Act labels render above their node cluster.

Interaction:

- Drag anywhere on the chart to pan; clamped to chart bounds.
- Act chips at the top jump the camera to that act.
- Tapping a node selects it and fills the bottom detail dock: name, subtitle,
  target count (or "BOSS ENCOUNTER"), par time, reward, personal best, star
  rating, and a `LAUNCH ▸` primary button.
- On entry the scene auto-selects and centres the lowest uncleared unlocked
  mission.
- Locked nodes are selectable (showing their unlock requirement) but cannot
  launch.

Star rating per mission, stored in a new `profile.missionStars: { [id]: 0-3 }`:

- 1 star — mission cleared.
- 2 stars — cleared with elapsed time `<= parTime`.
- 3 stars — cleared with elapsed time `<= parTime` **and** hull never fell below
  50% of max at any point during the run.

Stars are additive metadata. They do not gate progression and do not affect any
existing reward calculation.

---

## 3 · Combat systems

### 3.1 Enemy projectiles

New `src/components/EnemyBullet.js`, pooled in `PlayScene` as
`this.enemyBullets` with `physics.add.overlap(this.ship, this.enemyBullets)`.
No enemy shoots today; this is the enabling system for bosses and for the two
new high-tier enemies.

Enemy bullets participate in `shiftWorld()` exactly like every other pooled
group, including the `body.prev` / `body.prevFrame` translation the existing
code performs.

Damage from an enemy bullet routes through the same path as a collision:
`Math.max(5, damage - this.effects.collisionReduction)`.

### 3.2 New enemy archetypes

`ENEMY_TYPES` currently tops out at `minTier: 4`, so endless threat tiers 5 and
6 introduce no new content. Two additions:

- **lancer** — `minTier: 5`. Keeps its distance and fires a single aimed shot on
  a cooldown. Moderate HP, low speed.
- **sentinel** — `minTier: 6`. Carries a directional forward shield that negates
  damage from the front arc; must be flanked. High HP.

The endless tier cap stays at 6. No existing difficulty formula changes, so
`test/endless-mode.test.js` and `test/enemy-variety.test.js` continue to pass;
the latter gains cases asserting tiers 5 and 6 now yield new types.

### 3.3 Bosses

New `src/components/Boss.js`. Shared behaviour:

- Large sprite, high HP, immune to being pushed off-screen (exempt from the
  standard off-camera cull).
- Screen-anchored boss health bar with phase pips.
- Intro: name card, brief camera hold, controls locked for ~1.2s.
- Phase transitions at fixed HP fractions, each with a telegraph (flash +
  audio sting) before the new pattern starts.
- Death: staged explosion sequence, then `PlayScene.finish(true)`.

| Boss | Mission | Phase 1 | Phase 2 (60%) | Phase 3 (30%) |
|---|---|---|---|---|
| The Warden | 4 | Orbits at range, fires 3-way spread | Deploys drifter/striker adds | Radial burst volleys, faster orbit |
| The Hollow Choir | 8 | Three linked cores, alternating homing shots | Surviving cores gain fire rate per core lost | Final core enrages: continuous homing stream |
| The Devourer | 12 | Gravity pull dragging the ship, spawns swarmers | Telegraphed sweeping beam | Pull + beam + swarmers simultaneously |

Boss missions ignore `targetKills`. `PlayScene.getDifficulty()` returns the boss
mission's tuning for ambient spawns, which continue at a reduced rate during the
encounter.

Boss art: three sprites generated to match the existing `public/assets/enemies/`
style, plus one enemy-projectile sprite. `scripts/generate_brand_assets.py` is
the existing precedent for generated art in this repo.

### 3.4 Streak scoring

`PlayScene` tracks `this.streak`, incremented on each kill and reset to 0
whenever the ship takes damage from any source.

```
multiplier = Math.min(5, 1 + Math.floor(streak / 5))
```

Kill score is multiplied by `multiplier`. Coin, rescue, and speed-bonus scoring
are untouched, as are all credit calculations in `recordRun`.

This is purely additive: it can only increase score, never decrease it, and it
touches no formula covered by an existing test.

---

## 4 · HUD and controls

### 4.1 HUD (ship-centric)

Replaces `PlayScene.createHud()`. Elements, with `applyLayout` anchors:

- Thin top strip (52px) with a gradient fade, not a bordered bar.
- Top-left: mission name in `caption`.
- Top-centre: objective text plus a slim progress bar (kills/target, or boss HP
  fraction on boss missions).
- Top-right: score in `heading`, coins in `label` beneath.
- Far top-right corner: pause button. Today it sits at `(640, 48)` — dead centre,
  directly above the player ship, in the exact spot the eye occupies during
  combat.
- Around the ship: two concentric arcs — inner hull (colour-shifts green →
  yellow → red), outer ammo.
- Centre-low: streak multiplier, large, purple, appearing only at ≥×2.
- Screen edges: threat chevrons pointing at off-screen enemies within a
  threshold distance, coloured by enemy class. This addresses a real fairness
  problem — steering hunters converge from outside the viewport with no warning.
- Low health (<30%): red vignette plus a heartbeat pulse.

`HealthBar` keeps its class and public API (`getHealth`, `decreaseHealth`,
`increaseHealth`, `setPosition`, `maxHealth`) so `PlayScene` and
`setThrustAudio` are unaffected; its `updateHealthBar` draws the arc form.

### 4.2 Touch controls

`TouchControls` keeps its public API: `isDown`, `getAimRotation`, `reset`,
`setVisible`, `destroy`, and both `touchMode` values (`joystick`, `buttons`).

- **Floating stick.** A touch anywhere in the left third of the screen spawns the
  stick under the thumb. Today the stick is pinned at `(155, ↓86)` with a 92px
  hit circle, so a thumb landing slightly off produces no input at all. The
  resting/home position and visuals remain as they are when untouched.
- **Depth.** Gradient fills, inset shadows, rim glow — replacing flat circles.
- **FIRE.** Moved inward off the bezel. Today its centre is 78px from the right
  edge with r=62, putting the rim within 16px of the screen edge, colliding with
  gesture bars and curved glass. Its rim becomes the ammo gauge, draining as
  ammo depletes and flashing red on dry-fire (replacing the sound-only
  `emptyAmmo` cue). A faint sweep shows weapon cooldown.
- **THRUST.** Gains a flame that ignites while held. Label changes `DRIVE` →
  `THRUST` to match the keyboard documentation and the How To Play screen.
- **Safe areas.** Control anchors respect `env(safe-area-inset-*)`, plumbed
  through `layout.js` as new `safeInset*` values on the layout object.
- **Press retention.** `hitZone.on('pointerout')` currently releases the action
  when a thumb slides a few pixels off the button. Presses are retained until
  `pointerup` / `pointerupoutside`.

### 4.3 Feedback

- Brief hit-stop (~40ms time-scale dip) on a kill.
- Floating score numbers at the kill position.
- Stronger explosion particles.
- `showToast` moves above the control band. It currently renders at y≈535,
  directly over the joystick and FIRE button.

---

## 5 · Remaining scenes

| Scene | Change |
|---|---|
| `SplashScene` | Real loader-driven progress bar replacing the fixed 3-second timer gate. |
| `MenuScene` | Design-system restyle; `CONTINUE · MISSION N` primary CTA as the first action. |
| `HangarScene` | Ship stat comparison against the equipped ship; upgrade effect preview before purchase; scrollable list so adding ships cannot overflow. |
| `PlayScene` pause | Controls reference and a settings shortcut alongside RESUME / QUIT. |
| `EndScene` | Star rating vs par time, per-mission best comparison, drawn icons. **Correction (2026-08-06):** an earlier revision of this row claimed these scenes "never adapt to tablet or ultrawide viewports" and called for a `watchResponsiveLayout` listener. That was wrong, and the resulting change was implemented and then reverted. `layout.cameraTop` is **never positive** in this layout model — the camera expands symmetrically around the canvas centre, so `cameraTop` is 0 on phones and ultrawide, and negative on taller viewports (−60 at 1920×1080, −100 at 1440×900, −180 on a 1024×768 iPad). Anchoring a header to `cameraTop + offset` can therefore only push it *away* from its own content; it can never rescue a clipped one, and nothing was clipped. `x = 640` is already correct at every aspect ratio because `cameraWidth >= 1280` and is centred on `GAME_CENTER_X`. **Only genuinely edge-hugging elements need a layout listener** — see `addBackButton`, which anchors to `safeLeft`/`safeBottom`. Centred content must be left alone. |
| `AchievementsScene` | Progress bars toward locked achievements. |
| `InstructionsScene` | Restyled, retained as a reference screen. |
| `OptionsScene` | Design-system restyle; adds a "replay tutorial" action. |
| `LeaderboardScene` | Design-system restyle. |

### 5.1 First-run tutorial

Layered onto Mission 1 rather than built as a separate scene. Contextual prompts
fire in sequence — steer, thrust, fire, collect a coin, watch your hull — each
clearing when the player performs the action. Skippable at any point. Gated by a
new `profile.tutorialDone` boolean, replayable from Options.

Mission 1 remains fully playable if the tutorial is skipped or already done; the
tutorial adds no gameplay modification beyond the prompts.

---

## 6 · Production hygiene

- **One version source.** `package.json` version is injected via a Vite `define`
  as `__APP_VERSION__`, consumed by a new `src/config/version.js`. Removes the
  current three-way disagreement: `package.json` 2.0.0, `MenuScene.js:54`
  literal `'v2.1'`, `android/app/build.gradle` `versionCode 1` /
  `versionName "1.0"`. A new `scripts/sync-native-version.mjs` rewrites
  `versionName` from `package.json` and `versionCode` from a monotonic integer
  derived from it, plus the iOS `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`.
  It is wired into the `mobile:sync` npm script so native builds cannot drift.
- **Weapon core drop rate.** `PlayScene.js:466` reads
  `if (this.kills % 6 !== 0 && Math.random() >= 0.08) return;`. Because `&&`
  short-circuits, every 6th kill *guarantees* a core. Replaced with an explicit,
  documented rule: a guaranteed core every 12 kills, or an 8% chance otherwise.
- **`recordRun`** switches `LEVELS[levelId - 1]` to `getLevel(levelId)` now that
  mission ordering carries more weight.
- **ESLint.** `eslint` is a devDependency with no config and no script. Add a
  flat config and an `npm run lint` script.
- **README** updated for the 12-mission campaign, bosses, and streak scoring.

---

## 7 · Testing

Existing suite: 7 files, 31 tests, run with `node --test`. All must continue to
pass. `test/enemy-variety.test.js` gains cases; no existing assertion is
modified or removed.

New test files:

| File | Covers |
|---|---|
| `campaign-structure.test.js` | 12 missions; bosses at 4/8/12; acts partition all missions; standard-mission difficulty is monotonic across the reordered sequence; every mission has complete tuning data |
| `profile-migration.test.js` | v2→v3 id remap; `unlockedLevel` recomputation; credits/upgrades/skins/achievements/settings preserved; a v3 profile is not re-migrated; a corrupt profile still yields defaults |
| `boss-encounters.test.js` | Phase thresholds fire at 60%/30%; phase attack selection is deterministic given HP; boss death reports victory |
| `streak.test.js` | Multiplier curve and the 5× cap; reset on damage; score can only increase relative to the unstreaked baseline |
| `star-map-layout.test.js` | Every mission has a node; nodes do not overlap; path segments connect consecutive ids; chart bounds contain all nodes; the auto-selected mission is the lowest uncleared unlocked one |

Pure-logic extraction: node layout, phase thresholds, streak math, and the
migration map live in plain modules importable without Phaser, matching how
`gameData.js` and `PlayerProfile.js` are already tested.

---

## 8 · Out of scope

- Store submission itself — no uploading, no signing key generation, no
  Play Console or App Store Connect work.
- Server-authoritative score validation and Firebase App Check. The README
  already documents the client-trust limitation; it stands.
- New ships, new weapons, or new upgrade tracks.
- Raising the endless threat-tier cap above 6.
- Localisation.

## 9 · Risks

| Risk | Mitigation |
|---|---|
| Level renumbering corrupts existing progress | Migration is unit-tested against a realistic v2 profile fixture before any scene work begins |
| Star Map is a full scene rewrite | Keeps scene key `'levels'`; layout logic extracted to testable pure data; `LevelSelectScene.js` stays in git history for rollback |
| Enemy projectiles are a new collision path | Enemy bullets join the existing `shiftWorld` group list, reusing the proven body-translation logic rather than a parallel implementation |
| Design-system migration touches all 11 scenes | Barrel file preserves every existing import and signature; scenes migrate one at a time with the suite green between each |
| Boss art may not match existing sprites | Generated against the existing `enemy-*.png` set as style reference; regenerate if it clashes |
