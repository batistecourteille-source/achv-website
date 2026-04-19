import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
    if (getApps().length > 0) return getApps()[0];

    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set');

    return initializeApp({ credential: cert(JSON.parse(key)) });
}

export const adminDb = getFirestore(getAdminApp());
