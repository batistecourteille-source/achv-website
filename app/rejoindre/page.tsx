'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Gradient de couleur à partir d'une couleur hex
function makeGradient(color: string) {
    // Darken the hex color manually (subtract ~20%)
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - 40);
    const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - 40);
    const dark = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return `linear-gradient(135deg, ${color} 0%, ${dark} 100%)`;
}

const STEP_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export default function RejoindrePage() {
    const { schedules, settings } = useData();
    const rp = settings.rejoindrePage;

    const profiles = rp?.profiles || [];
    const inscriptionSteps = rp?.inscriptionSteps || [];
    const reinscriptionSteps = rp?.reinscriptionSteps || [];

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [animating, setAnimating] = useState(false);

    const handleSelect = (id: string) => {
        setAnimating(true);
        setTimeout(() => {
            setSelectedId(id);
            setAnimating(false);
            setTimeout(() => {
                document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }, 300);
    };

    const handleBack = () => {
        setAnimating(true);
        setTimeout(() => {
            setSelectedId(null);
            setAnimating(false);
            setTimeout(() => {
                document.getElementById('profile-grid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }, 300);
    };

    const selectedProfile = profiles.find(p => p.id === selectedId) || null;

    // Sort by day
    const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const relevantSchedules = selectedProfile
        ? (schedules || []).filter(s => (selectedProfile.categories || []).includes(s.category))
        : [];
    const sortedSchedules = [...relevantSchedules].sort((a, b) => {
        const dA = dayOrder.findIndex(d => (a.dayTime || '').toLowerCase().startsWith(d));
        const dB = dayOrder.findIndex(d => (b.dayTime || '').toLowerCase().startsWith(d));
        return (dA === -1 ? 99 : dA) - (dB === -1 ? 99 : dB);
    });

    const gradient = selectedProfile ? makeGradient(selectedProfile.color || '#3b82f6') : '';

    return (
        <>
            <Header />
            <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}>
                <div className="page-hero-content">
                    <h1>{rp?.heroTitle || 'Rejoindre le club'}</h1>
                    <p>{rp?.heroSubtitle || "Trouvez l'activité qui vous correspond en quelques clics"}</p>
                </div>
            </div>

            {/* ═══ SÉLECTION PROFIL ═══ */}
            <section className="section" style={{ background: '#f8fafc' }}>
                <div className="container" style={{ maxWidth: 900 }}>

                    {/* Stepper */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 48 }}>
                        {['Votre profil', 'Votre activité'].map((step, i) => {
                            const active = i === 0 ? !selectedId : !!selectedId;
                            return (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '12px 28px',
                                    background: active ? 'var(--primary)' : 'var(--white)',
                                    color: active ? 'white' : 'var(--medium-gray)',
                                    borderRadius: i === 0 ? '99px 0 0 99px' : '0 99px 99px 0',
                                    border: `2px solid ${active ? 'var(--primary)' : '#e2e8f0'}`,
                                    fontWeight: 700, fontSize: '0.95rem',
                                    cursor: 'default', transition: 'all 0.3s ease',
                                }}>
                                    <span style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: '0.85rem',
                                        color: active ? 'white' : 'var(--medium-gray)',
                                    }}>{i + 1}</span>
                                    {step}
                                </div>
                            );
                        })}
                    </div>

                    {/* STEP 1: Grille de profils */}
                    {!selectedId && (
                        <div id="profile-grid" style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(20px)' : 'none', transition: 'all 0.3s ease' }}>
                            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                                <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--dark)', marginBottom: 12 }}>
                                    {rp?.stepIntroTitle || 'Quel sportif êtes-vous ?'}
                                </h2>
                                <p style={{ color: 'var(--medium-gray)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
                                    {rp?.stepIntroText || 'Sélectionnez votre profil pour découvrir les activités, horaires et tarifs adaptés.'}
                                </p>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: 20,
                            }}>
                                {profiles.map((profile) => (
                                    <button
                                        key={profile.id}
                                        onClick={() => handleSelect(profile.id)}
                                        style={{
                                            background: 'var(--white)',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: 16,
                                            padding: 'clamp(20px, 3vw, 28px)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s ease',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = profile.color || '#3b82f6';
                                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
                                            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 24px ${profile.color || '#3b82f6'}25`;
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
                                            (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                                            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute', top: 0, right: 0,
                                            width: 80, height: 80,
                                            background: makeGradient(profile.color || '#3b82f6'),
                                            opacity: 0.08, borderRadius: '0 0 0 80px'
                                        }} />
                                        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{profile.emoji}</div>
                                        <h3 style={{ fontSize: '1.25rem', color: 'var(--dark)', marginBottom: 6, fontWeight: 700 }}>
                                            {profile.title}
                                        </h3>
                                        <p style={{ color: 'var(--medium-gray)', fontSize: '0.95rem', marginBottom: 12, lineHeight: 1.5 }}>
                                            {profile.subtitle}
                                        </p>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            background: `${profile.color || '#3b82f6'}15`,
                                            color: profile.color || '#3b82f6',
                                            borderRadius: 99,
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                        }}>
                                            {profile.age}
                                        </span>
                                        <div style={{
                                            marginTop: 16, color: profile.color || '#3b82f6',
                                            fontSize: '0.9rem', fontWeight: 600,
                                            display: 'flex', alignItems: 'center', gap: 6
                                        }}>
                                            Découvrir →
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Résultat profil sélectionné */}
                    {selectedId && selectedProfile && (
                        <div id="result-section" style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(20px)' : 'none', transition: 'all 0.3s ease' }}>
                            <button
                                onClick={handleBack}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--medium-gray)', fontSize: '0.95rem', fontWeight: 600,
                                    marginBottom: 32, padding: '8px 0',
                                }}
                            >
                                ← Changer de profil
                            </button>

                            {/* Profile header */}
                            <div style={{
                                background: gradient,
                                borderRadius: 20,
                                padding: 'clamp(24px, 5vw, 48px)',
                                color: 'white',
                                marginBottom: 32,
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                {selectedProfile.imageBg ? (
                                    <div style={{
                                        position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
                                        backgroundImage: `url(${selectedProfile.imageBg})`,
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right center',
                                        opacity: 0.15,
                                        mixBlendMode: 'overlay',
                                    }} />
                                ) : (
                                    <div style={{
                                        position: 'absolute', top: -40, right: -40,
                                        fontSize: '12rem', opacity: 0.1, lineHeight: 1,
                                    }}>
                                        {selectedProfile.emoji}
                                    </div>
                                )}
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>{selectedProfile.emoji}</div>
                                    <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 8 }}>
                                        {selectedProfile.title}
                                    </h2>
                                    <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 700, lineHeight: 1.7 }}>
                                        {selectedProfile.description}
                                    </p>
                                </div>
                            </div>

                            {/* Highlights */}
                            {(selectedProfile.highlights || []).length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: 16,
                                    marginBottom: 40,
                                }}>
                                    {selectedProfile.highlights.map((h, i) => (
                                        <div key={i} style={{
                                            background: 'var(--white)',
                                            borderRadius: 12,
                                            padding: '20px 24px',
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        }}>
                                            <span style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: `${selectedProfile.color || '#3b82f6'}15`,
                                                color: selectedProfile.color || '#3b82f6',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                                            }}>✓</span>
                                            <span style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '0.95rem' }}>{h}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Schedules */}
                            {sortedSchedules.length > 0 && (
                                <div style={{
                                    background: 'var(--white)', borderRadius: 16,
                                    padding: 'clamp(20px, 4vw, 32px)', marginBottom: 32,
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                                }}>
                                    <h3 style={{ fontSize: '1.3rem', color: 'var(--dark)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: '1.4rem' }}>🕐</span> Créneaux d&apos;entraînement
                                    </h3>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    <th style={{ padding: '12px 16px' }}>Discipline</th>
                                                    <th style={{ padding: '12px 16px' }}>Public</th>
                                                    <th style={{ padding: '12px 16px' }}>Jour &amp; Heure</th>
                                                    <th style={{ padding: '12px 16px' }}>Lieu</th>
                                                    <th style={{ padding: '12px 16px' }}>Ville</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedSchedules.map(s => (
                                                    <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{s.discipline}</td>
                                                        <td style={{ padding: '14px 16px', color: '#475569' }}>{s.ageGroup}</td>
                                                        <td style={{ padding: '14px 16px', color: '#334155' }}>{s.dayTime}</td>
                                                        <td style={{ padding: '14px 16px', color: '#475569' }}>{s.location}</td>
                                                        <td style={{ padding: '14px 16px' }}>
                                                            <span style={{
                                                                padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                                                                background: s.city === 'Noyal' ? '#eff6ff' : s.city === 'Nouvoitou' ? '#f0fdf4' : '#f3f4f6',
                                                                color: s.city === 'Noyal' ? '#2563eb' : s.city === 'Nouvoitou' ? '#16a34a' : '#4b5563',
                                                            }}>{s.city}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <div style={{
                                background: 'var(--white)', borderRadius: 16,
                                padding: 'clamp(24px, 5vw, 48px)', marginBottom: 32,
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                            }}>
                                <h3 style={{ fontSize: '1.5rem', color: 'var(--dark)', marginBottom: 12 }}>
                                    {rp?.ctaTitle || "Prêt à rejoindre l'aventure ?"} {selectedProfile.icon}
                                </h3>
                                <p style={{ color: 'var(--medium-gray)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7 }}>
                                    {rp?.ctaText || "Inscrivez-vous en ligne ou contactez-nous pour plus d'informations. Une séance d'essai gratuite est possible !"}
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                                    {settings.inscriptionUrl && (
                                        <a
                                            href={settings.inscriptionUrl}
                                            target="_blank"
                                            rel="noopener"
                                            className="btn btn-primary btn-lg"
                                            style={{ background: gradient, border: 'none', fontSize: '1.05rem', padding: '14px 32px' }}
                                        >
                                            ✅ M&apos;inscrire en ligne
                                        </a>
                                    )}
                                    <Link
                                        href="/tarifs"
                                        className="btn btn-lg"
                                        style={{
                                            background: 'var(--white)',
                                            border: `2px solid ${selectedProfile.color || '#3b82f6'}`,
                                            color: selectedProfile.color || '#3b82f6',
                                            fontSize: '1.05rem', padding: '14px 32px',
                                            fontWeight: 700, borderRadius: 12, textDecoration: 'none',
                                        }}
                                    >
                                        💰 Voir les tarifs
                                    </Link>
                                    <Link
                                        href="/contact"
                                        className="btn btn-lg"
                                        style={{
                                            background: '#f8fafc', border: '2px solid #e2e8f0',
                                            color: 'var(--dark)', fontSize: '1.05rem', padding: '14px 32px',
                                            fontWeight: 700, borderRadius: 12, textDecoration: 'none',
                                        }}
                                    >
                                        📧 Nous contacter
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ═══ GUIDE D'INSCRIPTION ═══ */}
            <InscriptionGuide
                settings={settings}
                inscriptionSteps={inscriptionSteps}
                reinscriptionSteps={reinscriptionSteps}
            />

            <Footer />
        </>
    );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*  COMPOSANT : Guide d'inscription / réinscription                      */
/* ══════════════════════════════════════════════════════════════════════ */

type Step = { title: string; text: string; note?: string };

function InscriptionGuide({
    settings,
    inscriptionSteps,
    reinscriptionSteps,
}: {
    settings: any;
    inscriptionSteps: Step[];
    reinscriptionSteps: Step[];
}) {
    const [tab, setTab] = useState<'inscription' | 'reinscription'>('inscription');
    const rp = settings.rejoindrePage;

    const stepStyle: React.CSSProperties = {
        background: 'var(--white)',
        borderRadius: 16,
        padding: 'clamp(20px, 4vw, 32px)',
        marginBottom: 24,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative',
    };

    const noteStyle: React.CSSProperties = {
        background: '#fefce8', border: '1px solid #fde68a',
        borderRadius: 12, padding: '16px 20px', marginTop: 16,
        fontSize: '0.9rem', color: '#92400e', lineHeight: 1.7,
    };

    const linkBtnStyle: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', borderRadius: 10, fontWeight: 700,
        fontSize: '0.95rem', textDecoration: 'none',
        transition: 'all 0.2s ease', marginTop: 12, marginRight: 12,
    };

    const steps = tab === 'inscription' ? inscriptionSteps : reinscriptionSteps;

    return (
        <section id="guide-inscription" className="section" style={{ background: 'var(--white)' }}>
            <div className="container">
                <div className="section-header" style={{ textAlign: 'center' }}>
                    <div className="section-label">Guide pas à pas</div>
                    <h2 className="section-title">{rp?.guideTitle || "Comment s'inscrire ?"}</h2>
                    <p className="section-subtitle" style={{ maxWidth: 650, margin: '0 auto' }}>
                        {rp?.guideSubtitle || "Suivez les étapes ci-dessous pour rejoindre l'ACHV. Le processus est simple et rapide !"}
                    </p>
                </div>

                {/* Tab switcher */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 48 }}>
                    <button
                        onClick={() => setTab('inscription')}
                        style={{
                            padding: '14px 28px', borderRadius: '12px 0 0 12px', border: '2px solid var(--primary)',
                            background: tab === 'inscription' ? 'var(--primary)' : 'white',
                            color: tab === 'inscription' ? 'white' : 'var(--primary)',
                            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        🎉 Première inscription
                    </button>
                    <button
                        onClick={() => setTab('reinscription')}
                        style={{
                            padding: '14px 28px', borderRadius: '0 12px 12px 0', border: '2px solid var(--primary)',
                            background: tab === 'reinscription' ? 'var(--primary)' : 'white',
                            color: tab === 'reinscription' ? 'white' : 'var(--primary)',
                            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        🔄 Réinscription
                    </button>
                </div>

                <div style={{ maxWidth: 800, margin: '0 auto' }}>

                    {/* Note essai gratuit (inscription only) */}
                    {tab === 'inscription' && (
                        <div style={{
                            background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
                            borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', marginBottom: 32,
                            border: '1px solid #c7d2fe',
                        }}>
                            <p style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '1.05rem', marginBottom: 8 }}>
                                💡 Vous n&apos;êtes pas encore inscrit à l&apos;ACHV ?
                            </p>
                            <p style={{ color: '#334155', lineHeight: 1.7 }}>
                                {rp?.trialText || "Bonne nouvelle ! Vous pouvez faire 2 séances d'essai gratuites avant de vous décider."}
                            </p>
                        </div>
                    )}

                    {/* Étapes dynamiques */}
                    {steps.map((step, i) => (
                        <div key={i} style={stepStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: STEP_COLORS[i % STEP_COLORS.length],
                                    color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '1.1rem', flexShrink: 0,
                                }}>{i + 1}</div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>
                                        {step.title}
                                    </h3>
                                    <p style={{ color: '#64748b', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                                        {step.text}
                                    </p>
                                    {step.note && (
                                        <div style={noteStyle}>
                                            💡 {step.note}
                                        </div>
                                    )}

                                    {/* Boutons spéciaux selon la position dans le flow */}
                                    {tab === 'inscription' && i === 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                                            <Link href="/activites" style={{ ...linkBtnStyle, background: '#eff6ff', color: '#2563eb' }}>
                                                📋 Activités &amp; Planning
                                            </Link>
                                            <Link href="/tarifs" style={{ ...linkBtnStyle, background: '#fef3c7', color: '#d97706' }}>
                                                💰 Tarifs
                                            </Link>
                                            {settings.plaquetteUrl && (
                                                <a href={settings.plaquetteUrl} target="_blank" rel="noopener" style={{ ...linkBtnStyle, background: '#f0fdf4', color: '#16a34a' }}>
                                                    📄 Plaquette du club
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {tab === 'inscription' && i === 1 && (
                                        <a href="https://admin.ffa.fr/planning/questionnaire-sante-mineur.pdf" target="_blank" rel="noopener" style={{ ...linkBtnStyle, background: '#fef3c7', color: '#d97706' }}>
                                            📝 Questionnaire de santé (mineur)
                                        </a>
                                    )}
                                    {tab === 'inscription' && i === 2 && settings.inscriptionUrl && (
                                        <a href={settings.inscriptionUrl} target="_blank" rel="noopener" style={{
                                            ...linkBtnStyle,
                                            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                                            color: 'white', padding: '12px 24px',
                                        }}>
                                            🏅 Adhérer à l&apos;ACHV
                                        </a>
                                    )}
                                    {tab === 'reinscription' && i === 2 && settings.reinscriptionUrl && (
                                        <a href={settings.reinscriptionUrl} target="_blank" rel="noopener" style={{
                                            ...linkBtnStyle,
                                            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                                            color: 'white', padding: '12px 24px',
                                        }}>
                                            🏅 Accéder à MonClub
                                        </a>
                                    )}

                                    {/* Message final (dernière étape) */}
                                    {i === steps.length - 1 && (
                                        <div style={{
                                            marginTop: 20, padding: '20px 24px',
                                            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                                            borderRadius: 12, border: '1px solid #bbf7d0',
                                        }}>
                                            <p style={{ color: '#166534', fontWeight: 700, fontSize: '1.05rem' }}>
                                                {tab === 'inscription'
                                                    ? "🎉 Vous voilà membre de l'ACHV : bienvenue !"
                                                    : "🎉 Votre licence est renouvelée, à bientôt sur les pistes !"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Contact CTA */}
                    <div style={{
                        textAlign: 'center', marginTop: 48,
                        padding: '32px', background: '#f8fafc',
                        borderRadius: 16, border: '1px solid #e2e8f0',
                        maxWidth: 700, margin: '48px auto 0',
                    }}>
                        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: 16, lineHeight: 1.7 }}>
                            Vous avez une question sur l&apos;inscription ou la réinscription ?
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                            <a
                                href={`mailto:${settings.contactEmailInscription || settings.contactEmail}`}
                                style={{ ...linkBtnStyle, background: 'var(--primary)', color: 'white' }}
                            >
                                📧 {settings.contactEmailInscription || settings.contactEmail}
                            </a>
                            <Link href="/contact" style={{ ...linkBtnStyle, background: '#f1f5f9', color: '#334155' }}>
                                💬 Page Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
