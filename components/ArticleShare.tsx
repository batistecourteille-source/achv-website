'use client';
import React, { useState } from 'react';

interface Props {
    title: string;
    url: string;
}

export default function ArticleShare({ title, url }: Props) {
    const [copied, setCopied] = useState(false);
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedTitle = encodeURIComponent(title);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    const tryNativeShare = async () => {
        if (typeof navigator !== 'undefined' && (navigator as any).share) {
            try {
                await (navigator as any).share({ title, url: fullUrl });
            } catch {}
        }
    };

    const hasNativeShare = typeof navigator !== 'undefined' && !!(navigator as any).share;

    return (
        <div className="article-share">
            <span className="article-share-label">Partager :</span>
            <div className="article-share-buttons">
                <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn share-fb"
                    title="Partager sur Facebook"
                    aria-label="Partager sur Facebook"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a
                    href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn share-twitter"
                    title="Partager sur X (Twitter)"
                    aria-label="Partager sur X"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a
                    href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn share-wa"
                    title="Partager sur WhatsApp"
                    aria-label="Partager sur WhatsApp"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
                </a>
                <a
                    href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
                    className="share-btn share-mail"
                    title="Partager par email"
                    aria-label="Partager par email"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                </a>
                <button onClick={copyLink} className={`share-btn share-copy ${copied ? 'copied' : ''}`} title="Copier le lien" aria-label="Copier le lien">
                    {copied ? '✓' : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    )}
                </button>
                {hasNativeShare && (
                    <button onClick={tryNativeShare} className="share-btn share-native" title="Plus d'options" aria-label="Partager">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    </button>
                )}
            </div>

            <style jsx>{`
                .article-share {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 16px 20px;
                    background: #f8fafc;
                    border-radius: 12px;
                    margin: 32px 0;
                    flex-wrap: wrap;
                }
                .article-share-label {
                    font-weight: 600;
                    color: #475569;
                    font-size: 0.9rem;
                }
                .article-share-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .share-btn {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-decoration: none;
                    transition: transform 0.15s, box-shadow 0.15s;
                    cursor: pointer;
                    border: none;
                    font-size: 1rem;
                    font-weight: 600;
                }
                .share-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .share-fb { background: #1877f2; }
                .share-twitter { background: #000000; }
                .share-wa { background: #25d366; }
                .share-mail { background: #ef4444; }
                .share-copy { background: #64748b; }
                .share-copy.copied { background: #16a34a; }
                .share-native { background: #6366f1; }

                @media (max-width: 480px) {
                    .article-share { gap: 10px; padding: 14px; }
                    .share-btn { width: 36px; height: 36px; }
                }
            `}</style>
        </div>
    );
}
