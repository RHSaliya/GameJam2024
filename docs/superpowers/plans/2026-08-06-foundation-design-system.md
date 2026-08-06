# Plan 1 — Foundation: Design System & Production Hygiene

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the game one shared visual language and one source of truth for its version, so every later plan builds on a consistent foundation instead of per-scene ad-hoc styling.

**Architecture:** `src/ui.js` becomes a barrel that re-exports from a new `src/ui/` directory, so all 11 scenes keep their existing `from '../ui'` imports untouched. Phaser-free leaf modules (`theme.js`, `format.js`, `text.js`) are unit-tested directly with `node --test`; Phaser-dependent modules are gated by `npm run build` plus a static barrel-completeness test. Version is injected at build time via a Vite `define` and pushed into the native projects by a script.

**Tech Stack:** Phaser 4.2, Vite 8, Capacitor 8, `node --test` (Node 26), ESLint 10 flat config.

**Spec:** `docs/superpowers/specs/2026-08-06-publishable-polish-design.md` §1 and §6.

## Global Constraints

- No existing feature may regress. Campaign, endless, upgrades, ships, weapon cores, achievements, leaderboard, offline play, both `touchMode` values, responsive layout, and audio lifecycle handling must all still work.
- The 31 existing tests must pass unmodified throughout this plan. No test file under `test/` may be edited in Plan 1.
- Every exported symbol currently in `src/ui.js` must remain exported with an unchanged signature and unchanged default behaviour: `COLORS`, `textStyle`, `addSpaceBackground`, `addBrandTitle`, `addTitle`, `addPanel`, `addButton`, `addBackButton`, `formatNumber`, `showToast`.
- Modules imported by tests must never import Phaser. `theme.js`, `format.js`, and `text.js` are Phaser-free; `text.js` may import only from `theme.js` and `src/config/layout.js`.
- Existing indentation is 4 spaces in `src/`, tabs in `main.js`, `vite.config.js`, and `package.json`. Match the file you are editing.
- `npm test` and `npm run build` must both pass before every commit.
- Type scale values, exact: `display 44`, `title 32`, `heading 24`, `body 18`, `label 14`, `caption 12`.
- Node 26.3 is the toolchain. `import.meta.main` is available.

---

## File Structure

**Create:**

| Path | Responsibility |
|---|---|
| `src/config/version.js` | Reads the build-time `__APP_VERSION__` define; exports `APP_VERSION`, `VERSION_LABEL` |
| `src/ui/theme.js` | `COLORS`, `TYPE`, `SPACING`, `RADII` — Phaser-free constants |
| `src/ui/format.js` | `formatNumber`, `formatTime` — Phaser-free |
| `src/ui/text.js` | `textStyle` with numeric and token support |
| `src/ui/icons.js` | `drawIcon` vector-icon factory |
| `src/ui/panel.js` | `addPanel` |
| `src/ui/button.js` | `addButton`, `addBackButton` |
| `src/ui/background.js` | `addSpaceBackground`, `addBrandTitle`, `addTitle` |
| `src/ui/toast.js` | `showToast` |
| `src/ui/transitions.js` | `fadeToScene` |
| `scripts/sync-native-version.mjs` | Pure `versionCodeFromName` + native project rewrite |
| `eslint.config.js` | Flat ESLint config |
| `test/ui-theme.test.js` | Theme token invariants |
| `test/ui-format.test.js` | `formatNumber` / `formatTime` |
| `test/ui-text-style.test.js` | `textStyle` backward compatibility + tokens |
| `test/ui-barrel.test.js` | Static check that `src/ui.js` re-exports every submodule |
| `test/version-sync.test.js` | `versionCodeFromName` monotonicity |

**Modify:**

| Path | Change |
|---|---|
| `src/ui.js` | Becomes a barrel re-exporting `src/ui/*` |
| `vite.config.js` | Adds the `__APP_VERSION__` define |
| `package.json` | Adds `lint` script; wires version sync into `mobile:sync` |
| `src/scenes/MenuScene.js:54` | Uses `VERSION_LABEL` instead of the literal `'v2.1'` |
| `src/scenes/SplashScene.js` | Loader-driven progress bar replacing the fixed 3s gate |
| `src/scenes/EndScene.js` | Drawn icons replace emoji; adds `watchResponsiveLayout` |
| `src/scenes/InstructionsScene.js`, `AchievementsScene.js`, `Credits.js` | Add `watchResponsiveLayout` |
| `src/scenes/PlayScene.js:466` | Weapon-core drop-rate fix |
| `src/services/PlayerProfile.js:220` | `LEVELS[levelId - 1]` → `getLevel(levelId)` |
| All menu-side scenes | Navigation routed through `fadeToScene` |

---

## Task 1: Single version source

**Files:**
- Create: `src/config/version.js`, `scripts/sync-native-version.mjs`, `test/version-sync.test.js`
- Modify: `vite.config.js`, `package.json`, `src/scenes/MenuScene.js:54`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `src/config/version.js` → `APP_VERSION: string` (e.g. `'2.0.0'`), `VERSION_LABEL: string` (e.g. `'v2.0.0'`)
  - `scripts/sync-native-version.mjs` → `versionCodeFromName(name: string): number`, `syncNativeVersion(rootDir: string): { versionName: string, versionCode: number, files: string[] }`

- [ ] **Step 1: Write the failing test**

Create `test/version-sync.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { versionCodeFromName } from '../scripts/sync-native-version.mjs';

test('version codes are derived from semver and increase monotonically', () => {
    assert.equal(versionCodeFromName('1.0.0'), 10000);
    assert.equal(versionCodeFromName('2.0.0'), 20000);
    assert.equal(versionCodeFromName('2.1.0'), 20100);
    assert.equal(versionCodeFromName('2.1.7'), 20107);
    assert.ok(versionCodeFromName('2.0.0') > versionCodeFromName('1.99.99'));
    assert.ok(versionCodeFromName('2.0.1') > versionCodeFromName('2.0.0'));
});

test('the derived code always clears the checked-in Android versionCode of 1', () => {
    assert.ok(versionCodeFromName('0.0.1') > 1);
});

test('malformed versions fall back to a valid positive code', () => {
    assert.equal(versionCodeFromName(''), 1);
    assert.equal(versionCodeFromName('not-a-version'), 1);
    assert.equal(versionCodeFromName('3'), 30000);
    assert.equal(versionCodeFromName('3.2'), 30200);
});

test('version segments are clamped so a large patch cannot overflow into minor', () => {
    assert.equal(versionCodeFromName('1.0.150'), 10099);
    assert.equal(versionCodeFromName('1.150.0'), 19900);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/version-sync.test.js`
Expected: FAIL — `Cannot find module '.../scripts/sync-native-version.mjs'`

- [ ] **Step 3: Write minimal implementation**

Create `scripts/sync-native-version.mjs`:

