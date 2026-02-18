'use client';
import React, { useState } from 'react';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useParams, useRouter } from 'next/navigation';

export default function ArticleDetail() {
    const { articles } = useData();
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const article = articles.find(a => a.id === id);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

    return (
        <>
            <Header />
            <div className="page-hero">
                <div className="page-hero-content">
                    <div className="news-card-date" style={{ color: 'white', opacity: 0.9, marginBottom: 12 }}>
                        {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <h1>{article.title}</h1>
                    <div className="tab active" style={{ display: 'inline-block', marginTop: 16 }}>{article.category}</div>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="custom-page-content">
                        {article.image && (
                            <img
                                src={article.image}
                                alt={article.title}
                                style={{
                                    width: '100%',
                                    maxHeight: 'min(500px, 60vw)',
                                    objectFit: 'cover',
                                    borderRadius: 16,
                                    marginBottom: 40
                                }}
                            />
                        )}
                        <div
                            style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', lineHeight: 1.8, color: '#374151' }}
                            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
                        />

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
                                            <img
                                                src={img}
                                                alt={`Photo ${idx + 1}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid #e5e7eb' }}>
                            <button onClick={() => router.back()} className="btn btn-outline">
                                ← Retour aux actualités
                            </button>
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
                    {/* Bouton précédent */}
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
                        style={{
                            maxWidth: '90vw', maxHeight: '85vh',
                            objectFit: 'contain', borderRadius: 8,
                        }}
                    />

                    {/* Bouton suivant */}
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

                    {/* Bouton fermer */}
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

                    {/* Compteur */}
                    <div style={{
                        position: 'absolute', bottom: 20,
                        color: 'white', fontSize: '0.95rem', opacity: 0.7
                    }}>
                        {lightboxIndex + 1} / {galleryImages.length}
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}
