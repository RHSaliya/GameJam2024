import { playerProfile } from './PlayerProfile';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
        if (this.initPromise) return this.initPromise;
        this.initPromise = this.initializeFirebase();
        return this.initPromise;
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

    async submitScore({ score, level }) {
        await this.initialize();
        if (!this.ready || !this.auth.currentUser) return { synced: false };
        const { doc, runTransaction, serverTimestamp } = this.firebase;
        const scoreRef = doc(this.db, 'leaderboards', 'global', 'scores', this.auth.currentUser.uid);
        const safeScore = Math.max(0, Math.floor(Number(score) || 0));
        await runTransaction(this.db, async transaction => {
            const current = await transaction.get(scoreRef);
            if (!current.exists() || safeScore > Number(current.data().score || 0)) {
                transaction.set(scoreRef, {
                    uid: this.auth.currentUser.uid,
                    name: playerProfile.data.displayName,
                    score: safeScore,
                    level: Math.max(1, Math.floor(Number(level) || 1)),
                    updatedAt: serverTimestamp(),
                });
            }
        });
        return { synced: true };
    }

    async getTopScores(count = 20) {
        await this.initialize();
        if (this.ready) {
            try {
                const { collection, getDocs, limit, orderBy, query } = this.firebase;
                const scoresQuery = query(
                    collection(this.db, 'leaderboards', 'global', 'scores'),
                    orderBy('score', 'desc'),
                    limit(Math.min(50, count)),
                );
                const snapshot = await getDocs(scoresQuery);
                return { mode: 'firebase', scores: snapshot.docs.map(item => item.data()) };
            } catch (error) {
                console.warn('Could not load global leaderboard.', error);
            }
        }
        return { mode: 'local', scores: playerProfile.data.localScores.slice(0, count) };
    }
}

export const leaderboardService = new LeaderboardService();
