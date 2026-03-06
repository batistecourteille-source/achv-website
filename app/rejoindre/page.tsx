'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type Profile = 'enfant' | 'coureur' | 'piste' | 'marcheur' | 'forme' | null;

const PROFILES = [
    {
        id: 'enfant' as Profile,
        emoji: '🧒',
        title: 'Enfant / Jeune',
        subtitle: 'De l\'éveil athlétique aux compétitions jeunes',
        age: '4 à 17 ans',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        categories: ['Jeunes'],
        description: 'L\'école d\'athlétisme de l\'ACHV accueille vos enfants dès 4 ans. Encadrés par des entraîneurs diplômés FFA, ils découvrent toutes les disciplines de l\'athlétisme dans un cadre bienveillant et motivant. Éveil, poussins, benjamins, minimes... chaque tranche d\'âge a son créneau adapté.',
        highlights: ['Encadrement diplômé FFA', 'Toutes les disciplines', 'Compétitions adaptées', 'Ambiance conviviale'],
        icon: '🏃‍♂️'
    },
    {
        id: 'coureur' as Profile,
        emoji: '🏃',
        title: 'Coureur Adulte',
        subtitle: 'Running, trail & route en groupe',
        age: '16 ans et +',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        categories: ['Adultes Hors-Stade'],
        description: 'Que vous soyez débutant ou confirmé, nos groupes de running et trail vous permettent de progresser à votre rythme. Sorties encadrées plusieurs fois par semaine, sur route et en nature, avec des parcours variés autour de Noyal et Nouvoitou.',
        highlights: ['Tous niveaux acceptés', 'Groupes par niveau', 'Sorties nature & route', 'Préparation compétitions'],
        icon: '🏅'
    },
    {
        id: 'piste' as Profile,
        emoji: '🏟️',
        title: 'Athlétisme Piste',
        subtitle: 'Entraînement sur piste & compétition',
        age: '14 ans et +',
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        categories: ['Adultes Piste'],
        description: 'Pour les compétiteurs dans l\'âme ! Entraînements structurés sur piste avec VMA, fractionné, technique de course, musculation spécifique. Préparation des championnats départementaux, régionaux et nationaux.',
        highlights: ['Entraînements structurés', 'Préparation compétitions', 'Musculation athlétisme', 'Suivi personnalisé'],
        icon: '🏆'
    },
    {
        id: 'marcheur' as Profile,
        emoji: '🥾',
        title: 'Marche Nordique',
        subtitle: 'Bien-être et sport en plein air',
        age: 'Tous âges',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        categories: ['Marche Nordique'],
        description: 'La marche nordique est bien plus qu\'une simple promenade ! C\'est un sport complet qui fait travailler 80% des muscles du corps. Nos groupes partent plusieurs fois par semaine dans les chemins autour de Noyal et Nouvoitou, dans une ambiance conviviale.',
        highlights: ['Sport doux et complet', 'En pleine nature', 'Convivialité garantie', 'Matériel prêté aux débutants'],
        icon: '🌿'
    },
    {
        id: 'forme' as Profile,
        emoji: '💪',
        title: 'Forme & Santé',
        subtitle: 'Pilates, renforcement & circuit training',
        age: 'Adultes',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        categories: ['Forme & Santé'],
        description: 'Pas besoin de courir pour faire du sport à l\'ACHV ! Nos cours de Pilates, renforcement musculaire et circuit training sont accessibles à tous. En salle ou en extérieur, retrouvez la forme avec nos coachs motivants.',
        highlights: ['Accessible à tous', 'Pas de course à pied', 'Cours en salle', 'Renforcement global'],
        icon: '🧘'
    },
];

