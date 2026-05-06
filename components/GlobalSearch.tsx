'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/DataContext';

type SearchResult = {
    id: string;
    type: 'article' | 'event' | 'page' | 'result' | 'partner' | 'activity';
    title: string;
    subtitle?: string;
    url: string;
    icon: string;
};

export default function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { articles, events, customPages, results, partners, activities } = useData();

    // Open with Cmd+K / Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen(o => !o);
            } else if (e.key === 'Escape' && open) {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open]);

    // Focus input when open
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setActiveIndex(0);
        } else {
            setQuery('');
        }
    }, [open]);

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            const original = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = original; };
        }
    }, [open]);

    const matches = useMemo<SearchResult[]>(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        const results_: SearchResult[] = [];

        // Articles
        (articles || []).filter(a => a.published).forEach(a => {
            const hay = `${a.title} ${a.excerpt || ''} ${(a.tags || []).join(' ')} ${a.category || ''} ${a.author || ''}`.toLowerCase();
            if (hay.includes(q)) {
                results_.push({
                    id: `article-${a.id}`,
                    type: 'article',
                    title: a.title,
                    subtitle: a.excerpt?.slice(0, 80),
                    url: `/actualites/${a.id}`,
                    icon: '📝',
                });
            }
        });

        // Events
        (events || []).forEach(ev => {
            const hay = `${ev.title} ${ev.location || ''} ${ev.description || ''}`.toLowerCase();
            if (hay.includes(q)) {
                results_.push({
                    id: `event-${ev.id}`,
                    type: 'event',
                    title: ev.title,
                    subtitle: `${ev.location || ''} — ${new Date(ev.date).toLocaleDateString('fr-FR')}`,
                    url: '/agenda',
                    icon: '📅',
                });
            }
        });

        // Custom pages
        (customPages || []).filter(p => p.published).forEach(p => {
            const hay = `${p.title} ${p.content || ''}`.toLowerCase();
            if (hay.includes(q)) {
                results_.push({
                    id: `page-${p.id}`,
                    type: 'page',
                    title: p.title,
                    url: `/p/${p.slug}`,
                    icon: '📄',
                });
            }
        });

        // Results
        (results || []).forEach(r => {
            const athletesStr = (r.athletes || []).map((a: any) => a.name).join(' ');
            const hay = `${r.competition} ${r.location} ${r.discipline} ${athletesStr}`.toLowerCase();
            if (hay.includes(q)) {
                results_.push({
                    id: `result-${r.id}`,
                    type: 'result',
                    title: r.competition,
                    subtitle: `${r.location} — ${r.discipline}`,
                    url: '/resultats',
                    icon: '🏆',
                });
            }
        });

        // Partners
        (partners || []).forEach(p => {
            if (p.name.toLowerCase().includes(q)) {
                results_.push({
                    id: `partner-${p.id}`,
                    type: 'partner',
                    title: p.name,
                    subtitle: 'Partenaire',
                    url: '/partenaires',
                    icon: '🤝',
                });
            }
        });

        // Activities
        (activities || []).forEach(act => {
            const hay = `${act.name} ${act.description || ''}`.toLowerCase();
            if (hay.includes(q)) {
                results_.push({
                    id: `activity-${act.id}`,
                    type: 'activity',
                    title: act.name,
                    subtitle: 'Activité',
                    url: '/activites',
                    icon: '🏃',
                });
            }
        });

        return results_.slice(0, 20);
    }, [query, articles, events, customPages, results, partners, activities]);

    // Clamp activeIndex
    useEffect(() => {
        if (activeIndex >= matches.length) setActiveIndex(0);
    }, [matches.length, activeIndex]);

    const goTo = (url: string) => {
        setOpen(false);
        router.push(url);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, matches.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && matches[activeIndex]) {
            e.preventDefault();
            goTo(matches[activeIndex].url);
        }
    };

    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(true)}
                aria-label="Rechercher"
                className="global-search-trigger"
                title="Rechercher (Ctrl+K)"
            >
                <span className="gs-icon">🔍</span>
                <span className="gs-label">Rechercher…</span>
                <span className="gs-kbd">{isMac ? '⌘' : 'Ctrl'} K</span>
            </button>

            {/* Modal overlay */}
            {open && (
                <div className="gs-overlay" onClick={() => setOpen(false)}>
                    <div className="gs-modal" onClick={e => e.stopPropagation()}>
                        <div className="gs-input-wrap">
                            <span style={{ fontSize: '1.1rem' }}>🔍</span>
                            <input
                                ref={inputRef}
                                type="search"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Rechercher articles, événements, résultats, pages…"
                            />
                            <button onClick={() => setOpen(false)} className="gs-close" aria-label="Fermer">✕</button>
                        </div>

                        <div className="gs-results">
                            {!query.trim() && (
                                <div className="gs-empty">
                                    <p style={{ marginBottom: 16 }}>Suggestions</p>
                                    <div className="gs-suggestions">
                                        <Link href="/actualites" onClick={() => setOpen(false)}>📝 Articles récents</Link>
                                        <Link href="/agenda" onClick={() => setOpen(false)}>📅 Agenda</Link>
                                        <Link href="/resultats" onClick={() => setOpen(false)}>🏆 Résultats</Link>
                                        <Link href="/rejoindre" onClick={() => setOpen(false)}>🏃 Rejoindre le club</Link>
                                    </div>
                                </div>
                            )}

                            {query.trim() && matches.length === 0 && (
                                <div className="gs-empty">
                                    <p>Aucun résultat pour <strong>« {query} »</strong></p>
                                </div>
                            )}

                            {matches.map((m, i) => (
                                <button
                                    key={m.id}
                                    className={`gs-result ${i === activeIndex ? 'active' : ''}`}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    onClick={() => goTo(m.url)}
                                >
                                    <span className="gs-result-icon">{m.icon}</span>
                                    <div className="gs-result-text">
                                        <div className="gs-result-title">{m.title}</div>
                                        {m.subtitle && <div className="gs-result-sub">{m.subtitle}</div>}
                                    </div>
                                    <span className="gs-result-type">{m.type}</span>
                                </button>
                            ))}
                        </div>

                        <div className="gs-footer">
                            <span><kbd>↑↓</kbd> naviguer</span>
                            <span><kbd>↵</kbd> ouvrir</span>
                            <span><kbd>esc</kbd> fermer</span>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .global-search-trigger {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: rgba(255,255,255,0.85);
                    padding: 7px 12px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .global-search-trigger:hover {
                    background: rgba(255,255,255,0.16);
                    border-color: rgba(255,255,255,0.3);
                }
                .gs-icon { font-size: 0.95rem; }
                .gs-label {
                    color: rgba(255,255,255,0.7);
                    margin-right: 4px;
                }
                .gs-kbd {
                    background: rgba(0,0,0,0.25);
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                @media (max-width: 1024px) {
                    .global-search-trigger {
                        padding: 8px 10px;
                        border-radius: 8px;
                        gap: 6px;
                    }
                    .gs-kbd { display: none; }
                }
                @media (max-width: 700px) {
                    .global-search-trigger {
                        padding: 8px;
                        border-radius: 50%;
                        gap: 0;
                    }
                    .gs-label { display: none; }
                }

                .gs-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.65);
                    backdrop-filter: blur(4px);
                    z-index: 9999;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding: clamp(20px, 8vh, 80px) 16px 16px;
                    animation: gsFade 0.15s ease-out;
                }
                @keyframes gsFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .gs-modal {
                    width: 100%;
                    max-width: 640px;
                    background: white;
                    border-radius: 14px;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    max-height: calc(100vh - 100px);
                }
                .gs-input-wrap {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 18px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .gs-input-wrap input {
                    flex: 1;
                    border: none;
                    outline: none;
                    font-size: 1.05rem;
                    background: transparent;
                    color: #1e293b;
                    font-family: inherit;
                }
                .gs-close {
                    background: #f1f5f9;
                    border: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    color: #64748b;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .gs-close:hover { background: #e2e8f0; }

                .gs-results {
                    overflow-y: auto;
                    padding: 8px;
                    flex: 1;
                    min-height: 100px;
                }
                .gs-result {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    text-align: left;
                    color: inherit;
                    transition: background 0.1s;
                }
                .gs-result.active { background: #eff6ff; }
                .gs-result-icon {
                    font-size: 1.3rem;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f1f5f9;
                    border-radius: 8px;
                    flex-shrink: 0;
                }
                .gs-result-text {
                    flex: 1;
                    min-width: 0;
                }
                .gs-result-title {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 0.95rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .gs-result-sub {
                    font-size: 0.8rem;
                    color: #64748b;
                    margin-top: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .gs-result-type {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: #94a3b8;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    flex-shrink: 0;
                }

                .gs-empty {
                    padding: 28px 16px;
                    color: #64748b;
                    text-align: center;
                    font-size: 0.95rem;
                }
                .gs-suggestions {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .gs-suggestions :global(a) {
                    text-align: left;
                    padding: 10px 14px;
                    border-radius: 8px;
                    color: #1e293b;
                    text-decoration: none;
                    font-size: 0.95rem;
                    transition: background 0.1s;
                }
                .gs-suggestions :global(a:hover) { background: #f1f5f9; }

                .gs-footer {
                    display: flex;
                    gap: 18px;
                    padding: 10px 18px;
                    border-top: 1px solid #f1f5f9;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    background: #fafbfc;
                }
                .gs-footer kbd {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    padding: 1px 6px;
                    font-family: inherit;
                    font-size: 0.7rem;
                    margin-right: 4px;
                }

                @media (max-width: 600px) {
                    .gs-overlay { padding: 16px 12px; }
                    .gs-result-type { display: none; }
                    .gs-footer { display: none; }
                }
            `}</style>
        </>
    );
}
