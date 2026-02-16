'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import { useData } from '@/lib/DataContext';

export default function SocialPostEmbed({ url }: { url?: string }) {
    const { settings } = useData();
    const postUrl = url || settings.instagramPostUrl;

    useEffect(() => {
        // Force re-process of Instagram embeds when url changes or component mounts
        if (typeof window !== 'undefined' && (window as any).instgrm) {
            (window as any).instgrm.Embeds.process();
        }
    }, [postUrl]);

    if (!postUrl) return null;

    const cleanUrl = postUrl.split('?')[0];

    // INSTAGRAM
    if (postUrl.includes('instagram.com')) {
        const embedUrl = `${cleanUrl}?utm_source=ig_embed&utm_campaign=loading`;
        return (
            <div className="instagram-embed-container" style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
                <blockquote
                    className="instagram-media"
                    data-instgrm-captioned
                    data-instgrm-permalink={embedUrl}
                    data-instgrm-version="14"
                    style={{
                        background: '#FFF',
                        border: '0',
                        borderRadius: '3px',
                        boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                        margin: '1px',
                        maxWidth: '540px',
                        minWidth: '326px',
                        padding: '0',
                        width: '99.375%',
                        width: '-webkit-calc(100% - 2px)',
                        width: 'calc(100% - 2px)'
                    }}
                >
                </blockquote>
                <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />
            </div>
        );
    }

    // FACEBOOK
    if (postUrl.includes('facebook.com')) {
        // Facebook requires the full URL encoded
        const encodedUrl = encodeURIComponent(postUrl);
        const fbEmbedUrl = `https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500`;

        return (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
                <div style={{
                    background: '#FFF',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    maxWidth: '550px',
                    width: '100%'
                }}>
                    <iframe
                        src={fbEmbedUrl}
                        width="100%"
                        height="650"
                        style={{ border: 'none', overflow: 'hidden' }}
                        scrolling="no"
                        frameBorder="0"
                        allowFullScreen={true}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    ></iframe>
                </div>
            </div>
        );
    }

    // YOUTUBE
    if (postUrl.includes('youtube.com') || postUrl.includes('youtu.be')) {
        let videoId = '';
        if (postUrl.includes('youtu.be')) {
            videoId = postUrl.split('youtu.be/')[1]?.split('?')[0];
        } else {
            videoId = new URLSearchParams(postUrl.split('?')[1]).get('v') || '';
        }

        if (videoId) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
                    <div style={{
                        maxWidth: '800px',
                        width: '100%',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                    }}>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                            <iframe
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // LINKEDIN
    if (postUrl.includes('linkedin.com')) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
                <div style={{
                    background: '#FFF',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    maxWidth: '550px',
                    width: '100%'
                }}>
                    <iframe src={postUrl} height="600" width="100%" frameBorder="0" allowFullScreen title="LinkedIn Post"></iframe>
                </div>
            </div>
        );
    }

    // FALLBACK LINK CARD
    return (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
            <a href={postUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'block',
                padding: '30px',
                background: '#f8f9fa',
                borderRadius: '12px',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#333',
                maxWidth: '600px',
                width: '100%',
                border: '1px solid #e2e8f0'
            }}>
                <h3 style={{ marginBottom: '10px' }}>Voir le post complet</h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>{postUrl}</p>
                <span style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    background: '#0070f3',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 500
                }}>
                    Ouvrir le lien →
                </span>
            </a>
        </div>
    );
}