export default function RejoindrePage() {
    const { schedules, settings } = useData();
    const [selected, setSelected] = useState<Profile>(null);
    const [animating, setAnimating] = useState(false);

    const handleSelect = (profile: Profile) => {
        setAnimating(true);
        setTimeout(() => {
            setSelected(profile);
            setAnimating(false);
            // Scroll to results
            setTimeout(() => {
                document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }, 300);
    };

    const handleBack = () => {
        setAnimating(true);
        setTimeout(() => {
            setSelected(null);
            setAnimating(false);
            setTimeout(() => {
                document.getElementById('profile-grid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }, 300);
    };

    const selectedProfile = PROFILES.find(p => p.id === selected);
    const relevantSchedules = selectedProfile
        ? (schedules || []).filter(s => selectedProfile.categories.includes(s.category))
        : [];

    // Sort by day
    const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const sortedSchedules = [...relevantSchedules].sort((a, b) => {
        const dA = dayOrder.findIndex(d => (a.dayTime || '').toLowerCase().startsWith(d));
        const dB = dayOrder.findIndex(d => (b.dayTime || '').toLowerCase().startsWith(d));
        return (dA === -1 ? 99 : dA) - (dB === -1 ? 99 : dB);
    });

    return (
        <>
            <Header />
            <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}>
                <div className="page-hero-content">
                    <h1>Rejoindre le club</h1>
                    <p>Trouvez l&apos;activité qui vous correspond en quelques clics</p>
                </div>
            </div>

            <section className="section" style={{ background: 'var(--bg-alt)' }}>
                <div className="container">
                    {/* Step indicator */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 48 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
                            background: !selected ? 'var(--primary)' : 'var(--white)',
                            color: !selected ? 'white' : 'var(--medium-gray)',
                            borderRadius: 99, fontWeight: 700, fontSize: '0.95rem',
                            transition: 'all 0.3s ease',
                            boxShadow: !selected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                            border: '2px solid ' + (!selected ? 'var(--primary)' : '#e2e8f0'),
                        }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: !selected ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.85rem', fontWeight: 800,
                            }}>1</span>
                            Votre profil
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
                            background: selected ? 'var(--primary)' : 'var(--white)',
                            color: selected ? 'white' : 'var(--medium-gray)',
                            borderRadius: 99, fontWeight: 700, fontSize: '0.95rem',
                            transition: 'all 0.3s ease',
                            boxShadow: selected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                            border: '2px solid ' + (selected ? 'var(--primary)' : '#e2e8f0'),
                        }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: selected ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.85rem', fontWeight: 800,
                            }}>2</span>
                            Votre activité
                        </div>
                    </div>

                    {/* STEP 1: Profile selection */}
                    {!selected && (
                        <div id="profile-grid" style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(20px)' : 'none', transition: 'all 0.3s ease' }}>
                            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                                <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--dark)', marginBottom: 12 }}>
                                    Quel sportif êtes-vous ?
                                </h2>
                                <p style={{ color: 'var(--medium-gray)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
                                    Sélectionnez votre profil pour découvrir les activités, horaires et tarifs adaptés.
                                </p>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: 20,
                                maxWidth: 1000,
                                margin: '0 auto',
                            }}>
                                {PROFILES.map(profile => (
                                    <button
                                        key={profile.id}
                                        onClick={() => handleSelect(profile.id)}
                                        style={{
                                            background: 'var(--white)',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: 16,
                                            padding: '32px 24px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.3s ease',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = profile.color;
                                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
                                            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 24px ${profile.color}25`;
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
                                            background: profile.gradient,
                                            opacity: 0.08, borderRadius: '0 0 0 80px'
                                        }} />
                                        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>
                                            {profile.emoji}
                                        </div>
                                        <h3 style={{ fontSize: '1.25rem', color: 'var(--dark)', marginBottom: 6, fontWeight: 700 }}>
                                            {profile.title}
                                        </h3>
                                        <p style={{ color: 'var(--medium-gray)', fontSize: '0.95rem', marginBottom: 12, lineHeight: 1.5 }}>
                                            {profile.subtitle}
                                        </p>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            background: `${profile.color}15`,
                                            color: profile.color,
                                            borderRadius: 99,
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                        }}>
                                            {profile.age}
                                        </span>
                                        <div style={{
                                            marginTop: 16, color: profile.color,
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

                    {/* STEP 2: Result */}
                    {selected && selectedProfile && (
                        <div id="result-section" style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(20px)' : 'none', transition: 'all 0.3s ease' }}>
                            {/* Back button */}
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
                                background: selectedProfile.gradient,
                                borderRadius: 20,
                                padding: 'clamp(24px, 5vw, 48px)',
                                color: 'white',
                                marginBottom: 32,
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    position: 'absolute', top: -40, right: -40,
                                    fontSize: '12rem', opacity: 0.1, lineHeight: 1,
                                }}>
                                    {selectedProfile.emoji}
                                </div>
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
                                            background: `${selectedProfile.color}15`,
                                            color: selectedProfile.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                                        }}>✓</span>
                                        <span style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '0.95rem' }}>{h}</span>
                                    </div>
                                ))}
                            </div>

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
                                    Prêt à rejoindre l&apos;aventure ? {selectedProfile.icon}
                                </h3>
                                <p style={{ color: 'var(--medium-gray)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7 }}>
                                    Inscrivez-vous en ligne ou contactez-nous pour plus d&apos;informations. Une séance d&apos;essai gratuite est possible !
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                                    {settings.inscriptionUrl && (
                                        <a
                                            href={settings.inscriptionUrl}
                                            target="_blank"
                                            rel="noopener"
                                            className="btn btn-primary btn-lg"
                                            style={{
                                                background: selectedProfile.gradient,
                                                border: 'none', fontSize: '1.05rem',
                                                padding: '14px 32px',
                                            }}
                                        >
                                            ✅ M&apos;inscrire en ligne
                                        </a>
                                    )}
                                    <Link
                                        href="/tarifs"
                                        className="btn btn-lg"
                                        style={{
                                            background: 'var(--white)',
                                            border: `2px solid ${selectedProfile.color}`,
                                            color: selectedProfile.color,
                                            fontSize: '1.05rem',
                                            padding: '14px 32px',
                                            fontWeight: 700,
                                            borderRadius: 12,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        💰 Voir les tarifs
                                    </Link>
                                    <Link
                                        href="/contact"
                                        className="btn btn-lg"
                                        style={{
                                            background: '#f8fafc',
                                            border: '2px solid #e2e8f0',
                                            color: 'var(--dark)',
                                            fontSize: '1.05rem',
                                            padding: '14px 32px',
                                            fontWeight: 700,
                                            borderRadius: 12,
                                            textDecoration: 'none',
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

            {/* ═══════════════════════════════════════════════════ */}
            {/* SECTION INSCRIPTION / RÉINSCRIPTION                */}
            {/* ═══════════════════════════════════════════════════ */}
            <InscriptionGuide settings={settings} />

            <Footer />
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  COMPOSANT : Guide d'inscription / réinscription                      */
/* ═══════════════════════════════════════════════════════════════════════ */

function InscriptionGuide({ settings }: { settings: any }) {
    const [tab, setTab] = useState<'inscription' | 'reinscription'>('inscription');

    const stepStyle: React.CSSProperties = {
        background: 'var(--white)',
        borderRadius: 16,
        padding: 'clamp(20px, 4vw, 32px)',
        marginBottom: 24,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative',
    };

    const stepNumberStyle = (color: string): React.CSSProperties => ({
        width: 40, height: 40, borderRadius: '50%',
        background: color, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '1.1rem', flexShrink: 0,
    });

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

    return (
        <section id="guide-inscription" className="section" style={{ background: 'var(--white)' }}>
            <div className="container">
                <div className="section-header" style={{ textAlign: 'center' }}>
                    <div className="section-label">Guide pas à pas</div>
                    <h2 className="section-title">Comment s&apos;inscrire ?</h2>
                    <p className="section-subtitle" style={{ maxWidth: 650, margin: '0 auto' }}>
                        Suivez les étapes ci-dessous pour rejoindre l&apos;ACHV. Le processus est simple et rapide !
                    </p>
                </div>

                {/* Tab switcher */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 48 }}>
                    <button
                        onClick={() => setTab('inscription')}
                        style={{
                            padding: '14px 28px', borderRadius: '12px 0 0 12px', border: '2px solid var(--primary)',
                            background: tab === 'inscription' ? 'var(--primary)' : 'transparent',
                            color: tab === 'inscription' ? 'white' : 'var(--primary)',
                            fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        🆕 Première inscription
                    </button>
                    <button
                        onClick={() => setTab('reinscription')}
                        style={{
                            padding: '14px 28px', borderRadius: '0 12px 12px 0', border: '2px solid var(--primary)',
                            background: tab === 'reinscription' ? 'var(--primary)' : 'transparent',
                            color: tab === 'reinscription' ? 'white' : 'var(--primary)',
                            fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        🔄 Réinscription
                    </button>
                </div>

                {/* ==================== PREMIÈRE INSCRIPTION ==================== */}
                {tab === 'inscription' && (
                    <div style={{ maxWidth: 800, margin: '0 auto' }}>

                        {/* Note importante */}
                        <div style={{
                            background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
                            borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', marginBottom: 32,
                            border: '1px solid #c7d2fe',
                        }}>
                            <p style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '1.05rem', marginBottom: 8 }}>
                                💡 Vous n&apos;êtes pas encore inscrit à l&apos;ACHV ?
                            </p>
                            <p style={{ color: '#334155', lineHeight: 1.7 }}>
                                Bonne nouvelle ! Vous pouvez faire <strong>2 séances d&apos;essai gratuites</strong> avant de vous décider.
                                Il vous suffit de vous présenter à l&apos;heure du cours choisi sur le lieu d&apos;entraînement.
                                Nos coachs vous accueilleront tout au long de l&apos;année et il n&apos;y a pas de date limite d&apos;inscription.
                            </p>
                        </div>

                        {/* Étape 1 */}
                        <div style={stepStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={stepNumberStyle('#3b82f6')}>1</div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>
                                        Renseignez-vous sur nos activités, nos horaires et nos tarifs
                                    </h3>
                                    <p style={{ color: '#64748b', lineHeight: 1.7 }}>
                                        Vous trouverez dans la plaquette du club les horaires des activités et les tarifs d&apos;inscription.
                                    </p>
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
                                </div>
                            </div>
                        </div>

                        {/* Étape 2 */}
                        <div style={stepStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={stepNumberStyle('#f59e0b')}>2</div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>
                                        Pour les mineurs, remplissez le questionnaire de santé
                                    </h3>
                                    <p style={{ color: '#64748b', lineHeight: 1.7 }}>
                                        Il faut répondre à un <strong>questionnaire sur la santé de l&apos;enfant</strong>.
                                        Lisez-le attentivement avec votre enfant et complétez-le.
                                    </p>
                                    <div style={noteStyle}>
                                        💡 Si vous avez répondu <strong>NON</strong> à toutes les questions, votre enfant n&apos;a pas besoin de certificat médical.
                                        Sinon il faut que votre enfant aille voir votre médecin pour obtenir un certificat médical.
                                    </div>
                                    <a href="https://admin.ffa.fr/planning/questionnaire-sante-mineur.pdf" target="_blank" rel="noopener" style={{ ...linkBtnStyle, background: '#fef3c7', color: '#d97706' }}>
                                        📝 Questionnaire de santé (mineur)
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Étape 3 */}
                        <div style={stepStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={stepNumberStyle('#10b981')}>3</div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>
                                        Adhérez à l&apos;ACHV via l&apos;application MonClub
                                    </h3>
                                    <p style={{ color: '#64748b', lineHeight: 1.7 }}>
                                        L&apos;adhésion se fait en ligne, via l&apos;application <strong>MonClub</strong>. Vous pouvez aussi payer en ligne si vous le souhaitez.
                                    </p>
                                    <p style={{ color: '#64748b', lineHeight: 1.7, marginTop: 8 }}>
                                        Vous pouvez vous connecter à l&apos;application MonClub depuis votre PC ou depuis votre mobile.
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, alignItems: 'center' }}>
                                        {settings.inscriptionUrl && (
                                            <a href={settings.inscriptionUrl} target="_blank" rel="noopener" style={{
                                                ...linkBtnStyle,
                                                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                                                color: 'white', padding: '12px 24px',
                                            }}>
                                                🏅 Adhérer à l&apos;ACHV
                                            </a>
                                        )}
                                    </div>
                                    <div style={noteStyle}>
                                        📱 Pour plus d&apos;informations sur l&apos;application MonClub et notamment savoir comment l&apos;utiliser depuis votre mobile, rendez-vous sur{' '}
                                        <a href="https://monclub.ffa.fr" target="_blank" rel="noopener" style={{ color: '#2563eb', fontWeight: 600 }}>monclub.ffa.fr</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Étape 4 */}
                        <div style={stepStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={stepNumberStyle('#8b5cf6')}>4</div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>
                                        Nous créons votre dossier dans la base de la FFA
                                    </h3>

                                    <div style={{ marginBottom: 20 }}>
                                        <h4 style={{ color: '#1e293b', fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>Pour les majeurs :</h4>
                                        <p style={{ color: '#64748b', lineHeight: 1.7 }}>
                                            Vous recevrez un premier mail de la FFA dont l&apos;objet est <em>&quot;FFA – Voici accès à votre Espace Athlé&quot;</em>, envoyé par l&apos;adresse <strong>athletesffalt@ffa.fr</strong>.
                                            Ce mail contient un bouton pour accéder à votre <strong>Espace Licencié</strong>. Il contient aussi votre identifiant et votre mot de passe. <strong>Il faut conserver ces informations.</strong>
                                        </p>
                                        <p style={{ color: '#64748b', lineHeight: 1.7, marginTop: 8 }}>
                                            Dans l&apos;Espace Licencié, cliquez sur le bouton &quot;Prise de licence 2024-2025&quot; et suivez ce qui est expliqué sur &quot;Renouvellement et Parcours Prévention Santé&quot;.
                                            Vous allez pouvoir compléter votre dossier, valider vos conditions d&apos;assurance et réaliser votre <strong>Parcours Prévention Santé</strong>.
                                        </p>
                                        <p style={{ color: '#64748b', lineHeight: 1.7, marginTop: 8 }}>
                                            Quand vous aurez terminé ces opérations, côté club nous pourrons alors valider votre licence. Vous recevrez ensuite un second mail de la FFA qui contiendra votre licence en fichier PDF.
                                        </p>
                                    </div>

                                    <div>
                                        <h4 style={{ color: '#1e293b', fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>Pour les mineurs :</h4>
                                        <p style={{ color: '#64748b', lineHeight: 1.7 }}>
                                            Vous recevrez immédiatement un mail de la FFA dans lequel il vous est demandé de valider les conditions d&apos;assurance de la FFA.
                                            Lorsque vous aurez fait cela, vous recevrez un second mail contenant la licence de votre enfant dans un fichier PDF.
                                        </p>
                                    </div>

                                    <div style={{
                                        marginTop: 20, padding: '20px 24px',
                                        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                                        borderRadius: 12, border: '1px solid #bbf7d0',
                                    }}>
                                        <p style={{ color: '#166534', fontWeight: 700, fontSize: '1.05rem' }}>
                                            🎉 Vous voilà membre de l&apos;ACHV : bienvenue !
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== RÉINSCRIPTION ==================== */}
                {tab === 'reinscription' && (
                    <div style={{ maxWidth: 800, margin: '0 auto' }}>

                        {/* Étape 1 */}
                        <div style={stepStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={stepNumberStyle('#3b82f6')}>1</div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>
                                        Renouvellement de la licence et Parcours Prévention Santé (PPS)
                                    </h3>
                                    <p style={{ color: '#64748b', lineHeight: 1.7 }}>
                                        Vous avez reçu un message provenant de l&apos;adresse <strong>&quot;athletesffalt@ffa.fr&quot;</strong>{' '}
                                        dont l&apos;objet contient <em>&quot;tu peux dès à présent renouveler ta licence pour la saison 2024-2025&quot;</em>.
                                        Ce message vous explique comment procéder pour cette étape de renouvellement de la licence FFA.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Étape 2.1 */}
                        <div style={stepStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={stepNumberStyle('#f59e0b')}>2</div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>
                                        Validez votre PPS (Parcours Prévention Santé)
                                    </h3>

                                    <div style={{
                                        background: '#eff6ff', borderRadius: 12, padding: '16px 20px',
                                        marginBottom: 16, border: '1px solid #bfdbfe',
                                    }}>
                                        <h4 style={{ color: '#1d4ed8', fontWeight: 700, marginBottom: 6 }}>👤 Pour les majeurs : validez votre PPS</h4>
                                        <p style={{ color: '#334155', lineHeight: 1.7 }}>
                                            Allez sur le site FFA pour réaliser votre{' '}
                                            <a href="https://preventiondopage.ffa.fr" target="_blank" rel="noopener" style={{ color: '#2563eb', fontWeight: 600 }}>
                                                &quot;Renouvellement et Parcours Prévention Santé&quot;
                                            </a>.
                                        </p>
                                        <p style={{ color: '#334155', lineHeight: 1.7, marginTop: 8 }}>
                                            Vous trouverez plus d&apos;informations sur le &quot;Parcours Prévention Santé&quot; dans la page{' '}
                                            <a href="https://preventiondopage.ffa.fr" target="_blank" rel="noopener" style={{ color: '#2563eb', fontWeight: 600 }}>
                                                Renouvellement et Parcours Prévention Santé
                                            </a>{' '} de notre site.
                                        </p>
                                    </div>

                                    <div style={{
                                        background: '#fefce8', borderRadius: 12, padding: '16px 20px',
                                        border: '1px solid #fde68a',
                                    }}>
                                        <h4 style={{ color: '#92400e', fontWeight: 700, marginBottom: 6 }}>🧒 Pour les mineurs : questionnaire de santé</h4>
                                        <p style={{ color: '#78350f', lineHeight: 1.7 }}>
                                            Allez sur le site de la FFA pour réaliser le renouvellement de la licence de votre enfant :{' '}
                                            <a href="https://admin.ffa.fr/planning/questionnaire-sante-mineur.pdf" target="_blank" rel="noopener" style={{ color: '#d97706', fontWeight: 600 }}>
                                                ouvrir le formulaire
                                            </a>.
                                        </p>
                                        <p style={{ color: '#78350f', lineHeight: 1.7, marginTop: 8 }}>
                                            Vous aurez à compléter un questionnaire de santé, lisez-le attentivement avec votre enfant et complétez-le.
                                        </p>
                                        <div style={noteStyle}>
                                            💡 Si vous avez répondu <strong>NON</strong> à toutes les questions, votre enfant n&apos;a pas besoin de certificat médical.
                                            Sinon il faut que votre enfant aille voir votre médecin pour obtenir un certificat médical.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Étape 3 */}
                        <div style={stepStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={stepNumberStyle('#10b981')}>3</div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>
                                        Adhérez à l&apos;ACHV via MonClub
                                    </h3>
                                    <p style={{ color: '#64748b', lineHeight: 1.7 }}>
                                        L&apos;adhésion se fait en ligne, via l&apos;application <strong>MonClub</strong>. Vous pouvez aussi payer en ligne si vous le souhaitez.
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, alignItems: 'center' }}>
                                        {settings.reinscriptionUrl && (
                                            <a href={settings.reinscriptionUrl} target="_blank" rel="noopener" style={{
                                                ...linkBtnStyle,
                                                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                                                color: 'white', padding: '12px 24px',
                                            }}>
                                                🏅 Accéder à MonClub
                                            </a>
                                        )}
                                    </div>
                                    <div style={noteStyle}>
                                        📱 Si vous souhaitez plus d&apos;informations sur l&apos;application MonClub et notamment savoir comment l&apos;utiliser depuis votre mobile, rendez-vous sur{' '}
                                        <a href="https://monclub.ffa.fr" target="_blank" rel="noopener" style={{ color: '#2563eb', fontWeight: 600 }}>monclub.ffa.fr</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Étape 4 */}
                        <div style={stepStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={stepNumberStyle('#8b5cf6')}>4</div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 8 }}>
                                        Nous validons votre licence, que vous recevez par mail de la FFA
                                    </h3>
                                    <p style={{ color: '#64748b', lineHeight: 1.7 }}>
                                        Dès que nous aurons validé votre dossier côté club, la FFA vous enverra un mail contenant votre licence au format PDF.
                                    </p>
                                    <div style={{
                                        marginTop: 20, padding: '20px 24px',
                                        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                                        borderRadius: 12, border: '1px solid #bbf7d0',
                                    }}>
                                        <p style={{ color: '#166534', fontWeight: 700, fontSize: '1.05rem' }}>
                                            🎉 Votre licence est renouvelée, à bientôt sur les pistes !
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                        <a href={`mailto:${settings.contactEmailInscription || settings.contactEmail}`}
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
        </section>
    );
}
