import { playerProfile } from './PlayerProfile.js';

export function pilotNameKey(name) {
    return String(name).trim().toLowerCase().replace(/[\s_-]+/g, '-');
}

const environment = import.meta.env || {};
const firebaseConfig = {
    apiKey: environment.VITE_FIREBASE_API_KEY,
    authDomain: environment.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: environment.VITE_FIREBASE_PROJECT_ID,
    storageBucket: environment.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: environment.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: environment.VITE_FIREBASE_APP_ID,
};

class LeaderboardService {
    constructor() {
        this.ready = false;
        this.mode = 'local';
        this.initPromise = null;
    }

    isConfigured() {
        return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
    }

    async initialize() {
        if (this.ready) return true;
        if (!this.initPromise) this.initPromise = this.initializeFirebase();
        const initialized = await this.initPromise;
        if (!initialized) this.initPromise = null;
        return initialized;
    }

    async initializeFirebase() {
        if (!this.isConfigured()) return false;
        try {
            const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
                import('firebase/app'), import('firebase/auth'), import('firebase/firestore'),
            ]);
            const app = initializeApp(firebaseConfig);
            this.auth = authModule.getAuth(app);
            this.db = firestoreModule.getFirestore(app);
            this.firebase = { ...authModule, ...firestoreModule };
            if (!this.auth.currentUser) await authModule.signInAnonymously(this.auth);
            this.ready = true;
            this.mode = 'firebase';
            return true;
        } catch (error) {
            console.warn('Firebase leaderboard unavailable; using local scores.', error);
            this.mode = 'local';
            return false;
        }
    }

    async submitScore({ score, threat }) {
        await this.initialize();
        if (!this.ready || !this.auth.currentUser) return { synced: false };
        const { doc, runTransaction, serverTimestamp } = this.firebase;
        const scoreRef = doc(this.db, 'leaderboards', 'global', 'scores', this.auth.currentUser.uid);
        const safeScore = Math.max(0, Math.floor(Number(score) || 0));
        await runTransaction(this.db, async transaction => {
            const current = await transaction.get(scoreRef);
            if (!current.exists() || current.data().mode !== 'endless' || safeScore > Number(current.data().score || 0)) {
                transaction.set(scoreRef, {
                    uid: this.auth.currentUser.uid,
                    name: playerProfile.data.displayName,
                    mode: 'endless',
                    score: safeScore,
                    threat: Math.min(6, Math.max(1, Math.floor(Number(threat) || 1))),
                    updatedAt: serverTimestamp(),
                });
            }
        });
        return { synced: true };
    }

    async claimPilotName(name) {
        const initialized = await this.initialize();
        if (!initialized) {
            return this.isConfigured()
                ? { ok: false, reason: 'OFFLINE' }
                : { ok: true, mode: 'local' };
        }

        const { doc, runTransaction, serverTimestamp } = this.firebase;
        const nameRef = doc(this.db, 'pilotNames', pilotNameKey(name));
        try {
            await runTransaction(this.db, async transaction => {
                const reservation = await transaction.get(nameRef);
                if (reservation.exists() && reservation.data().uid !== this.auth.currentUser.uid) {
                    throw new Error('PILOT_NAME_TAKEN');
                }
                if (!reservation.exists()) {
                    transaction.set(nameRef, {
                        uid: this.auth.currentUser.uid,
                        name,
                        createdAt: serverTimestamp(),
                    });
                }
            });
            return { ok: true, mode: 'firebase' };
        } catch (error) {
            if (error.message === 'PILOT_NAME_TAKEN') return { ok: false, reason: 'TAKEN' };
            console.warn('Could not reserve pilot name.', error);
            return { ok: false, reason: 'OFFLINE' };
        }
    }

    async getTopScores(count = 20) {
        await this.initialize();
        if (this.ready) {
            try {
                const { collection, getDocs, limit, orderBy, query, where } = this.firebase;
                const scoresQuery = query(
                    collection(this.db, 'leaderboards', 'global', 'scores'),
                    where('mode', '==', 'endless'),
                    orderBy('score', 'desc'),
                    limit(Math.min(50, count)),
                );
                const snapshot = await getDocs(scoresQuery);
                return { mode: 'firebase', scores: snapshot.docs.map(item => item.data()) };
            } catch (error) {
                console.warn('Could not load global leaderboard.', error);
            }
        }
        return { mode: 'local', scores: playerProfile.data.endlessScores.slice(0, count) };
    }
}

export const leaderboardService = new LeaderboardService();
