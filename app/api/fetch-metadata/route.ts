import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch the URL' }, { status: response.status });
        }

        const html = await response.text();

        const getMeta = (prop: string) => {
            const regexes = [
                new RegExp(`<meta property="${prop}" content="([^"]*)"`, 'i'),
                new RegExp(`<meta name="${prop}" content="([^"]*)"`, 'i'),
                new RegExp(`<meta property="${prop}" content='([^']*)'`, 'i'),
                new RegExp(`<meta name="${prop}" content='([^']*)'`, 'i'),
                new RegExp(`<meta property="${prop}" content=([^ >]*)`, 'i'),
                new RegExp(`<meta name="${prop}" content=([^ >]*)`, 'i')
            ];
            for (const regex of regexes) {
                const match = html.match(regex);
                if (match) return match[1];
            }
            return '';
        };

        const title = getMeta('og:title') || getMeta('twitter:title') || (html.match(/<title>(.*?)<\/title>/is)?.[1] || '');
        const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description') || '';
        let image = getMeta('og:image') || getMeta('twitter:image') || getMeta('og:image:secure_url') || '';
        const siteName = getMeta('og:site_name') || '';

        // Instagram Fallback: construct media URL if direct scraping failed
        if (url.includes('instagram.com/p/') || url.includes('instagram.com/reel/')) {
            if (!image) {
                const shortcode = url.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/)?.[1];
                if (shortcode) {
                    image = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
                }
            }
            // Always use proxy for Instagram images to avoid CORS
            if (image) {
                image = `/api/image-proxy?url=${encodeURIComponent(image)}`;
            }
        }

        // Clean up common bad descriptions
        const cleanDescription = description.trim();
        const cleanTitle = title.trim();

        return NextResponse.json({
            title: cleanTitle,
            description: cleanDescription,
            image,
            siteName
        });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return NextResponse.json({ error: 'Failed to parse metadata' }, { status: 500 });
    }
}
