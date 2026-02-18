'use client';
import React from 'react';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ClubPage() {
    const { team, settings } = useData();
    const bureau = team.filter(t => t.category === 'bureau');
    const coachs = team.filter(t => t.category === 'coach');

    return (
        <>
            <Header />
            {/* HERO */}
            <div className="page-hero" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(/hero-club.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="page-hero-content">
                    <h1>{settings.clubPage.heroTitle}</h1>
                    <p>{settings.clubPage.heroSubtitle}</p>
                </div>
            </div>

            {/* PRESENTATION */}
            <section className="section" id="presentation">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-image-wrapper">
                            <img src={settings.clubPage.image || settings.aboutImage || '/about-team.png'} alt="Équipe ACHV" className="shadow-lg rounded-xl" />
                        </div>
                        <div className="about-text">
                            <div className="section-label">Notre Histoire</div>
                            <h2 dangerouslySetInnerHTML={{ __html: settings.clubPage.introTitle.replace(/(tous)/i, '<span class="highlight">$1</span>') }} />
                            <p style={{ whiteSpace: 'pre-line' }}>{settings.clubPage.description || settings.aboutText}</p>

                            <div style={{ marginTop: 24, padding: 24, background: '#f8fafc', borderRadius: 12, borderLeft: '4px solid var(--primary)' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>{settings.clubPage.affiliationTitle}</h3>
                                <p style={{ fontSize: '0.95rem', margin: 0 }}>{settings.clubPage.affiliationText}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* VALUES (FROM SETTINGS) */}
            <section className="section section-alt">
                <div className="container">
                    <div className="section-header text-center">
                        <div className="section-label">Nos Piliers</div>
                        <h2 className="section-title">{settings.clubPage.valuesTitle}</h2>
                    </div>
                    <div className="values-grid">
                        {(settings.clubValues || []).map((v, i) => (
                            <div key={i} className="value-card">
                                <span className="value-icon">{v.icon}</span>
                                <h3>{v.title}</h3>
                                <p>{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FACILITIES */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">Lieux de pratique</div>
                        <h2 className="section-title">{settings.clubPage.facilitiesTitle}</h2>
                    </div>
                    <div className="sponsors-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 24 }}>
                        {(settings.clubPage.facilities || []).map((f, i) => (
                            <div key={i} className="sponsor-card" style={{ padding: 0, overflow: 'hidden', textAlign: 'left', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: 180, background: '#e2e8f0', backgroundImage: `url(${f.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                <div style={{ padding: 24, flex: 1 }}>
                                    <h3 style={{ marginBottom: 8 }}>{f.title}</h3>
                                    <p style={{ color: '#666', fontSize: '0.9em' }}>{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TEAM */}
            <section className="section section-alt" id="team">
                <div className="container">
                    <div className="section-header text-center">
                        <div className="section-label">L&apos;Humain avant tout</div>
                        <h2 className="section-title">{settings.clubPage.teamTitle}</h2>
                        <p className="section-subtitle">{settings.clubPage.teamSubtitle}</p>
                    </div>

                    <h3 id="bureau" style={{ marginTop: 40, marginBottom: 24, fontSize: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: 12, scrollMarginTop: 100 }}>Bureau</h3>
                    <div className="team-grid">
                        {bureau.map(m => (
                            <div key={m.id} className="team-card">
                                <div className="team-avatar" style={m.photo ? { backgroundImage: `url(${m.photo})`, backgroundSize: 'cover', fontSize: 0 } : {}}>
                                    {!m.photo && m.name.charAt(0)}
                                </div>
                                <h3>{m.name}</h3>
                                <div className="team-role">{m.role}</div>
                            </div>
                        ))}
                    </div>

                    <h3 id="coachs" style={{ marginTop: 60, marginBottom: 24, fontSize: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: 12, scrollMarginTop: 100 }}>Coachs</h3>
                    <div className="team-grid">
                        {coachs.map(m => (
                            <div key={m.id} className="team-card">
                                <div className="team-avatar" style={m.photo ? { backgroundImage: `url(${m.photo})`, backgroundSize: 'cover', fontSize: 0 } : {}}>
                                    {!m.photo && m.name.charAt(0)}
                                </div>
                                <h3>{m.name}</h3>
                                <div className="team-role">{m.role}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section section-primary" style={{ textAlign: 'center' }}>
                <div className="container">
                    <h2 style={{ marginBottom: 24 }}>{settings.clubPage.ctaTitle}</h2>
                    <p style={{ marginBottom: 32, opacity: 0.9, fontSize: '1.1rem' }}>{settings.clubPage.ctaText}</p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/contact" className="wp-btn wp-btn-secondary">Nous contacter</a>
                        <a href={settings.inscriptionUrl} target="_blank" rel="noopener" className="wp-btn wp-btn-outline-white">S&apos;inscrire</a>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}
