# Quarrel Through The Cosmos

A mobile-first Phaser space game with six campaign missions, persistent upgrades, unlockable ship skins, achievements, offline play, native Android/iOS wrappers, and an optional Firebase leaderboard.

## Play locally

Requirements: Node.js 22 or newer.

```bash
npm install
npm start
```

Open `http://localhost:8000` and use a landscape window. Touch controls are always visible; desktop controls are A/D or Left/Right to rotate, W or Up to thrust, Space to fire, and Escape to pause.

## Verify

```bash
npm test
npm run build
```

## Firebase leaderboard setup

The game works offline and uses a local top-ten leaderboard until Firebase is configured.

1. Create a Firebase project and a Web app.
2. Enable **Anonymous** sign-in under Authentication > Sign-in method.
3. Create a Firestore database.
4. Copy `.env.example` to `.env` and fill in the Web app values.
5. Deploy the checked-in rules with `firebase deploy --only firestore:rules`.
6. Run `npm run build` again.

Each authenticated pilot can write only their own best-score document, and scores can only increase. Because gameplay is client-side, determined users can still forge a score; a competition with prizes should submit signed run events to a trusted Cloud Function and enable Firebase App Check.

## Android and iOS

The Capacitor projects are checked in and locked to landscape.

```bash
npm run mobile:sync
npm run mobile:android
# or
npm run mobile:ios
```

`mobile:android` opens Android Studio and `mobile:ios` opens Xcode. Set release signing, application icons, store metadata, and the production Firebase `.env` before creating store builds. Do not add the platform-native Firebase config files for this Web SDK integration; Capacitor loads the generated web bundle.

## Progression model

- Six finite missions with escalating speed, density, damage, and rewards.
- Four permanent upgrades: hull, engine, blaster, and shield.
- Five purchasable/equippable skins.
- Eight automatically awarded achievements with credit bonuses.
- Versioned local persistence with legacy high-score migration.
- One best global score per anonymous Firebase user, plus local fallback rankings.
