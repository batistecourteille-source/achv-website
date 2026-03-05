'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { Suspense } from 'react';

function ActualitesContent() {
    const { articles, socialPosts, settings } = useData();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState<'blog' | 'social'>(tabParam === 'social' ? 'social' : 'blog');

    useEffect(() => {
        if (tabParam === 'social') setActiveTab('social');
        else if (tabParam === 'blog') setActiveTab('blog');
    }, [tabParam]);

    // BLOG LOGIC
    const published = articles.filter(a => a.published);
    const categories = ['Toutes', ...Array.from(new Set(published.map(a => a.category).filter(Boolean).map(c => c || 'Uncategorized')))]; // Safety check
    const [activeCategory, setActiveCategory] = useState('Toutes');
    const [activeCity, setActiveCity] = useState('Toutes');

    const filteredArticles = published.filter(a => {
        const catMatch = activeCategory === 'Toutes' || a.category === activeCategory;
        const articleCity = a.city || 'Les deux';
        const cityMatch = activeCity === 'Toutes' || articleCity === 'Les deux' || (activeCity === 'Noyal' && articleCity === 'Noyal') || (activeCity === 'Nouvoitou' && articleCity === 'Nouvoitou');
        return catMatch && cityMatch;
    });

    // SOCIAL LOGIC
    const facebookPosts = socialPosts.filter(p => p.platform === 'facebook');
    const instagramPosts = socialPosts.filter(p => p.platform === 'instagram');
    const linkedinPosts = socialPosts.filter(p => p.platform === 'linkedin');
    const youtubePosts = socialPosts.filter(p => p.platform === 'youtube');

    const platformGradients: Record<string, string> = {
        instagram: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
        facebook: 'linear-gradient(135deg, #1877f2 0%, #0d47a1 100%)',
        linkedin: 'linear-gradient(135deg, #0077b5 0%, #004471 100%)',
        youtube: 'linear-gradient(135deg, #ff0000 0%, #8b0000 100%)',
    };
    const platformEmojis: Record<string, string> = {
        instagram: '📸',
        facebook: '📘',
        linkedin: '💼',
        youtube: '🎥',
    };

    const renderSocialSection = (title: string, posts: typeof socialPosts, icon: string) => {
        if (posts.length === 0) return null;
        return (
            <div style={{ marginBottom: 48 }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.8rem' }}>{icon}</span> {title}
                </h3>
                <div className="social-feed-container">
                    <div className="social-feed-track">
                        {posts.map(post => (
                            <a key={post.id} href={post.postUrl || '#'} target="_blank" rel="noopener" className="social-card">
                                <div className="social-card-header">
                                    <span className={`social-icon ${post.platform}`}>
                                        {post.platform === 'facebook' && '📘'}
                                        {post.platform === 'instagram' && '📸'}
                                        {post.platform === 'linkedin' && '💼'}
                                        {post.platform === 'youtube' && '🎥'}
                                    </span>
                                    <span className="social-date">{post.date}</span>
                                </div>
                                {post.imageUrl ? (
                                    <div className="social-card-image" style={{ position: 'relative', overflow: 'hidden' }}>
                                        <img
                                            src={post.imageUrl}
                                            alt={post.content?.slice(0, 50) || 'Post'}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            onError={(e) => {
                                                // Si l'image ne charge pas, on remplace par un placeholder stylé
                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                if (parent) {
                                                    parent.style.background = platformGradients[post.platform] || '#e2e8f0';
                                                    parent.style.display = 'flex';
                                                    parent.style.alignItems = 'center';
                                                    parent.style.justifyContent = 'center';
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    const emoji = document.createElement('span');
                                                    emoji.textContent = platformEmojis[post.platform] || '📷';
                                                    emoji.style.fontSize = '3rem';
                                                    emoji.style.opacity = '0.8';
                                                    parent.appendChild(emoji);
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="social-card-image" style={{
                                        background: platformGradients[post.platform] || '#e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <span style={{ fontSize: '3rem', opacity: 0.8 }}>
                                            {platformEmojis[post.platform] || '📷'}
                                        </span>
                                    </div>
                                )}
                                <div className="social-card-content">
                                    <p>{post.content}</p>
                                </div>
                                <div className="social-card-footer">
                                    Voir sur {post.platform} →
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Header />
            <div className="page-hero">
                <div className="page-hero-content">
                    <h1>{settings.actualitesPage.heroTitle}</h1>
                    <p>{settings.actualitesPage.heroSubtitle}</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    {/* MAIN TABS */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 48 }}>
                        <button
                            className={`tab ${activeTab === 'blog' ? 'active' : ''}`}
                            onClick={() => setActiveTab('blog')}
                            style={{ fontSize: '1.1rem', padding: '12px 32px' }}
                        >
                            📝 Blog / Articles
                        </button>
                        {(settings.socialVisibility?.facebook || settings.socialVisibility?.instagram || settings.socialVisibility?.linkedin || settings.socialVisibility?.youtube || settings.socialVisibility?.tiktok) && (
                            <button
                                className={`tab ${activeTab === 'social' ? 'active' : ''}`}
                                onClick={() => setActiveTab('social')}
                                style={{ fontSize: '1.1rem', padding: '12px 32px' }}
                            >
                                📱 Réseaux Sociaux (Direct)
                            </button>
                        )}
                    </div>

                    {activeTab === 'blog' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
                                {[
                                    { id: 'Toutes', label: 'Toutes les villes' },
                                    { id: 'Noyal', label: 'Noyal-sur-Vilaine' },
                                    { id: 'Nouvoitou', label: 'Nouvoitou' }
                                ].map(city => (
                                    <button
                                        key={city.id}
                                        onClick={() => setActiveCity(city.id)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            background: activeCity === city.id ? 'var(--primary)' : '#e5e7eb',
                                            color: activeCity === city.id ? 'white' : '#374151',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {city.label}
                                    </button>
                                ))}
                            </div>
                            <div className="tabs">
                                {categories.map(cat => (
                                    <button key={cat} className={`tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
                                ))}
                            </div>
                            <div className="news-grid">
                                {filteredArticles.map(article => (
                                    <Link key={article.id} href={`/actualites/${article.id}`} className="news-card">
                                        {article.image ? (
                                            <img src={article.image} alt={article.title} className="news-card-image" />
                                        ) : (
                                            <div className="image-placeholder">🏃</div>
                                        )}
                                        <div className="news-card-content">
                                            <div className="news-card-date">{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                            <h3>{article.title}</h3>
                                            <p>{article.excerpt}</p>
                                            <span className="news-card-link">Lire la suite →</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            {filteredArticles.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--medium-gray)' }}>
                                    <p style={{ fontSize: '1.1rem' }}>Aucun article dans cette catégorie pour le moment.</p>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'social' && (
                        <div>
                            {settings.socialVisibility?.facebook && renderSocialSection('Facebook', facebookPosts, '📘')}
                            {settings.socialVisibility?.instagram && renderSocialSection('Instagram', instagramPosts, '📸')}
                            {settings.socialVisibility?.linkedin && renderSocialSection('LinkedIn', linkedinPosts, '💼')}
                            {settings.socialVisibility?.youtube && renderSocialSection('YouTube', youtubePosts, '🎥')}

                            {socialPosts.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--medium-gray)' }}>
                                    <p>Aucun post social pour le moment.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
            <Footer />
        </>
    );
}

export default function ActualitesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ActualitesContent />
        </Suspense>
    );
}
