'use client';
import React, { useState, useEffect } from 'react';
import { useData } from '@/lib/DataContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InstagramPost from '@/components/InstagramPost';

/* =============================================
   HEADER avec nav dynamique (custom pages)
   ============================================= */


/* =============================================
   NEWS TICKER
   ============================================= */
function NewsTicker() {
    const { settings } = useData();
    const msgs = settings.tickerMessages;
    return (
        <div className="news-ticker">
            <div className="ticker-content">
                {[...msgs, ...msgs].map((msg, i) => (
                    <span key={i} className="ticker-item">
                        <span className="ticker-dot"></span>
                        {msg}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* =============================================
   HERO SECTION
   ============================================= */
function HeroSection() {
    const { settings } = useData();
    return (
        <section className="hero" id="hero">
            <div className="hero-overlay"></div>
            <div className="hero-particles">
                {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className="hero-particle" style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 15}s`,
                        animationDuration: `${10 + Math.random() * 12}s`,
                    }}></div>
                ))}
            </div>
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                backgroundImage: `url(${settings.heroImage || '/achv-team.jpg'})`,
                backgroundSize: 'cover', backgroundPosition: 'center top',
                opacity: settings.heroImage ? 1 : 0.35,
            }}></div>
            <div className="hero-content">
                <div className="hero-badge">{settings.heroBadge}</div>
                <h1>
                    Bienvenue à l&apos;<span className="highlight">ACHV</span>
                </h1>
                <p className="hero-subtitle">{settings.heroSubtitle}</p>
                <div className="hero-buttons">
                    <a href={settings.inscriptionUrl} target="_blank" rel="noopener" className="btn btn-primary">
                        🚀 Rejoignez-nous
                    </a>
                    <Link href="/activites" className="btn btn-outline">
                        Découvrir nos activités
                    </Link>
                </div>
                <div className="hero-stats">
                    <div className="hero-stat">
                        <div className="hero-stat-number">{settings.licencies}+</div>
                        <div className="hero-stat-label">Licenciés</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-number">5</div>
                        <div className="hero-stat-label">Disciplines</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-number">2</div>
                        <div className="hero-stat-label">Communes</div>
                    </div>
                </div>
            </div>
            <div className="scroll-indicator">
                <div className="scroll-indicator-mouse">
                    <div className="scroll-indicator-wheel"></div>
                </div>
            </div>
        </section>
    );
}

/* =============================================
   ABOUT SECTION
   ============================================= */
function AboutSection() {
    const { settings } = useData();
    return (
        <section className="section" id="about">
            <div className="container">
                <div className="about-grid">
                    <div className="about-image-wrapper">
                        <img src={settings.aboutImage || '/achv-team.jpg'} alt="Équipe ACHV" />
                    </div>
                    <div className="about-text">
                        <div className="section-label">Qui sommes-nous</div>
                        <h2>L&apos;<span className="highlight">ACHV</span>, votre club</h2>
                        <p>{settings.aboutText}</p>
                        <Link href="/club" className="btn btn-primary">Découvrir le club</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* =============================================
   VALUES
   ============================================= */
function ValuesSection() {
    const { settings } = useData();
    return (
        <section className="section section-alt" id="values">
            <div className="container">
                <div className="section-header">
                    <div className="section-label">Nos valeurs</div>
                    <h2 className="section-title">Ce qui nous anime</h2>
                    <p className="section-subtitle">Sport, partage et progression — les piliers de l&apos;ACHV</p>
                </div>
                <div className="values-grid">
                    {settings.clubValues.map((v, i) => (
                        <div key={i} className="value-card">
                            <span className="value-icon">{v.icon}</span>
                            <h3>{v.title}</h3>
                            <p>{v.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* =============================================
   ACTIVITIES PREVIEW
   ============================================= */
function ActivitiesPreview() {
    const { activities } = useData();
    return (
        <section className="section" id="activities-preview">
            <div className="container">
                <div className="section-header">
                    <div className="section-label">Nos activités</div>
                    <h2 className="section-title">Trouve ta discipline</h2>
                    <p className="section-subtitle">Piste, trail, route, cross et marche nordique — il y en a pour tout le monde</p>
                </div>
                <div className="activities-grid">
                    {activities.slice(0, 4).map(a => (
                        <div key={a.id} className="activity-card">
                            <img src={a.image || '/activity-track.png'} alt={a.title} />
                            <div className="activity-card-overlay">
                                <h3>{a.title}</h3>
                                <p>{a.schedule}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 48 }}>
                    <Link href="/activites" className="btn btn-primary">Toutes les activités</Link>
                </div>
            </div>
        </section>
    );
}

/* =============================================
   NEWS PREVIEW
   ============================================= */
function NewsPreview() {
    const { articles } = useData();
    const published = articles.filter(a => a.published).slice(0, 3);
    return (
        <section className="section section-alt" id="news-preview">
            <div className="container">
                <div className="section-header">
                    <div className="section-label">Actualités</div>
                    <h2 className="section-title">Les dernières news</h2>
                </div>
                <div className="news-grid">
                    {published.map(article => (
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
                <div style={{ textAlign: 'center', marginTop: 48 }}>
                    <Link href="/actualites" className="btn btn-primary">Toutes les actualités</Link>
                </div>
            </div>
        </section>
    );
}

/* =============================================
   EVENTS PREVIEW
   ============================================= */
function EventsPreview() {
    const { events } = useData();
    const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

    // Sort chronological: Nearest first
    // Optional: Filter past events? Let's check dates.
    // If the user wants an "Agendas" view, usually it's future events.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sorted = [...events]
        .filter(e => {
            const d = new Date(e.dateEnd || e.date);
            return d >= today; // Keep today and future
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());



    return (
        <section className="section" id="events-preview">
            <div className="container">
                <div className="section-header">
                    <div className="section-label">Agenda</div>
                    <h2 className="section-title">Prochains événements</h2>
                </div>
                <div className="events-list">
                    {sorted.slice(0, 4).map(ev => {
                        const d = new Date(ev.date);
                        const dEnd = ev.dateEnd ? new Date(ev.dateEnd) : null;

                        let dayDisplay = d.getDate().toString();
                        let monthDisplay = months[d.getMonth()];

                        if (dEnd) {
                            if (d.getMonth() === dEnd.getMonth()) {
                                dayDisplay = `${d.getDate()}-${dEnd.getDate()}`;
                            } else {
                                // For cross-month, simple fallback in box
                                dayDisplay = d.getDate().toString();
                                monthDisplay = months[d.getMonth()];
                            }
                        }

                        // Format full string
                        // Format full string
                        const fullDate = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                        const fullDateEnd = dEnd ? dEnd.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null;
                        const rangeString = dEnd ? `Du ${fullDate} au ${fullDateEnd}` : `Le ${fullDate}`;

                        return (
                            <div key={ev.id} className="event-item">
                                <div className="event-date-box">
                                    <div className="event-date-day" style={dayDisplay.length > 2 ? { fontSize: '1.2rem' } : {}}>{dayDisplay}</div>
                                    <div className="event-date-month">{monthDisplay}</div>
                                </div>
                                <div className="event-info">
                                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        {rangeString}
                                    </div>
                                    <h3>{ev.title}</h3>
                                    <p>{ev.description}</p>
                                    <div className="event-location">📍 {ev.location}</div>
                                </div>
                            </div>
                        );
                    })}
                    {sorted.length === 0 && (
                        <div style={{ textAlign: 'center', width: '100%', padding: '20px', color: 'var(--medium-gray)' }}>
                            Aucun événement à venir.
                        </div>
                    )}
                </div>
                <div style={{ textAlign: 'center', marginTop: 48 }}>
                    <Link href="/agenda" className="btn btn-outline" style={{ color: 'var(--dark)', borderColor: 'var(--primary)' }}>
                        Voir tout l&apos;agenda
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* =============================================
   SPONSORS Section — Premium showcase
   ============================================= */
function SponsorsSection() {
    const { partners } = useData();
    if (partners.length === 0) return null;
    const gold = partners.filter(p => p.tier === 'gold');
    const silver = partners.filter(p => p.tier === 'silver');
    const bronze = partners.filter(p => p.tier === 'bronze');

    return (
        <section className="section" id="sponsors" style={{ background: '#FAFAFA' }}>
            <div className="container">
                <div className="section-header">
                    <div className="section-label" style={{ background: 'rgba(230, 57, 70, 0.1)', color: '#E63946', border: 'none' }}>Nos partenaires</div>
                    <h2 className="section-title">Ils nous soutiennent</h2>
                    <p className="section-subtitle">Merci à nos partenaires qui rendent nos événements possibles</p>
                </div>

                {gold.length > 0 && (
                    <div className="sponsor-tier gold">
                        <div className="tier-header">
                            <span className="tier-icon">⭐</span>
                            <h3>Partenaires Principaux</h3>
                        </div>
                        <div className="sponsors-grid gold-grid">
                            {gold.map(p => (
                                <a key={p.id} href={p.url} target="_blank" rel="noopener" className="sponsor-card gold-card">
                                    {p.logo ? (
                                        <img src={p.logo} alt={p.name} />
                                    ) : (
                                        <span className="sponsor-card-text">{p.name}</span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {(silver.length > 0 || bronze.length > 0) && (
                    <div className="sponsor-tier standard" style={{ marginTop: 60 }}>
                        <div className="tier-header">
                            <h3>Partenaires</h3>
                        </div>
                        <div className="sponsors-grid standard-grid">
                            {[...silver, ...bronze].map(p => (
                                <a key={p.id} href={p.url} target="_blank" rel="noopener" className="sponsor-card standard-card">
                                    {p.logo ? (
                                        <img src={p.logo} alt={p.name} />
                                    ) : (
                                        <span className="sponsor-card-text">{p.name}</span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

/* =============================================
   CTA
   ============================================= */
function CTASection() {
    const { settings } = useData();
    return (
        <section className="cta-section" id="cta">
            <div className="container">
                <h2>{settings.ctaTitle}</h2>
                <p>{settings.ctaText}</p>
                <div className="contact-cards">
                    <div className="contact-card">
                        <div className="contact-card-icon">📧</div>
                        <h3>Bureau</h3>
                        <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
                    </div>
                    <div className="contact-card">
                        <div className="contact-card-icon">📝</div>
                        <h3>Inscriptions</h3>
                        <a href={`mailto:${settings.contactEmailInscription}`}>{settings.contactEmailInscription}</a>
                    </div>
                    <div className="contact-card">
                        <div className="contact-card-icon">👤</div>
                        <h3>Président</h3>
                        <a href={`mailto:${settings.contactEmailPresident}`}>{settings.contactEmailPresident}</a>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* =============================================
   FOOTER
   ============================================= */


/* =============================================
   MAIN PAGE — Export all
   ============================================= */
/* =============================================
   SOCIAL FEED
   ============================================= */
function SocialFeed() {
    const { socialPosts, settings } = useData();

    // Filter posts based on visibility flags
    const visiblePosts = socialPosts.filter(post => {
        const platform = post.platform as keyof typeof settings.socialVisibility;
        return settings.socialVisibility?.[platform] ?? true;
    });

    if (!visiblePosts || visiblePosts.length === 0) return null;

    // Duplicate list for infinite scroll effect (if needed, but simple scroll is safer)
    return (
        <section className="section" id="social-feed">
            <div className="container">
                <div className="section-header">
                    <div className="section-label">Réseaux Sociaux</div>
                    <h2 className="section-title">Suivez l&apos;actualité en direct</h2>
                    <p className="section-subtitle">Retrouvez nos derniers posts Facebook, Instagram, LinkedIn et YouTube</p>
                </div>

                <div style={{ marginBottom: 40 }}>
                    <InstagramPost />
                </div>

                <div className="social-feed-container">
                    <div className="social-feed-track">
                        {visiblePosts.map(post => (
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
                                {post.imageUrl && (
                                    <div className="social-card-media">
                                        <div className="social-card-bg" style={{ backgroundImage: `url(${post.imageUrl})` }}></div>
                                        <div className="social-card-img" style={{ backgroundImage: `url(${post.imageUrl})` }}></div>
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
        </section>
    );
}




export default function Home() {
    return (
        <>
            <Header />
            <main>
                <HeroSection />
                <NewsTicker />
                <AboutSection />
                <ValuesSection />
                <ActivitiesPreview />
                <NewsPreview />
                <EventsPreview />
                <SocialFeed />
                <SponsorsSection />
                <CTASection />
            </main>
            <Footer />
        </>
    );
}
