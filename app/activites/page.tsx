'use client';
import React, { useState } from 'react';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ActivitesPage() {
    const { activities, schedules, settings } = useData();
    const [cityFilter, setCityFilter] = useState('all');

    // Filter schedules
    const filteredSchedules = (schedules || []).filter(s => cityFilter === 'all' || s.city === cityFilter);

    // Group schedules by category
    const groupedSchedules = filteredSchedules.reduce((acc: any, s) => {
        (acc[s.category] = acc[s.category] || []).push(s);
        return acc;
    }, {});

    // Define category order
    const catOrder = ['Jeunes', 'Adultes Piste', 'Adultes Hors-Stade', 'Marche Nordique', 'Forme & Santé'];
    const sortedCats = Object.keys(groupedSchedules).sort((a, b) => {
        const ia = catOrder.indexOf(a);
        const ib = catOrder.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
    });

    const sortSchedules = (a: any, b: any) => {
        const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        const getDay = (s: string) => {
            const idx = days.findIndex(d => (s || '').toLowerCase().trim().startsWith(d));
            return idx === -1 ? 99 : idx;
        };
        const da = getDay(a.dayTime);
        const db = getDay(b.dayTime);
        if (da !== db) return da - db;
        return (a.dayTime || '').localeCompare(b.dayTime || '');
    };

    return (
        <>
            <Header />
            <div className="page-hero">
                <div className="page-hero-content">
                    <h1>{settings.activitesPage.heroTitle}</h1>
                    <p>{settings.activitesPage.heroSubtitle}</p>
                </div>
            </div>
            <section className="section">
                <div className="container">
                    <div className="activities-grid">
                        {activities.map(a => (
                            <div key={a.id} className="activity-card">
                                <img src={a.image || '/activity-track.png'} alt={a.title} />
                                <div className="activity-card-overlay">
                                    <h3>{a.title}</h3>
                                    <p>{a.schedule}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 64 }}>
                        {activities.map(a => (
                            <div key={a.id} style={{
                                background: 'var(--white)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'clamp(16px, 4vw, 32px)',
                                marginBottom: '20px',
                                boxShadow: 'var(--shadow-sm)',
                                border: '1px solid var(--light-gray)',
                            }}>
                                <h2 style={{ color: 'var(--dark)', marginBottom: 12, fontSize: '1.4rem' }}>{a.title}</h2>
                                <p style={{ color: 'var(--medium-gray)', lineHeight: 1.8, marginBottom: 12 }}>{a.description}</p>
                                <p style={{ fontWeight: 600, color: 'var(--primary)' }}>🕐 {a.schedule}</p>
                            </div>
                        ))}
                    </div>

                    {/* PLANNING SECTION */}
                    <div id="planning" style={{ marginTop: 'clamp(40px, 8vw, 80px)', marginBottom: 'clamp(40px, 8vw, 80px)' }}>
                        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 12 }}>{settings.activitesPage.planningTitle}</h2>
                        <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: 40, maxWidth: 800, margin: '0 auto 40px' }}>
                            {settings.activitesPage.planningSubtitle}<br />
                            <span style={{ fontSize: '0.9em', color: '#666' }}>{settings.activitesPage.planningLocation}</span>
                        </p>

                        {/* CITY FILTER */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setCityFilter('all')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: 99,
                                    border: 'none',
                                    background: cityFilter === 'all' ? 'var(--primary)' : '#f1f5f9',
                                    color: cityFilter === 'all' ? 'white' : '#64748b',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: cityFilter === 'all' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Tout voir
                            </button>
                            <button
                                onClick={() => setCityFilter('Noyal')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: 99,
                                    border: 'none',
                                    background: cityFilter === 'Noyal' ? '#3b82f6' : '#f1f5f9',
                                    color: cityFilter === 'Noyal' ? 'white' : '#64748b',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: cityFilter === 'Noyal' ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none'
                                }}
                            >
                                📍 Noyal-sur-Vilaine
                            </button>
                            <button
                                onClick={() => setCityFilter('Nouvoitou')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: 99,
                                    border: 'none',
                                    background: cityFilter === 'Nouvoitou' ? '#10b981' : '#f1f5f9',
                                    color: cityFilter === 'Nouvoitou' ? 'white' : '#64748b',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: cityFilter === 'Nouvoitou' ? '0 2px 4px rgba(16, 185, 129, 0.3)' : 'none'
                                }}
                            >
                                📍 Nouvoitou
                            </button>
                        </div>

                        {sortedCats.map(cat => (
                            <div key={cat} style={{ marginBottom: 40, background: 'var(--white)', padding: 'clamp(12px, 3vw, 24px)', borderRadius: 16, border: '1px solid var(--light-gray)' }}>
                                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid var(--super-light-gray)' }}>{cat}</h3>
                                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', minWidth: 500 }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', color: '#666', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <th style={{ padding: '12px 16px' }}>Discipline</th>
                                                <th style={{ padding: '12px 16px' }}>Public / Age</th>
                                                <th style={{ padding: '12px 16px' }}>Jour & Heure</th>
                                                <th style={{ padding: '12px 16px' }}>Lieu</th>
                                                <th style={{ padding: '12px 16px' }}>Ville</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedSchedules[cat].sort(sortSchedules).map((s: any) => (
                                                <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px', fontWeight: 600, color: '#1e293b' }}>{s.discipline}</td>
                                                    <td style={{ padding: '16px', color: '#475569' }}>{s.ageGroup}</td>
                                                    <td style={{ padding: '16px', color: '#334155' }}>{s.dayTime}</td>
                                                    <td style={{ padding: '16px', color: '#475569' }}>{s.location}</td>
                                                    <td style={{ padding: '16px' }}>
                                                        {s.city === 'Noyal'
                                                            ? <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: 6, fontSize: '0.8em', fontWeight: 600 }}>Noyal</span>
                                                            : s.city === 'Nouvoitou'
                                                                ? <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 8px', borderRadius: 6, fontSize: '0.8em', fontWeight: 600 }}>Nouvoitou</span>
                                                                : <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: 6, fontSize: '0.8em', fontWeight: 600 }}>{s.city}</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}
