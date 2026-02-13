'use client';
import React, { useState } from 'react';
import { useData, PricingItem } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TarifsPage() {
    const { pricing, settings } = useData();

    // Group items by category
    const competition = pricing.filter(p => p.category === 'Competition').sort((a, b) => a.order - b.order);
    const runningSante = pricing.filter(p => p.category === 'RunningSante').sort((a, b) => a.order - b.order);
    const autre = pricing.filter(p => p.category === 'Autre').sort((a, b) => a.order - b.order);

    return (
        <>
            <Header />
            <div className="page-hero" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(/hero-club.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="page-hero-content">
                    <h1>{settings.pricingPage.heroTitle}</h1>
                    <p>{settings.pricingPage.heroSubtitle}</p>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <div className="section-header text-center">
                        <div className="section-label">{settings.pricingPage.sectionLabel}</div>
                        <h2 className="section-title">{settings.pricingPage.sectionTitle}</h2>
                        <p className="section-subtitle">{settings.pricingPage.sectionSubtitle}</p>
                    </div>

                    <div className="pricing-table-container">
                        <h3 className="pricing-category-title">{settings.pricingPage.competitionTitle}</h3>
                        <p className="pricing-category-desc">{settings.pricingPage.competitionDesc}</p>

                        <div className="table-responsive">
                            <table className="pricing-table">
                                <thead>
                                    <tr>
                                        <th>Activité</th>
                                        <th>Licence</th>
                                        <th>Année de naissance</th>
                                        <th>Tarif</th>
                                        <th>Code MonClub</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {competition.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <strong>{item.activity}</strong>
                                                {item.comment && <div className="pricing-comment">{item.comment}</div>}
                                            </td>
                                            <td>{item.licenseType}</td>
                                            <td>{item.birthYears}</td>
                                            <td className="pricing-price">{item.price}</td>
                                            <td><span className="monclub-badge">{item.monClubCode}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pricing-divider"></div>

                        <h3 className="pricing-category-title">{settings.pricingPage.runningTitle}</h3>
                        <p className="pricing-category-desc">{settings.pricingPage.runningDesc}</p>

                        <div className="table-responsive">
                            <table className="pricing-table">
                                <thead>
                                    <tr>
                                        <th>Activité</th>
                                        <th>Licence</th>
                                        <th>Année de naissance</th>
                                        <th>Tarif</th>
                                        <th>Code MonClub</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {runningSante.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <strong>{item.activity}</strong>
                                                {item.comment && <div className="pricing-comment">{item.comment}</div>}
                                            </td>
                                            <td>{item.licenseType}</td>
                                            <td>{item.birthYears}</td>
                                            <td className="pricing-price">{item.price}</td>
                                            <td><span className="monclub-badge">{item.monClubCode}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pricing-divider"></div>

                        <h3 className="pricing-category-title">{settings.pricingPage.optionsTitle}</h3>
                        <div className="table-responsive">
                            <table className="pricing-table">
                                <thead>
                                    <tr>
                                        <th>Intitulé</th>
                                        <th>Détail</th>
                                        <th>Tarif</th>
                                        <th>Code MonClub</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {autre.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <strong>{item.activity}</strong>
                                            </td>
                                            <td>{item.comment || '-'}</td>
                                            <td className="pricing-price">{item.price}</td>
                                            <td>{item.monClubCode !== '-' ? <span className="monclub-badge">{item.monClubCode}</span> : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pricing-notes">
                            {settings.pricingPage.notes.map((note, i) => <p key={i}>{note}</p>)}
                        </div>

                        <div className="cta-centered">
                            <a href={settings.inscriptionUrl} target="_blank" rel="noopener" className="btn btn-primary btn-lg">
                                {settings.pricingPage.ctaButton}
                            </a>
                            <p className="cta-subtext">{settings.pricingPage.ctaSubtext}</p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />

            <style jsx>{`
                .pricing-table-container {
                    background: var(--white);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-md);
                    padding: 40px;
                    border: 1px solid var(--light-gray);
                }
                .pricing-category-title {
                    color: var(--primary);
                    font-size: 1.5rem;
                    margin-bottom: 8px;
                    border-left: 4px solid var(--primary);
                    padding-left: 16px;
                }
                .pricing-category-desc {
                    color: var(--medium-gray);
                    margin-bottom: 24px;
                    padding-left: 20px;
                    font-size: 0.95rem;
                    max-width: 800px;
                }
                .pricing-divider {
                    height: 1px;
                    background: var(--light-gray);
                    margin: 40px 0;
                }
                .table-responsive {
                    overflow-x: auto;
                    margin-bottom: 20px;
                }
                .pricing-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 600px;
                }
                .pricing-table th {
                    text-align: left;
                    padding: 12px 16px;
                    background: var(--bg-alt);
                    color: var(--dark);
                    font-weight: 600;
                    border-bottom: 2px solid var(--light-gray);
                    font-size: 0.9rem;
                }
                .pricing-table td {
                    padding: 14px 16px;
                    border-bottom: 1px solid var(--light-gray);
                    color: var(--dark);
                    font-size: 0.95rem;
                    vertical-align: middle;
                }
                .pricing-price {
                    font-family: 'Space Grotesk', sans-serif;
                    font-weight: 700;
                    color: var(--dark);
                    font-size: 1.1rem;
                }
                .pricing-comment {
                    font-size: 0.8rem;
                    color: var(--medium-gray);
                    margin-top: 4px;
                    font-style: italic;
                }
                .monclub-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    background: var(--dark);
                    color: white;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 0.9rem;
                }
                .pricing-notes {
                    margin-top: 32px;
                    padding: 16px;
                    background: #fff8e1;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    color: #5d4037;
                }
                .pricing-notes p {
                    margin-bottom: 4px;
                }
                .cta-centered {
                    text-align: center;
                    margin-top: 48px;
                }
                .cta-subtext {
                    margin-top: 12px;
                    font-size: 0.9rem;
                    color: var(--medium-gray);
                }
                
                @media (max-width: 768px) {
                    .pricing-table-container {
                        padding: 20px;
                    }
                    .pricing-table th:nth-child(2),
                    .pricing-table td:nth-child(2),
                    .pricing-table th:nth-child(3),
                    .pricing-table td:nth-child(3) {
                        display: none;
                    }
                    .pricing-category-title {
                        font-size: 1.25rem;
                    }
                }
            `}</style>
        </>
    );
}
