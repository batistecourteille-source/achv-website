'use client';
import React, { useEffect, useState } from 'react';

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface Props {
    contentSelector: string;
}

export default function TableOfContents({ contentSelector }: Props) {
    const [items, setItems] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const container = document.querySelector(contentSelector);
        if (!container) return;

        const headings = container.querySelectorAll('h2, h3') as NodeListOf<HTMLHeadingElement>;
        const toc: TocItem[] = [];
        headings.forEach((h, idx) => {
            if (!h.id) {
                const slug = (h.textContent || `heading-${idx}`)
                    .toLowerCase()
                    .normalize('NFD').replace(/[̀-ͯ]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '') || `heading-${idx}`;
                h.id = slug;
            }
            toc.push({
                id: h.id,
                text: h.textContent || '',
                level: h.tagName === 'H2' ? 2 : 3,
            });
        });
        setItems(toc);

        // ScrollSpy
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) setActiveId(e.target.id);
                });
            },
            { rootMargin: '-80px 0px -70% 0px' }
        );
        headings.forEach(h => observer.observe(h));
        return () => observer.disconnect();
    }, [contentSelector]);

    const handleClick = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    if (items.length < 2) return null;

    return (
        <aside className="toc-wrap">
            <button className="toc-toggle" onClick={() => setCollapsed(c => !c)} aria-expanded={!collapsed}>
                <span>📑 Sommaire</span>
                <span style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>
            {!collapsed && (
                <nav className="toc-nav" aria-label="Sommaire">
                    {items.map(item => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={e => handleClick(item.id, e)}
                            className={`toc-item ${activeId === item.id ? 'active' : ''} toc-l${item.level}`}
                        >
                            {item.text}
                        </a>
                    ))}
                </nav>
            )}
            <style jsx>{`
                .toc-wrap {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 14px 16px;
                    margin: 24px 0 32px;
                }
                .toc-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: #1e293b;
                    padding: 4px 0;
                    font-family: inherit;
                }
                .toc-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #e2e8f0;
                }
                .toc-item {
                    color: #475569;
                    text-decoration: none;
                    font-size: 0.9rem;
                    padding: 6px 10px;
                    border-radius: 6px;
                    border-left: 2px solid transparent;
                    transition: all 0.15s;
                    line-height: 1.4;
                }
                .toc-item:hover {
                    background: white;
                    color: var(--primary);
                }
                .toc-item.active {
                    color: var(--primary);
                    font-weight: 600;
                    border-left-color: var(--primary);
                    background: white;
                }
                .toc-l3 {
                    padding-left: 22px;
                    font-size: 0.85rem;
                }
                @media (min-width: 1100px) {
                    .toc-wrap {
                        position: sticky;
                        top: 90px;
                    }
                }
            `}</style>
        </aside>
    );
}
