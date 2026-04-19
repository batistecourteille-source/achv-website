'use client';
import React, { useState } from 'react';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@/app/globals.css';
import '@/app/components.css';
import '@/app/sections.css';

const DISCIPLINES = [
    { id: 'all', label: 'Tous', icon: '🏅' },
    { id: 'piste', label: 'Piste & Stade', icon: '🏟️' },
    { id: 'cross', label: 'Cross', icon: '🌲' },
    { id: 'route', label: 'Route', icon: '🛣️' },
    { id: 'trail', label: 'Trail', icon: '⛰️' },
    { id: 'marche-nordique', label: 'Marche Nordique', icon: '🚶' },
];

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function disciplineLabel(d: string) {
    return DISCIPLINES.find(x => x.id === d)?.label || d;
}

function disciplineIcon(d: string) {
    return DISCIPLINES.find(x => x.id === d)?.icon || '🏅';
}

export default function ResultatsPage() {
    const { results, settings } = useData();
    const [activeDiscipline, setActiveDiscipline] = useState('all');

    const sorted = [...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted.slice(0, 3);
    const filtered = activeDiscipline === 'all' ? sorted : sorted.filter(r => r.discipline === activeDiscipline);

    return (
        <>
            <Header />
            {/* Page Hero */}
            <section className="page-hero" style={{ marginTop: 80 }}>
                <div className="container">
                    <div className="section-label">Résultats</div>
                    <h1 className="section-title" dangerouslySetInnerHTML={{ __html: settings.resultatsPage.heroTitle.replace(/(compétitions)/, '<span class="highlight">$1</span>') }} />
                    <p className="section-subtitle">{settings.resultatsPage.heroSubtitle}</p>
                </div>
            </section>

            {/* Latest Results - Quick Access */}
            <section className="section" style={{ paddingTop: 40, paddingBottom: 40 }}>
                <div className="container">
                    <h2 style={{ fontSize: '1.3rem', color: 'var(--dark)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {settings.resultatsPage.latestTitle}
                    </h2>
                    <div className="results-latest-grid">
                        {latest.map(r => (
                            <div key={r.id} className="result-latest-card">
                                <div className="result-latest-badge">{disciplineIcon(r.discipline)}</div>
                                <div className="result-latest-info">
                                    <span className="result-latest-date">{formatDate(r.date)}</span>
                                    <h3>{r.competition}</h3>
                                    <span className="result-latest-location">📍 {r.location}</span>
                                    <div className="result-latest-athletes">
                                        {r.athletes.slice(0, 2).map((a, i) => (
                                            <span key={i} className="result-athlete-chip">
                                                {a.rank && <strong>{a.rank}</strong>} {a.name} — {a.performance}
                                            </span>
                                        ))}
                                        {r.athletes.length > 2 && <span className="result-athlete-chip more">+{r.athletes.length - 2} athlètes</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Discipline Tabs */}
            <section className="section section-alt" style={{ paddingTop: 40 }}>
                <div className="container">
                    <div className="results-tabs">
                        {DISCIPLINES.map(d => (
                            <button
                                key={d.id}
                                className={`results-tab ${activeDiscipline === d.id ? 'active' : ''}`}
                                onClick={() => setActiveDiscipline(d.id)}
                            >
                                <span className="results-tab-icon">{d.icon}</span>
                                {d.label}
                            </button>
                        ))}
                    </div>

                    {/* Results List */}
                    <div className="results-list">
                        {filtered.length === 0 ? (
                            <div className="results-empty">
                                <span style={{ fontSize: '3rem' }}>📭</span>
                                <p>Aucun résultat dans cette discipline pour le moment.</p>
                            </div>
                        ) : (
                            filtered.map(r => (
                                <div key={r.id} className="result-card">
                                    <div className="result-card-header">
                                        <div className="result-card-discipline">{disciplineIcon(r.discipline)} {disciplineLabel(r.discipline)}</div>
                                        <span className="result-card-date">{formatDate(r.date)}</span>
                                    </div>
                                    <h3 className="result-card-title">{r.competition}</h3>
                                    <div className="result-card-location">📍 {r.location}</div>
                                    <div className="result-card-athletes">
                                        <table className="result-table">
                                            <thead>
                                                <tr>
                                                    <th>Classement</th>
                                                    <th>Athlète</th>
                                                    <th>Catégorie</th>
                                                    <th>Performance</th>
                                                    {r.showFields?.timeCourse && <th>Tps Course</th>}
                                                    {r.showFields?.timePuce && <th>Tps Puce</th>}
                                                    {r.showFields?.classementScratch && <th>Cl. Scratch</th>}
                                                    {r.showFields?.classementCategorie && <th>Cl. Catégorie</th>}
                                                    {r.showFields?.classementFeminine && <th>Cl. Féminine</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {r.athletes.map((a, i) => (
                                                    <tr key={i}>
                                                        <td><span className="result-rank">{a.rank || '—'}</span></td>
                                                        <td><strong>{a.name}</strong></td>
                                                        <td>{a.category}</td>
                                                        <td className="result-perf">{a.performance}</td>
                                                        {r.showFields?.timeCourse && <td className="result-perf">{a.timeCourse || '—'}</td>}
                                                        {r.showFields?.timePuce && <td className="result-perf">{a.timePuce || '—'}</td>}
                                                        {r.showFields?.classementScratch && <td><span className="result-rank">{a.classementScratch || '—'}</span></td>}
                                                        {r.showFields?.classementCategorie && <td><span className="result-rank">{a.classementCategorie || '—'}</span></td>}
                                                        {r.showFields?.classementFeminine && <td><span className="result-rank">{a.classementFeminine || '—'}</span></td>}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {r.url && (
                                        <a href={r.url} target="_blank" rel="noopener" className="result-card-link">
                                            Voir les résultats complets →
                                        </a>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <Footer />

            <style jsx>{`
                .results-latest-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                .result-latest-card {
                    background: var(--white);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--light-gray);
                    padding: 24px;
                    display: flex;
                    gap: 16px;
                    transition: var(--transition-spring);
                    position: relative;
                    overflow: hidden;
                }
                .result-latest-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    background: var(--gradient-primary);
                }
                .result-latest-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                }
                .result-latest-badge {
                    font-size: 2rem;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-alt);
                    border-radius: var(--radius-md);
                    flex-shrink: 0;
                }
                .result-latest-info { flex: 1; }
                .result-latest-date {
                    font-size: 0.75rem;
                    color: var(--primary);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .result-latest-info h3 {
                    font-size: 1rem;
                    color: var(--dark);
                    margin: 4px 0 6px;
                }
                .result-latest-location {
                    font-size: 0.8rem;
                    color: var(--medium-gray);
                }
                .result-latest-athletes {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 10px;
                }
                .result-athlete-chip {
                    background: var(--bg-alt);
                    padding: 3px 10px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    color: var(--dark);
                }
                .result-athlete-chip strong {
                    color: var(--primary);
                }
                .result-athlete-chip.more {
                    color: var(--medium-gray);
                    font-style: italic;
                }

                /* Tabs */
                .results-tabs {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-bottom: 32px;
                }
                .results-tab {
                    padding: 10px 20px;
                    border-radius: var(--radius-full);
                    border: 1px solid var(--light-gray);
                    background: var(--white);
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--medium-gray);
                    transition: var(--transition-fast);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .results-tab:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                }
                .results-tab.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }
                .results-tab-icon { font-size: 1.1rem; }

                /* Results List */
                .results-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding-bottom: 60px;
                }
                .results-empty {
                    text-align: center;
                    padding: 60px 0;
                    color: var(--medium-gray);
                }
                .result-card {
                    background: var(--white);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--light-gray);
                    padding: 28px;
                    transition: var(--transition-spring);
                }
                .result-card:hover {
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-2px);
                }
                .result-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .result-card-discipline {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--primary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .result-card-date {
                    font-size: 0.8rem;
                    color: var(--medium-gray);
                }
                .result-card-title {
                    font-size: 1.2rem;
                    color: var(--dark);
                    margin-bottom: 6px;
                }
                .result-card-location {
                    font-size: 0.85rem;
                    color: var(--medium-gray);
                    margin-bottom: 16px;
                }
                .result-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .result-table th {
                    text-align: left;
                    font-size: 0.75rem;
                    color: var(--medium-gray);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 8px 12px;
                    border-bottom: 2px solid var(--light-gray);
                }
                .result-table td {
                    padding: 10px 12px;
                    font-size: 0.9rem;
                    color: var(--dark);
                    border-bottom: 1px solid var(--bg-alt);
                }
                .result-rank {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 32px;
                    height: 28px;
                    background: var(--bg-alt);
                    border-radius: var(--radius-md);
                    font-weight: 700;
                    font-size: 0.85rem;
                    color: var(--primary);
                }
                .result-perf {
                    font-family: 'Space Grotesk', monospace;
                    font-weight: 600;
                    color: var(--dark) !important;
                }
                .result-card-link {
                    display: inline-block;
                    margin-top: 16px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--primary);
                }
                .result-card-link:hover {
                    text-decoration: underline;
                }

                @media (max-width: 768px) {
                    .results-latest-grid {
                        grid-template-columns: 1fr;
                    }
                    .result-table th:nth-child(3),
                    .result-table td:nth-child(3) {
                        display: none;
                    }
                }
            `}</style>
        </>
    );
}