```js
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ANDROID_GRADLE = 'android/app/build.gradle';
const IOS_PBXPROJ = 'ios/App/App.xcodeproj/project.pbxproj';

// Android requires a strictly increasing integer. Packing the semver segments
// as MAJOR * 10000 + MINOR * 100 + PATCH keeps that ordering readable, and
// clamping each sub-segment to 99 stops a large patch from stealing a minor
// bump's range.
export function versionCodeFromName(name) {
    const segments = String(name).split('.');
    const major = Number.parseInt(segments[0], 10);
    if (!Number.isFinite(major)) return 1;
    const clamp = value => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? Math.min(99, Math.max(0, parsed)) : 0;
    };
    return Math.max(1, major * 10000 + clamp(segments[1]) * 100 + clamp(segments[2]));
}

async function rewrite(path, replacements) {
    let source;
    try {
        source = await readFile(path, 'utf8');
    } catch {
        return false;
    }
    const updated = replacements.reduce((text, [pattern, value]) => text.replace(pattern, value), source);
    if (updated === source) return false;
    await writeFile(path, updated);
    return true;
}

export async function syncNativeVersion(rootDir = process.cwd()) {
    const manifest = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8'));
    const versionName = manifest.version;
    const versionCode = versionCodeFromName(versionName);
    const files = [];

    if (await rewrite(join(rootDir, ANDROID_GRADLE), [
        [/versionCode\s+\d+/, `versionCode ${versionCode}`],
        [/versionName\s+"[^"]*"/, `versionName "${versionName}"`],
    ])) files.push(ANDROID_GRADLE);

    if (await rewrite(join(rootDir, IOS_PBXPROJ), [
        [/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${versionCode};`],
        [/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${versionName};`],
    ])) files.push(IOS_PBXPROJ);

    return { versionName, versionCode, files };
}

if (import.meta.main) {
    const result = await syncNativeVersion();
    console.log(`Synced ${result.versionName} (code ${result.versionCode}) → ${result.files.join(', ') || 'no changes'}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/version-sync.test.js`
Expected: PASS — 4 tests

- [ ] **Step 5: Add the build-time define**

Modify `vite.config.js` (tabs — match the file):

```js
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
	plugins: [],
	define: { __APP_VERSION__: JSON.stringify(version) },
	server: { host: '0.0.0.0', port: 8000 },
	clearScreen: false,
	build: { chunkSizeWarningLimit: 1600 },
})
```

- [ ] **Step 6: Create the version module**

Create `src/config/version.js`:

```js
// __APP_VERSION__ is replaced at build time by the Vite define in
// vite.config.js. The typeof guard keeps this module importable from Node
// test runs and from `vite dev` before the define is applied.
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
export const VERSION_LABEL = `v${APP_VERSION}`;
```

- [ ] **Step 7: Use it in the menu**

Modify `src/scenes/MenuScene.js`. Add to the imports at the top:

```js
import { VERSION_LABEL } from '../config/version';
```

Replace line 54:

```js
        const versionText = this.add.text(GAME_WIDTH - 20, 585, VERSION_LABEL, textStyle(14, '#7781a4')).setOrigin(1);
```

- [ ] **Step 8: Wire the scripts**

Modify the `scripts` block in `package.json` (tabs). Add `lint` and
`version:native`, and change the existing `mobile:sync` line. The full block
afterwards:

```json
	"scripts": {
		"start": "vite",
		"build": "vite build",
		"preview": "vite preview",
		"test": "node --test",
		"lint": "eslint src scripts test",
		"version:native": "node scripts/sync-native-version.mjs",
		"mobile:sync": "npm run build && npm run version:native && cap sync",
		"mobile:android": "npm run mobile:sync && cap open android",
		"mobile:ios": "npm run mobile:sync && cap open ios"
	},
```

- [ ] **Step 9: Verify the whole suite and the build**

Run: `npm test && npm run build`
Expected: PASS — 35 tests (31 existing + 4 new), build succeeds.

- [ ] **Step 10: Verify the native sync actually rewrites both projects**

Run: `npm run version:native && grep -n "versionCode\|versionName" android/app/build.gradle && grep -n "MARKETING_VERSION" ios/App/App.xcodeproj/project.pbxproj`
Expected: `versionCode 20000`, `versionName "2.0.0"`, `MARKETING_VERSION = 2.0.0;` (twice).

- [ ] **Step 11: Commit**

```bash
git add src/config/version.js scripts/sync-native-version.mjs test/version-sync.test.js \
        vite.config.js package.json src/scenes/MenuScene.js \
        android/app/build.gradle ios/App/App.xcodeproj/project.pbxproj
git commit -m "fix: derive app version from package.json across web and native"
```

---

## Task 2: ESLint flat config

**Files:**
- Create: `eslint.config.js`
- Modify: none

**Interfaces:**
- Consumes: the `lint` script added in Task 1 Step 8.
- Produces: `npm run lint` exits 0 on the current tree.

- [ ] **Step 1: Create the config**

Create `eslint.config.js`:

```js
export default [
    {
        files: ['src/**/*.js', 'scripts/**/*.mjs', 'test/**/*.js'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                __APP_VERSION__: 'readonly',
                console: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                process: 'readonly',
                window: 'readonly',
                DOMException: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
            'no-undef': 'error',
            'prefer-const': 'warn',
            'no-var': 'error',
            eqeqeq: ['warn', 'smart'],
        },
    },
];
```

- [ ] **Step 2: Run the linter**

Run: `npm run lint`
Expected: exits 0. Warnings are acceptable; **errors are not**. If `no-undef` errors appear for a browser or Node global this config missed, add that global to the `globals` map — do not silence the rule.

- [ ] **Step 3: Confirm nothing else broke**

Run: `npm test && npm run build`
Expected: PASS — 35 tests, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add eslint.config.js
git commit -m "chore: add eslint flat config and lint script"
```

---

## Task 3: Phaser-free design tokens

