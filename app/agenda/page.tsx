'use client';
import React from 'react';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AgendaPage() {
    const { events, settings } = useData();
    const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <>
            <Header />
            <div className="page-hero">
                <div className="page-hero-content">
                    <h1>{settings.agendaPage.heroTitle}</h1>
                    <p>{settings.agendaPage.heroSubtitle}</p>
                </div>
            </div>
            <section className="section">
                <div className="container">
                    <div className="events-list">
                        {sortedEvents.map(ev => {
                            const d = new Date(ev.date);
                            const dEnd = ev.dateEnd ? new Date(ev.dateEnd) : null;

                            let dayDisplay = d.getDate().toString();
                            let monthDisplay = months[d.getMonth()];

                            // Logic for date range display
                            if (dEnd) {
                                if (d.getMonth() === dEnd.getMonth()) {
                                    dayDisplay = `${d.getDate()}-${dEnd.getDate()}`;
                                } else {
                                    dayDisplay = `${d.getDate()}/${d.getMonth() + 1} - ${dEnd.getDate()}/${dEnd.getMonth() + 1}`;
                                    monthDisplay = ''; // Hide month in box if complex range, or handle differently
                                    // Better approach for cross-month:
                                    // Box shows Start Date. Full range is in text.
                                    dayDisplay = d.getDate().toString();
                                    monthDisplay = months[d.getMonth()];
                                }
                            }

                            // Format full date string for display
                            const fullDate = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                            const fullDateEnd = dEnd ? dEnd.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null;
                            const rangeString = dEnd ? `Du ${fullDate} au ${fullDateEnd}` : `Le ${fullDate}`;

                            return (
                                <div key={ev.id} className="event-item">
                                    <div className="event-date-box">
                                        <div className="event-date-day" style={dayDisplay.length > 2 ? { fontSize: '1.2rem' } : {}}>{dayDisplay}</div>
                                        {monthDisplay && <div className="event-date-month">{monthDisplay}</div>}
                                    </div>
                                    <div className="event-info">
                                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            {rangeString}
                                        </div>
                                        <h3>{ev.title}</h3>
                                        <p>{ev.description}</p>
                                        <div className="event-location">📍 {ev.location}</div>

                                        {(ev.registrationUrl || ev.presentationUrl) && (
                                            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                {ev.registrationUrl && (
                                                    <a
                                                        href={ev.registrationUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-primary"
                                                        style={{ padding: '8px 20px', fontSize: '0.8rem' }}
                                                    >
                                                        S'inscrire
                                                    </a>
                                                )}
                                                {ev.presentationUrl && (
                                                    <a
                                                        href={ev.presentationUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn"
                                                        style={{
                                                            padding: '8px 20px',
                                                            fontSize: '0.8rem',
                                                            background: 'transparent',
                                                            border: '1.5px solid var(--primary)',
                                                            color: 'var(--primary)'
                                                        }}
                                                    >
                                                        En savoir plus
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {sortedEvents.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--medium-gray)' }}>
                                <p style={{ fontSize: '1.1rem' }}>Aucun événement à venir.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}
