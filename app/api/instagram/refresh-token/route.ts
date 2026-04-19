import { NextRequest, NextResponse } from 'next/server';

// GET — called by Vercel Cron monthly to keep the token alive (valid 60 days)
export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const auth = req.headers.get('authorization');
        if (auth !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    const { adminDb } = await import('@/lib/firebase-admin');
    const docRef = adminDb.doc('site/achv');
    const doc = await docRef.get();
    const token: string | undefined = doc.data()?.settings?.instagramAccessToken;

    if (!token) {
        return NextResponse.json({ error: 'Aucun token configuré' }, { status: 400 });
    }

    const res = await fetch(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
    );
    const json = await res.json();

    if (json.error) {
        return NextResponse.json({ error: json.error.message }, { status: 400 });
    }

    // Save the refreshed token back to Firestore
    await docRef.update({ 'settings.instagramAccessToken': json.access_token });

    return NextResponse.json({ success: true, expiresIn: json.expires_in });
}
