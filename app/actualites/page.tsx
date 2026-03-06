'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Suspense } from 'react';
import SocialPostEmbed from '@/components/SocialPostEmbed';
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
    const sortedSocialPosts = [...socialPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const facebookPosts = sortedSocialPosts.filter(p => p.platform === 'facebook');
    const instagramPosts = sortedSocialPosts.filter(p => p.platform === 'instagram');
    const linkedinPosts = sortedSocialPosts.filter(p => p.platform === 'linkedin');
    const youtubePosts = sortedSocialPosts.filter(p => p.platform === 'youtube');

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
                        {posts.map(post => {
                            if (post.platform === 'instagram' && post.postUrl) {
                                return (
                                    <div key={post.id} className="social-card" style={{ padding: 0, overflow: 'hidden', background: '#FFF' }}>
                                        <SocialPostEmbed url={post.postUrl} slim={true} />
                                    </div>
                                );
                            }

                            return (
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
                            );
                        })}
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
                            {/* NOUVEAU LAYOUT TYPE JOURNAL : Editorial Style */}
                            <div className="editorial-layout" style={{ display: 'grid', gap: '48px', marginBottom: '60px' }}>

                                {/* 1. SECTION À LA UNE */}
                                {filteredArticles.filter(a => a.isFeatured).length > 0 && (
                                    <div className="editorial-featured-section">
                                        <h2 style={{ fontSize: '1.5rem', borderBottom: '4px solid var(--dark)', paddingBottom: '8px', marginBottom: '24px', fontFamily: '"Georgia", serif', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            À la une
                                        </h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                                            {filteredArticles.filter(a => a.isFeatured).map(article => (
                                                <Link key={article.id} href={`/actualites/${article.id}`} style={{ textDecoration: 'none', display: 'block', group: 'hover' }}>
                                                    {article.image && (
                                                        <div style={{ overflow: 'hidden', borderRadius: '2px', marginBottom: '16px' }}>
                                                            <img src={article.image} alt={article.title} style={{ width: '100%', height: '350px', objectFit: 'cover', transition: 'transform 0.5s ease', transform: 'scale(1)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '8px', letterSpacing: '0.5px' }}>{article.city || 'Club'} <span style={{ color: '#ccc' }}>•</span> {article.category}</div>
                                                        <h3 style={{ fontSize: '2.2rem', fontFamily: '"Georgia", serif', lineHeight: '1.2', marginBottom: '12px', color: 'var(--dark)' }}>{article.title}</h3>
                                                        <p style={{ fontSize: '1.1rem', color: '#4b5563', lineHeight: '1.6', marginBottom: '16px', fontFamily: '"Georgia", serif' }}>{article.excerpt}</p>
                                                        <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Par {article.author || 'La Rédaction'} — {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2. FIL D'ACTUALITÉS */}
                                <div className="editorial-feed-section">
                                    <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '24px', fontFamily: '"Georgia", serif', textTransform: 'uppercase', letterSpacing: '1px', color: '#374151' }}>
                                        Dernières publications
                                    </h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px', borderTop: filteredArticles.filter(a => a.isFeatured).length > 0 ? 'none' : '4px solid var(--dark)', paddingTop: filteredArticles.filter(a => a.isFeatured).length > 0 ? '0' : '8px' }}>
                                        {filteredArticles.filter(a => !a.isFeatured).map(article => (
                                            <Link key={article.id} href={`/actualites/${article.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                {article.image ? (
                                                    <div style={{ overflow: 'hidden', borderRadius: '2px', marginBottom: '12px' }}>
                                                        <img src={article.image} alt={article.title} style={{ width: '100%', height: '180px', objectFit: 'cover', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                                                    </div>
                                                ) : (
                                                    <div className="image-placeholder" style={{ height: '180px', borderRadius: '2px', marginBottom: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏃</div>
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>{article.category}</div>
                                                    <h3 style={{ fontSize: '1.25rem', fontFamily: '"Georgia", serif', lineHeight: '1.3', color: 'var(--dark)', marginBottom: '8px' }}>{article.title}</h3>
                                                    <p style={{ fontSize: '0.95rem', color: '#6b7280', lineHeight: '1.5', fontFamily: '"Georgia", serif' }}>
                                                        {article.excerpt.length > 100 ? article.excerpt.substring(0, 100) + '...' : article.excerpt}
                                                    </p>
                                                </div>
                                                <div style={{ marginTop: '16px', color: '#9ca3af', fontSize: '0.8rem', borderTop: '1px solid #f3f4f6', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                                    <span style={{ fontStyle: 'italic' }}>Par {article.author || 'La Rédaction'}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
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
