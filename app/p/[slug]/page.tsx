'use client';
import React from 'react';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useParams } from 'next/navigation';

export default function CustomPageView() {
    const { customPages } = useData();
    const params = useParams();
    const slug = params?.slug as string;
    const page = customPages.find(p => p.slug === slug && p.published);

    if (!page) {
        return (
            <>
                <Header />
                <div className="page-hero">
                    <div className="page-hero-content">
                        <h1>Page introuvable</h1>
                        <p>Cette page n&apos;existe pas ou a été supprimée.</p>
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
                    <h1>{page.title}</h1>
                </div>
            </div>
            <section className="section">
                <div className="container">
                    <div className="custom-page-content">
                        {page.image && <img src={page.image} alt={page.title} />}
                        <div dangerouslySetInnerHTML={{ __html: page.content.replace(/\n/g, '<br/>') }} />
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}
