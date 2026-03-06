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
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
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

        let title = getMeta('og:title') || getMeta('twitter:title') || (html.match(/<title>(.*?)<\/title>/is)?.[1] || '');
        let description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description') || '';
        let image = getMeta('og:image') || getMeta('twitter:image') || getMeta('og:image:secure_url') || '';
        const siteName = getMeta('og:site_name') || '';

        // Attempt to get publication date from common meta tags
        let publishedDate = getMeta('article:published_time') || getMeta('og:updated_time') || getMeta('release_date') || getMeta('video:release_date') || (html.match(/itemprop="datePublished" content="([^"]*)"/i)?.[1] || '');

        // Instagram specific handling
        if (url.includes('instagram.com/p/') || url.includes('instagram.com/reel/') || url.includes('instagr.am/p/')) {
            // 1. Check if scraping worked (og:image found)
            if (!image || image.includes('instagram.com/static/')) {
                // 2. Try Microlink API as fallback for Instagram
                try {
                    const mlRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
                    if (mlRes.ok) {
                        const mkData = await mlRes.json();
                        if (mkData.data) {
                            if (mkData.data.image && mkData.data.image.url) {
                                // Pour éviter de faire crasher la base de données avec du base64 énorme (qui bloque "Ajouter au flux"),
                                // On ne garde PAS l'image si elle est en base64 pour Instagram (on utilisera l'intégration Iframe à la place)
                                if (!mkData.data.image.url.startsWith('data:')) {
                                    image = `/api/image-proxy?url=${encodeURIComponent(mkData.data.image.url)}`;
                                } else {
                                    image = ''; // Pas d'image base64 énorme
                                }
                            }
                            if (mkData.data.description && !description) description = mkData.data.description;
                            if (mkData.data.title && !title) title = mkData.data.title;
                            if (mkData.data.date && !publishedDate) publishedDate = mkData.data.date;
                        }
                    }
                } catch (e) {
                    console.error("Microlink fallback failed", e);
                }
            } else {
                // General Microlink fallback for non-IG if meta empty 
                if (!image || !title) {
                    try {
                        const mlRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
                        if (mlRes.ok) {
                            const mkData = await mlRes.json();
                            if (mkData.data) {
                                if (!image && mkData.data.image?.url) image = mkData.data.image.url;
                                if (!description && mkData.data.description) description = mkData.data.description;
                                if (!title && mkData.data.title) title = mkData.data.title;
                                if (!publishedDate && mkData.data.date) publishedDate = mkData.data.date;
                            }
                        }
                    } catch (e) { }
                }

                // If scraping worked, ensure image is proxied too
                if (image && !image.startsWith('data:')) {
                    image = `/api/image-proxy?url=${encodeURIComponent(image)}`;
                }
            }

            const cleanDescription = description ? description.trim() : '';
            const cleanTitle = title ? title.trim() : '';
            let cleanDate = '';
            if (publishedDate) {
                try {
                    cleanDate = new Date(publishedDate).toISOString().split('T')[0];
                } catch (e) { }
            }

            return NextResponse.json({
                title: cleanTitle,
                description: cleanDescription,
                image,
                siteName,
                date: cleanDate
            });
        } catch (error) {
            console.error('Error fetching metadata:', error);
            return NextResponse.json({ error: 'Failed to parse metadata' }, { status: 500 });
        }
    }