**Files:**
- Create: `src/ui/theme.js`, `src/ui/format.js`, `test/ui-theme.test.js`, `test/ui-format.test.js`
- Modify: none yet — `src/ui.js` still holds its own copies until Task 5.

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `src/ui/theme.js` → `COLORS` (same keys and values as today's `src/ui.js`), `TYPE`, `SPACING`, `RADII`
  - `TYPE` shape: `{ [token]: { size: number, letterSpacing: number } }` for tokens `display | title | heading | body | label | caption`
  - `src/ui/format.js` → `formatNumber(value: unknown): string`, `formatTime(seconds: unknown): string`

- [ ] **Step 1: Write the failing tests**

Create `test/ui-theme.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { COLORS, RADII, SPACING, TYPE } from '../src/ui/theme.js';

const TOKENS = ['display', 'title', 'heading', 'body', 'label', 'caption'];

test('the palette keeps every colour the scenes already reference', () => {
    ['navy', 'panel', 'panelDark', 'cyan', 'yellow', 'green', 'red', 'purple', 'white', 'muted']
        .forEach(key => assert.ok(key in COLORS, `missing colour ${key}`));
    assert.equal(COLORS.cyan, 0x5ce1e6);
    assert.equal(COLORS.yellow, 0xffd166);
    assert.equal(COLORS.green, 0x7ae582);
    assert.equal(COLORS.red, 0xff6b6b);
    // `muted` is a CSS string because it is passed straight to text styles.
    assert.equal(COLORS.muted, '#9ea9d1');
});

test('the type scale has exactly six descending steps', () => {
    assert.deepEqual(Object.keys(TYPE), TOKENS);
    const sizes = TOKENS.map(token => TYPE[token].size);
    assert.deepEqual(sizes, [44, 32, 24, 18, 14, 12]);
    sizes.slice(1).forEach((size, index) => assert.ok(size < sizes[index], 'sizes must descend'));
});

test('only the small uppercase steps carry letter-spacing', () => {
    ['display', 'title', 'heading', 'body'].forEach(token => assert.equal(TYPE[token].letterSpacing, 0));
    assert.ok(TYPE.label.letterSpacing > 0);
    assert.ok(TYPE.caption.letterSpacing > TYPE.label.letterSpacing);
});

test('spacing and radii are positive and ordered', () => {
    const spacing = Object.values(SPACING);
    spacing.slice(1).forEach((value, index) => assert.ok(value > spacing[index]));
    assert.ok(Object.values(RADII).every(value => value > 0));
});
```

Create `test/ui-format.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber, formatTime } from '../src/ui/format.js';

test('numbers are grouped and never negative', () => {
    assert.equal(formatNumber(1240), '1,240');
    assert.equal(formatNumber(0), '0');
    assert.equal(formatNumber(-50), '0');
    assert.equal(formatNumber('not-a-number'), '0');
    assert.equal(formatNumber(undefined), '0');
});

test('times render as minutes and padded seconds', () => {
    assert.equal(formatTime(0), '0:00');
    assert.equal(formatTime(9), '0:09');
    assert.equal(formatTime(65), '1:05');
    assert.equal(formatTime(155), '2:35');
    assert.equal(formatTime(3600), '60:00');
});

test('malformed durations degrade to zero rather than NaN', () => {
    assert.equal(formatTime(-12), '0:00');
    assert.equal(formatTime('abc'), '0:00');
    assert.equal(formatTime(undefined), '0:00');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/ui-theme.test.js test/ui-format.test.js`
Expected: FAIL — `Cannot find module '.../src/ui/theme.js'`

- [ ] **Step 3: Write the implementation**

Create `src/ui/theme.js`:

```js
export const COLORS = {
    navy: 0x0c1024,
    panel: 0x1a2244,
    panelDark: 0x121730,
    cyan: 0x5ce1e6,
    yellow: 0xffd166,
    green: 0x7ae582,
    red: 0xff6b6b,
    purple: 0xa06ee1,
    white: 0xffffff,
    muted: '#9ea9d1',
};

// Six named steps replacing the ~16 ad-hoc font sizes the scenes used to pick
// individually. letterSpacing is in pixels, matching Phaser's Text config, and
// is only applied to the small uppercase steps where tracking aids legibility.
export const TYPE = {
    display: { size: 44, letterSpacing: 0 },
    title: { size: 32, letterSpacing: 0 },
    heading: { size: 24, letterSpacing: 0 },
    body: { size: 18, letterSpacing: 0 },
    label: { size: 14, letterSpacing: 2.2 },
    caption: { size: 12, letterSpacing: 2.6 },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };

export const RADII = { sm: 8, md: 12, lg: 16, pill: 999 };
```

Create `src/ui/format.js`:

```js
export function formatNumber(value) {
    return Math.max(0, Number(value) || 0).toLocaleString('en-US');
}

export function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/ui-theme.test.js test/ui-format.test.js`
Expected: PASS — 7 tests

- [ ] **Step 5: Full suite**

Run: `npm test && npm run lint`
Expected: PASS — 42 tests, lint exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/ui/theme.js src/ui/format.js test/ui-theme.test.js test/ui-format.test.js
git commit -m "feat: add phaser-free design tokens and formatters"
```

---

## Task 4: Text styles with token support

**Files:**
- Create: `src/ui/text.js`, `test/ui-text-style.test.js`
- Modify: none yet.

**Interfaces:**
- Consumes: `TYPE` from `src/ui/theme.js`; `RENDER_SCALE` from `src/config/layout.js`.
- Produces: `src/ui/text.js` → `textStyle(sizeOrToken: number | string, color?: string | number): object`.

The returned object keeps today's exact shape for numeric input:
`{ fontFamily, fontStyle, fontSize, color, stroke, strokeThickness, resolution }`.
Token input additionally sets `letterSpacing`.

- [ ] **Step 1: Write the failing test**

Create `test/ui-text-style.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { textStyle } from '../src/ui/text.js';
import { TYPE } from '../src/ui/theme.js';

test('numeric sizes keep the exact style contract the scenes already rely on', () => {
    const style = textStyle(24, '#ffd166');
    assert.equal(style.fontSize, '24px');
    assert.equal(style.color, '#ffd166');
    assert.equal(style.fontStyle, 'bold');
    assert.ok(style.fontFamily.startsWith('Caramel'));
    assert.equal(style.stroke, '#080a18');
    // Math.max(2, Math.round(24 / 16)) === 2
    assert.equal(style.strokeThickness, 2);
    assert.equal(style.letterSpacing, undefined);
});

test('stroke thickness still scales with the font size', () => {
    assert.equal(textStyle(12).strokeThickness, 2);
    assert.equal(textStyle(44).strokeThickness, 3);
    assert.equal(textStyle(96).strokeThickness, 6);
});

test('numeric colours are converted to padded css hex', () => {
    assert.equal(textStyle(20, 0xffd166).color, '#ffd166');
    assert.equal(textStyle(20, 0x0c1024).color, '#0c1024');
    assert.equal(textStyle(20).color, '#ffffff');
});

test('named tokens resolve to their scale size and tracking', () => {
    assert.equal(textStyle('display').fontSize, `${TYPE.display.size}px`);
    assert.equal(textStyle('heading').fontSize, '24px');
    assert.equal(textStyle('label').letterSpacing, TYPE.label.letterSpacing);
    assert.equal(textStyle('caption').letterSpacing, TYPE.caption.letterSpacing);
    // Steps with no tracking must not emit the property at all, so their
    // rendering stays byte-identical to the pre-token behaviour.
    assert.equal(textStyle('body').letterSpacing, undefined);
});

test('an unknown token falls back to the body step instead of producing NaN', () => {
    assert.equal(textStyle('nonsense').fontSize, `${TYPE.body.size}px`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/ui-text-style.test.js`
Expected: FAIL — `Cannot find module '.../src/ui/text.js'`

- [ ] **Step 3: Write the implementation**

Create `src/ui/text.js`:

```js
import { RENDER_SCALE } from '../config/layout.js';
import { TYPE } from './theme.js';

const toCssColor = color => (typeof color === 'number'
    ? `#${color.toString(16).padStart(6, '0')}`
    : color);

// Accepts either a raw pixel size (the original signature, still used across
// the scenes) or one of the six named scale tokens. Tokens additionally carry
// letter-spacing; numeric callers get exactly the object they always got.
export const textStyle = (sizeOrToken = 28, color = '#ffffff') => {
    const token = typeof sizeOrToken === 'string' ? (TYPE[sizeOrToken] || TYPE.body) : undefined;
    const size = token ? token.size : sizeOrToken;
    const style = {
        fontFamily: 'Caramel, "Arial Rounded MT Bold", Arial, sans-serif',
        fontStyle: 'bold',
        fontSize: `${size}px`,
        color: toCssColor(color),
        stroke: '#080a18',
        strokeThickness: Math.max(2, Math.round(size / 16)),
        resolution: RENDER_SCALE,
    };
    if (token?.letterSpacing) style.letterSpacing = token.letterSpacing;
    return style;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/ui-text-style.test.js`
Expected: PASS — 5 tests

- [ ] **Step 5: Full suite**

Run: `npm test && npm run lint`
Expected: PASS — 47 tests, lint exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/ui/text.js test/ui-text-style.test.js
git commit -m "feat: add type-scale token support to text styles"
```

---

## Task 5: Extract Phaser UI modules behind the barrel

This is a pure refactor: **no visual or behavioural change**. The gate is that the existing suite and the production build both stay green, plus a static test proving the barrel is complete.

**Files:**
- Create: `src/ui/panel.js`, `src/ui/button.js`, `src/ui/background.js`, `src/ui/toast.js`, `test/ui-barrel.test.js`
- Modify: `src/ui.js` (becomes the barrel)

**Interfaces:**
- Consumes: `COLORS` from `theme.js`, `textStyle` from `text.js`, `formatNumber` from `format.js`.
- Produces: `src/ui.js` re-exports `COLORS`, `TYPE`, `SPACING`, `RADII`, `textStyle`, `formatNumber`, `formatTime`, `addPanel`, `addButton`, `addBackButton`, `addSpaceBackground`, `addBrandTitle`, `addTitle`, `showToast`.

- [ ] **Step 1: Write the failing test**

`src/ui.js` imports Phaser, which needs a DOM and cannot be imported under `node --test`. So the barrel is verified statically instead.

Create `test/ui-barrel.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const barrel = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');

const SUBMODULES = ['theme', 'format', 'text', 'panel', 'button', 'background', 'toast', 'transitions', 'icons'];

test('the barrel re-exports every ui submodule', () => {
    SUBMODULES.forEach(name => {
        assert.match(barrel, new RegExp(`export \\* from '\\./ui/${name}\\.js'`),
            `src/ui.js must re-export ./ui/${name}.js`);
    });
});

test('the barrel holds no implementation of its own', () => {
    const withoutExports = barrel.replace(/export \* from '[^']+';?/g, '').replace(/\/\/[^\n]*/g, '').trim();
    assert.equal(withoutExports, '', 'src/ui.js should contain only re-exports and comments');
});

test('every symbol the scenes import from ../ui is still provided', () => {
    const required = [
        'COLORS', 'textStyle', 'addSpaceBackground', 'addBrandTitle', 'addTitle',
        'addPanel', 'addButton', 'addBackButton', 'formatNumber', 'showToast',
    ];
    const sources = SUBMODULES
        .map(name => readFileSync(new URL(`../src/ui/${name}.js`, import.meta.url), 'utf8'))
        .join('\n');
    required.forEach(symbol => {
        assert.match(sources, new RegExp(`export (const|function|class)\\s+${symbol}\\b`),
            `no ui submodule exports ${symbol}`);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/ui-barrel.test.js`
Expected: FAIL — `Cannot find module '.../src/ui/panel.js'`

- [ ] **Step 3: Move `addPanel` into its own module**

Create `src/ui/panel.js` with the body copied verbatim from `src/ui.js:114-131`, changing only the imports:

```js
import { COLORS } from './theme.js';

export function addPanel(scene, x, y, width, height, alpha = 0.92) {
    const container = scene.add.container(x, y);

    // Dark semi-transparent backdrop panel
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.panelDark, alpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.lineStyle(2, COLORS.cyan, 0.45);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

    // Inner subtle glass glow line at top edge
    const glow = scene.add.graphics();
    glow.lineStyle(1.5, 0xffffff, 0.22);
    glow.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, 2, 4);

    container.add([bg, glow]);
    return container;
}
```

- [ ] **Step 4: Move `addButton` and `addBackButton`**

Create `src/ui/button.js` with the bodies copied verbatim from `src/ui.js:133-217`. Imports at the top:

```js
import Phaser from 'phaser';
import { GAME_HEIGHT, watchResponsiveLayout } from '../config/layout.js';
import { playerProfile } from '../services/PlayerProfile.js';
import { COLORS } from './theme.js';
import { textStyle } from './text.js';
```

Copy `addButton` (lines 133-207) and `addBackButton` (lines 209-217) unchanged.

- [ ] **Step 5: Move the background helpers**

Create `src/ui/background.js` with `addSpaceBackground`, `addBrandTitle`, and `addTitle` copied verbatim from `src/ui.js:37-112`. Imports:

```js
import {
    CAMERA_VIEW_HEIGHT, CAMERA_VIEW_WIDTH, GAME_CENTER_X, GAME_HEIGHT, GAME_WIDTH,
    watchResponsiveLayout,
} from '../config/layout.js';
import { playMusic } from '../services/AudioService.js';
import { COLORS } from './theme.js';
import { textStyle } from './text.js';
```

- [ ] **Step 6: Move `showToast`**

Create `src/ui/toast.js` with the body copied verbatim from `src/ui.js:223-253`. Imports:

```js
import { GAME_CENTER_X, watchResponsiveLayout } from '../config/layout.js';
import { COLORS } from './theme.js';
import { textStyle } from './text.js';
```

- [ ] **Step 7: Create the two remaining stub modules**

`transitions.js` and `icons.js` are filled in by Tasks 6 and 7, but the barrel test requires them to exist and be re-exported now.

Create `src/ui/transitions.js`:

```js
// Replaced with a real camera fade in Task 7.
export function fadeToScene(scene, key, data) {
    scene.scene.start(key, data);
}
```

Create `src/ui/icons.js`:

```js
// Replaced with the full vector icon set in Task 6.
export function drawIcon(scene, name, x, y, size = 16, color = 0xffffff) {
    return scene.add.graphics().fillStyle(color, 1).fillCircle(x, y, size / 2);
}
```

- [ ] **Step 8: Replace `src/ui.js` with the barrel**

Overwrite `src/ui.js` entirely:

```js
// Barrel for the UI design system. Scenes import from '../ui' and must keep
// working unchanged, so every submodule is re-exported here rather than
// scenes being pointed at the individual files.
export * from './ui/theme.js';
export * from './ui/format.js';
export * from './ui/text.js';
export * from './ui/panel.js';
export * from './ui/button.js';
export * from './ui/background.js';
export * from './ui/toast.js';
export * from './ui/transitions.js';
export * from './ui/icons.js';
```

- [ ] **Step 9: Run test to verify it passes**

Run: `node --test test/ui-barrel.test.js`
Expected: PASS — 3 tests

- [ ] **Step 10: Verify nothing regressed**

Run: `npm test && npm run lint && npm run build`
Expected: PASS — 50 tests, lint exits 0, build succeeds with no unresolved-import errors.

- [ ] **Step 11: Smoke-test the running game**

Run: `npm start`, open `http://localhost:8000` in a landscape window.
Verify: splash → menu renders; Campaign, Hangar, Achievements, Leaderboard, Options, and How To Play all open and return via BACK; starting Mission 1 shows the HUD and touch controls. Everything must look **identical** to before this task.

- [ ] **Step 12: Commit**

```bash
git add src/ui.js src/ui/ test/ui-barrel.test.js
git commit -m "refactor: split ui helpers into modules behind a barrel"
```

---

## Task 6: Vector icons replace emoji

**Files:**
- Modify: `src/ui/icons.js`, `src/scenes/EndScene.js:93-113`
- Test: `test/ui-barrel.test.js` (already covers the export)

**Interfaces:**
- Consumes: `COLORS` from `theme.js`.
- Produces: `drawIcon(scene, name, x, y, size = 16, color = COLORS.white): Phaser.GameObjects.Graphics` for names `target | coin | clock | gem | skull | lock | star | chevron | pause`. The graphics object is positioned at `(x, y)` and drawn centred on its own origin.

- [ ] **Step 1: Implement the icon factory**

Overwrite `src/ui/icons.js`:

```js
import { COLORS } from './theme.js';

// Each painter draws into a Graphics object already translated to (x, y),
// using a unit radius so callers control size in one place. Emoji were
// previously used for these and resolved to the host OS emoji font, which
// rendered full-colour and inconsistently across platforms.
const PAINTERS = {
    target(g, r, color) {
        g.lineStyle(Math.max(1.5, r * 0.18), color, 1);
        g.strokeCircle(0, 0, r);
        g.strokeCircle(0, 0, r * 0.45);
        g.lineBetween(-r * 1.35, 0, -r * 0.9, 0);
        g.lineBetween(r * 0.9, 0, r * 1.35, 0);
        g.lineBetween(0, -r * 1.35, 0, -r * 0.9);
        g.lineBetween(0, r * 0.9, 0, r * 1.35);
        g.fillStyle(color, 1).fillCircle(0, 0, r * 0.16);
    },
    coin(g, r, color) {
        g.fillStyle(color, 1).fillCircle(0, 0, r);
        g.lineStyle(Math.max(1.5, r * 0.16), COLORS.navy, 0.85).strokeCircle(0, 0, r * 0.62);
        g.fillStyle(0xffffff, 0.55).fillCircle(-r * 0.32, -r * 0.36, r * 0.2);
    },
    clock(g, r, color) {
        g.lineStyle(Math.max(1.5, r * 0.16), color, 1).strokeCircle(0, 0, r);
        g.lineBetween(0, 0, 0, -r * 0.55);
        g.lineBetween(0, 0, r * 0.42, 0);
    },
    gem(g, r, color) {
        g.fillStyle(color, 1).fillPoints([
            { x: 0, y: -r }, { x: r, y: 0 }, { x: 0, y: r }, { x: -r, y: 0 },
        ], true);
        g.fillStyle(0xffffff, 0.4).fillPoints([
            { x: 0, y: -r }, { x: r * 0.42, y: 0 }, { x: 0, y: r * 0.28 },
        ], true);
    },
    skull(g, r, color) {
        g.fillStyle(color, 1).fillCircle(0, -r * 0.18, r * 0.82);
        g.fillRect(-r * 0.42, r * 0.34, r * 0.84, r * 0.5);
        g.fillStyle(COLORS.navy, 1);
        g.fillCircle(-r * 0.34, -r * 0.22, r * 0.24);
        g.fillCircle(r * 0.34, -r * 0.22, r * 0.24);
    },
    lock(g, r, color) {
        g.lineStyle(Math.max(1.5, r * 0.2), color, 1);
        g.beginPath();
        g.arc(0, -r * 0.28, r * 0.48, Math.PI, 0);
        g.strokePath();
        g.fillStyle(color, 1).fillRoundedRect(-r * 0.72, -r * 0.28, r * 1.44, r * 1.12, r * 0.2);
    },
    star(g, r, color) {
        const points = [];
        for (let index = 0; index < 10; index += 1) {
            const radius = index % 2 === 0 ? r : r * 0.44;
            const angle = (Math.PI / 5) * index - Math.PI / 2;
            points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
        }
        g.fillStyle(color, 1).fillPoints(points, true);
    },
    chevron(g, r, color) {
        g.fillStyle(color, 1).fillPoints([
            { x: -r * 0.6, y: -r }, { x: r * 0.7, y: 0 }, { x: -r * 0.6, y: r },
            { x: -r * 0.2, y: 0 },
        ], true);
    },
    pause(g, r, color) {
        g.fillStyle(color, 1);
        g.fillRoundedRect(-r * 0.6, -r, r * 0.42, r * 2, r * 0.14);
        g.fillRoundedRect(r * 0.18, -r, r * 0.42, r * 2, r * 0.14);
    },
};

export function drawIcon(scene, name, x, y, size = 16, color = COLORS.white) {
    const graphics = scene.add.graphics({ x, y });
    const painter = PAINTERS[name];
    if (painter) painter(graphics, size / 2, color);
    return graphics;
}

export const ICON_NAMES = Object.keys(PAINTERS);
```

- [ ] **Step 2: Replace the emoji in the debrief**

In `src/scenes/EndScene.js`, add `drawIcon` to the existing `from '../ui'` import.

Replace the `boxes` array (lines 97-102) — dropping the `icon` emoji strings for icon names:

```js
        const boxes = [
            { x: 260, label: 'ELIMINATED', value: `${run.kills} Targets`, icon: 'target', color: '#ffffff', iconColor: COLORS.white },
            { x: 510, label: 'COINS COLLECTED', value: `◆ ${run.coins}`, icon: 'coin', color: '#ffd166', iconColor: COLORS.yellow },
            { x: 760, label: 'FLIGHT TIME', value: `${run.seconds}s ${run.speedBonus > 0 ? `(+${run.speedBonus} bonus)` : ''}`, icon: 'clock', color: '#5ce1e6', iconColor: COLORS.cyan },
            { x: 1010, label: 'CREDITS REWARD', value: `+◆ ${formatNumber(rewards.creditsEarned)}`, icon: 'gem', color: '#7ae582', iconColor: COLORS.green },
        ];
```

Replace the two label lines inside `boxes.forEach` (lines 111-112):

```js
            drawIcon(this, box.icon, box.x - boxWidth / 2 + 22, boxY - 18, 15, box.iconColor);
            this.add.text(box.x + 8, boxY - 18, box.label, textStyle('label', COLORS.muted)).setOrigin(0.5);
            this.add.text(box.x, boxY + 10, box.value, textStyle(19, box.color)).setOrigin(0.5);
```

- [ ] **Step 3: Confirm no emoji remain in gameplay or menu surfaces**

Run: `grep -rnP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' src/`
Expected: no matches in `src/scenes/` or `src/components/`. The geometric glyphs `◆ ★ ‹ › ▲ ☠ ✦ ✚ ↺ ↻ Ⅱ` are **not** emoji, render from the text font consistently, and stay as-is.

- [ ] **Step 4: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: PASS — 50 tests, lint exits 0, build succeeds.

- [ ] **Step 5: Smoke-test the debrief**

Run: `npm start`, play Mission 1 to completion (or let the ship be destroyed).
Verify: the four debrief stat cards show drawn vector icons, correctly coloured and vertically aligned with their labels. No emoji anywhere.

- [ ] **Step 6: Commit**

```bash
git add src/ui/icons.js src/scenes/EndScene.js
git commit -m "feat: replace debrief emoji with drawn vector icons"
```

---

## Task 7: Scene fade transitions

**Files:**
- Modify: `src/ui/transitions.js`, `src/scenes/MenuScene.js`, `src/scenes/LevelSelectScene.js`, `src/scenes/HangarScene.js`, `src/scenes/AchievementsScene.js`, `src/scenes/LeaderboardScene.js`, `src/scenes/OptionsScene.js`, `src/scenes/InstructionsScene.js`, `src/scenes/Credits.js`, `src/scenes/EndScene.js`, `src/ui/button.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `fadeToScene(scene, key, data?, duration = 220): void`.

`PlayScene` navigation is deliberately **excluded** — its pause-quit and `finish()` paths already coordinate audio teardown and delayed calls, and adding a fade there risks the shutdown ordering. It gets its transition in Plan 2 alongside the HUD work.

- [ ] **Step 1: Implement the fade**

Overwrite `src/ui/transitions.js`:

```js
// Phaser keeps the outgoing scene updating during a camera fade, so the guard
// flag stops a second tap from queueing another start mid-fade — the same
// class of bug SplashScene's `launching` latch already guards against.
//
// Phaser reuses a Scene instance across restarts, so the flag MUST be cleared
// on shutdown. Without that reset the first navigation away from a scene would
// permanently wedge every later navigation from it.
export function fadeToScene(scene, key, data, duration = 220) {
    if (scene.__transitioning) return;
    scene.__transitioning = true;
    scene.events.once('shutdown', () => { scene.__transitioning = false; });
    scene.cameras.main.fadeOut(duration, 8, 11, 30);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
        scene.scene.start(key, data);
    });
}
```

- [ ] **Step 2: Fade in on scene entry**

Every scene that fades out must fade back in, or the second visit starts black. Add to `src/ui/background.js`, at the end of `addSpaceBackground`, immediately before `return bg;`:

```js
    scene.cameras.main.fadeIn(180, 8, 11, 30);
```

`addSpaceBackground` is called by every menu-side scene, so this covers all of them in one place.

- [ ] **Step 3: Route the back button through the fade**

In `src/ui/button.js`, add the import:

```js
import { fadeToScene } from './transitions.js';
```

and change the `addBackButton` press handler from `() => scene.scene.start(target, data)` to:

```js
    const button = addButton(scene, 92, GAME_HEIGHT - 36, '‹ BACK', () => fadeToScene(scene, target, data), {
```

- [ ] **Step 4: Route the menu-side navigations**

In each of `MenuScene.js`, `LevelSelectScene.js`, `HangarScene.js`, `AchievementsScene.js`, `LeaderboardScene.js`, `OptionsScene.js`, `InstructionsScene.js`, `Credits.js`, and `EndScene.js`: add `fadeToScene` to the `from '../ui'` import, then replace every `this.scene.start(...)` navigation with `fadeToScene(this, ...)`.

Specifically:
- `MenuScene.js:42` — `const go = (scene, data) => fadeToScene(this, scene, data);`
- `LevelSelectScene.js:34` — `() => fadeToScene(this, 'play', { levelId: level.id })`
- `EndScene.js:138-140` — `go(scene, data) { fadeToScene(this, scene, data); }`

Leave `SplashScene.js:44` alone; Task 8 rewrites it.

- [ ] **Step 5: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: PASS — 50 tests, lint exits 0, build succeeds.

- [ ] **Step 6: Smoke-test navigation**

Run: `npm start`.
Verify: every menu navigation cross-fades rather than hard-cutting. Navigate Menu → Hangar → BACK → Achievements → BACK → Options → BACK repeatedly and confirm no screen is left black. Double-tap a menu button rapidly and confirm it does not double-navigate.

- [ ] **Step 7: Commit**

```bash
git add src/ui/transitions.js src/ui/background.js src/ui/button.js src/scenes/
git commit -m "feat: cross-fade between menu scenes"
```

---

## Task 8: Real loading progress on the splash

**Files:**
- Modify: `src/scenes/SplashScene.js`

**Interfaces:**
- Consumes: `textStyle`, `COLORS` from `../ui`; `fadeToScene` from `../ui`.
- Produces: nothing consumed by later tasks.

`SplashScene` currently gates on `time > 3000` — a fixed three-second wait unrelated to actual loading. On a fast connection it wastes three seconds; on a slow one it can advance before assets settle. Replacing it with real loader progress is the single clearest "this is a finished product" signal on first launch.

- [ ] **Step 1: Add the progress bar**

In `src/scenes/SplashScene.js`, replace the `create()` body's trailing status line and add progress wiring. After the `addBrandTitle` call, replace:

```js
        this.add.text(centerX, 450, 'PREPARING LAUNCH…', textStyle(22, '#aeb8da')).setOrigin(0.5);
```

with:

```js
        this.statusText = this.add.text(centerX, 442, 'PREPARING LAUNCH…', textStyle('label', '#aeb8da')).setOrigin(0.5);

        const barWidth = 420;
        const barHeight = 10;
        this.progressTrack = this.add.graphics();
        this.progressTrack.fillStyle(COLORS.panelDark, 0.9);
        this.progressTrack.fillRoundedRect(centerX - barWidth / 2, 470, barWidth, barHeight, barHeight / 2);
        this.progressTrack.lineStyle(1.5, COLORS.cyan, 0.35);
        this.progressTrack.strokeRoundedRect(centerX - barWidth / 2, 470, barWidth, barHeight, barHeight / 2);
        this.progressFill = this.add.graphics();

        this.drawProgress = value => {
            const clamped = Math.min(1, Math.max(0, value));
            this.progressFill.clear();
            if (clamped <= 0) return;
            this.progressFill.fillStyle(COLORS.cyan, 0.95);
            this.progressFill.fillRoundedRect(
                centerX - barWidth / 2 + 2, 472,
                Math.max(barHeight - 4, (barWidth - 4) * clamped), barHeight - 4,
                (barHeight - 4) / 2,
            );
        };
        this.drawProgress(0);
```

- [ ] **Step 2: Drive it from the real loader**

Still in `create()`, after the block above, queue the next scene's assets so the bar reflects genuine work, then advance when the queue drains:

```js
        // Preloading the menu's assets here is what gives the bar something
        // real to measure, and it means the menu appears instantly afterwards
        // instead of flashing an unstyled frame.
        this.load.image('menu', 'assets/menu-space-v2.png');
        this.load.image('titleImage', 'assets/spacetitle.png');
        this.load.on('progress', value => this.drawProgress(value));
        this.load.once('complete', () => {
            this.drawProgress(1);
            this.statusText.setText('READY');
            // A short beat so a cached instant load does not flash the splash.
            this.time.delayedCall(420, () => this.launch());
        });
        this.load.start();
```

- [ ] **Step 3: Replace the timer gate**

Replace the whole `update()` method:

```js
    update(time, diff) {
        this.splashImage.tilePositionX += diff * 0.017;
        this.splashImage.tilePositionY += diff * 0.009;
        if (this.splashImage.alpha < 1) this.splashImage.alpha += 0.01;
    }

    launch() {
        // The scene keeps updating behind the fade, so the latch stops a second
        // start being queued.
        if (this.launching) return;
        this.launching = true;
        fadeToScene(this, 'menu');
    }
```

Add `COLORS` and `fadeToScene` to the `from '../ui'` import.

- [ ] **Step 4: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: PASS — 50 tests, lint exits 0, build succeeds.

- [ ] **Step 5: Smoke-test both load speeds**

Run: `npm start`, hard-reload with an empty cache (DevTools → Network → Disable cache).
Verify: the bar fills progressively and the menu appears when it completes. Reload again with cache enabled and confirm the splash still shows for a readable beat rather than flashing, and never hangs.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/SplashScene.js
git commit -m "feat: drive the splash screen from real load progress"
```

---

## Task 9: Responsive layout for the remaining static scenes

**Files:**
- Modify: `src/scenes/EndScene.js`, `src/scenes/InstructionsScene.js`, `src/scenes/AchievementsScene.js`, `src/scenes/Credits.js`

**Interfaces:**
- Consumes: `watchResponsiveLayout` from `../config/layout`.
- Produces: nothing consumed by later tasks.

These four scenes hardcode positions around x=640 and register no layout listener, so on tablets and ultrawide displays they do not use the revealed area — unlike `MenuScene`, `HangarScene`, and `PlayScene`, which all watch. `EndScene` matters most: it is on the critical path after every single run.

- [ ] **Step 1: Anchor the debrief**

In `src/scenes/EndScene.js`, capture the edge-anchored objects when creating them, then at the end of `create()` add:

```js
        watchResponsiveLayout(this, layout => {
            headerTitle.setPosition(GAME_CENTER_X, layout.cameraTop + 52);
            runLabelText.setPosition(GAME_CENTER_X, layout.cameraTop + 92);
        });
```

Assign the run-label text to `runLabelText` at line 54 (it is currently created without being captured), and add `GAME_CENTER_X` plus `watchResponsiveLayout` to the `from '../config/layout'` import.

The central score card and stat grid stay centred on the fixed logical canvas, which is correct — only the top-anchored header needs to track the revealed camera edge.

- [ ] **Step 2: Anchor the three list scenes**

In each of `InstructionsScene.js`, `AchievementsScene.js`, and `Credits.js`,
add `watchResponsiveLayout` to the `from '../config/layout'` import, then
capture the `addTitle` return value and add a listener at the end of `create()`.

For example, in `InstructionsScene.js` change line 11 from:

```js
        addTitle(this, 'HOW TO PLAY', 'Finish campaign targets quickly or survive as long as you can in Endless Mode');
```

to:

```js
        const title = addTitle(this, 'HOW TO PLAY', 'Finish campaign targets quickly or survive as long as you can in Endless Mode');
```

and add at the end of `create()`, before `addBackButton(this)`:

```js
        watchResponsiveLayout(this, layout => {
            title.setY(layout.cameraTop + 38);
            title.subtitle?.setY(layout.cameraTop + 75);
        });
```

Apply the same three edits to `AchievementsScene.js` and `Credits.js`, using
whatever title strings those scenes already pass.

`addTitle` currently returns only the title text object. Change it in `src/ui/background.js` to return both:

```js
export function addTitle(scene, title, subtitle = '') {
    const centerX = GAME_CENTER_X;
    const titleText = scene.add.text(centerX, 38, title, textStyle(42, '#ffffff'))
        .setOrigin(0.5)
        .setShadow(0, 3, '#080a18', 6);
    const subtitleText = subtitle
        ? scene.add.text(centerX, 75, subtitle, textStyle(19, COLORS.muted)).setOrigin(0.5)
        : undefined;
    titleText.subtitle = subtitleText;
    return titleText;
}
```

Attaching the subtitle as a property preserves the existing return type, so the four current `addTitle` call sites keep working unchanged.

- [ ] **Step 3: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: PASS — 50 tests, lint exits 0, build succeeds.

- [ ] **Step 4: Smoke-test at three aspect ratios**

Run: `npm start`. In DevTools device toolbar, check at 1920×1080 (16:9), 1024×768 (4:3 tablet), and 3440×1440 (ultrawide).
Verify: on each, the debrief header and the three list-scene titles sit near the top edge of the visible area rather than floating inward, and nothing is clipped.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/EndScene.js src/scenes/InstructionsScene.js \
        src/scenes/AchievementsScene.js src/scenes/Credits.js src/ui/background.js
git commit -m "fix: anchor debrief and list scene headers to the visible viewport"
```

---

## Task 10: Gameplay hygiene fixes

**Files:**
- Modify: `src/scenes/PlayScene.js:465-471`, `src/services/PlayerProfile.js:220`

**Interfaces:**
- Consumes: `getLevel` from `../config/gameData`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Fix the weapon-core drop rate**

`src/scenes/PlayScene.js:466` reads:

```js
        if (this.kills % 6 !== 0 && Math.random() >= 0.08) return;
```

Because `&&` short-circuits, `kills % 6 === 0` makes the whole condition false and the function never returns early — so **every sixth kill guarantees a core**, on top of an 8% chance on all other kills. Replace the method body's guard with an explicit rule:

```js
    maybeSpawnWeaponPowerUp(x, y) {
        // A guaranteed core every twelfth kill keeps the pity timer the old
        // `&&` short-circuit accidentally created, at half its rate, and the
        // independent roll keeps drops feeling unscheduled in between.
        const guaranteed = this.kills > 0 && this.kills % 12 === 0;
        if (!guaranteed && Math.random() >= 0.08) return;
        const choices = getWeaponPickupChoices(this.nativeWeaponId);
        const weapon = Phaser.Utils.Array.GetRandom(choices);
        const powerUp = this.weaponPowerUps.get();
        if (powerUp && weapon) powerUp.show(x, y, weapon, this.ship);
    }
```

- [ ] **Step 2: Look up levels by id, not array index**

`src/services/PlayerProfile.js:220` reads `const level = LEVELS[levelId - 1];`, which assumes array position always equals `id - 1`. Plan 3 renumbers missions, so switch to the accessor now.

Change the import on line 1:

```js
import { ACHIEVEMENTS, getLevel, LEVELS, SKINS, UPGRADES } from '../config/gameData.js';
```

Change line 220:

```js
        const level = getLevel(levelId);
```

`LEVELS` is still used elsewhere in the file (`normalizeProfile`, the clamps in `recordRun`), so keep the import.

- [ ] **Step 3: Verify the existing profile tests still pass**

Run: `npm test`
Expected: PASS — 50 tests. `test/player-profile.test.js` asserts `creditsEarned === 194` for a level-1 victory; `getLevel(1)` returns the same object `LEVELS[0]` did, so this must be unchanged. If it fails, the accessor swap is wrong — do not adjust the test.

- [ ] **Step 4: Verify build and lint**

Run: `npm run lint && npm run build`
Expected: lint exits 0, build succeeds.

- [ ] **Step 5: Smoke-test the drop rate**

Run: `npm start`, play Endless Mode and destroy at least 25 enemies.
Verify: weapon cores appear occasionally rather than reliably every sixth kill, and collecting one still swaps the weapon and shows the toast.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/PlayScene.js src/services/PlayerProfile.js
git commit -m "fix: correct weapon core drop rate and look up levels by id"
```

---

## Task 11: Component variants

Spec §1.4. Plans 2–4 need `primary` / `danger` / `ghost` buttons and panel
variants; establishing the API here means no later plan has to reopen
`button.js`. Nothing in Plan 1 passes a variant, so **every existing call site
must keep rendering exactly as it does today** — that is what the tests pin.

**Files:**
- Create: `src/ui/variants.js`, `test/ui-variants.test.js`
- Modify: `src/ui/panel.js`, `src/ui/button.js`, `src/ui.js`

**Interfaces:**
- Consumes: `COLORS`, `RADII` from `theme.js`.
- Produces:
  - `resolveButtonStyle({ variant, accent, disabled, hovered, pressed, selected, fill })` → `{ fill, fillAlpha, stroke, strokeAlpha, strokeWidth, labelColor }`
  - `resolveButtonSize(size)` → `{ width, height, fontSize }` for `sm | md | lg`
  - `resolvePanelStyle({ variant, accent, alpha })` → `{ fill, fillAlpha, stroke, strokeAlpha, strokeWidth, radius }`
  - Variants: button `primary | secondary | ghost | danger`; panel `default | raised | inset | danger`. Defaults are `secondary` and `default`.

- [ ] **Step 1: Write the failing test**

Create `test/ui-variants.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveButtonSize, resolveButtonStyle, resolvePanelStyle } from '../src/ui/variants.js';
import { COLORS } from '../src/ui/theme.js';

// These four assertions are the regression guard for every existing call site:
// no scene passes a variant yet, so the defaults must reproduce today's exact
// rendering values from the pre-split src/ui.js.
test('the default button variant reproduces the current styling exactly', () => {
    const resting = resolveButtonStyle({ accent: COLORS.cyan });
    assert.equal(resting.fill, COLORS.panel);
    assert.equal(resting.fillAlpha, 0.92);
    assert.equal(resting.stroke, COLORS.cyan);
    assert.equal(resting.strokeAlpha, 0.65);
    assert.equal(resting.strokeWidth, 2);
    assert.equal(resting.labelColor, '#ffffff');
});

test('the default button reproduces the current hover, press, selected and disabled states', () => {
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, pressed: true }).fillAlpha, 0.98);
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, hovered: true }).strokeAlpha, 0.95);
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, hovered: true }).strokeWidth, 3);
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, selected: true }).strokeWidth, 3);

    const disabled = resolveButtonStyle({ accent: COLORS.cyan, disabled: true });
    assert.equal(disabled.fill, 0x12162b);
    assert.equal(disabled.fillAlpha, 0.4);
    assert.equal(disabled.stroke, 0x3a4263);
    assert.equal(disabled.strokeAlpha, 0.3);
    assert.equal(disabled.labelColor, '#5a6385');
});

test('an explicit fill override still wins, as options.fill does today', () => {
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, fill: 0x123456 }).fill, 0x123456);
    // ...but never over a disabled button, which today forces its own fill.
    assert.equal(resolveButtonStyle({ accent: COLORS.cyan, fill: 0x123456, disabled: true }).fill, 0x12162b);
});

test('primary and danger read as stronger than secondary', () => {
    const primary = resolveButtonStyle({ variant: 'primary', accent: COLORS.cyan });
    assert.equal(primary.fill, COLORS.cyan);
    assert.ok(primary.strokeAlpha >= 0.9);
    // A filled accent button needs dark text to stay legible.
    assert.equal(primary.labelColor, '#06121a');

    const danger = resolveButtonStyle({ variant: 'danger', accent: COLORS.cyan });
    assert.equal(danger.stroke, COLORS.red, 'danger ignores the passed accent');

    const ghost = resolveButtonStyle({ variant: 'ghost', accent: COLORS.cyan });
    assert.ok(ghost.fillAlpha < 0.5, 'ghost is mostly transparent');
});

test('button sizes are ordered and md matches the current defaults', () => {
    assert.deepEqual(resolveButtonSize('md'), { width: 220, height: 50, fontSize: 24 });
    const [sm, md, lg] = ['sm', 'md', 'lg'].map(resolveButtonSize);
    assert.ok(sm.height < md.height && md.height < lg.height);
    assert.ok(sm.fontSize < md.fontSize && md.fontSize < lg.fontSize);
    assert.deepEqual(resolveButtonSize('nonsense'), resolveButtonSize('md'));
});

test('the default panel variant reproduces the current styling exactly', () => {
    const panel = resolvePanelStyle({});
    assert.equal(panel.fill, COLORS.panelDark);
    assert.equal(panel.fillAlpha, 0.92);
    assert.equal(panel.stroke, COLORS.cyan);
    assert.equal(panel.strokeAlpha, 0.45);
    assert.equal(panel.strokeWidth, 2);
    assert.equal(panel.radius, 12);
    // The explicit alpha argument every current call site passes must win.
    assert.equal(resolvePanelStyle({ alpha: 0.6 }).fillAlpha, 0.6);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/ui-variants.test.js`
Expected: FAIL — `Cannot find module '.../src/ui/variants.js'`

- [ ] **Step 3: Write the implementation**

Create `src/ui/variants.js`:

```js
import { COLORS, RADII } from './theme.js';

const BUTTON_SIZES = {
    sm: { width: 150, height: 40, fontSize: 19 },
    md: { width: 220, height: 50, fontSize: 24 },
    lg: { width: 320, height: 60, fontSize: 28 },
};

export function resolveButtonSize(size = 'md') {
    return { ...(BUTTON_SIZES[size] || BUTTON_SIZES.md) };
}

// `secondary` is the historical look: every call site that passes no variant
// must come out of here byte-identical to the pre-split implementation.
export function resolveButtonStyle({
    variant = 'secondary', accent = COLORS.cyan, fill,
    disabled = false, hovered = false, pressed = false, selected = false,
} = {}) {
    if (disabled) {
        return {
            fill: 0x12162b, fillAlpha: 0.4,
            stroke: 0x3a4263, strokeAlpha: 0.3, strokeWidth: 2,
            labelColor: '#5a6385',
        };
    }

    const emphasised = hovered || selected;
    const base = {
        fillAlpha: pressed ? 0.98 : 0.92,
        strokeAlpha: emphasised ? 0.95 : 0.65,
        strokeWidth: emphasised ? 3 : 2,
        labelColor: '#ffffff',
    };

    if (variant === 'primary') {
        return { ...base, fill: accent, strokeAlpha: 0.95, strokeWidth: 3, stroke: accent, labelColor: '#06121a' };
    }
    if (variant === 'danger') {
        return { ...base, fill: fill ?? COLORS.panel, stroke: COLORS.red, strokeAlpha: emphasised ? 1 : 0.75 };
    }
    if (variant === 'ghost') {
        return { ...base, fill: fill ?? COLORS.panel, fillAlpha: pressed ? 0.35 : 0.18, stroke: accent };
    }
    return { ...base, fill: fill ?? COLORS.panel, stroke: accent };
}

export function resolvePanelStyle({ variant = 'default', accent = COLORS.cyan, alpha } = {}) {
    const base = {
        fill: COLORS.panelDark,
        fillAlpha: alpha ?? 0.92,
        stroke: accent,
        strokeAlpha: 0.45,
        strokeWidth: 2,
        radius: RADII.md,
    };
    if (variant === 'raised') return { ...base, fill: COLORS.panel, strokeAlpha: 0.7 };
    if (variant === 'inset') return { ...base, fill: COLORS.navy, strokeAlpha: 0.28 };
    if (variant === 'danger') return { ...base, stroke: COLORS.red, strokeAlpha: 0.6 };
    return base;
}
```

Note `RADII.md` is 12, matching the hardcoded radius in the current `addPanel`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/ui-variants.test.js`
Expected: PASS — 6 tests

- [ ] **Step 5: Route the components through the resolvers**

In `src/ui/panel.js`, replace the drawing block so it reads its values from the
resolver while keeping the existing positional signature:

```js
import { resolvePanelStyle } from './variants.js';

export function addPanel(scene, x, y, width, height, alpha = 0.92, options = {}) {
    const container = scene.add.container(x, y);
    const style = resolvePanelStyle({ ...options, alpha });

    const bg = scene.add.graphics();
    bg.fillStyle(style.fill, style.fillAlpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, style.radius);
    bg.lineStyle(style.strokeWidth, style.stroke, style.strokeAlpha);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, style.radius);

    // Inner subtle glass glow line at top edge
    const glow = scene.add.graphics();
    glow.lineStyle(1.5, 0xffffff, 0.22);
    glow.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, 2, 4);

    container.add([bg, glow]);
    return container;
}
```

In `src/ui/button.js`, replace the `drawButton` closure and the width/height/
fontSize defaults. Keep everything else — the interaction handlers, tweens,
haptics, `container.setSelected`, and the `background` / `label` properties —
exactly as they are:

```js
import { resolveButtonSize, resolveButtonStyle } from './variants.js';

// ...inside addButton:
    const defaults = resolveButtonSize(options.size);
    const width = options.width || defaults.width;
    const height = options.height || defaults.height;
    const accentColor = options.accent || COLORS.cyan;

    const drawButton = (hovered = false, pressed = false) => {
        bgGraphics.clear();
        const style = resolveButtonStyle({
            variant: options.variant, accent: accentColor, fill: options.fill,
            disabled: options.disabled, hovered, pressed, selected,
        });
        bgGraphics.fillStyle(style.fill, style.fillAlpha);
        bgGraphics.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bgGraphics.lineStyle(style.strokeWidth, style.stroke, style.strokeAlpha);
        bgGraphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    };
```

and derive the label colour and size from the resolvers too:

```js
    const labelColor = resolveButtonStyle({
        variant: options.variant, accent: accentColor, disabled: options.disabled,
    }).labelColor;
    const labelText = scene.add.text(0, 0, label, textStyle(options.fontSize || defaults.fontSize, labelColor))
        .setOrigin(0.5);
```

**Deliberate behaviour change:** the old code interpolated the hover fill 30%
toward the accent. The resolver drops that in favour of the stronger stroke and
the existing scale tween. This is the one visual difference in Task 11 and it is
intentional — confirm it in Step 7.

- [ ] **Step 6: Re-export and verify**

Add to `src/ui.js`, keeping alphabetical grouping with the other submodules:

```js
export * from './ui/variants.js';
```

Run: `npm test && npm run lint && npm run build`
Expected: PASS — 56 tests, lint exits 0, build succeeds. `test/ui-barrel.test.js`
already asserts the barrel contains only re-exports, so it covers the new line.

- [ ] **Step 7: Smoke-test every button surface**

Run: `npm start`.
Verify across Menu, Mission Select, Hangar (both tabs, including a MAXED
upgrade and the EQUIPPED ship), Options, and the debrief: resting, hover, press,
selected (Hangar tabs), and disabled buttons all render as they did before,
apart from the hover fill no longer tinting toward the accent. Panels are
unchanged, including the dimmed `alpha: 0.6` locked mission panels.

- [ ] **Step 8: Commit**

```bash
git add src/ui/variants.js src/ui/panel.js src/ui/button.js src/ui.js test/ui-variants.test.js
git commit -m "feat: add button and panel variants to the design system"
```

---

## Done criteria

- `npm test` → 56 tests passing (31 existing unmodified + 25 new).
- `npm run lint` → exits 0.
- `npm run build` → succeeds.
- `npm run version:native` → Android `versionCode 20000` / `versionName "2.0.0"`, iOS `MARKETING_VERSION = 2.0.0`.
- Every scene reachable from the menu opens, cross-fades, and returns.
- Splash shows a real progress bar; menu shows `v2.0.0`.
- No emoji remain in `src/scenes/` or `src/components/`.

## Deferred from this plan

Spec §6 also calls for a README update. Its content — the 12-mission campaign,
bosses, and streak scoring — does not exist until Plans 2 and 3, so the README
is updated at the end of Plan 3 rather than being written against features that
are not yet built.

## Notes for Plan 3

`test/player-profile.test.js:21-22` encodes "there are exactly 6 levels":

```js
    assert.equal(profile.unlockedLevel, 6);      // clamp target, becomes 12
    assert.deepEqual(profile.completedLevels, [1]);  // 9 is invalid today, becomes valid
```

Both assertions must be updated when `LEVELS` grows to 12. This is the only place in the existing suite that hardcodes the level count. The spec's "31 existing tests pass unmodified" constraint holds for Plans 1 and 2 and must be relaxed for exactly these two lines in Plan 3.
