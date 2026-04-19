import { NextRequest, NextResponse } from 'next/server';

const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

async function runSync() {
    // Lazy import to avoid firebase-admin init crash if env var missing
    const { adminDb } = await import('@/lib/firebase-admin');

    const docRef = adminDb.doc('site/achv');
    const doc = await docRef.get();
    const data = doc.data() || {};

    const token: string | undefined = data.settings?.instagramAccessToken;
    if (!token) {
        return NextResponse.json({ error: 'Aucun token Instagram configuré dans les réglages admin.' }, { status: 400 });
    }

    const res = await fetch(
        `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=30&access_token=${token}`
    );
    const json = await res.json();

    if (json.error) {
        return NextResponse.json({ error: json.error.message }, { status: 400 });
    }

    const instagramPosts = (json.data || []).map((item: any) => ({
        id: item.id,
        platform: 'instagram',
        content: item.caption || '',
        imageUrl: item.media_type === 'VIDEO' ? (item.thumbnail_url || '') : (item.media_url || ''),
        postUrl: item.permalink,
        date: new Date(item.timestamp).toLocaleDateString('fr-FR'),
    }));

    // Keep non-instagram posts, replace instagram ones
    const otherPosts = (data.socialPosts || []).filter((p: any) => p.platform !== 'instagram');
    const merged = [...instagramPosts, ...otherPosts];

    await docRef.update({
        socialPosts: merged,
        'settings.instagramLastSync': new Date().toISOString(),
    });

    return NextResponse.json({ success: true, count: instagramPosts.length });
}

// GET — called by Vercel Cron (sends Authorization: Bearer <CRON_SECRET>)
export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const auth = req.headers.get('authorization');
        if (auth !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return runSync();
}

// POST — called by the admin panel "Sync maintenant" button
export async function POST() {
    return runSync();
}
