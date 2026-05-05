import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let _app: App | null = null;

function getAdminApp(): App {
    if (_app) return _app;
    if (getApps().length > 0) {
        _app = getApps()[0];
        return _app;
    }
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set');
    _app = initializeApp({ credential: cert(JSON.parse(key)) });
    return _app;
}

export function getAdminDb() {
    return getFirestore(getAdminApp());
}
