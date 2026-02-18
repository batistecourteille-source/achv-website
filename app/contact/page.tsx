'use client';
import React from 'react';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
    const { settings } = useData();

    return (
        <>
            <Header />
            <div className="page-hero">
                <div className="page-hero-content">
                    <h1>{settings.contactPage.heroTitle}</h1>
                    <p>{settings.contactPage.heroSubtitle}</p>
                </div>
            </div>
            <section className="section">
                <div className="container">
                    <div className="contact-cards" style={{ maxWidth: 900, margin: '0 auto 60px' }}>
                        <div className="contact-card" style={{ background: 'var(--white)', border: '1px solid var(--light-gray)', color: 'var(--dark)' }}>
                            <div className="contact-card-icon">📧</div>
                            <h3 style={{ color: 'var(--dark)' }}>Bureau</h3>
                            <a href={`mailto:${settings.contactEmail}`} style={{ color: 'var(--primary)' }}>{settings.contactEmail}</a>
                        </div>
                        <div className="contact-card" style={{ background: 'var(--white)', border: '1px solid var(--light-gray)', color: 'var(--dark)' }}>
                            <div className="contact-card-icon">📝</div>
                            <h3 style={{ color: 'var(--dark)' }}>Inscriptions</h3>
                            <a href={`mailto:${settings.contactEmailInscription}`} style={{ color: 'var(--primary)' }}>{settings.contactEmailInscription}</a>
                        </div>
                        <div className="contact-card" style={{ background: 'var(--white)', border: '1px solid var(--light-gray)', color: 'var(--dark)' }}>
                            <div className="contact-card-icon">👤</div>
                            <h3 style={{ color: 'var(--dark)' }}>Président</h3>
                            <a href={`mailto:${settings.contactEmailPresident}`} style={{ color: 'var(--primary)' }}>{settings.contactEmailPresident}</a>
                        </div>
                    </div>

                    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={{ marginBottom: 16 }}>{settings.contactPage.addressTitle}</h2>
                        <p style={{ color: 'var(--medium-gray)', fontSize: '1.05rem', marginBottom: 32 }}>{settings.address}</p>

                        <h2 style={{ marginBottom: 16 }}>{settings.contactPage.socialTitle}</h2>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
                            {settings.facebookUrl && (
                                <a href={settings.facebookUrl} target="_blank" rel="noopener" className="btn btn-outline" style={{ color: 'var(--dark)', borderColor: 'var(--light-gray)' }}>
                                    📘 Facebook
                                </a>
                            )}
                            {settings.instagramUrl && (
                                <a href={settings.instagramUrl} target="_blank" rel="noopener" className="btn btn-outline" style={{ color: 'var(--dark)', borderColor: 'var(--light-gray)' }}>
                                    📷 Instagram
                                </a>
                            )}
                            {settings.youtubeUrl && (
                                <a href={settings.youtubeUrl} target="_blank" rel="noopener" className="btn btn-outline" style={{ color: 'var(--dark)', borderColor: 'var(--light-gray)' }}>
                                    🎥 YouTube
                                </a>
                            )}
                            {settings.tiktokUrl && (
                                <a href={settings.tiktokUrl} target="_blank" rel="noopener" className="btn btn-outline" style={{ color: 'var(--dark)', borderColor: 'var(--light-gray)' }}>
                                    🎵 TikTok
                                </a>
                            )}
                        </div>

                        <h2 style={{ marginBottom: 16 }}>{settings.contactPage.linksTitle}</h2>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a href={settings.inscriptionUrl} target="_blank" rel="noopener" className="btn btn-primary">Inscription</a>
                            <a href={settings.reinscriptionUrl} target="_blank" rel="noopener" className="btn btn-outline" style={{ color: 'var(--dark)', borderColor: 'var(--light-gray)' }}>Réinscription</a>
                            <a href={settings.hbaUrl} target="_blank" rel="noopener" className="btn btn-outline" style={{ color: 'var(--dark)', borderColor: 'var(--light-gray)' }}>Site HBA</a>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}
