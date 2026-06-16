'use client';
import React from 'react';
import { useBookmarks } from '@/lib/useBookmarks';

interface Props {
    articleId: string;
    variant?: 'icon' | 'text';
}

export default function BookmarkButton({ articleId, variant = 'icon' }: Props) {
    const { has, toggle } = useBookmarks();
    const saved = has(articleId);

    if (variant === 'text') {
        return (
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(articleId); }}
                className={`bookmark-btn-text ${saved ? 'saved' : ''}`}
                aria-pressed={saved}
                title={saved ? 'Retirer des favoris' : 'Enregistrer'}
            >
                {saved ? '🔖 Enregistré' : '🔖 Enregistrer'}
                <style jsx>{`
                    .bookmark-btn-text {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 8px 16px;
                        border-radius: 50px;
                        border: 1.5px solid #e2e8f0;
                        background: white;
                        cursor: pointer;
                        font-size: 0.85rem;
                        font-weight: 500;
                        color: #475569;
                        transition: all 0.15s;
                        font-family: inherit;
                    }
                    .bookmark-btn-text:hover { border-color: var(--primary); color: var(--primary); }
                    .bookmark-btn-text.saved { background: #fef3c7; border-color: #f59e0b; color: #92400e; }
                `}</style>
            </button>
        );
    }

    return (
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(articleId); }}
            className={`bookmark-btn-icon ${saved ? 'saved' : ''}`}
            aria-pressed={saved}
            aria-label={saved ? 'Retirer des favoris' : 'Enregistrer'}
            title={saved ? 'Retirer des favoris' : 'Enregistrer'}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            <style jsx>{`
                .bookmark-btn-icon {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    border: 1.5px solid #e2e8f0;
                    background: rgba(255,255,255,0.95);
                    cursor: pointer;
                    color: #64748b;
                    transition: all 0.15s;
                    backdrop-filter: blur(4px);
                    flex-shrink: 0;
                }
                .bookmark-btn-icon:hover { border-color: #f59e0b; color: #f59e0b; transform: scale(1.05); }
                .bookmark-btn-icon.saved { color: #f59e0b; border-color: #f59e0b; background: #fef3c7; }
            `}</style>
        </button>
    );
}
