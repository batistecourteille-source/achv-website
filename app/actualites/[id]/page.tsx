'use client';
import React from 'react';
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
                                    maxHeight: 500,
                                    objectFit: 'cover',
                                    borderRadius: 16,
                                    marginBottom: 40
                                }}
                            />
                        )}
                        <div
                            style={{ fontSize: '1.2rem', lineHeight: 1.8, color: '#374151' }}
                            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
                        />

                        <div style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid #e5e7eb' }}>
                            <button onClick={() => router.back()} className="btn btn-outline">
                                ← Retour aux actualités
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}
