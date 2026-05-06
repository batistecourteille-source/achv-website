'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArticleShare from '@/components/ArticleShare';
import { useParams, useRouter } from 'next/navigation';

function readingTime(html: string) {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(' ').length : 0;
    const minutes = Math.max(1, Math.round(words / 200));
    return minutes;
}

export default function ArticleDetail() {
    const { articles } = useData();
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const article = articles.find(a => a.id === id);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Sort published articles by date desc, find current index for prev/next
    const publishedSorted = useMemo(() => {
        return articles
            .filter(a => a.published)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [articles]);

    const currentIndex = publishedSorted.findIndex(a => a.id === id);
    const prevArticle = currentIndex >= 0 ? publishedSorted[currentIndex + 1] : null;
    const nextArticle = currentIndex > 0 ? publishedSorted[currentIndex - 1] : null;

    // Related articles: same category or shared tags, excluding self
    const relatedArticles = useMemo(() => {
        if (!article) return [];
        const myTags = new Set(article.tags || []);
        return publishedSorted
            .filter(a => a.id !== article.id)
            .map(a => {
                const sharedTags = (a.tags || []).filter(t => myTags.has(t)).length;
                const sameCategory = a.category === article.category ? 1 : 0;
                return { article: a, score: sharedTags * 2 + sameCategory };
            })
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(x => x.article);
    }, [article, publishedSorted]);

    if (!article) {
        return (
            <>
                <Header />
                <div className="page-hero">
                    <div className="page-hero-content">
                        <h1>Article introuvable</h1>
                        <p>Cet article n&apos;existe pas ou a été supprimé.</p>
                        <button onClick={() => router.back()} className="btn btn-primary" style={{ marginTop: 20 }}>
                            Retour aux actualités
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const galleryImages = article.images || [];
    const minutes = readingTime(article.content || '');

    return (
        <>
            <Header />
            <div className="page-hero">
                <div className="page-hero-content">
                    <div className="article-meta-hero">
                        <span>📅 {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>⏱️ {minutes} min de lecture</span>
                        {article.author && <span>✍️ {article.author}</span>}
                    </div>
                    <h1>{article.title}</h1>
                    <div className="article-tags-hero">
                        <div className="tab active" style={{ display: 'inline-block' }}>{article.category}</div>
                        {(article.tags || []).slice(0, 3).map(tag => (
                            <span key={tag} className="article-hero-tag">#{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="custom-page-content article-content-wrap">
                        {/* Breadcrumb */}
                        <nav className="article-breadcrumb" aria-label="Fil d'Ariane">
                            <Link href="/">Accueil</Link>
                            <span>›</span>
                            <Link href="/actualites">Actualités</Link>
                            <span>›</span>
                            <span className="current">{article.title}</span>
                        </nav>

                        {article.image && (
                            <img
                                src={article.image}
                                alt={article.title}
                                className="article-hero-img"
                            />
                        )}

                        {article.excerpt && (
                            <p className="article-excerpt">{article.excerpt}</p>
                        )}

                        <div
                            className="article-body"
                            dangerouslySetInnerHTML={{ __html: (article.content || '').replace(/\n/g, '<br/>') }}
                        />

                        {/* Tags complets */}
                        {(article.tags || []).length > 0 && (
                            <div className="article-tags-list">
                                {(article.tags || []).map(tag => (
                                    <Link key={tag} href={`/actualites?tag=${encodeURIComponent(tag)}`} className="article-tag">
                                        #{tag}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Share buttons */}
                        <ArticleShare title={article.title} url={`/actualites/${article.id}`} />

                        {/* Galerie photos */}
                        {galleryImages.length > 0 && (
                            <div style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid #e5e7eb' }}>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span>📸</span> Galerie photos ({galleryImages.length})
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 100%), 1fr))',
                                    gap: 12,
                                }}>
                                    {galleryImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setLightboxIndex(idx)}
                                            style={{
                                                cursor: 'pointer',
                                                borderRadius: 12,
                                                overflow: 'hidden',
                                                aspectRatio: '4/3',
                                                position: 'relative',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                            }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 25px rgba(0,0,0,0.18)'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                                        >
                                            <img src={img} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Prev / Next navigation */}
                        {(prevArticle || nextArticle) && (
                            <div className="article-nav">
                                {prevArticle ? (
                                    <Link href={`/actualites/${prevArticle.id}`} className="article-nav-card prev">
                                        <span className="article-nav-label">← Article précédent</span>
                                        <span className="article-nav-title">{prevArticle.title}</span>
                                    </Link>
                                ) : <div />}
                                {nextArticle ? (
                                    <Link href={`/actualites/${nextArticle.id}`} className="article-nav-card next">
                                        <span className="article-nav-label">Article suivant →</span>
                                        <span className="article-nav-title">{nextArticle.title}</span>
                                    </Link>
                                ) : <div />}
                            </div>
                        )}

                        {/* Related articles */}
                        {relatedArticles.length > 0 && (
                            <div className="article-related">
                                <h3>Articles similaires</h3>
                                <div className="article-related-grid">
                                    {relatedArticles.map(a => (
                                        <Link key={a.id} href={`/actualites/${a.id}`} className="related-card">
                                            {a.image ? (
                                                <div className="related-img-wrap">
                                                    <img src={a.image} alt={a.title} />
                                                </div>
                                            ) : (
                                                <div className="related-img-wrap related-no-img">🏃</div>
                                            )}
                                            <div className="related-body">
                                                <span className="related-cat">{a.category}</span>
                                                <h4>{a.title}</h4>
                                                <span className="related-date">
                                                    {new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
                            <Link href="/actualites" className="btn btn-outline">
                                ← Retour aux actualités
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Lightbox / Modal */}
            {lightboxIndex !== null && galleryImages.length > 0 && (
                <div
                    onClick={() => setLightboxIndex(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.9)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 'clamp(8px, 2vw, 20px)'
                    }}
                >
                    <button
                        onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length); }}
                        style={{
                            position: 'absolute', left: 'clamp(8px, 2vw, 20px)', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                            fontSize: 'clamp(1.2rem, 3vw, 2rem)', width: 'clamp(36px, 6vw, 50px)', height: 'clamp(36px, 6vw, 50px)', borderRadius: '50%', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(4px)'
                        }}
                    >‹</button>

                    <img
                        src={galleryImages[lightboxIndex]}
                        alt={`Photo ${lightboxIndex + 1}`}
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }}
                    />

                    <button
                        onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % galleryImages.length); }}
                        style={{
                            position: 'absolute', right: 'clamp(8px, 2vw, 20px)', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                            fontSize: 'clamp(1.2rem, 3vw, 2rem)', width: 'clamp(36px, 6vw, 50px)', height: 'clamp(36px, 6vw, 50px)', borderRadius: '50%', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(4px)'
                        }}
                    >›</button>

                    <button
                        onClick={() => setLightboxIndex(null)}
                        style={{
                            position: 'absolute', top: 20, right: 20,
                            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                            fontSize: '1.5rem', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(4px)'
                        }}
                    >✕</button>

                    <div style={{ position: 'absolute', bottom: 20, color: 'white', fontSize: '0.95rem', opacity: 0.7 }}>
                        {lightboxIndex + 1} / {galleryImages.length}
                    </div>
                </div>
            )}

            <Footer />

            <style jsx global>{`
                .article-meta-hero {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    color: rgba(255,255,255,0.85);
                    font-size: 0.9rem;
                    margin-bottom: 18px;
                }
                .article-tags-hero {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 16px;
                    align-items: center;
                }
                .article-hero-tag {
                    background: rgba(255,255,255,0.18);
                    color: white;
                    border-radius: 20px;
                    padding: 4px 12px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .article-content-wrap { max-width: 800px; margin: 0 auto; }

                .article-breadcrumb {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-bottom: 24px;
                }
                .article-breadcrumb a {
                    color: #64748b;
                    text-decoration: none;
                }
                .article-breadcrumb a:hover { color: var(--primary); text-decoration: underline; }
                .article-breadcrumb .current {
                    color: #1e293b;
                    font-weight: 500;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 50ch;
                }

                .article-hero-img {
                    width: 100%;
                    max-height: min(500px, 60vw);
                    object-fit: cover;
                    border-radius: 16px;
                    margin-bottom: 32px;
                    display: block;
                }
                .article-excerpt {
                    font-size: clamp(1.05rem, 2.4vw, 1.25rem);
                    line-height: 1.6;
                    color: #475569;
                    font-style: italic;
                    border-left: 4px solid var(--primary);
                    padding: 4px 0 4px 18px;
                    margin: 0 0 28px;
                }
                .article-body {
                    font-size: clamp(1rem, 2.2vw, 1.15rem);
                    line-height: 1.8;
                    color: #374151;
                }
                .article-body img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 12px;
                    margin: 24px 0;
                }
                .article-body a {
                    color: var(--primary);
                    text-decoration: underline;
                }

                .article-tags-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #e5e7eb;
                }
                .article-tag {
                    background: #eff6ff;
                    color: #1d4ed8;
                    border-radius: 20px;
                    padding: 4px 12px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    text-decoration: none;
                    transition: background 0.15s;
                }
                .article-tag:hover { background: #dbeafe; }

                .article-nav {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin: 50px 0 30px;
                }
                .article-nav-card {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 18px 20px;
                    background: #f8fafc;
                    border-radius: 12px;
                    text-decoration: none;
                    color: inherit;
                    transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
                    border: 1px solid #e2e8f0;
                }
                .article-nav-card:hover {
                    background: white;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
                }
                .article-nav-card.next { text-align: right; }
                .article-nav-label {
                    font-size: 0.78rem;
                    color: var(--primary);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .article-nav-title {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 0.95rem;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .article-related {
                    margin-top: 50px;
                    padding-top: 40px;
                    border-top: 1px solid #e5e7eb;
                }
                .article-related h3 {
                    font-size: 1.5rem;
                    margin-bottom: 24px;
                    color: var(--dark);
                }
                .article-related-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 20px;
                }
                .related-card {
                    text-decoration: none;
                    color: inherit;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    overflow: hidden;
                    transition: transform 0.2s, box-shadow 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .related-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                .related-img-wrap {
                    height: 140px;
                    overflow: hidden;
                    background: #f3f4f6;
                }
                .related-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
                .related-no-img {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                }
                .related-body { padding: 14px; }
                .related-cat {
                    font-size: 0.7rem;
                    color: var(--primary);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .related-body h4 {
                    font-size: 0.95rem;
                    color: #0f172a;
                    margin: 6px 0;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .related-date { font-size: 0.78rem; color: #6b7280; }

                @media (max-width: 600px) {
                    .article-nav { grid-template-columns: 1fr; }
                    .article-nav-card.next { text-align: left; }
                    .article-meta-hero { gap: 10px; font-size: 0.85rem; }
                }
            `}</style>
        </>
    );
}
