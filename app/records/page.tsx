'use client';
import React, { useState } from 'react';
import { useData, ClubRecord } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@/app/globals.css';
import '@/app/components.css';
import '@/app/sections.css';

const CATEGORIES = ['Eveil Athlé', 'Poussin', 'Benjamin', 'Minime', 'Cadet', 'Junior', 'Espoir', 'Senior', 'Master'];

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RecordsPage() {
    const { records, settings } = useData();
    const [activeType, setActiveType] = useState<'outdoor' | 'indoor' | 'hors-stade'>('outdoor');
    const [activeGender, setActiveGender] = useState<'M' | 'F'>('M');
    const [activeCategory, setActiveCategory] = useState('all');

    const filtered = records.filter(r => {
        // Handle legacy 'stade' as 'outdoor'
        const rType = r.type === 'stade' ? 'outdoor' : r.type;
        if (rType !== activeType) return false;
        if (r.gender !== activeGender) return false;
        if (activeCategory !== 'all' && r.category !== activeCategory) return false;
        return true;
    });

    // Group by event
    const events = [...new Set(filtered.map(r => r.event))];
    const categories = [...new Set(records.filter(r => {
        const rType = r.type === 'stade' ? 'outdoor' : r.type;
        return rType === activeType && r.gender === activeGender;
    }).map(r => r.category))].sort((a, b) => {
        const idxA = CATEGORIES.indexOf(a);
        const idxB = CATEGORIES.indexOf(b);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    // Sort events logically: by distance for running events
    const eventOrder = (e: string): number => {
        const clean = e.toLowerCase().trim();
        // Specific distances
        if (clean === '50m') return 50;
        if (clean === '60m') return 60;
        if (clean === '100m') return 100;
        if (clean === '200m') return 200;
        if (clean === '400m') return 400;
        if (clean === '800m') return 800;
        if (clean === '1000m') return 1000;
        if (clean === '1500m') return 1500;
        if (clean === '2000m') return 2000;
        if (clean === '3000m') return 3000;
        if (clean === '5000m') return 5000;
        if (clean === '10000m') return 10000;

        // Relais
        if (clean.includes('4x')) return 7000;

        // Haies
        if (clean.includes('haies')) {
            const m = parseInt(e);
            return 401 + (isNaN(m) ? 0 : m / 1000);
        }

        // Steeple
        if (clean.includes('steeple')) {
            const m = parseInt(e);
            return 3001 + (isNaN(m) ? 0 : m / 1000);
        }

        // Marche
        if (clean.includes('marche')) {
            const m = parseInt(e);
            return 5001 + (isNaN(m) ? 0 : m / 1000);
        }

        // Hors Stade
        if (clean === '5 km') return 10005;
        if (clean === '10 km') return 10010;
        if (clean.includes('semi')) return 21100;
        if (clean.includes('marathon')) return 42195;
        if (clean.includes('cross court')) return 8001;
        if (clean.includes('cross long')) return 12001;

        // Field events (Sauts)
        if (clean.includes('hauteur')) return 90001;
        if (clean.includes('perche')) return 90002;
        if (clean.includes('longueur')) return 90003;
        if (clean.includes('triple')) return 90004;

        // Field events (Lancers)
        if (clean.includes('poids')) return 91001;
        if (clean.includes('disque')) return 91002;
        if (clean.includes('marteau')) return 91003;
        if (clean.includes('javelot')) return 91004;

        // Combo
        if (clean.includes('heptathlon')) return 95001;
        if (clean.includes('decathlon')) return 95002;
        if (clean.includes('pentathlon')) return 95003;

        const num = parseInt(e);
        if (!isNaN(num)) return num;
        return 999999;
    };
    events.sort((a, b) => eventOrder(a) - eventOrder(b));

    return (
        <>
            <Header />
            {/* Page Hero */}
            <section className="page-hero" style={{ marginTop: 80 }}>
                <div className="container">
                    <div className="section-label">Records</div>
                    <h1 className="section-title" dangerouslySetInnerHTML={{ __html: settings.recordsPage.heroTitle.replace(/(Club)/, '<span class="highlight">$1</span>') }} />
                    <p className="section-subtitle">{settings.recordsPage.heroSubtitle}</p>
                </div>
            </section>

            <section className="section" style={{ paddingTop: 40 }}>
                <div className="container">
                    {/* Type Toggle */}
                    <div className="records-type-toggle">
                        <button className={`records-type-btn ${activeType === 'outdoor' ? 'active' : ''}`} onClick={() => setActiveType('outdoor')}>
                            🏟️ Outdoor
                        </button>
                        <button className={`records-type-btn ${activeType === 'indoor' ? 'active' : ''}`} onClick={() => setActiveType('indoor')}>
                            🏛️ Indoor
                        </button>
                        <button className={`records-type-btn ${activeType === 'hors-stade' ? 'active' : ''}`} onClick={() => setActiveType('hors-stade')}>
                            🌍 Hors Stade
                        </button>
                    </div>

                    {/* Gender Toggle */}
                    <div className="records-gender-toggle">
                        <button className={`records-gender-btn ${activeGender === 'M' ? 'active' : ''}`} onClick={() => setActiveGender('M')}>
                            👨 Hommes
                        </button>
                        <button className={`records-gender-btn ${activeGender === 'F' ? 'active' : ''}`} onClick={() => setActiveGender('F')}>
                            👩 Femmes
                        </button>
                    </div>

                    {/* Category Filter */}
                    <div className="records-category-filter">
                        <button className={`records-cat-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>Toutes</button>
                        {CATEGORIES.map(c => (
                            <button key={c} className={`records-cat-btn ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>
                                {c}
                            </button>
                        ))}
                    </div>

                    {/* Records Table */}
                    {filtered.length === 0 ? (
                        <div className="records-empty">
                            <span style={{ fontSize: '3rem' }}>📭</span>
                            <p>Aucun record enregistré pour cette sélection.</p>
                        </div>
                    ) : (
                        <div className="records-table-wrapper">
                            <table className="records-table">
                                <thead>
                                    <tr>
                                        <th>Épreuve</th>
                                        <th>Performance</th>
                                        <th>Athlète</th>
                                        <th>Catégorie</th>
                                        <th>Date</th>
                                        <th>Lieu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map(evt => {
                                        const recs = filtered.filter(r => r.event === evt);
                                        return recs.map((r, i) => (
                                            <tr key={r.id} className={i === 0 ? 'records-row-first' : ''}>
                                                {i === 0 && <td rowSpan={recs.length} className="records-event-cell"><span className="records-event-name">{evt}</span></td>}
                                                <td className="records-perf">{r.performance}</td>
                                                <td><strong>{r.athlete}</strong></td>
                                                <td><span className="records-cat-badge">{r.category}</span></td>
                                                <td className="records-date">{formatDate(r.date)}</td>
                                                <td className="records-location">{r.location || '—'}</td>
                                            </tr>
                                        ));
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            <Footer />

            <style jsx>{`
                .records-type-toggle {
                    display: flex;
                    gap: 0;
                    margin-bottom: 20px;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    border: 2px solid var(--primary);
                    width: fit-content;
                }
                .records-type-btn {
                    padding: 12px 32px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    background: var(--white);
                    color: var(--primary);
                    border: none;
                    transition: var(--transition-fast);
                }
                .records-type-btn.active {
                    background: var(--primary);
                    color: white;
                }
                .records-type-btn:hover:not(.active) {
                    background: rgba(230, 57, 70, 0.08);
                }

                .records-gender-toggle {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 16px;
                }
                .records-gender-btn {
                    padding: 8px 24px;
                    border-radius: var(--radius-full);
                    border: 1px solid var(--light-gray);
                    background: var(--white);
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--medium-gray);
                    transition: var(--transition-fast);
                }
                .records-gender-btn.active {
                    background: var(--dark);
                    color: white;
                    border-color: var(--dark);
                }

                .records-category-filter {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    margin-bottom: 28px;
                }
                .records-cat-btn {
                    padding: 6px 16px;
                    border-radius: var(--radius-full);
                    border: 1px solid var(--light-gray);
                    background: var(--white);
                    cursor: pointer;
                    font-size: 0.8rem;
                    color: var(--medium-gray);
                    transition: var(--transition-fast);
                }
                .records-cat-btn.active {
                    background: var(--accent-neon);
                    color: var(--dark);
                    border-color: var(--accent-neon);
                    font-weight: 600;
                }

                .records-empty {
                    text-align: center;
                    padding: 60px 0;
                    color: var(--medium-gray);
                }

                .records-table-wrapper {
                    overflow-x: auto;
                    margin-bottom: 60px;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--light-gray);
                    background: var(--white);
                }
                .records-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .records-table thead {
                    background: var(--dark);
                }
                .records-table th {
                    text-align: left;
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.8);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    padding: 14px 16px;
                    font-weight: 600;
                }
                .records-table td {
                    padding: 12px 16px;
                    font-size: 0.9rem;
                    color: var(--dark);
                    border-bottom: 1px solid var(--bg-alt);
                    vertical-align: middle;
                }
                .records-row-first td {
                    border-top: 2px solid var(--light-gray);
                }
                .records-event-cell {
                    background: rgba(230, 57, 70, 0.03);
                    border-right: 3px solid var(--primary);
                }
                .records-event-name {
                    font-family: 'Space Grotesk', sans-serif;
                    font-weight: 700;
                    font-size: 1rem;
                    color: var(--dark);
                }
                .records-perf {
                    font-family: 'Space Grotesk', monospace;
                    font-weight: 700;
                    font-size: 1rem;
                    color: var(--primary) !important;
                }
                .records-cat-badge {
                    display: inline-block;
                    padding: 2px 10px;
                    border-radius: var(--radius-full);
                    background: var(--bg-alt);
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: var(--medium-gray);
                }
                .records-date {
                    font-size: 0.8rem;
                    color: var(--medium-gray);
                }
                .records-location {
                    font-size: 0.8rem;
                    color: var(--medium-gray);
                }

                @media (max-width: 768px) {
                    .records-type-toggle {
                        width: 100%;
                    }
                    .records-type-btn {
                        flex: 1;
                        text-align: center;
                    }
                    .records-table th:nth-child(5),
                    .records-table td:nth-child(5),
                    .records-table th:nth-child(6),
                    .records-table td:nth-child(6) {
                        display: none;
                    }
                }
            `}</style>
        </>
    );
}
